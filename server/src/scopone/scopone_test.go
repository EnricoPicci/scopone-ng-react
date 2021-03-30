package scopone

import (
	"fmt"
	"sort"
	"testing"

	"go-scopone/src/deck"
	"go-scopone/src/player"
	"go-scopone/src/team"
)

func newTestGameFactory(scopone *Scopone, gName string) *Game {
	return newGame("Player_1", "Player_2", "Player_3", "Player_4", scopone, gName)
}
func newGame(p1 string, p2 string, p3 string, p4 string, scopone *Scopone, gName string) *Game {
	g, _ := scopone.NewGame(gName)
	scopone.PlayerEnters(p1)
	scopone.PlayerEnters(p2)
	scopone.PlayerEnters(p3)
	scopone.PlayerEnters(p4)
	scopone.AddPlayerToGame(p1, gName)
	scopone.AddPlayerToGame(p2, gName)
	scopone.AddPlayerToGame(p3, gName)
	scopone.AddPlayerToGame(p4, gName)
	return g
}

func TestPlayCard(t *testing.T) {
	scopone := New(&DoNothingStore{}, &DoNothingStore{})
	firstPlayerSecondTeam := "Player_3"
	g := newGame("Player_1", "Player_2", firstPlayerSecondTeam, "Player_4", scopone, "TestPlayCard")
	scopone.NewHand(g)
	hand := currentHand(g)
	player := currentPlayer(g)
	card := g.Players[player.Name].Cards[1]
	numberOfCards := len(player.Cards)
	handView, _, _ := scopone.Play(player.Name, card, []deck.Card{})
	// the player has 1 card less
	if len(player.Cards) != numberOfCards-1 {
		t.Errorf("Number of cards is %v and not %v as expected", len(player.Cards), numberOfCards-1)
	}
	// the card which is not in players hand is the one played
	_, found := deck.Find(player.Cards, card)
	if found {
		t.Errorf("Cards %v should bnot be in player's hand any more", card)
	}
	// test that the card played is on the table
	if len(hand.Table) != 1 {
		t.Errorf("There should be just one card on the table and not %v", len(hand.Table))
	}
	_, found = deck.Find(hand.Table, card)
	if !found {
		t.Errorf("%v should be on the table but the table has these cards %v", card, hand.Table)
	}
	// test that the other players have still 10 cards
	for _, p := range g.Players {
		if p.Name != player.Name {
			if len(p.Cards) != 10 {
				t.Errorf("Player %v should have 10 cards but has %v cards", p, len(p.Cards))
			}
		}
	}
	// test that no team has any Scopa
	for _, team := range g.Teams {
		if len(team.ScopeDiScopone) != 0 {
			t.Errorf("Team %v has Scope %v but should have none", team, team.ScopeDiScopone)
		}
	}
	// test that current player now is the first player ofthe second team
	if hand.CurrentPlayer.Name != firstPlayerSecondTeam {
		t.Errorf("The current palyer should be %v but is %v", firstPlayerSecondTeam, hand.CurrentPlayer.Name)
	}
	// test that the handView returned is correct
	for pName, hvForPlayer := range handView {
		// simply test that the first card in the handView for a certain player is present in the Player known by the game
		playerFromGame := g.Players[pName]
		oneCard := hvForPlayer.PlayerCards[0]
		_, OK := deck.Find(playerFromGame.Cards, oneCard)
		if !OK {
			t.Errorf("Player Hand View for player %v has card %v which is not among the cards of %v", pName, oneCard, playerFromGame)
		}
		// test that the card on the table is correctly reflected in the handView
		if len(hvForPlayer.Table) != len(hand.Table) {
			t.Errorf("Player Hand View for player %v shows this as table %v but it should be this %v", pName, hvForPlayer.Table, hand.Table)
		}
		cardOnTable := hand.Table[0]
		_, OK = deck.Find(hvForPlayer.Table, cardOnTable)
		if !OK {
			t.Errorf("The table on the Hand View for player %v has not the card %v which is on the game table", pName, cardOnTable)
		}
		// Test Scope on Hand View
		if len(hvForPlayer.OurScope) != 0 {
			t.Errorf("Our Scope the Hand View for player %v should be empty but instead has %v", pName, hvForPlayer.OurScope)
		}
		if len(hvForPlayer.TheirScope) != 0 {
			t.Errorf("Their Scope the Hand View for player %v should be empty but instead has %v", pName, hvForPlayer.TheirScope)
		}
		// Test Status of Hand View
		if hvForPlayer.Status != HandActive {
			t.Errorf("The Status of the Hand View for player %v should be Active but instead has %v", pName, hvForPlayer.Status)
		}
		// Test First Player name of Hand View
		if hvForPlayer.FirstPlayerName != hand.FirstPlayer.Name {
			t.Errorf("The First Player of the Hand View for player %v should be %v but instead is %v", pName, hand.FirstPlayer.Name, hvForPlayer.FirstPlayerName)
		}
		// Test Current Player name of Hand View
		if hvForPlayer.CurrentPlayerName != hand.CurrentPlayer.Name {
			t.Errorf("The Current Player of the Hand View for player %v should be %v but instead is %v", pName, hand.CurrentPlayer.Name, hvForPlayer.CurrentPlayerName)
		}
		// Test Current Game Score
		if hvForPlayer.OurCurrentGameScore != 0 {
			t.Errorf("Our Current Game Score of the Hand View for player %v should be 0 but instead is %v", pName, hvForPlayer.OurCurrentGameScore)
		}
		if hvForPlayer.TheirCurrentGameScore != 0 {
			t.Errorf("Their Current Game Score of the Hand View for player %v should be 0 but instead is %v", pName, hvForPlayer.TheirCurrentGameScore)
		}
		// Test Final Hand Score
		if hvForPlayer.OurFinalHandScore != 0 {
			t.Errorf("Our Final Hand Score of the Hand View for player %v should be 0 but instead is %v", pName, hvForPlayer.OurFinalHandScore)
		}
		if hvForPlayer.TheirFinalHandScore != 0 {
			t.Errorf("Their Final Hand Score of the Hand View for player %v should be 0 but instead is %v", pName, hvForPlayer.TheirFinalHandScore)
		}
	}
}

