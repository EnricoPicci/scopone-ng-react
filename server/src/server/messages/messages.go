// Package server implements the server
package server

import (
	"time"

	"go-scopone/src/game-logic/deck"
	"go-scopone/src/game-logic/player"
	"go-scopone/src/game-logic/scopone"

	"github.com/spf13/viper"
)

// MessageFromPlayer contains all possible properties that a JSON message coming from a Player can have
// It does not mean that every message has all of them, e.g. the AddPlayer message does not the GameName property
type MessageFromPlayer struct {
	ID         string      `json:"id"`
	TsSent     string      `json:"tsSent"`
	PlayerName string      `json:"playerName"`
	GameName   string      `json:"gameName"`
	CardPlayed deck.Card   `json:"cardPlayed"`
	CardsTaken []deck.Card `json:"cardsTaken"`
}

// Ids of messages that can be sent to the clients
const (
	PlayerLeftMsgID                = "PlayerLeftOsteria"
	PlayersMsgID                   = "Players"
	GamesMsgID                     = "Games"
	PlayerIsAlreadyInOsteria       = "PlayerIsAlreadyInOsteria"
	GameWithSameNamePresent        = "GameWithSameNamePresent"
	ErrorAddingPlayerToGameMsgID   = "ErrorAddingPlayerToGame"
	HandView                       = "HandView"
	CardsPlayedAndTaken            = "CardsPlayedAndTaken"
	ErrorAddingObserverToGameMsgID = "ErrorAddingObserverToGame"
)

// MessageToAllClients is a message to be sent to all clients
type MessageToAllClients struct {
	ResponseTo string           `json:"responseTo"`
	Receiver   string           `json:"receiver,omitempty"`
	ID         string           `json:"id"`
	TsSent     string           `json:"tsSent"`
	PlayerName string           `json:"playerName,omitempty"`
	Players    []*player.Player `json:"players,omitempty"`
	Games      []*scopone.Game  `json:"games"`
	Teams      [][]string       `json:"teams,omitempty"`
	MsgVersion string           `json:"msgVersion"`
}

// NewMessageToAllClients creates a message for all clients
func NewMessageToAllClients(id string) MessageToAllClients {
	var msg MessageToAllClients
	msg.ID = id
	msg.TsSent = time.Now().String()
	msg.MsgVersion = msgVersion()
	return msg
}

// MessageToOnePlayer is a message for one specific player
type MessageToOnePlayer struct {
	ResponseTo         string                            `json:"responseTo"`
	ID                 string                            `json:"id"`
	TsSent             string                            `json:"tsSent"`
	PlayerName         string                            `json:"playerName"`
	HandPlayerView     scopone.HandPlayerView            `json:"handPlayerView,omitempty"`
	AllHandPlayerViews map[string]scopone.HandPlayerView `json:"allHandPlayerViews,omitempty"`
	Error              string                            `json:"error,omitempty"`
	GameName           string                            `json:"gameName,omitempty"`
	CardPlayed         deck.Card                         `json:"cardPlayed,omitempty"`
	CardsTaken         []deck.Card                       `json:"cardsTaken,omitempty"`
	CardPlayedByPlayer string                            `json:"cardPlayedByPlayer"`
	FinalTableTake     scopone.FinalTableTake            `json:"finalTableTake"`
	MsgVersion         string                            `json:"msgVersion"`
}

// NewMessageToOnePlayer creates a message for one player
func NewMessageToOnePlayer(id string, playerName string) MessageToOnePlayer {
	var msg MessageToOnePlayer
	msg.ID = id
	msg.PlayerName = playerName
	msg.TsSent = time.Now().String()
	msg.MsgVersion = msgVersion()
	return msg
}

func msgVersion() string {
	msgVersion, ok := viper.Get("VERSION").(string)
	if !ok {
		//panic("Invalid type assertion")
		return "not supported yet"
	}
	return msgVersion
}
