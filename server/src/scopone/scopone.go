// Package scopone implements the rules of the game
package scopone

import (
	"fmt"
	"log"
	"sort"
	"strconv"

	"go-scopone/src/deck"
	"go-scopone/src/player"
	"go-scopone/src/team"

	"github.com/spf13/viper"
)

// Scopone is a traditional italian card game usually played in the Osteria which is a traditional bar
type Scopone struct {
	Players     map[string]*player.Player
	Games       map[string]*Game
	PlayerStore PlayerWriter
	GameStore   GameReadWriter
}

// New Scopone
func New(playerStore PlayerWriter, gameStore GameReadWriter) *Scopone {
	fmt.Println("Start Scopone")

	viper.SetDefault("VERSION", "no version set")

	viper.SetConfigType("env")
	viper.AddConfigPath(".")     // config path for runtime
	viper.AddConfigPath("../..") // config path for test
	viper.SetConfigName("app")

	err := viper.ReadInConfig()
	if err != nil {
		log.Fatalf("Error while reading config file. Error message: \"%s\"", err)
	}
	msgVersion, ok := viper.Get("VERSION").(string)
	if !ok {
		panic("Invalid type assertion - version is not a string")
	}

	s := Scopone{}
	fmt.Printf("Version %v \n", msgVersion)

	s.PlayerStore = playerStore
	s.GameStore = gameStore
	games, players, err := gameStore.ReadOpenGames()
	if err != nil {
		log.Println("Error occurred while reading games from store")
	}
	s.Games = games
	s.Players = players
	return &s
}

// PlayerEnters creates a player if it was never in the Osteria, reactivate the player if it was inactive because
// got disconnected and returns an error if the Player is already in the Osteria and is active
func (s *Scopone) PlayerEnters(pName string) (handViews map[string]HandPlayerView, alreadyIn bool) {
	alreadyIn = false

	if pName == "" {
		panic("The name of the player you want to add is empty\n")
	}

	plr, found := s.Players[pName]
	// the player is new and therefore needs to be created
	if !found {
		p := player.New(pName)
		s.Players[pName] = p
		p.Status = player.PlayerNotPlaying
		err := s.PlayerStore.AddPlayerEntry(p)
		if err != nil {
			panic(err)
		}
		return
	}

	// there is already a player with this name in the Osteria
	// check if the player is already playing a game or not
	pStatus := plr.Status
	switch pStatus {
	case player.PlayerLeftOsteria:
		fmt.Printf("Player %v returned to the Osteria\n", pName)
		err := s.PlayerStore.AddPlayerEntry(plr)
		if err != nil {
			panic(err)
		}
		// find if the player was playeing or observing any game
		gameOfPlayer, pFound := findGameForPlayer(plr, s.Games)
		_, oFound := findGameForObserver(plr.Name, s.Games)
		if !pFound && !oFound {
			// if the player was not in any game, then the player has just come back to the Osteria
			plr.Status = player.PlayerNotPlaying
			return
		}

		// if the player was already playing or observing a game and and the program reaches this point it means
		// that the player is coming back to the game
		if oFound {
			plr.Status = player.PlayerObserving
			return handViews, false
		}

		plr.Status = player.PlayerPlaying
		setStatusWhenHandClosed(gameOfPlayer, plr)
		// the state needs to be calculated after the status of the player has been updated - this piece is a bit
		// too much of stateful logic but this is how it is, at least for the moment
		gameOfPlayer.CalculateState()
		handViews := buildCurrentHandView(gameOfPlayer)
		return handViews, false

	default:
		alreadyIn = true
		return
	}
}

// findGameForPlayer returns the game the player is playing - if the player is not playing then it returns false
// in the second returned value
// There must be ONLY ONE game at most that a player plays
func findGameForPlayer(player *player.Player, games map[string]*Game) (*Game, bool) {
	for gK := range games {
		gameK := games[gK]
		if gameK.State != GameClosed {
			for pK := range gameK.Players {
				if gameK.Players[pK].Name == player.Name {
					return gameK, true
				}
			}
		}
	}
	return nil, false
}

