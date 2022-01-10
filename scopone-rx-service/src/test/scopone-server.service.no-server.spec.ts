// these tests do not require a server running

import { describe, it } from "mocha";
import { expect } from "chai";
import { ScoponeServerService } from "../scopone-server.service";
import { Subject } from "rxjs";
import { MessageFromServer, MessageFromServerIds } from "../scopone-messages";
import { Card, Suits, Types } from "../model/card";
import { PlayerView } from "../model//player-view";

describe("Mocha - ScoponeServerService receives messages from the scopone server", () => {
  it(`when a message of hand view is received specifying that the currentPlayer is the one registered with the scoponeServerService, 
  then isMyTurnToPlay$ emits true`, (done) => {
    const messages$ = new Subject<MessageFromServer>();
    const playerName = "thePlayer";
    const scoponeServer = new ScoponeServerService(messages$, playerName);

    scoponeServer.isMyTurnToPlay$.subscribe({
      next: (d) => {
        expect(d).to.be.true;
        done();
      },
      error: (err) => {
        console.error("Should not error", err);
        throw new Error(err);
      },
    });

    messages$.next({
      id: MessageFromServerIds.HandView,
      handPlayerView: {
        currentPlayerName: playerName,
        gameName: "a test game",
      } as PlayerView,
    });
  });
  it(`when a message of hand view is received specifying a currentPlayer which is not the one registered with the scoponeServerService, 
  then isMyTurnToPlay$ emits false`, (done) => {
    const messages$ = new Subject<MessageFromServer>();
    const playerName = "thePlayer";
    const scoponeServer = new ScoponeServerService(messages$, playerName);

    scoponeServer.isMyTurnToPlay$.subscribe({
      next: (d) => {
        expect(d).to.be.false;
        done();
      },
      error: (err) => {
        console.error("Should not error", err);
        throw new Error(err);
      },
    });

    messages$.next({
      id: MessageFromServerIds.HandView,
      handPlayerView: {
        currentPlayerName: "not " + playerName,
        gameName: "a test game",
      },
    });
  });
});