// The first player plays a card and the second player has a card for Scopa
func TestPlayCardWithScopa(t *testing.T) {
	scopone := New(&DoNothingStore{}, &DoNothingStore{})
	g := newGame("Player_1", "Player_2", "Player_3", "Player_4", scopone, "TestPlayCardWithScopa")
	scopone.NewHand(g)
	hand := currentHand(g)
	player1 := currentPlayer(g)
	player2 := nextPlayer(g)
	card1 := g.Players[player1.Name].Cards[1]
	var card2 deck.Card
	for _, c := range hand.Deck {
		if c.Type == card1.Type && c.Suit != card1.Suit {
			card2 = c
			break
		}
	}
	player2.Cards[0] = card2

	// player1 plays the card
	scopone.Play(player1.Name, card1, []deck.Card{})
	// player2 palys a card to make Scopa on the card played by player1
	handView, _, _ := scopone.Play(player2.Name, card2, []deck.Card{card1})

	// test that no card played is on the table
	if len(hand.Table) != 0 {
		t.Errorf("There should be NO card on the table but we see these cards %v", hand.Table)
	}
	// test that the players have the right amount of cards
	for _, p := range g.Players {
		if p.Name != player1.Name && p.Name != player2.Name {
			if len(p.Cards) != 10 {
				t.Errorf("Player %v should have 10 cards but has %v cards", p, len(p.Cards))
			}
		} else if len(p.Cards) != 9 {
			t.Errorf("Player %v should have 9 cards but has %v cards", p, len(p.Cards))
		}
	}
	// test that player2 Team has one Scopa and 2 takenCards and the other no Scopa and no TakenCards
	for _, team := range g.Teams {
		if team.Players[0].Name == player2.Name || team.Players[1].Name == player2.Name {
			if len(team.ScopeDiScopone) != 1 {
				t.Errorf("Team %v should have 1 Scopa but has %v", team, len(team.ScopeDiScopone))
			}
			if len(team.TakenCards) != 2 {
				t.Errorf("Team %v should have 2 TakenCards but has %v", team, len(team.ScopeDiScopone))
			}
		} else {
			if len(team.ScopeDiScopone) != 0 {
				t.Errorf("Team %v should have no Scopa but has %v", team, len(team.ScopeDiScopone))
			}
			if len(team.TakenCards) != 0 {
				t.Errorf("Team %v should have 0 TakenCards but has %v", team, len(team.ScopeDiScopone))
			}
		}
	}
	// test that the handView returned is correct
	for pName, hvForPlayer := range handView {
		firstTeam := g.Teams[0]
		isPlayerOfFirstTeam := false
		if firstTeam.Players[0].Name == pName || firstTeam.Players[1].Name == pName {
			isPlayerOfFirstTeam = true
		}
		// Test Scope on Hand View
		if isPlayerOfFirstTeam {
			if len(hvForPlayer.OurScope) != 0 {
				t.Errorf("Our Scope the Hand View for player %v should be empty but instead has %v", pName, hvForPlayer.OurScope)
			}
			if len(hvForPlayer.TheirScope) != 1 {
				t.Errorf("Their Scope the Hand View for player %v should have one scopa but instead has %v", pName, hvForPlayer.TheirScope)
			}
		} else {
			if len(hvForPlayer.OurScope) != 1 {
				t.Errorf("Our Scope the Hand View for player %v should have one scopa but instead has %v", pName, hvForPlayer.OurScope)
			}
			if len(hvForPlayer.TheirScope) != 0 {
				t.Errorf("Their Scope the Hand View for player %v should be empty but instead has %v", pName, hvForPlayer.TheirScope)
			}
		}
	}
}