// setStatusWhenHandClosed set the status to "PlayerLookingAtHandResult" if the hand is closed
func setStatusWhenHandClosed(g *Game, p *player.Player) {
	// if the Game has already one hand and the last hand is closed, it means that the player is just looking at the results
	// of the last hand, waiting for the next onw to be started
	nHands := len(g.Hands)
	if nHands > 0 {
		lastHand := g.Hands[nHands-1]
		if lastHand.State == HandClosed {
			p.Status = player.PlayerLookingAtHandResult
		}
	}
}

// findGameForObserver returns the game the player is observing - if the player is not observing then it returns false
// in the second returned value
func findGameForObserver(observerName string, games map[string]*Game) (*Game, bool) {
	for gK := range games {
		gameK := games[gK]
		if gameK.State != GameClosed {
			for pK := range gameK.Observers {
				if gameK.Observers[pK].Name == observerName {
					return gameK, true
				}
			}
		}
	}
	return nil, false
}

// AllPlayers returns all the players in the Osteria
func (s *Scopone) AllPlayers() (allPlayers []*player.Player) {
	allPlayers = make([]*player.Player, 0)
	for pK := range s.Players {
		p := s.Players[pK]
		allPlayers = append(allPlayers, p)
	}
	return
}

// RemovePlayer sets the status of the Player
// The player in NOT removed from the collection since he can come back later
// Removing is performed when a client is disconnected. If a new client is connected with the same name
// then the Player is brought back to his previous state (see addPlayer function)
// If the player was playing a game, then the players of the game are returned
// so that the server can update the clients
func (s *Scopone) RemovePlayer(playerName string) (players map[string]*player.Player, wasPlaying bool) {
	plr, found := s.Players[playerName]
	if !found {
		msg := fmt.Sprintf("We are trying to remove Player %v but the player is not in the Osteria", playerName)
		panic(msg)
	}
	if plr.Status == player.PlayerLeftOsteria {
		msg := fmt.Sprintf("We are trying to remove Player %v but the player has been already removed", playerName)
		panic(msg)
	}
	plr.Status = player.PlayerLeftOsteria
	playerGame, found := findGameForPlayer(plr, s.Games)
	if found {
		playerGame.Suspend()
		return playerGame.Players, true
	}
	observerGame, found := findGameForObserver(playerName, s.Games)
	if found {
		delete(observerGame.Observers, playerName)
	}
	return nil, false
}

// NewGame creates a new Game unsless a Game with the same name is already present
func (s *Scopone) NewGame(gName string) (g *Game, e error) {
	_, found := s.Games[gName]
	if found {
		e = fmt.Errorf("Game %v already present in the Osteria", gName)
		return
	}
	game := NewGame()
	game.Name = gName
	g = game
	s.Games[gName] = g
	err := s.GameStore.WriteGame(g)
	if err != nil {
		panic(err)
	}
	return
}

// AddPlayerToGame sends the request to the game to add one player
func (s *Scopone) AddPlayerToGame(playerName string, gameName string) (e error) {
	g, gfound := s.Games[gameName]
	if !gfound {
		e = fmt.Errorf("There is no Game with name %v", gameName)
		return
	}
	p, pfound := s.Players[playerName]
	if !pfound {
		e = fmt.Errorf("There is no Player with name %v", playerName)
		return
	}
	err := g.AddPlayer(p)
	if err == nil {
		err_ := s.GameStore.WriteGame(g)
		if err_ != nil {
			panic(err_)
		}
	}
	return err
}

// AddObserverToGame sends the request to the game to add one observer
func (s *Scopone) AddObserverToGame(playerName string, gameName string) (handViews map[string]HandPlayerView, e error) {
	g, gfound := s.Games[gameName]
	if !gfound {
		e = fmt.Errorf("There is no Game with name %v", gameName)
		return
	}
	p, pfound := s.Players[playerName]
	if !pfound {
		e = fmt.Errorf("There is no Player with name %v", playerName)
		return
	}
	handViews = buildCurrentHandView(g)
	e = g.AddObserver(p)
	if e == nil {
		err_ := s.GameStore.WriteGame(g)
		if err_ != nil {
			panic(err_)
		}
	}
	return handViews, e
}

// AllGames returns all the games in the Osteria
func (s *Scopone) AllGames() (allGames []*Game) {
	allGames = make([]*Game, 0)
	for gK := range s.Games {
		g := s.Games[gK]
		allGames = append(allGames, g)
	}
	return
}