describe(`Mocha - ScoponeServerService calculates cardsToTake`, () => {
  describe(`When [7-denari] are on the table`, () => {
    const table: Card[] = [{ type: Types.SEVEN, suit: Suits.DENARI }];
    it("if a 2-spade is played than no card is taken from the table", () => {
      const scoponeServer = new ScoponeServerService();

      const cardPlayed: Card = { type: Types.TWO, suit: Suits.SPADE };
      const cardsToTake = scoponeServer.cardsTakeable(cardPlayed, table);
      const expectedCards = [];

      cardsAreSame(cardsToTake, expectedCards);
    });
    it("if a 7 is played than 7-denari taken from the table", () => {
      const scoponeServer = new ScoponeServerService();

      const cardPlayed: Card = { type: Types.SEVEN, suit: Suits.SPADE };
      const cardsToTake = scoponeServer.cardsTakeable(cardPlayed, table);
      const expectedCards = [[{ type: Types.SEVEN, suit: Suits.DENARI }]];

      cardsAreSame(cardsToTake, expectedCards);
    });
  });

  describe(`When [7-denari, 6-bastoni, 2-coppe] are on the table`, () => {
    const table: Card[] = [
      { type: Types.SEVEN, suit: Suits.DENARI },
      { type: Types.SIX, suit: Suits.BASTONI },
      { type: Types.TWO, suit: Suits.COPPE },
    ];
    it(`there are 8 possible combinations of cards`, () => {
      const scoponeServer = new ScoponeServerService();

      const possibleCombinations = scoponeServer.combinationsOfCards(table);
      const expectedCombinations: Card[][] = [
        [], // the empty set
        [{ type: Types.SEVEN, suit: Suits.DENARI }],
        [{ type: Types.SIX, suit: Suits.BASTONI }],
        [
          { type: Types.SEVEN, suit: Suits.DENARI },
          { type: Types.SIX, suit: Suits.BASTONI },
        ],
        [{ type: Types.TWO, suit: Suits.COPPE }],
        [
          { type: Types.SEVEN, suit: Suits.DENARI },
          { type: Types.TWO, suit: Suits.COPPE },
        ],
        [
          { type: Types.SIX, suit: Suits.BASTONI },
          { type: Types.TWO, suit: Suits.COPPE },
        ],
        [
          { type: Types.SEVEN, suit: Suits.DENARI },
          { type: Types.SIX, suit: Suits.BASTONI },
          { type: Types.TWO, suit: Suits.COPPE },
        ],
      ];
      cardsAreSame(possibleCombinations, expectedCombinations);
    });
    it("if a 2-spade is played than 2-coppe is taken from the table", () => {
      const scoponeServer = new ScoponeServerService();

      const cardPlayed: Card = { type: Types.TWO, suit: Suits.SPADE };
      const cardsToTake = scoponeServer.cardsTakeable(cardPlayed, table);
      const expectedCards = [[{ type: Types.TWO, suit: Suits.COPPE }]];

      cardsAreSame(cardsToTake, expectedCards);
    });
    it("if a Jack is played than 2 and 6 are taken from the table", () => {
      const scoponeServer = new ScoponeServerService();

      const cardPlayed: Card = { type: Types.JACK, suit: Suits.SPADE };
      const cardsToTake = scoponeServer.cardsTakeable(cardPlayed, table);
      const expectedCards = [
        [
          { type: Types.SIX, suit: Suits.BASTONI },
          { type: Types.TWO, suit: Suits.COPPE },
        ],
      ];

      cardsAreSame(cardsToTake, expectedCards);
    });
    it("if a 3 is played than no card is taken from the table", () => {
      const scoponeServer = new ScoponeServerService();

      const cardPlayed: Card = { type: Types.THREE, suit: Suits.SPADE };
      const cardsToTake = scoponeServer.cardsTakeable(cardPlayed, table);
      const expectedCards = [];

      cardsAreSame(cardsToTake, expectedCards);
    });
  });

  describe(`When [7-denari, 7-bastoni, 2-coppe] are on the table`, () => {
    const table: Card[] = [
      { type: Types.SEVEN, suit: Suits.DENARI },
      { type: Types.SEVEN, suit: Suits.BASTONI },
      { type: Types.TWO, suit: Suits.COPPE },
    ];
    it("if a 7-spade is played than the player can take from the table either of the 2 7s", () => {
      const scoponeServer = new ScoponeServerService();

      const cardPlayed: Card = { type: Types.SEVEN, suit: Suits.SPADE };
      const cardsToTake = scoponeServer.cardsTakeable(cardPlayed, table);
      const expectedCards = [
        [{ type: Types.SEVEN, suit: Suits.DENARI }],
        [{ type: Types.SEVEN, suit: Suits.BASTONI }],
      ];

      cardsAreSame(cardsToTake, expectedCards);
    });
  });

  describe(`When [3-denari, 2-bastoni, ACE-coppe] are on the table`, () => {
    const table: Card[] = [
      { type: Types.THREE, suit: Suits.DENARI },
      { type: Types.TWO, suit: Suits.BASTONI },
      { type: Types.ACE, suit: Suits.COPPE },
    ];
    it("if a 6-spade is played than the player takes the whole table", () => {
      const scoponeServer = new ScoponeServerService();

      const cardPlayed: Card = { type: Types.SIX, suit: Suits.SPADE };
      const cardsToTake = scoponeServer.cardsTakeable(cardPlayed, table);

      cardsAreSame(cardsToTake, [table]);
    });
  });

  describe(`When [3-denari, 2-bastoni, ACE-coppe, 6-denari] are on the table`, () => {
    const table: Card[] = [
      { type: Types.THREE, suit: Suits.DENARI },
      { type: Types.TWO, suit: Suits.BASTONI },
      { type: Types.ACE, suit: Suits.COPPE },
      { type: Types.SIX, suit: Suits.DENARI },
    ];
    it("if a 6-spade is played than the player can take only the 6-denari", () => {
      const scoponeServer = new ScoponeServerService();

      const cardPlayed: Card = { type: Types.SIX, suit: Suits.SPADE };
      const cardsToTake = scoponeServer.cardsTakeable(cardPlayed, table);
      const expectedCards = [[{ type: Types.SIX, suit: Suits.DENARI }]];

      cardsAreSame(cardsToTake, expectedCards);
    });
  });

  describe(`When [3-denari, 2-bastoni, 3-coppe, 2-denari] are on the table`, () => {
    const table: Card[] = [
      { type: Types.THREE, suit: Suits.DENARI },
      { type: Types.TWO, suit: Suits.BASTONI },
      { type: Types.THREE, suit: Suits.COPPE },
      { type: Types.TWO, suit: Suits.DENARI },
    ];
    it("if a 5-spade is played than the player has 4 choices in terms of cards to be taken", () => {
      const scoponeServer = new ScoponeServerService();

      const cardPlayed: Card = { type: Types.FIVE, suit: Suits.SPADE };
      const cardsToTake = scoponeServer.cardsTakeable(cardPlayed, table);
      const expectedCards = [
        [
          { type: Types.THREE, suit: Suits.DENARI },
          { type: Types.TWO, suit: Suits.BASTONI },
        ],
        [
          { type: Types.TWO, suit: Suits.BASTONI },
          { type: Types.THREE, suit: Suits.COPPE },
        ],
        [
          { type: Types.THREE, suit: Suits.DENARI },
          { type: Types.TWO, suit: Suits.DENARI },
        ],
        [
          { type: Types.THREE, suit: Suits.COPPE },
          { type: Types.TWO, suit: Suits.DENARI },
        ],
      ];

      cardsAreSame(cardsToTake, expectedCards);
    });
    it("if a Queen is played than the player can not take any card", () => {
      const scoponeServer = new ScoponeServerService();

      const cardPlayed: Card = { type: Types.QUEEN, suit: Suits.SPADE };
      const cardsToTake = scoponeServer.cardsTakeable(cardPlayed, table);
      const expectedCards = [];

      cardsAreSame(cardsToTake, expectedCards);
    });
  });
});