// All the cards are played - the second team takes all cards and the first team takes none
// the rules of Scopone are not followed in this test, all cards on the table are just taken, regardless of the card played
// this is just to test that the closure of the hand is reached and the calculations of the score triggered
func TestPlayAllCards(t *testing.T) {
	scopone := New(&DoNothingStore{}, &DoNothingStore{})
	g := newGame("Player_1", "Player_2", "Player_3", "Player_4", scopone, "TestPlayAllCards")
	scopone.NewHand(g)
	hand := currentHand(g)
	var cardOfLastPlayer deck.Card
	var handView map[string]HandPlayerView
	for range hand.Deck {
		player := currentPlayer(g)
		c := player.Cards[0]
		var cardsTaken []deck.Card
		if len(hand.Table) > 0 {
			cardsTaken = []deck.Card{cardOfLastPlayer}
		}
		handView, _, _ = scopone.Play(player.Name, c, cardsTaken)
		cardOfLastPlayer = c
	}

	// test that the hand is closed
	if hand.State != HandClosed {
		t.Errorf("The hand should be closed and instread is %v", hand.State)
	}
	// test the score
	// FIRST TEAM SCORE
	handScoreFirstTeam := hand.Score[team.Name(g.Teams[0])]
	if handScoreFirstTeam.Score != 0 {
		t.Errorf("The first team should have zero score in this hand but has %v", handScoreFirstTeam.Score)
	}
	// the game score keeps the sum of all game scores per team
	gameScoreFirstTeam := g.Score[team.Name(g.Teams[0])]
	if gameScoreFirstTeam != 0 {
		t.Errorf("The first team should have zero score in this game but has %v", gameScoreFirstTeam)
	}
	// SECOND TEAM SCORE
	handScoreSecondTeam := hand.Score[team.Name(g.Teams[1])]
	// the score is composed by 4 points di Mazzo, 10 Napoli, 10 Scope
	if handScoreSecondTeam.Score != 33 {
		t.Errorf("The second team should have score 33 but has %v", handScoreSecondTeam.Score)
	}
	// the game score keeps the sum of all game scores per team
	gameScoreSecondTeam := g.Score[team.Name(g.Teams[1])]
	if gameScoreSecondTeam != 33 {
		t.Errorf("The first team should have 33 score in this game but has %v", gameScoreSecondTeam)
	}

	// test that the handView returned is correct
	for pName, hvForPlayer := range handView {
		firstTeam := g.Teams[0]
		isPlayerOfFirstTeam := false
		if firstTeam.Players[0].Name == pName || firstTeam.Players[1].Name == pName {
			isPlayerOfFirstTeam = true
		}
		// Test Cards
		if len(hvForPlayer.PlayerCards) != 0 {
			t.Errorf("Cards in the Hand View for player %v should be empty but instead has %v", pName, hvForPlayer.PlayerCards)
		}
		// Test Table
		if len(hvForPlayer.Table) != 0 {
			t.Errorf("Table in the Hand View for player %v should be empty but instead has %v", pName, hvForPlayer.PlayerCards)
		}
		// Test Scope on Hand View
		if isPlayerOfFirstTeam {
			if len(hvForPlayer.OurScope) != 0 {
				t.Errorf("Our Scope the Hand View for player %v should be empty but instead has %v", pName, hvForPlayer.OurScope)
			}
			if len(hvForPlayer.TheirScope) != 19 {
				t.Errorf("Their Scope the Hand View for player %v should have 10 scope but instead has %v", pName, hvForPlayer.TheirScope)
			}
		} else {
			if len(hvForPlayer.OurScope) != 19 {
				t.Errorf("Our Scope the Hand View for player %v should have 10 scope but instead has %v", pName, hvForPlayer.OurScope)
			}
			if len(hvForPlayer.TheirScope) != 0 {
				t.Errorf("Their Scope the Hand View for player %v should be empty but instead has %v", pName, hvForPlayer.TheirScope)
			}
		}
		// Test Status of Hand View
		if hvForPlayer.Status != HandClosed {
			t.Errorf("The Status of the Hand View for player %v should be Colsed but instead has %v", pName, hvForPlayer.Status)
		}
		// Test Current Game Score
		if isPlayerOfFirstTeam {
			if hvForPlayer.OurCurrentGameScore != 0 {
				t.Errorf("Our Current Game Score of the Hand View for player %v should be 0 but instead is %v", pName, hvForPlayer.OurCurrentGameScore)
			}
			if hvForPlayer.TheirCurrentGameScore != 33 {
				t.Errorf("Their Current Game Score of the Hand View for player %v should be 33 but instead is %v", pName, hvForPlayer.TheirCurrentGameScore)
			}
		} else {
			if hvForPlayer.OurCurrentGameScore != 33 {
				t.Errorf("Our Current Game Score of the Hand View for player %v should be 33 but instead is %v", pName, hvForPlayer.OurCurrentGameScore)
			}
			if hvForPlayer.TheirCurrentGameScore != 0 {
				t.Errorf("Their Current Game Score of the Hand View for player %v should be 0 but instead is %v", pName, hvForPlayer.TheirCurrentGameScore)
			}
		}
		// Test Final Hand Score
		if isPlayerOfFirstTeam {
			if hvForPlayer.OurFinalHandScore != 0 {
				t.Errorf("Our Final Hand Score of the Hand View for player %v should be 0 but instead is %v", pName, hvForPlayer.OurFinalHandScore)
			}
			if hvForPlayer.TheirFinalHandScore != 33 {
				t.Errorf("Their Final Hand Score of the Hand View for player %v should be 33 but instead is %v", pName, hvForPlayer.TheirFinalHandScore)
			}
		} else {
			if hvForPlayer.OurFinalHandScore != 33 {
				t.Errorf("Our Final Hand Score of the Hand View for player %v should be 33 but instead is %v", pName, hvForPlayer.OurFinalHandScore)
			}
			if hvForPlayer.TheirFinalHandScore != 0 {
				t.Errorf("Their Final Hand Score of the Hand View for player %v should be 0 but instead is %v", pName, hvForPlayer.TheirFinalHandScore)
			}
		}
	}
}

// Two hands where all the cards are won by the team which starts playing as second
// the rules of Scopone are not followed in this test, all cards on the table are just taken, regardless of the card played
// This is to test that the game keeps the right score for the teams
// In the first hand, the second team wins all the cards because it is the second team to play the cards
// In the second hand the opposite happens, the first team is the team playing second, and so it wins all the cards
// The team which wins all the cards scores 24 point, made of 4 of Mazzo, 10 Napoli and 10 Scope
func TestPlayAllCardsTwoHands(t *testing.T) {
	scopone := New(&DoNothingStore{}, &DoNothingStore{})
	g := newGame("Player_1", "Player_2", "Player_3", "Player_4", scopone, "TestPlayAllCardsTwoHands")
	// First Hand
	scopone.NewHand(g)
	hand := currentHand(g)
	var cardOfLastPlayer deck.Card
	for range hand.Deck {
		player := currentPlayer(g)
		c := player.Cards[0]
		var cardsTaken []deck.Card
		if len(hand.Table) > 0 {
			cardsTaken = []deck.Card{cardOfLastPlayer}
		}
		scopone.Play(player.Name, c, cardsTaken)
		cardOfLastPlayer = c
	}
	// Second Hand
	scopone.NewHand(g)
	hand = currentHand(g)
	for range hand.Deck {
		player := currentPlayer(g)
		c := player.Cards[0]
		var cardsTaken []deck.Card
		if len(hand.Table) > 0 {
			cardsTaken = []deck.Card{cardOfLastPlayer}
		}
		scopone.Play(player.Name, c, cardsTaken)
		cardOfLastPlayer = c
	}

	// test that the hand is closed
	if hand.State != HandClosed {
		t.Errorf("The hand should be closed and instread is %v", hand.State)
	}
	// test the score
	// FIRST TEAM SCORE
	// the game score keeps the sum of all game scores per team
	gameScoreFirstTeam := g.Score[team.Name(g.Teams[0])]
	if gameScoreFirstTeam != 33 {
		t.Errorf("The first team should have 33 score in this game but has %v", gameScoreFirstTeam)
	}
	// SECOND TEAM SCORE
	// the score is composed by 4 points di Mazzo, 10 Napoli, 19 Scope, which makes 33 for each hand
	// the game score keeps the sum of all game scores per team
	gameScoreSecondTeam := g.Score[team.Name(g.Teams[1])]
	if gameScoreSecondTeam != 33 {
		t.Errorf("The first team should have 33 score in this game but has %v", gameScoreSecondTeam)
	}
}

