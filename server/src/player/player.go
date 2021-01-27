package player

import "go-scopone/src/deck"

// PlayerStatus is the type for the status of a player
type PlayerStatus string

// values of the status of the player
const (
	PlayerPlaying             PlayerStatus = "playing"
	PlayerLookingAtHandResult PlayerStatus = "lookingAtHandResult"
	PlayerNotPlaying          PlayerStatus = "notPlayingAnyGame"
	PlayerLeftOsteria         PlayerStatus = "leftOsteriaMaybeMomentarely"
	PlayerObserving           PlayerStatus = "observingGames"
)

// A Player of the Game
type Player struct {
	Name string `json:"name"`
	// this should not be sent as json property since this would mean to send the cards of all players
	// any time the Players list is sent to the clients to refresh them
	Cards  []deck.Card  `json:"-"` // DO NOT SEND THIS AS JSON PROPERTY
	Status PlayerStatus `json:"status"`
}

// New returns a new Player
func New(name string) *Player {
	p := Player{}
	p.Name = name
	p.Status = PlayerNotPlaying
	return &p
}
