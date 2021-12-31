package scopone

import (
	"testing"

	"go-scopone/src/game-logic/player"
)

func TestAddPlayerToNewGameAndGameState(t *testing.T) {
	player1 := player.New("Player_1")
	player2 := player.New("Player_2")
	player3 := player.New("Player_3")
	player4 := player.New("Player_4")
	game := NewGame()

	// test the game status is "created"
	if game.State != GameCreated {
		t.Errorf("A game just created should have state created but has state %v", game.State)
	}

	// add the first 2 players
	err_ := game.AddPlayer(player1)
	if err_ != nil {
		panic(err_)
	}
	err_ = game.AddPlayer(player2)
	if err_ != nil {
		panic(err_)
	}

	// test the game status is "TeamsForming" since at least one player has entered the game but not all players have joined
	if game.State != TeamsForming {
		t.Errorf("A game with at least one player should have state open but has state %v", game.State)
	}

	// test that if we try to add a player already present we get an error
	e := game.AddPlayer(player1)
	if e == nil {
		t.Errorf("We should not be able to add twice the same player")
	}

	err_ = game.AddPlayer(player3)
	if err_ != nil {
		panic(err_)
	}
	err_ = game.AddPlayer(player4)
	if err_ != nil {
		panic(err_)
	}
	// test that a new Game has no Hands
	if len(game.Hands) != 0 {
		t.Errorf("The current game has %v hands and not 0", len(game.Hands))
	}
	// test that a new Game has 2 Teams
	if len(game.Teams) != 2 {
		t.Errorf("The current game has %v Teams and not 2", len(game.Teams))
	}
	// test that each team has 2 Players
	t0 := game.Teams[0]
	t1 := game.Teams[1]
	if len(t0.Players) != 2 {
		t.Errorf("The first team has %v Players and not 2", len(t0.Players))
	}
	if len(t0.Players) != 2 {
		t.Errorf("The second team has %v Players and not 2", len(t1.Players))
	}
	// test the game state is "Open" since all players have joined
	if game.State != GameOpen {
		t.Errorf("A game with at least one player should have state open but has state %v", game.State)
	}

	// test that if we try to add one more player we get an error
	player5 := player.New("Player 5")
	e = game.AddPlayer(player5)
	if e == nil {
		t.Errorf("We should not be able to add a fifth player")
	}

	// test that if we try to add a player already present we get an error
	e = game.AddPlayer(player1)
	if e == nil {
		t.Errorf("We should not be able to add twice the same player")
	}
}