func TestNewHand(t *testing.T) {
	s := New(&DoNothingStore{}, &DoNothingStore{})
	g := newTestGameFactory(s, "TestNewHand")
	hand, handPlayersView, _ := s.NewHand(g)
	// test that a new Game has one Hand
	if len(g.Hands) != 1 {
		t.Errorf("The current game has %v hands and not 1", len(g.Hands))
	}
	// test that a new Game has 2 Teams
	if len(g.Teams) != 2 {
		t.Errorf("The current game has %v Teams and not 2", len(g.Teams))
	}
	// test that each player has a deck with 10 cards
	var player *player.Player
	for i := range g.Teams {
		for j := range g.Teams[i].Players {
			player = g.Teams[i].Players[j]
			if len(player.Cards) != 10 {
				t.Errorf("The player %v has %v Cards and not 10", player.Name, len(player.Cards))
			}
		}
	}
	// test that the Players have 40 different cards
	cardMap := make(map[string]deck.Card)
	for _, t := range g.Teams {
		for _, p := range t.Players {
			for _, c := range p.Cards {
				cardKey := c.Suit + "_" + c.Type
				cardMap[cardKey] = c
			}
		}
	}
	if len(cardMap) != 40 {
		t.Errorf("The players have %v Cards and not 40", len(cardMap))
	}
	// Test that the new hand has a deck with 40 cards
	if len(hand.Deck) != 40 {
		t.Errorf("The deck of the new hand %v Cards and not 40", len(cardMap))
	}
	// Test the status of a new hand
	if hand.State != HandActive {
		t.Errorf("The new hand has status %v and not acticve", hand.State)
	}
	// Test that the winner of the new hand is nil
	if hand.Winner.Players != nil {
		t.Errorf("The new hand has winner %v but this should be nil", hand.Winner)
	}
	// Test that the first player of the new hand is the current player since no play has been made
	if hand.FirstPlayer.Name != hand.CurrentPlayer.Name {
		t.Errorf("The first player is %v and is not the same as the current player %v", hand.FirstPlayer, hand.CurrentPlayer)
	}
	// Test that the table of the new hand is empty
	if len(hand.Table) != 0 {
		t.Errorf("The table of the new hand should be empty but has %v cards", hand.Table)
	}
	// Test that the score of the new hand is empty
	if len(hand.Score) != 0 {
		t.Errorf("The score of the new hand should be empty but is %v ", hand.Score)
	}

	// Test that the hand view returned is for 4 players
	if len(handPlayersView) != 4 {
		t.Errorf("The hand player view should be for 4 but is for %v ", len(handPlayersView))
	}
	for k := range handPlayersView {
		// Test that the hand views for the players have 10 player cards
		if len(handPlayersView[k].PlayerCards) != 10 {
			t.Errorf("The hand player %v should have 10 cards but has %v cards", k, len(handPlayersView[k].PlayerCards))
		}
		// Test that the hand views for the players have 0 cards on the table
		if len(handPlayersView[k].Table) != 0 {
			t.Errorf("The hand player %v should have 0 cards on the table but has %v cards", k, len(handPlayersView[k].Table))
		}
		// Test that the hand views for the players have no ScoponeScope
		if len(handPlayersView[k].OurScope) != 0 {
			t.Errorf("The hand player %v should have 0 scope but has %v scope", k, len(handPlayersView[k].OurScope))
		}
		if len(handPlayersView[k].TheirScope) != 0 {
			t.Errorf("The hand player %v should see 0 scope of the other team but sees %v scope", k, len(handPlayersView[k].TheirScope))
		}
		// Test that the hand views for the players sees the status of the hand as active
		if handPlayersView[k].Status != HandActive {
			t.Errorf("The hand player %v should see the status as acticve but it is %v ", k, handPlayersView[k].Status)
		}
		// Test that the hand views for the players see the first player is the current player since no play has been made
		if handPlayersView[k].FirstPlayerName != handPlayersView[k].CurrentPlayerName {
			t.Errorf("The hand player %v sees the first player %v and is not the same as the current player %v", k, handPlayersView[k].FirstPlayerName, handPlayersView[k].CurrentPlayerName)
		}
		// Test that the hand views for the players see that the score is empty
		if handPlayersView[k].OurCurrentGameScore != 0 {
			t.Errorf("The score of the team of %v should be zero", k)
		}
		if handPlayersView[k].TheirCurrentGameScore != 0 {
			t.Errorf("The score of the team opposite of the team of %v should be zero", k)
		}
	}

}

func TestCurrentHand(t *testing.T) {
	s := New(&DoNothingStore{}, &DoNothingStore{})
	g := newTestGameFactory(s, "TestCurrentHand")
	s.NewHand(g)
	hand := currentHand(g)
	// fmt.Printf("hand %v", hand)
	// I test simply that there is a FirstPlayer defined to test that the current hand is not empty
	if hand.FirstPlayer.Name == "" {
		t.Errorf("The current hand has no FirstPlayer defined")
	}

}

func TestCurrentPlayer(t *testing.T) {
	s := New(&DoNothingStore{}, &DoNothingStore{})
	g := newTestGameFactory(s, "TestCurrentPlayer")
	s.NewHand(g)
	player := currentPlayer(g)
	if player.Name == "" {
		t.Errorf("The current player is not defined")
	}
}

// Test which is the next player for a brand new game - this must be the first player of the second team
func TestNextPlayerForNewGame(t *testing.T) {
	s := New(&DoNothingStore{}, &DoNothingStore{})
	g := newTestGameFactory(s, "TestNextPlayerForNewGame")
	s.NewHand(g)
	player := nextPlayer(g)
	if player.Name != g.Teams[1].Players[0].Name {
		t.Errorf("For a new Game the next player should be the first player of the second team but is not")
	}
}

