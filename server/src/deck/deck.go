// Package deck implements the deck used in  the game
// inspired by https://gist.github.com/montanaflynn/4cc2779d2e353d7524a7bdce57869a75
package deck

import (
	"fmt"
	"math/rand"
	"os"
	"time"
)

// Card holds the card suits and types in the deck
type Card struct {
	Type string `json:"type"`
	Suit string `json:"suit"`
}

// TypeSuit returns the Type and Suite of the Card
func TypeSuit(c Card) string {
	return c.Type + "-" + c.Suit
}

// Deck holds the cards in the deck to be shuffled
type Deck []Card

// Types include Two, Three, Four, Five, Six
// Seven, Eight, Nine, Ten, Jack, Queen, King & Ace
var Types = []string{"Two", "Three", "Four", "Five", "Six", "Seven",
	"Jack", "Queen", "King", "Ace"}

// Denari is denari
const Denari = "Denari"

// Suits include Heart, Diamond, Club & Spade
var Suits = []string{Denari, "Bastoni", "Spade", "Coppe"}

// New creates a deck of cards to be used
func New() (deck Deck) {
	// Loop over each type and suit appending to the deck
	for i := 0; i < len(Types); i++ {
		for n := 0; n < len(Suits); n++ {
			card := Card{
				Type: Types[i],
				Suit: Suits[n],
			}
			deck = append(deck, card)
		}
	}
	return
}

// Shuffle the deck
func Shuffle(d Deck) Deck {
	for i := 1; i < len(d); i++ {
		// Create a random int up to the number of cards
		r := rand.Intn(i + 1)

		// If the the current card doesn't match the random
		// int we generated then we'll switch them out
		if i != r {
			d[r], d[i] = d[i], d[r]
		}
	}
	return d
}

// Deal a specified amount of cards
func Deal(d Deck, n int) {
	for i := 0; i < n; i++ {
		fmt.Println(d[i])
	}
}

// Debug helps debugging the deck of cards
func Debug(d Deck) {
	if os.Getenv("DEBUG") != "" {
		for i := 0; i < len(d); i++ {
			fmt.Printf("Card #%d is a %s of %ss\n", i+1, d[i].Type, d[i].Suit)
		}
	}
}

// Find takes a slice of Card and looks for a Card in it. If found it will
// return it's index, otherwise it will return -1 and a bool of false.
// https://golangcode.com/check-if-element-exists-in-slice/
func Find(deck []Card, c Card) (int, bool) {
	for i := range deck {
		if TypeSuit(c) == TypeSuit(deck[i]) {
			return i, true
		}
	}
	return -1, false
}

// RemoveCard removes a Card from a deck with immutability
// a new deck is returned and the one passed as input is left unchanged
// https://stackoverflow.com/a/59205977/5699993
func RemoveCard(deck []Card, c Card) (newDeck []Card) {
	i, found := Find(deck, c)
	if !found {
		fmt.Printf("Panicking! The card %v is not in the deck %v\n", c, deck)
		panic(fmt.Sprintf("Panicking! The card %v is not in the deck %v\n", c, deck))
	}
	for j := range deck {
		if j != i {
			newDeck = append(newDeck, deck[j])
		}
	}
	return
}

// RemoveCards removes a slice of Cards from a deck
func RemoveCards(deck []Card, cardsToRemove []Card) (newDeck []Card) {
	// copy for immutability
	newDeck = make([]Card, len(deck))
	copy(newDeck, deck)
	for _, c := range cardsToRemove {
		newDeck = RemoveCard(newDeck, c)
	}
	return
}

// Seed our randomness with the current time
func init() {
	rand.Seed(time.Now().UnixNano())
}
