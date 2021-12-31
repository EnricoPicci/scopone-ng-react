// inspired by https://github.com/gorilla/websocket/tree/master/examples/chat

package srvgorilla

import (
	// "bytes"

	"flag"
	"fmt"
	"log"
	"net/http"
	"time"

	"go-scopone/src/game-logic/scopone"

	"github.com/gorilla/websocket"
)

// https://stackoverflow.com/a/56312831/5699993
var addr = flag.String("addr", ":8080", "http service address")

const (
	// Time allowed to write a message to the peer.
	writeWait = 10 * time.Second

	// Time allowed to read the next pong message from the peer.
	pongWait = 60 * time.Second

	// Send pings to peer with this period. Must be less than pongWait.
	pingPeriod = (pongWait * 9) / 10

	// Maximum message size allowed from peer.
	// maxMessageSize = 512
)

var (
	newline = []byte{'\n'}
	space   = []byte{' '}
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

// Hub maintains the set of active clients and broadcasts messages to the
// clients.
type Hub struct {
	broadcastMsg     chan []byte
	clients          map[string]*client
	registerClient   chan *client
	unregisterClient chan *client
}

func newHub() *Hub {
	return &Hub{
		broadcastMsg:     make(chan []byte),
		clients:          make(map[string]*client),
		registerClient:   make(chan *client),
		unregisterClient: make(chan *client),
	}
}

func (h *Hub) run() {
	for {
		select {
		case message := <-h.broadcastMsg:
			for k, client := range h.clients {
				select {
				case client.send <- message:
				default:
					close(client.send)
					delete(h.clients, k)
				}
			}
		case c := <-h.registerClient:
			h.clients[c.name] = c
		case client := <-h.unregisterClient:
			if _, ok := h.clients[client.name]; ok {
				delete(h.clients, client.name)
				close(client.send)
				log.Printf("Connection closed - Name: %v", client.name)
			}
		}
	}
}

// ServeOsteria handles websocket requests from the Players that want to play in the Osteria.
func serveOsteria(hub *Hub, scopone *scopone.Scopone, w http.ResponseWriter, r *http.Request) {
	// just assume the origin is OK - security happiness
	upgrader.CheckOrigin = func(r *http.Request) bool { return true }

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}

	// conn.SetReadLimit(maxMessageSize)
	conn.SetReadDeadline(time.Now().Add(pongWait))
	conn.SetPongHandler(func(string) error { conn.SetReadDeadline(time.Now().Add(pongWait)); return nil })

	client := &client{hub: hub, conn: conn, send: make(chan []byte, 256), scopone: scopone}

	// Allow collection of memory referenced by the caller by doing all work in
	// new goroutines.
	go client.writePump()
	go client.readPump()
}

// Start the server
func Start(playerStore scopone.PlayerWriter, gameStore scopone.GameReadWriter) {
	fmt.Println("Server started")
	flag.Parse()

	http.HandleFunc("/", homePage)

	hub := newHub()
	go hub.run()

	scopone := scopone.New(playerStore, gameStore)

	http.HandleFunc("/osteria", func(w http.ResponseWriter, r *http.Request) {
		serveOsteria(hub, scopone, w, r)
	})

	err := http.ListenAndServe(*addr, nil)
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}

func homePage(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, "Home Page")
}