func TestTeamOfPlayer(t *testing.T) {
	s := New(&DoNothingStore{}, &DoNothingStore{})
	pName := "This_Player"
	g := newGame(pName, "Player_2", "Player_3", "Player_4", s, "TestTeamOfPlayer")
	playerTeam, e := teamOfPlayer(pName, g)
	if e != nil {
		t.Errorf("%v should be in one team", pName)
	}
	var player *player.Player
	for _, p := range playerTeam.Players {
		if p.Name == pName {
			player = p
		}
	}
	if player.Name == "" {
		t.Errorf("%v should be in the team %v", pName, playerTeam)
	}
}

func TestOtherTeam(t *testing.T) {
	s := New(&DoNothingStore{}, &DoNothingStore{})
	pName := "This_Player"
	g := newGame(pName, "Player_2", "Player_3", "Player_4", s, "TestOtherTeam")
	notThePlayerTeam := otherTeam(pName, g)
	var player *player.Player
	for _, p := range notThePlayerTeam.Players {
		if p.Name == pName {
			player = p
		}
	}
	if player != nil {
		t.Errorf("%v should NOT be in the team %v", pName, notThePlayerTeam)
	}
}

func TestTeamForPlayerNotPresent(t *testing.T) {
	s := New(&DoNothingStore{}, &DoNothingStore{})
	pName := "Player_not_Present"
	g := newGame("Player_1", "Player_2", "Player_3", "Player_4", s, "TestTeamForPlayerNotPresent")
	_, e := teamOfPlayer(pName, g)
	if e == nil {
		t.Errorf("%v should not be in one team", pName)
	}
}

func TestSortForPrimiera(t *testing.T) {
	s := New(&DoNothingStore{}, &DoNothingStore{})
	g := newGame("Player_1", "Player_2", "Player_3", "Player_4", s, "TestSortForPrimiera")
	s.NewHand(g)
	hand := currentHand(g)
	// take all denari from the shuffled deck
	var denari byPrimiera = cardsWithSuit(deck.Denari, hand.Deck)
	// order denari for primiera
	sort.Sort(denari)

	// there are 10 denari
	if len(denari) != 10 {
		t.Errorf("Number of cards is %v and not 10 as expected", len(denari))
	}
	// the first one is seven
	if denari[0].Type != "Seven" {
		t.Errorf("The first in Primiera is Seven but here we find %v", denari[0])
	}
	// the second one is six
	if denari[1].Type != "Six" {
		t.Errorf("The second in Primiera is Six but here we find %v", denari[1])
	}
	// the third one one is Ace
	if denari[2].Type != "Ace" {
		t.Errorf("The third in Primiera is Ace but here we find %v", denari[2])
	}

}

// Test if sorting all suits works
func TestSortForPrimieraTwoSuits(t *testing.T) {
	s := New(&DoNothingStore{}, &DoNothingStore{})
	g := newGame("Player_1", "Player_2", "Player_3", "Player_4", s, "TestSortForPrimieraTwoSuits")
	s.NewHand(g)
	hand := currentHand(g)
	// take all suits from the shuffled deck
	var denari byPrimiera
	var bastoni byPrimiera
	var spade byPrimiera
	var coppe byPrimiera
	denari = cardsWithSuit(deck.Denari, hand.Deck)
	bastoni = cardsWithSuit("Bastoni", hand.Deck)
	spade = cardsWithSuit("Spade", hand.Deck)
	coppe = cardsWithSuit("Coppe", hand.Deck)
	// ordersuitsfor primiera
	sort.Sort(denari)
	sort.Sort(bastoni)
	sort.Sort(spade)
	sort.Sort(coppe)

	// there are 10 denari
	if len(denari) != 10 || len(bastoni) != 10 || len(spade) != 10 || len(coppe) != 10 {
		t.Errorf("Number of cards is %v and not 10 as expected", len(denari))
	}
	// the first one is seven
	if denari[0].Type != "Seven" || bastoni[0].Type != "Seven" || spade[0].Type != "Seven" || coppe[0].Type != "Seven" {
		t.Errorf("The first in Primiera is Seven but here we find %v", denari[0])
	}
	// the second one is six
	if denari[1].Type != "Six" || bastoni[1].Type != "Six" || spade[1].Type != "Six" || coppe[1].Type != "Six" {
		t.Errorf("The second in Primiera is Six but here we find %v", denari[1])
	}
	// the third one one is Ace
	if denari[2].Type != "Ace" || bastoni[2].Type != "Ace" || spade[2].Type != "Ace" || coppe[2].Type != "Ace" {
		t.Errorf("The third in Primiera is Ace but here we find %v", denari[2])
	}

}

func TestSortForNapoli(t *testing.T) {
	s := New(&DoNothingStore{}, &DoNothingStore{})
	g := newGame("Player_1", "Player_2", "Player_3", "Player_4", s, "TestSortForNapoli")
	s.NewHand(g)
	hand := currentHand(g)
	// take all denari from the shuffled deck
	var denari byNapoli = cardsWithSuit(deck.Denari, hand.Deck)
	// order denari for napoli
	sort.Sort(denari)

	// there are 10 denari
	if len(denari) != 10 {
		t.Errorf("Number of cards is %v and not 10 as expected", len(denari))
	}
	// the first one is ace
	if denari[0].Type != "Ace" {
		t.Errorf("The first in Napoli is Ace but here we find %v", denari[0])
	}
	// the second one is two
	if denari[1].Type != "Two" {
		t.Errorf("The second in Napoli is Two but here we find %v", denari[1])
	}
	// the third one one is Three
	if denari[2].Type != "Three" {
		t.Errorf("The third in Napoli is Three but here we find %v", denari[2])
	}

}

func TestPrimieraScore(t *testing.T) {
	d := []deck.Card{
		{Type: "Seven", Suit: deck.Denari}, // 21
		{Type: "Five", Suit: deck.Denari},
		{Type: "Ace", Suit: deck.Denari}, // 18
		{Type: "Six", Suit: "Bastoni"},
		{Type: "Five", Suit: "Bastoni"},
		{Type: "Ace", Suit: "Bastoni"},
		{Type: "Ace", Suit: "Spade"}, // 16
		{Type: "Three", Suit: "Spade"},
		{Type: "Ace", Suit: "Coppe"}, // 16
		{Type: "King", Suit: "Coppe"},
	}

	pSuits := primieraSuits(d)
	pScore := calculatePrimieraScore(pSuits)

	if pScore != 71 {
		t.Errorf("The expected Primiera score for this deck is 21 + 18 + 16 + 16 = 71  but we get %v\n", pScore)
	}

}

