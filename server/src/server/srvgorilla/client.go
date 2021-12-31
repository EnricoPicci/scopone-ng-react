// Package srvgorilla implements the server using Gorilla WebSocket server
package srvgorilla

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"sync"
	"time"

	"go-scopone/src/game-logic/deck"
	"go-scopone/src/game-logic/player"
	"go-scopone/src/game-logic/scopone"
	"go-scopone/src/server"

	"github.com/gorilla/websocket"
)

// Client is a middleman between the websocket connection and the hub.
type client struct {
	name    string
	scopone *scopone.Scopone
	hub     *Hub
	// The websocket connection.
	conn *websocket.Conn
	// Buffered channel of outbound messages.
	send chan []byte
}

// The processing of each command needs to be synchronized.
// If the commands sent by different clients are processed at the same time, then their shared state (e.g. the
// game they are playing) can be accessed in read and write simoultaneously by different processings
var processCommandMutex sync.Mutex

// readPump pumps messages from the websocket connection to the hub.
//
// The application runs readPump in a per-connection goroutine. The application
// ensures that there is at most one reader on a connection by executing all
// reads from this goroutine.
func (c *client) readPump() {
	defer func() {
		c.hub.unregisterClient <- c
		c.conn.Close()
	}()
	for {
		_, message, err := c.conn.ReadMessage()
		processCommandMutex.Lock()
		{
			if err != nil {
				if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
					log.Printf("UNEXPECTED error: %v", err)
				}
				cName := c.name
				if cName == "" {
					cName = "Unknown client - the client did not register as client in the Osteria"
				} else {
					_, wasPlaying := c.scopone.RemovePlayer(cName)
					if wasPlaying {
						error := fmt.Sprintf("Error Because Player \"%v\" has been removed", cName)
						sendPlayerLeftOsteria(c, cName, error)
						sendGames(c, error)
					}
				}
				log.Printf("Error: %v", err)
				processCommandMutex.Unlock()
				c.conn.Close()
				break
			}

			message = bytes.TrimSpace(bytes.Replace(message, newline, space, -1))
			fmt.Println("Message received", string(message))
			// convert data received to MessageFromPlayer struct
			var msg server.MessageFromPlayer
			if err := json.Unmarshal(message, &msg); err != nil {
				panic(err.Error())
			}

			switch msg.ID {
			case "playerEntersOsteria":
				playerName := msg.PlayerName
				hv, alreadyIn := c.scopone.PlayerEnters(playerName)
				if alreadyIn {
					// Player is already in the osteria
					response := server.NewMessageToOnePlayer(server.PlayerIsAlreadyInOsteria, playerName)
					response.Error = fmt.Sprintf("Player \"%v\" is already in the Osteria", playerName)
					rsp, e := json.Marshal(response)
					if e != nil {
						panicMessage := fmt.Sprintf("Marshalling to json of %v failed with error %v\n", response, e)
						panic(panicMessage)
					}
					c.send <- []byte(rsp)
				} else {
					c.name = playerName
					c.hub.registerClient <- c
					if hv == nil {
						// if there are no handViews to be sent to Players it means that the Player is entering for the fist time in the Osteria
						// or he is re-entering but was not playing any game previously
						respTo := "playerEntersOsteria - no handViews"
						sendPlayers(c, respTo)
						sendGames(c, respTo)
					} else {
						// on the contrary if the handViews are defined it means that the Player is re-entering the Osteria
						// and that he was previously playing a game, so we return the handViews to all Players for them
						// to resume the game
						respTo := fmt.Sprintf("playerEntersOsteria \"%v\"", playerName)
						sendGames(c, respTo)
						sendPlayers(c, respTo)
						sendPlayerViews(c, hv, respTo)
					}
				}
			case "newGame":
				gameName := msg.GameName
				_, e := c.scopone.NewGame(gameName)
				if e != nil {
					// There is already a game with the same name
					response := server.NewMessageToOnePlayer(server.GameWithSameNamePresent, c.name)
					response.Error = fmt.Sprintf("Game \"%v\" with the same name already created", gameName)
					response.GameName = gameName
					rsp, e := json.Marshal(response)
					if e != nil {
						panicMessage := fmt.Sprintf("Marshalling to json of %v failed with error %v\n", response, e)
						panic(panicMessage)
					}
					c.send <- []byte(rsp)
				}
				respTo := fmt.Sprintf("newGame \"%v\"", gameName)
				sendGames(c, respTo)
			case "addPlayerToGame":
				playerName := msg.PlayerName
				gameName := msg.GameName
				e := c.scopone.AddPlayerToGame(playerName, gameName)
				if e != nil {
					response := server.NewMessageToOnePlayer(server.ErrorAddingPlayerToGameMsgID, playerName)
					response.Error = e.Error()
					rsp, e := json.Marshal(response)
					if e != nil {
						panicMessage := fmt.Sprintf("Marshalling to json of %v failed with error %v\n", response, e)
						panic(panicMessage)
					}
					c.send <- []byte(rsp)
				} else {
					respTo := fmt.Sprintf("addPlayerToGame - game \"%v\"", gameName)
					sendGames(c, respTo)
				}
			case "addObserverToGame":
				playerName := msg.PlayerName
				gameName := msg.GameName
				hv, err := c.scopone.AddObserverToGame(playerName, gameName)
				if err != nil {
					response := server.NewMessageToOnePlayer(server.ErrorAddingObserverToGameMsgID, playerName)
					response.Error = err.Error()
					rsp, e := json.Marshal(response)
					if e != nil {
						panicMessage := fmt.Sprintf("Marshalling to json of %v failed with error %v\n", response, e)
						panic(panicMessage)
					}
					c.send <- []byte(rsp)
				} else {
					respTo := fmt.Sprintf("addObserverToGame - game \"%v\"", gameName)
					sendGames(c, respTo)
					game := c.scopone.Games[gameName]
					sendObserverUpdates(c, hv, respTo, game)
				}
			case "newHand":
				gameName := msg.GameName
				game := c.scopone.Games[gameName]
				// _, handViewForPlayers, handCreated := game.NewHand()
				_, handViewForPlayers, handCreated := c.scopone.NewHand(game)
				if handCreated {
					respTo := fmt.Sprintf("newHand - game \"%v\"", gameName)
					fmt.Println("NewHand", gameName, len(handViewForPlayers))
					sendGames(c, respTo)
					sendPlayerViews(c, handViewForPlayers, respTo)
					sendObserverUpdates(c, handViewForPlayers, respTo, game)
				}
			case "playCard":
				handViewForPlayers, finalTableTake, g := c.scopone.Play(msg.PlayerName, msg.CardPlayed, msg.CardsTaken)
				// if handViewForPlayers is nil it means something anomalous happened while playing the card and so
				// there is no message sent to clients
				if handViewForPlayers != nil {
					respTo := fmt.Sprintf("playCard \"%v\"", c.name)
					sendCardsPlayedAndTaken(c, msg.CardPlayed, msg.CardsTaken, finalTableTake, g, respTo)
					sendPlayerViews(c, handViewForPlayers, respTo)
					sendObserverUpdates(c, handViewForPlayers, respTo, g)
				}
			case "closeGame":
				gameName := msg.GameName
				c.scopone.Close(gameName, c.name)
				respTo := fmt.Sprintf("Game \"%v\" closed", gameName)
				sendGames(c, respTo)
			default:
				panicMessage := fmt.Sprintf("Unexpected messageId %v arrived from player %v\n", msg.ID, c.name)
				panic(panicMessage)
			}
		}
		processCommandMutex.Unlock()
	}
}
func sendPlayers(c *client, responseTo string) {
	msg := server.NewMessageToAllClients(server.PlayersMsgID)
	msg.Players = c.scopone.AllPlayers()
	msg.ResponseTo = responseTo
	c.hub.broadcastMsg <- messageToAllAsJSON(msg)
}
func sendGames(c *client, responseTo string) {
	allGames := c.scopone.AllGames()
	if len(allGames) > 0 {
		msg := server.NewMessageToAllClients(server.GamesMsgID)
		msg.Games = allGames
		msg.ResponseTo = responseTo
		c.hub.broadcastMsg <- messageToAllAsJSON(msg)
	}
}
func sendPlayerLeftOsteria(c *client, playerName string, rspTo string) {
	msg := server.NewMessageToAllClients(server.PlayerLeftMsgID)
	msg.PlayerName = playerName
	msg.ResponseTo = rspTo
	c.hub.broadcastMsg <- messageToAllAsJSON(msg)
}
func messageToAllAsJSON(message server.MessageToAllClients) []byte {
	b, err := json.Marshal(message)
	if err != nil {
		fmt.Printf("Message %v can not be converted to JSON. Error: %v \n", message, err)
		panic(err)
	}
	return b
}
func sendPlayerViews(c *client, handViewForPlayers map[string]scopone.HandPlayerView, responseTo string) {
	for playerName := range handViewForPlayers {
		hView := handViewForPlayers[playerName]
		msgHandView := server.NewMessageToOnePlayer(server.HandView, playerName)
		msgHandView.ResponseTo = responseTo
		msgHandView.HandPlayerView = hView
		msgHandViewJ, e := json.Marshal(msgHandView)
		if e != nil {
			panicMessage := fmt.Sprintf("Marshalling to json of %v failed with error %v\n", msgHandView, e)
			panic(panicMessage)
		}

		if c.scopone.Players[playerName].Status == player.PlayerPlaying || c.scopone.Players[playerName].Status == player.PlayerLookingAtHandResult {
			c.hub.clients[playerName].send <- msgHandViewJ
		}
	}
}
func sendObserverUpdates(c *client, handViewForPlayers map[string]scopone.HandPlayerView, responseTo string, game *scopone.Game) {
	for observerName := range game.Observers {
		msgObsUpdate := server.NewMessageToOnePlayer(server.HandView, observerName)
		msgObsUpdate.ResponseTo = responseTo
		msgObsUpdate.AllHandPlayerViews = handViewForPlayers
		msgObsUpdateJ, e := json.Marshal(msgObsUpdate)
		if e != nil {
			panicMessage := fmt.Sprintf("Marshalling to json of %v failed with error %v\n", msgObsUpdate, e)
			panic(panicMessage)
		}
		c.hub.clients[observerName].send <- msgObsUpdateJ
	}
}
func sendCardsPlayedAndTaken(c *client, cardPlayed deck.Card, cardsTaken []deck.Card,
	finalTableTake scopone.FinalTableTake, game *scopone.Game, responseTo string) {
	playerObservers := make([]string, 0)
	for p := range game.Players {
		playerObservers = append(playerObservers, p)
	}
	for o := range game.Observers {
		playerObservers = append(playerObservers, o)
	}
	for _, playerObserverName := range playerObservers {
		msgCardsPlayedAndTaken := server.NewMessageToOnePlayer(server.CardsPlayedAndTaken, playerObserverName)
		msgCardsPlayedAndTaken.ResponseTo = responseTo
		msgCardsPlayedAndTaken.CardPlayed = cardPlayed
		msgCardsPlayedAndTaken.CardsTaken = cardsTaken
		msgCardsPlayedAndTaken.FinalTableTake = finalTableTake
		msgCardsPlayedAndTaken.CardPlayedByPlayer = c.name
		msgCardsPlayedAndTaken.FinalTableTake = finalTableTake
		msgCardsPlayedAndTakenJ, e := json.Marshal(msgCardsPlayedAndTaken)
		if e != nil {
			panicMessage := fmt.Sprintf("Marshalling to json of %v failed with error %v\n", msgCardsPlayedAndTaken, e)
			panic(panicMessage)
		}
		// ATTENTION PLEASE
		c.hub.clients[playerObserverName].send <- msgCardsPlayedAndTakenJ
	}
}

// writePump pumps messages from the hub to the websocket connection.
//
// A goroutine running writePump is started for each connection. The
// application ensures that there is at most one writer to a connection by
// executing all writes from this goroutine.
func (c *client) writePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
		fmt.Println("&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&& - write pump defer", c.name)
	}()
	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				// The hub closed the channel.
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				fmt.Println("&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&& - The hub closed the channel", c.name)
				return
			}

			w, err := c.conn.NextWriter(websocket.TextMessage)
			if err != nil {
				fmt.Println("&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&& - NextWriter", c.name)
				return
			}
			w.Write(message)

			// Add queued chat messages to the current websocket message.
			n := len(c.send)
			for i := 0; i < n; i++ {
				w.Write(newline)
				w.Write(<-c.send)
			}

			if err := w.Close(); err != nil {
				fmt.Println("&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&& - w.Close()", c.name)
				return
			}
		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}