// NewHand creates a new hand and saves it in the store
func (s *Scopone) NewHand(g *Game) (hand Hand, handView map[string]HandPlayerView, handCreated bool) {
	handCreated = true
	if len(g.Hands) > 0 {
		lastHand := g.Hands[len(g.Hands)-1]
		if lastHand.State == HandActive {
			handCreated = false
			return
		}
	}
	newDeck := deck.New()
	deck.Shuffle(newDeck)
	hand.Deck = newDeck
	hand.Table = make([]deck.Card, 0)
	hand.Score = make(map[string]TeamScore)
	if len(g.Hands) == 0 {
		hand.FirstPlayer = g.Teams[0].Players[0]
	} else {
		lastHand := g.Hands[len(g.Hands)-1]
		hand.FirstPlayer = playersSequence(g)[lastHand.FirstPlayer.Name]
	}
	hand.CurrentPlayer = hand.FirstPlayer
	g.Hands = append(g.Hands, &hand)
	// gives cards to the Players and initializes Scope and TakenCards
	for i := range g.Teams {
		g.Teams[i].ScopeDiScopone = []deck.Card{}
		g.Teams[i].TakenCards = []deck.Card{}
		for j := range g.Teams[i].Players {
			start := i*20 + j*10
			g.Teams[i].Players[j].Cards = currentHand(g).Deck[start : start+10]
		}
	}
	hand.State = HandActive
	hand.History = HandHistory{}
	g.History = append(g.History, &hand.History)
	var playerDecks = make(map[string][]deck.Card)
	for _, p := range g.Players {
		playerDecks[p.Name] = p.Cards
	}
	hand.History.PlayerDecks = playerDecks
	if handCreated {
		err_ := s.GameStore.WriteGame(g)
		if err_ != nil {
			panic(err_)
		}
	}
	return hand, buildHandView(&hand, g), handCreated
}

// FinalTableTake represents the cards, if any, taken from the table as result o the LAST card played
type FinalTableTake struct {
	Cards           []deck.Card
	TeamTakingTable []*player.Player
}