// Test the primiera score with shuffled cards
func TestPrimieraScoreShuffle(t *testing.T) {
	d := []deck.Card{
		{Type: "Seven", Suit: deck.Denari}, // 21
		{Type: "Ace", Suit: "Spade"},       // 16
		{Type: "Six", Suit: "Bastoni"},
		{Type: "Five", Suit: deck.Denari},
		{Type: "Five", Suit: "Bastoni"},
		{Type: "Ace", Suit: "Coppe"}, // 16
		{Type: "Ace", Suit: "Bastoni"},
		{Type: "Three", Suit: "Spade"},
		{Type: "King", Suit: "Coppe"},
		{Type: "Ace", Suit: deck.Denari}, // 18
	}

	pSuits := primieraSuits(d)
	pScore := calculatePrimieraScore(pSuits)

	if pScore != 71 {
		t.Errorf("The expected Primiera score for this deck is 21 + 18 + 16 + 16 = 71  but we get %v\n", pScore)
	}

}

// Test the primiera score with the entire deck
func TestPrimieraScoreWholeDeck(t *testing.T) {
	s := New(&DoNothingStore{}, &DoNothingStore{})
	g := newGame("Player_1", "Player_2", "Player_3", "Player_4", s, "TestPrimieraScoreWholeDeck")
	hand, _, _ := s.NewHand(g)
	d := hand.Deck

	pSuits := primieraSuits(d)
	pScore := calculatePrimieraScore(pSuits)

	if pScore != 84 {
		t.Errorf("The expected Primiera score for the entire deck is 21 + 4 = 84  but we get %v\n", pScore)
	}

}

// test the calculation of Primiera Score in case of Suit missing in the deck
func TestPrimieraScoreMissingSuit(t *testing.T) {
	d := []deck.Card{
		{Type: "Seven", Suit: deck.Denari}, // 21
		{Type: "Five", Suit: deck.Denari},
		{Type: "Ace", Suit: deck.Denari}, // 18
		{Type: "Six", Suit: "Bastoni"},
		{Type: "Five", Suit: "Bastoni"},
		{Type: "Ace", Suit: "Bastoni"},
		{Type: "Ace", Suit: "Spade"}, // 16
		{Type: "Three", Suit: "Spade"},
		{Type: "Jack", Suit: "Spade"},
		{Type: "King", Suit: "Spade"},
	}

	pSuits := primieraSuits(d)
	pScore := calculatePrimieraScore(pSuits)

	if pScore != 55 {
		t.Errorf("The expected Primiera score for this deck is 21 + 18 + 16 = 55  but we get %v\n", pScore)
	}

}

func TestCalculateScore(t *testing.T) {
	s := New(&DoNothingStore{}, &DoNothingStore{})
	g := newGame("Player_1", "Player_2", "Player_3", "Player_4", s, "TestCalculateScore")
	hand, _, _ := s.NewHand(g)

	// Settebello is the only point scored by this team
	takenCards1 := []deck.Card{
		{Type: "Seven", Suit: deck.Denari}, // settebello    Denaro
		{Type: "Five", Suit: deck.Denari},  //               Denaro
		{Type: "Ace", Suit: deck.Denari},   //               Denaro
		{Type: "Six", Suit: "Bastoni"},
		{Type: "Five", Suit: "Bastoni"},
		{Type: "Ace", Suit: "Bastoni"},
		{Type: "Ace", Suit: "Spade"},
		{Type: "Three", Suit: "Spade"},
		{Type: "Jack", Suit: "Spade"},
		{Type: "King", Suit: "Spade"},
	}
	g.Teams[0].TakenCards = takenCards1

	// This teams scores Carte, Denari and Primiera
	takenCards2 := deck.RemoveCards(hand.Deck, takenCards1)
	g.Teams[1].TakenCards = takenCards2

	if len(takenCards1)+len(takenCards2) != 40 {
		t.Errorf("The total of the cards shuold be 40 but is %v\n", len(takenCards1)+len(takenCards2))
	}

	var teams []*team.Team
	teams = append(teams, g.Teams[0], g.Teams[1])
	scores := calculateScore(teams)

	if scores[0].Score != 1 {
		t.Errorf("The score of first team should be 1 but is %v\n", scores[0].PrimieraScore)
		for _, v := range scores[0].ScoreCard.PrimieraSuits {
			fmt.Println(v)
		}
	}
	if scores[1].Score != 3 {
		t.Errorf("The score of second team should be 3 but is %v\n", scores[1].PrimieraScore)
		for _, v := range scores[1].ScoreCard.PrimieraSuits {
			fmt.Println(v)
		}
	}

}

func TestCalculateScoreWithScope(t *testing.T) {
	s := New(&DoNothingStore{}, &DoNothingStore{})
	g := newGame("Player_1", "Player_2", "Player_3", "Player_4", s, "TestCalculateScoreWithScope")
	hand, _, _ := s.NewHand(g)

	// Settebello and one Scopa is scored by this team
	takenCards1 := []deck.Card{
		{Type: "Seven", Suit: deck.Denari}, // settebello    Denaro
		{Type: "Five", Suit: deck.Denari},  //               Denaro
		{Type: "Ace", Suit: deck.Denari},   //               Denaro
		{Type: "Six", Suit: "Bastoni"},
		{Type: "Five", Suit: "Bastoni"},
		{Type: "Ace", Suit: "Bastoni"},
		{Type: "Ace", Suit: "Spade"},
		{Type: "Three", Suit: "Spade"},
		{Type: "Jack", Suit: "Spade"},
		{Type: "King", Suit: "Spade"},
	}
	g.Teams[0].TakenCards = takenCards1
	g.Teams[0].ScopeDiScopone = []deck.Card{takenCards1[2]}

	// This teams scores Carte, Denari and Primiera
	takenCards2 := deck.RemoveCards(hand.Deck, takenCards1)
	g.Teams[1].TakenCards = takenCards2

	if len(takenCards1)+len(takenCards2) != 40 {
		t.Errorf("The total of the cards shuold be 40 but is %v\n", len(takenCards1)+len(takenCards2))
	}

	var teams []*team.Team
	teams = append(teams, g.Teams[0], g.Teams[1])
	scores := calculateScore(teams)

	if scores[0].Score != 2 {
		t.Errorf("The score of first team should be 2 but is %v\n", scores[0])
	}
	if scores[1].Score != 3 {
		t.Errorf("The score of second team should be 3 but is %v\n", scores[1])
	}

}