describe(`Mocha - ScoponeServerService sorts deck by suit and type`, () => {
  it(`Groups by Suit a deck containing [3-denari, 2-bastoni, 3-coppe, 2-denari]`, () => {
    const deck: Card[] = [
      { type: Types.THREE, suit: Suits.DENARI },
      { type: Types.TWO, suit: Suits.BASTONI },
      { type: Types.THREE, suit: Suits.COPPE },
      { type: Types.TWO, suit: Suits.DENARI },
    ];
    const scoponeServer = new ScoponeServerService();
    const expectedSortedDeck = new Map<Suits, Card[]>();
    expectedSortedDeck.set(Suits.DENARI, [
      { type: Types.THREE, suit: Suits.DENARI },
      { type: Types.TWO, suit: Suits.DENARI },
    ]);
    expectedSortedDeck.set(Suits.BASTONI, [
      { type: Types.TWO, suit: Suits.BASTONI },
    ]);
    expectedSortedDeck.set(Suits.COPPE, [
      { type: Types.THREE, suit: Suits.COPPE },
    ]);
    const sortedDeck = scoponeServer.groupCardsBySuit(deck);
    expect(sortedDeck.get(Suits.SPADE)).to.be.undefined;
    Object.keys(sortedDeck).forEach((suit: Suits) => {
      expect(sortedDeck.get(suit).length).equal(
        expectedSortedDeck.get(suit).length
      );
      sortedDeck.get(suit).forEach((card: Card) => {
        expect(
          expectedSortedDeck
            .get(suit)
            .find((c: Card) => c.type === card.type && c.suit === card.suit)
        );
      });
    });
  });

  it(`Sorts by Suit and Type a deck containing [3-denari, 2-bastoni, 3-coppe, 2-denari]`, () => {
    const deck: Card[] = [
      { type: Types.THREE, suit: Suits.DENARI },
      { type: Types.TWO, suit: Suits.BASTONI },
      { type: Types.THREE, suit: Suits.COPPE },
      { type: Types.TWO, suit: Suits.DENARI },
    ];
    const scoponeServer = new ScoponeServerService();
    const expectedSortedDeck: Card[] = [
      { type: Types.TWO, suit: Suits.BASTONI },
      { type: Types.THREE, suit: Suits.COPPE },
      { type: Types.THREE, suit: Suits.DENARI },
      { type: Types.TWO, suit: Suits.DENARI },
    ];
    const sortedDeck = scoponeServer.sortCardsBySuitAndType(deck);
    expect(sortedDeck.length).equal(deck.length);
    expectedSortedDeck.forEach((card, i) => {
      expect(card.type).equal(sortedDeck[i].type);
      expect(card.suit).equal(sortedDeck[i].suit);
    });
  });
});

function cardsAreSame(cards1: Card[][], cards2: Card[][]) {
  expect(cards1.length).equal(cards2.length);
  cards1.forEach((cards, i) => {
    expect(cards.length).equal(cards2[i].length);
    cards.forEach((c, j) => {
      expect(c.suit).equal(cards2[i][j].suit);
      expect(c.type).equal(cards2[i][j].type);
    });
  });
}