// Play a card means
// - remove the cardPlayed from the deck of the Player
// - add the cardPlayed to the table if there are no cardsTaken
// - assigning the cardPlayed and the cardsTaken to the Team if there are cardsTaken
// - set the Scopa if the table is left empty
// - if this is the last card of the last player closes the hand
// - otherwise set the next player as current player
func (s *Scopone) Play(pName string, cardPlayed deck.Card, cardsTaken []deck.Card) (handViews map[string]HandPlayerView,
	finalTableTake FinalTableTake, g *Game) {
	p, pFound := s.Players[pName]
	if !pFound {
		panic(fmt.Sprintf("Panicking! No player with name %v\n", pName))
	}
	g, gFound := findGameForPlayer(p, s.Games)
	if !gFound {
		panic(fmt.Sprintf("Panicking! Player %v is not playing any game\n", pName))
	}
	if len(g.Players) < 4 {
		panicMessage := fmt.Sprintf("%v tries to play before the teams are made and the game is started\n", pName)
		panic(panicMessage)
	}
	if pName != currentPlayer(g).Name {
		// if by chance we receive the command to play a card from a player who is not the current player
		// we log a warning and ignore the command - this situation should not happen but we have seen it happen
		// when the current user clicks twice fast and the front end does not check this situation
		log.Printf("Warning! Player with name %v is not the current player %v\n", pName, currentPlayer(g).Name)
		return
	}
	if cardPlayed.Suit == "" || cardPlayed.Type == "" {
		panicMessage := fmt.Sprintf("The card played %v has either no suit or no type or none of these things\n", cardPlayed)
		panic(panicMessage)
	}

	hand := currentHand(g)

	// register the data relative to the card played, the state of the game at that moment and the cards taken
	var playerDecks = make(map[string][]deck.Card)
	for _, p := range g.Players {
		playerDecks[p.Name] = p.Cards
	}
	var cardPlay = HandCardPlay{
		Player:       pName,
		Table:        hand.Table,
		CardPlayed:   cardPlayed,
		CardsTaken:   cardsTaken,
		PlayersDecks: playerDecks,
	}
	hand.History.CardPlaySequence = append(hand.History.CardPlaySequence, cardPlay)

	// take the cardPlayed card out of the cards of the Player
	p.Cards = deck.RemoveCard(p.Cards, cardPlayed)

	playerTeam, e := teamOfPlayer(pName, g)
	if e != nil {
		panic(fmt.Sprintf("Panicking! No team for player with name %v\n", pName))
	}

	// if there are no cards taken, add the card played to the table
	if len(cardsTaken) == 0 {
		hand.Table = append(hand.Table, cardPlayed)
	} else {
		// if there are cards taken, remove them from the table
		hand.Table = deck.RemoveCards(hand.Table, cardsTaken)
		// and add them to the cardsTaken by the team
		playerTeam.TakenCards = append(playerTeam.TakenCards, cardsTaken...)
		// and add the card played to the cards of the team
		playerTeam.TakenCards = append(playerTeam.TakenCards, cardPlayed)
		// if there are no cards on the table and it is not the last player on the last round, then this is Scopa
		if len(hand.Table) == 0 && !(isLastPlayer(pName, g) && len(p.Cards) == 0) {
			playerTeam.ScopeDiScopone = append(playerTeam.ScopeDiScopone, cardPlayed)
		}
	}

	// if this is the last card of the last player, give all cards on the table to the last team which took some cards
	if len(p.Cards) == 0 && isLastPlayer(pName, g) {
		//
		// this block is to manage in the history the fact that we can have to add a final CardPlay, with no card played
		// but with cards taken from the table to represent the fact that it is not the last team to get the cards left
		// on the table but rather it is the first team
		if len(hand.Table) > 0 {
			var playerTakingLastHandName string
			var lastTeamTakingCards *team.Team
			var lastCardPlayResultingInTakingCards HandCardPlay
			handHistory := hand.History
			for _, cardPlay := range handHistory.CardPlaySequence {
				if len(cardPlay.CardsTaken) > 0 {
					lastCardPlayResultingInTakingCards = cardPlay
				}
			}
			lastTeamTakingCards, _ = teamOfPlayer(lastCardPlayResultingInTakingCards.Player, g)
			lastTeamTakingCards.TakenCards = append(lastTeamTakingCards.TakenCards, hand.Table...)
			// add to history the cardPlay representing the cards on the table when the last card of the game is played
			if lastTeamTakingCards != playerTeam {
				playerTakingLastHandName = lastCardPlayResultingInTakingCards.Player
				finalTableCardPlay := HandCardPlay{
					Player:     playerTakingLastHandName,
					CardPlayed: deck.Card{},
					CardsTaken: hand.Table,
				}
				hand.History.CardPlaySequence = append(hand.History.CardPlaySequence, finalTableCardPlay)
			}
			finalTableTake = FinalTableTake{
				Cards:           hand.Table,
				TeamTakingTable: lastTeamTakingCards.Players,
			}
			// End Block
			//
		}
		hand.Table = []deck.Card{}
		closeCurrentHand(g)
	} else {
		// otherwise sets the next player as current
		hand.CurrentPlayer = nextPlayer(g)
	}

	handViews = buildHandView(hand, g)
	err_ := s.GameStore.WriteGame(g)
	if err_ != nil {
		panic(err_)
	}
	return handViews, finalTableTake, g
}

// Close the game and sets all other players as not playing
// this means that if just ONE player leaves the game, all other players leave it
func (s *Scopone) Close(gName string, playerClosing string) {
	g := s.Games[gName]
	g.Close(playerClosing)
	err_ := s.GameStore.WriteGame(g)
	if err_ != nil {
		panic(err_)
	}
}

// teamOfPlayer returns the teamOfPlayer of the Player
func teamOfPlayer(pName string, g *Game) (t *team.Team, e error) {
	for i := range g.Teams {
		for j := range g.Teams[i].Players {
			if g.Teams[i].Players[j].Name == pName {
				return g.Teams[i], nil
			}
		}
	}
	return t, fmt.Errorf("Player %v not present in any team", pName)

}

// currentPlayer returns the player who has to play
func currentPlayer(g *Game) *player.Player {
	return currentHand(g).CurrentPlayer
}

// currentHand returns the hand which is currently played or nil if the game has no hands
func currentHand(g *Game) *Hand {
	if len(g.Hands) == 0 {
		return nil
	}
	return g.Hands[len(g.Hands)-1]
}

// isLastPlayer returns true if this is the last player of the current hand
func isLastPlayer(pName string, g *Game) bool {
	next := playersSequence(g)[pName]
	return next.Name == currentHand(g).FirstPlayer.Name
}