func TestCalculateScoreWithScopeAndNapoli(t *testing.T) {
	s := New(&DoNothingStore{}, &DoNothingStore{})
	g := newGame("Player_1", "Player_2", "Player_3", "Player_4", s, "TestCalculateScoreWithScopeAndNapoli")
	hand, _, _ := s.NewHand(g)

	// Settebello, one Scopa and 3 Napoli is scored by this team
	takenCards1 := []deck.Card{
		{Type: "Seven", Suit: deck.Denari}, // settebello    Denaro
		{Type: "Five", Suit: deck.Denari},  //               Denaro
		{Type: "Ace", Suit: deck.Denari},   //               Denaro - Napoli
		{Type: "Three", Suit: deck.Denari}, //               Denaro - Napoli
		{Type: "Two", Suit: deck.Denari},   //               Denaro - Napoli
		{Type: "Six", Suit: "Bastoni"},
		{Type: "Five", Suit: "Bastoni"},
		{Type: "Ace", Suit: "Bastoni"},
		{Type: "Ace", Suit: "Spade"},
		{Type: "Three", Suit: "Spade"},
		{Type: "Jack", Suit: "Spade"},
		{Type: "King", Suit: "Spade"},
	}
	g.Teams[0].TakenCards = takenCards1
	g.Teams[0].ScopeDiScopone = []deck.Card{takenCards1[2]}

	// This teams scores Carte and Primiera - Denari are five so no point is scored for it
	takenCards2 := deck.RemoveCards(hand.Deck, takenCards1)
	g.Teams[1].TakenCards = takenCards2

	if len(takenCards1)+len(takenCards2) != 40 {
		t.Errorf("The total of the cards shuold be 40 but is %v\n", len(takenCards1)+len(takenCards2))
	}

	var teams []*team.Team
	teams = append(teams, g.Teams[0], g.Teams[1])
	scores := calculateScore(teams)

	if scores[0].Score != 5 {
		t.Errorf("The score of first team should be 5 but is %v\n", scores[0].Score)
	}
	if scores[1].Score != 2 {
		t.Errorf("The score of second team should be 2 but is %v\n", scores[1].Score)
	}

}

func TestCalculateScoreWithWholeNapoli(t *testing.T) {
	s := New(&DoNothingStore{}, &DoNothingStore{})
	g := newGame("Player_1", "Player_2", "Player_3", "Player_4", s, "TestCalculateScoreWithWholeNapoli")
	hand, _, _ := s.NewHand(g)

	// no point is scored by this team
	takenCards1 := []deck.Card{
		{Type: "Six", Suit: "Bastoni"},
		{Type: "Five", Suit: "Bastoni"},
		{Type: "Ace", Suit: "Bastoni"},
		{Type: "Ace", Suit: "Spade"},
		{Type: "Three", Suit: "Spade"},
		{Type: "Jack", Suit: "Spade"},
		{Type: "King", Suit: "Spade"},
	}

	// This teams scores all points and 10 Napoli
	takenCards2 := deck.RemoveCards(hand.Deck, takenCards1)
	g.Teams[1].TakenCards = takenCards2

	if len(takenCards1)+len(takenCards2) != 40 {
		t.Errorf("The total of the cards shuold be 40 but is %v\n", len(takenCards1)+len(takenCards2))
	}

	var teams []*team.Team
	teams = append(teams, g.Teams[0], g.Teams[1])
	scores := calculateScore(teams)

	if scores[0].Score != 0 {
		t.Errorf("The score of first team should be 0 but is %v\n", scores[0].Score)
	}
	if scores[1].Score != 14 {
		t.Errorf("The score of second team should be 14 but is %v\n", scores[1].Score)
	}

}

func TestPlayerEnters(t *testing.T) {
	playerName := "Biscazziere"
	scopone := New(&DoNothingStore{}, &DoNothingStore{})

	// test that if we add a Player we do not get an error
	hv, alreadyIn := scopone.PlayerEnters(playerName)
	if alreadyIn {
		t.Errorf("We can not add the player %v to the Osteria", playerName)
	}
	if hv != nil {
		t.Errorf("We should not receive handViews but rather we are receiving %v", hv)
	}

	// test that if we add 2 times the same Player we get an error since the player is already in the Osteria
	hv, alreadyIn = scopone.PlayerEnters(playerName)
	if !alreadyIn {
		t.Errorf("We should not let the player %v enter the Osteria since he is already in", playerName)
	}
	if hv != nil {
		t.Errorf("We should not receive handViews but rather we are receiving %v", hv)
	}

}

func TestNewGame(t *testing.T) {
	gameName := "A new game"
	scopone := New(&DoNothingStore{}, &DoNothingStore{})

	// test that if we create a new game we get no error
	_, err := scopone.NewGame(gameName)
	if err != nil {
		t.Errorf("We should be able to create a new game with name %v but we get an error %v", gameName, err)
	}

	// test that if we try to create a game with the same name of an existing game we get an error
	_, err = scopone.NewGame(gameName)
	if err == nil {
		t.Errorf("We should not create the game with name %v since there is already one", gameName)
	}

}

