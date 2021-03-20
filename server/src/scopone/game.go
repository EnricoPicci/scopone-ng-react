package scopone

import (
	"fmt"

	"go-scopone/src/deck"
	"go-scopone/src/player"
	"go-scopone/src/team"
)

// State is the state of a gamew
type State string

// GameState possible values
const (
	GameCreated   State = "created"      // created but with no players yet"
	TeamsForming  State = "teamsForming" // it has some players but not all
	GameOpen      State = "open"
	GameSuspended State = "suspended"
	GameClosed    State = "closed"
)

// Game represents a match of Scopone
type Game struct {
	Name      string                    `json:"name"`
	Hands     []*Hand                   `json:"hands"`
	Teams     []*team.Team              `json:"teams"`
	Players   map[string]*player.Player `json:"players"`
	Observers map[string]*player.Player `json:"observers"`
	Score     map[string]int            `json:"score"`
	State     State                     `json:"state"`
	ClosedBy  string                    `json:"closedBy"`
	History   []*HandHistory            `json:"-"`
}

// NewGame game
func NewGame() *Game {
	fmt.Println("A new Game is created")
	g := Game{}
	g.Teams = make([]*team.Team, 2)
	g.Teams[0] = team.New()
	g.Teams[1] = team.New()
	g.Players = make(map[string]*player.Player)
	g.Observers = make(map[string]*player.Player)
	g.Score = make(map[string]int)
	g.Hands = make([]*Hand, 0)
	g.State = GameCreated
	return &g
}

// Suspend suspends the game
func (game *Game) Suspend() {
	game.State = GameSuspended
}

// Close the game and sets all other players as not playing
// this means that if just ONE player leaves the game, all other players leave it
func (game *Game) Close(playerClosing string) {
	if game.State == GameClosed {
		return
	}
	for pK := range game.Players {
		p := game.Players[pK]
		p.Status = player.PlayerNotPlaying
	}
	game.State = GameClosed
	game.ClosedBy = playerClosing
}

type handState string

const (
	// HandActive the hand is active
	HandActive handState = "active"
	// HandClosed the hand is closed
	HandClosed handState = "closed"
)

// Hand is an hand of a Scopone
type Hand struct {
	Deck          deck.Deck `json:"-"`
	State         handState `json:"state"`
	Winner        team.Team
	FirstPlayer   *player.Player
	CurrentPlayer *player.Player
	Table         []deck.Card          `json:"-"`
	Score         map[string]TeamScore `json:"-"`
	History       HandHistory          `json:"-"`
}

// HandCardPlay represents a single card played by a player with the cards it took
type HandCardPlay struct {
	Player       string                 `json:"player"`
	Table        []deck.Card            `json:"table"`
	CardPlayed   deck.Card              `json:"cardPlayed"`
	CardsTaken   []deck.Card            `json:"cardsTaken"`
	PlayersDecks map[string][]deck.Card `json:"playersDecks"`
}

// HandHistory contains the hystory of the hand
type HandHistory struct {
	PlayerDecks      map[string][]deck.Card `json:"playerDecks"`
	CardPlaySequence []HandCardPlay         `json:"cardPlaySequence"`
}

// AddPlayer adds a player to a game and to one of the 2 teams
func (game *Game) AddPlayer(p *player.Player) error {
	if len(game.Players) == 4 {
		var playerNames string
		for pName := range game.Players {
			playerNames = playerNames + " " + pName
		}
		return fmt.Errorf("Game has already 4 Players: %v", playerNames)
	}
	// the same player can not be added twice to the same game
	_, pFound := game.Players[p.Name]
	if pFound {
		return fmt.Errorf("Player %v is already present in game %v", p.Name, game.Name)
	}
	// the player fills the first slot free in the teams - this allows a player to reenter a game at his place
	switch noOfPlayer := len(game.Players); noOfPlayer {
	case 0:
		game.Teams[0].Players[0] = p
	case 1:
		game.Teams[0].Players[1] = p
	case 2:
		game.Teams[1].Players[0] = p
	case 3:
		game.Teams[1].Players[1] = p
	}
	game.Players[p.Name] = p
	p.Status = player.PlayerPlaying
	game.CalculateState()
	return nil
}

// AddObserver adds an Observer to a game
func (game *Game) AddObserver(p *player.Player) error {
	// the same observer can not be added twice to the same game
	_, oFound := game.Observers[p.Name]
	if oFound {
		return fmt.Errorf("%v is already observing game %v", p.Name, game.Name)
	}
	game.Observers[p.Name] = p
	p.Status = player.PlayerObserving
	return nil
}

// CalculateState calculates the sate of the game
func (game *Game) CalculateState() {
	if len(game.Players) == 0 {
		game.State = GameCreated
		return
	}
	if game.State == GameClosed {
		return
	}
	for kP := range game.Players {
		p := game.Players[kP]
		if p.Status == player.PlayerLeftOsteria {
			game.State = GameSuspended
			return
		}
		if p.Status != player.PlayerPlaying && p.Status != player.PlayerLookingAtHandResult {
			msg := fmt.Sprintf(`Player %v in game %v has state "%v" which is never expected to happen 
			since player in a game should either be playing or be suspended`, p.Name, game.Name, p.Status)
			panic(msg)
		}
	}
	if len(game.Players) == 4 {
		game.State = GameOpen
		return
	}
	game.State = TeamsForming
}

// HandPlayerView is the data set that a Player can see of a running hand
type HandPlayerView struct {
	ID                    string      `json:"id"`
	GameName              string      `json:"gameName"`
	PlayerCards           []deck.Card `json:"playerCards"`
	Table                 []deck.Card `json:"table"`
	OurScope              []deck.Card `json:"ourScope"`   // Scope of the player's team
	TheirScope            []deck.Card `json:"theirScope"` // Scope of the other team
	OurScorecard          ScoreCard   `json:"ourScorecard"`
	TheirScorecard        ScoreCard   `json:"theirScorecard"`
	Status                handState   `json:"status"`
	FirstPlayerName       string      `json:"firstPlayerName"`
	CurrentPlayerName     string      `json:"currentPlayerName"`
	OurCurrentGameScore   int         `json:"ourCurrentGameScore"`
	TheirCurrentGameScore int         `json:"theirCurrentGameScore"`
	OurFinalHandScore     int         `json:"ourFinalScore"`
	TheirFinalHandScore   int         `json:"theirFinalScore"`
	History               HandHistory `json:"history,omitempty"`
}

// ScoreCard organizes the cards to facilitate calculating the score of a Team
type ScoreCard struct {
	Settebello    bool                   `json:"settebello"`
	Denari        []deck.Card            `json:"denari"`
	PrimieraSuits map[string][]deck.Card `json:"primiera"`
	Carte         []deck.Card            `json:"carte"`
	Scope         []deck.Card            `json:"scope"`
	Napoli        []deck.Card            `json:"napoli"`
}

// TeamScore is a data struct containg info related to the score of a team in one hand
type TeamScore struct {
	ScoreCard     ScoreCard
	PrimieraScore int
	Score         int
}