// playersSequence returns a map of Players where the key is a Player and the value is the next player
func playersSequence(game *Game) map[string]*player.Player {
	teams := game.Teams
	sequence := map[string]*player.Player{
		teams[0].Players[0].Name: teams[1].Players[0],
		teams[1].Players[0].Name: teams[0].Players[1],
		teams[0].Players[1].Name: teams[1].Players[1],
		teams[1].Players[1].Name: teams[0].Players[0],
	}
	return sequence
}

// nextPlayer returns the player who has to play next in the game
func nextPlayer(g *Game) *player.Player {
	return playersSequence(g)[currentPlayer(g).Name]
}

// closeCurrentHand closes the hand which is currently played
func closeCurrentHand(g *Game) {
	var cards []deck.Card
	for _, tt := range g.Teams {
		cards = append(cards, tt.TakenCards...)
	}
	if len(cards) != 40 {
		panic(fmt.Sprintf("Panicking! At the end the teams have %v cards\n", len(cards)))
	}
	currentHand := currentHand(g)
	currentHand.State = HandClosed
	scores := calculateScore([]*team.Team{g.Teams[0], g.Teams[1]})
	for i, s := range scores {
		currentHand.Score[team.Name(g.Teams[i])] = s
		g.Score[team.Name(g.Teams[i])] = g.Score[team.Name(g.Teams[i])] + s.Score
	}
	fmt.Printf("Hand %v closed\n", len(g.Hands))
}

// calculateScore calculate the score for the teams
func calculateScore(teams []*team.Team) (scores []TeamScore) {
	for i, t := range teams {
		var score TeamScore
		scores = append(scores, score)
		scores[i].ScoreCard = fillScoreCard(t)
		// Carte
		if len(scores[i].ScoreCard.Carte) > 20 {
			scores[i].Score++
		}
		// Denari
		if len(scores[i].ScoreCard.Denari) > 5 {
			scores[i].Score++
		}
		// Settebello
		if scores[i].ScoreCard.Settebello {
			scores[i].Score++
		}
		// Scope
		scores[i].Score = scores[i].Score + len(scores[i].ScoreCard.Scope)
		// Napoli
		if len(scores[i].ScoreCard.Napoli) > 2 {
			scores[i].Score = scores[i].Score + len(scores[i].ScoreCard.Napoli)
		}
		// calculate primieraScore
		scores[i].PrimieraScore = calculatePrimieraScore(scores[i].ScoreCard.PrimieraSuits)
	}
	// Primiera
	if scores[0].PrimieraScore > scores[1].PrimieraScore {
		scores[0].Score++
	} else if scores[0].PrimieraScore < scores[1].PrimieraScore {
		scores[1].Score++
	}
	return

}

// calculatePrimieraScore returns the value of the Primiera
func calculatePrimieraScore(pSuits map[string][]deck.Card) (primieraScore int) {
	primieraValues := map[string]int{
		"Seven": 21, "Six": 18, "Ace": 16, "Five": 15, "Four": 14, "Three": 13, "Two": 12, "King": 10, "Queen": 10, "Jack": 10,
	}
	for _, v := range pSuits {
		if len(v) > 0 {
			s := primieraValues[v[0].Type]
			primieraScore = primieraScore + s
		}
	}
	return
}

// byPrimiera sorts the cards in the Primiera order
type byPrimiera []deck.Card

func (cards byPrimiera) Len() int { return len(cards) }
func (cards byPrimiera) Less(i, j int) bool {
	primieraOrder := map[string]int{
		"Seven": 1, "Six": 2, "Ace": 3, "Five": 4, "Four": 5, "Three": 6, "Two": 7, "King": 8, "Queen": 9, "Jack": 10,
	}
	return primieraOrder[cards[i].Type] < primieraOrder[cards[j].Type]
}
func (cards byPrimiera) Swap(i, j int) { cards[i], cards[j] = cards[j], cards[i] }

// byNapoli sorts the cards in the Napoli order
type byNapoli []deck.Card

func (cards byNapoli) Len() int { return len(cards) }

var napoliOrder = map[string]int{
	"Ace": 1, "Two": 2, "Three": 3, "Four": 4, "Five": 5, "Six": 6, "Seven": 7, "Jack": 8, "Queen": 9, "King": 10,
}