func TestAddPlayersToGame(t *testing.T) {
	playerName1 := "Player 1"
	playerName2 := "Player 2"
	playerName3 := "Player 3"
	playerName4 := "Player 4"
	playerName5 := "Player 5"
	playerNames := []string{
		playerName1,
		playerName2,
		playerName3,
		playerName4,
	}
	gameName := "A new game where to add players"
	scopone := New(&DoNothingStore{}, &DoNothingStore{})
	scopone.NewGame(gameName)
	g := scopone.Games[gameName]
	for _, name := range playerNames {
		scopone.PlayerEnters(name)
		e := scopone.AddPlayerToGame(name, gameName)
		if e != nil {
			t.Errorf("Player %v can not be added to the new game %v - error %v is returned", name, gameName, e)
		}
		// Test that we can NOT add add again the same player to the game
		e = scopone.AddPlayerToGame(playerName1, gameName)
		if e == nil {
			t.Errorf("Player %v can not be added 2 times to the new game %v", playerName1, gameName)
		}
		// Test that the player in in the right status
		pFromGame := g.Players[playerName1]
		if pFromGame.Status != player.PlayerPlaying {
			t.Errorf("Player %v should be in the PlayerNotPlaying status but is in %v status", playerName1, pFromGame.Status)
		}
		pFromOsteria := scopone.Players[playerName1]
		if pFromOsteria.Status != player.PlayerPlaying {
			t.Errorf("Player %v should be in the PlayerNotPlaying status but is in %v status", playerName1, pFromOsteria.Status)
		}
	}

	// Test that we can not add the fifth player
	scopone.PlayerEnters(playerName5)
	e := scopone.AddPlayerToGame(playerName5, gameName)
	if e == nil {
		t.Errorf("Player %v should not be added to the new game %v since it has already 4 players", playerName5, gameName)
	}

	// Test that we can not add a player to a game that does not exist
	e = scopone.AddPlayerToGame(playerName5, "a game that does not exist")
	if e == nil {
		t.Errorf("Player %v should not be added to a game that does not exist", playerName5)
	}

	// Test that we can not add a player that does not exist
	e = scopone.AddPlayerToGame("a player that does not exist", gameName)
	if e == nil {
		t.Errorf("Player that does not exist should not be added to the game %v", gameName)
	}
}

func TestAddPlayerToOsteriaAndThenRemove(t *testing.T) {
	playerName := "Player who leaves"
	scopone := New(&DoNothingStore{}, &DoNothingStore{})

	scopone.PlayerEnters(playerName)
	scopone.RemovePlayer(playerName)

	// test that if I add again the same player (i.e. the player comes back to the Osteria after he left)
	// I receive no handViews and no error
	hv, alreadyIn := scopone.PlayerEnters(playerName)
	if alreadyIn {
		t.Errorf("We can not add the player \"%v\" to the Osteria", playerName)
	}
	if hv != nil {
		t.Errorf("We should not receive handViews but rather we are receiving %v", hv)
	}

	// test that the status of the player is PlayerNotPlaying
	pStatus := scopone.Players[playerName].Status
	if pStatus != player.PlayerNotPlaying {
		t.Errorf("Player %v should be in the PlayerNotPlaying status but is in %v status", playerName, pStatus)
	}
}

func TestAddPlayerToGameAndThenRomove(t *testing.T) {
	playerName := "Player who enter the a game and then leaves"
	gameName := "A new game where the player comes and leaves"

	scopone := New(&DoNothingStore{}, &DoNothingStore{})
	scopone.PlayerEnters(playerName)
	scopone.NewGame(gameName)
	scopone.AddPlayerToGame(playerName, gameName)

	scopone.RemovePlayer(playerName)

	// test tha the player status is PlayerLeftTheGame
	g := scopone.Games[gameName]
	pStatus := g.Players[playerName].Status
	if pStatus != player.PlayerLeftOsteria {
		t.Errorf("Player %v should be in the PlayerLeftTheGame status but is in %v status", playerName, pStatus)
	}

	// Test that we can add again the player if he comes back and that he will be back in the game
	hv, alreadyIn := scopone.PlayerEnters(playerName)
	if alreadyIn {
		t.Errorf("Could not add Player %v to the new game \"%v\" - because aready in", playerName, gameName)
	}
	if hv != nil {
		t.Errorf("We should not receive handViews but rather we are receiving %v", hv)
	}
	pStatus = g.Players[playerName].Status
	if pStatus != player.PlayerPlaying {
		t.Errorf("Player %v should be in the PlayerPlaying status but is in %v status", playerName, pStatus)
	}
}

func TestStartGameAndThenRemovePlayers(t *testing.T) {
	playerName1 := "Player 1"
	playerName2 := "Player 2"
	playerName3 := "Player 3"
	playerName4 := "Player 4"
	playerNames := []string{
		playerName1,
		playerName2,
		playerName3,
		playerName4,
	}
	gameName := "A new game where players come and go"

	scopone := New(&DoNothingStore{}, &DoNothingStore{})
	scopone.NewGame(gameName)
	for _, name := range playerNames {
		scopone.PlayerEnters(name)
		scopone.AddPlayerToGame(name, gameName)
	}

	g := scopone.Games[gameName]
	scopone.NewHand(g)

	// test that the game is open
	if g.State != GameOpen {
		t.Errorf("Game \"%v\" should be open but is %v", gameName, g.State)
	}
	scopone.RemovePlayer(playerName3)

	// test that the game is suspended
	if g.State != GameSuspended {
		t.Errorf("Game \"%v\" should be suspended but is in state %v", gameName, g.State)
	}

	scopone.PlayerEnters(playerName3)
	// test that the game returns open
	if g.State != GameOpen {
		t.Errorf("Game \"%v\" should be open but is in state %v", gameName, g.State)
	}

	// test that after removing all players and adding back 1, the game is still suspended
	scopone.RemovePlayer(playerName1)
	scopone.RemovePlayer(playerName2)
	scopone.RemovePlayer(playerName3)
	scopone.RemovePlayer(playerName4)
	scopone.PlayerEnters(playerName2)
	if g.State != GameSuspended {
		t.Errorf("Game \"%v\" should be suspended but is in state %v", gameName, g.State)
	}
	// add 2 more players and the game is still suspended
	scopone.PlayerEnters(playerName3)
	scopone.PlayerEnters(playerName4)
	if g.State != GameSuspended {
		t.Errorf("Game \"%v\" should be suspended but is in state %v", gameName, g.State)
	}
	// add the last one and the game is open again
	scopone.PlayerEnters(playerName1)
	if g.State != GameOpen {
		t.Errorf("Game \"%v\" should be open but is in state %v", gameName, g.State)
	}

}
