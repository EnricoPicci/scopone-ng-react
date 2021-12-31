// Package team implements the team
package team

import (
	"go-scopone/src/game-logic/deck"
	"go-scopone/src/game-logic/player"
)

// Team is made of 2 Players, has some Cards taken and can have some SCOPE_OF_SCOPONE
type Team struct {
	Players        []*player.Player
	TakenCards     []deck.Card
	ScopeDiScopone []deck.Card
}

// New returns a team with 2 players
func New() *Team {
	team := Team{}
	players := make([]*player.Player, 2)
	team.Players = players
	return &team
}

// Name returns the name of the team
func Name(t *Team) string {
	name := t.Players[0].Name + "_" + t.Players[1].Name
	return name
}