func (cards byNapoli) Less(i, j int) bool {
	return napoliOrder[cards[i].Type] < napoliOrder[cards[j].Type]
}
func (cards byNapoli) Swap(i, j int) { cards[i], cards[j] = cards[j], cards[i] }

// fillScoreCard fills the score card startig from the cards taken by a Team
func fillScoreCard(t *team.Team) (sc ScoreCard) {
	d := t.TakenCards
	sc.PrimieraSuits = primieraSuits(d)

	// settebello
	settebello := deck.Card{
		Type: "Seven",
		Suit: deck.Denari,
	}
	_, found := deck.Find(d, settebello)
	sc.Settebello = found

	// denari
	sc.Denari = sc.PrimieraSuits[deck.Denari]

	// primiera
	sc.PrimieraSuits = primieraSuits(t.TakenCards)

	// carte
	sc.Carte = d

	// scope
	sc.Scope = t.ScopeDiScopone

	// napoli
	var orderedByNapoli byNapoli = cardsWithSuit(deck.Denari, d)
	sort.Sort(orderedByNapoli)
	var napoli []deck.Card
	for i, c := range orderedByNapoli {
		if napoliOrder[c.Type] == i+1 {
			napoli = append(napoli, c)
		} else {
			break
		}
	}
	sc.Napoli = napoli

	return
}

// primieraSuits returns the suits oredered for Primiera
func primieraSuits(d []deck.Card) (pSuits map[string][]deck.Card) {
	pSuits = make(map[string][]deck.Card)
	// group cards by suit
	for _, suit := range deck.Suits {
		var cardsSameSuits byPrimiera = cardsWithSuit(suit, d)
		sort.Sort(cardsSameSuits)
		pSuits[suit] = cardsSameSuits
	}
	return
}

// cardsWithSuit returns the cards with a certain suit
func cardsWithSuit(suit string, d []deck.Card) (cardsSuit []deck.Card) {
	for _, c := range d {
		if c.Suit == suit {
			cardsSuit = append(cardsSuit, c)
		}
	}
	return
}

// buildHandView returns the views of the hand for each player
func buildHandView(hand *Hand, g *Game) map[string]HandPlayerView {
	var handView = make(map[string]HandPlayerView)
	for _, p := range g.Players {
		pTeam, _ := teamOfPlayer(p.Name, g)
		others := otherTeam(p.Name, g)
		hv := HandPlayerView{
			ID:                    strconv.Itoa(len(g.Hands)),
			GameName:              g.Name,
			PlayerCards:           p.Cards,
			Table:                 hand.Table,
			OurScope:              pTeam.ScopeDiScopone,
			TheirScope:            others.ScopeDiScopone,
			OurScorecard:          hand.Score[team.Name(pTeam)].ScoreCard,
			TheirScorecard:        hand.Score[team.Name(others)].ScoreCard,
			Status:                hand.State,
			FirstPlayerName:       hand.FirstPlayer.Name,
			CurrentPlayerName:     hand.CurrentPlayer.Name,
			OurCurrentGameScore:   g.Score[team.Name(pTeam)],
			TheirCurrentGameScore: g.Score[team.Name(others)],
		}
		if s, OK := hand.Score[team.Name(pTeam)]; OK {
			hv.OurFinalHandScore = s.Score
		}
		if s, OK := hand.Score[team.Name(others)]; OK {
			hv.TheirFinalHandScore = s.Score
		}
		if hand.State == HandClosed {
			hv.History = hand.History
		}
		handView[p.Name] = hv
	}
	return handView
}

// buildCurrentHandView returns the hand views for the current hand
func buildCurrentHandView(g *Game) map[string]HandPlayerView {
	cHand := currentHand(g)
	if cHand == nil {
		return nil
	}
	return buildHandView(currentHand(g), g)
}

// otherTeam returns the other team, i.e. the opposite team
func otherTeam(pName string, g *Game) (otherTeam *team.Team) {
	firstTeam := g.Teams[0]
	secondTeam := g.Teams[1]
	isFirstTeam := false
	for _, p := range firstTeam.Players {
		if p.Name == pName {
			isFirstTeam = true
		}
	}
	if isFirstTeam {
		return secondTeam
	}
	return firstTeam

}

// IsCurrentHandActive returns true if the current hand is active
func IsCurrentHandActive(g *Game) bool {
	cHand := currentHand(g)
	return cHand != nil && cHand.State == HandActive
}
