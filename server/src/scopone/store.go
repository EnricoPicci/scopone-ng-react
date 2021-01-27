package scopone

import "go-scopone/src/player"

// PlayerWriter adds, updates, deletes a Player in the sotre
type PlayerWriter interface {
	AddPlayerEntry(player *player.Player) error
}

// GameWriter saves a game in the store
type GameWriter interface {
	WriteGame(game *Game) error
}

// GameReader reads the games from the store
type GameReader interface {
	ReadOpenGames() (map[string]*Game, map[string]*player.Player, error)
}

// GameReadWriter reads and writes the games with mongo
type GameReadWriter interface {
	GameReader
	GameWriter
}

// DoNothingStore represents a store that does nothing
// It is used as default store for Osteria
// If Osteria has to have a real store, somebody has to set a real store from outside Osteria
type DoNothingStore struct {
}

// AddPlayerEntry does nothing
func (store *DoNothingStore) AddPlayerEntry(player *player.Player) error {
	return nil
}

// WriteGame does nothing
func (store *DoNothingStore) WriteGame(game *Game) error {
	return nil
}

// ReadOpenGames does nothing
func (store *DoNothingStore) ReadOpenGames() (games map[string]*Game, players map[string]*player.Player, err error) {
	games = make(map[string]*Game)
	players = make(map[string]*player.Player)
	return
}
