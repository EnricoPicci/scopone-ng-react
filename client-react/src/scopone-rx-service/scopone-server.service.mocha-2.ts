// This is a second set of tests. They run well and can be run more than once without having to restart the server
// (contrary to what happens with the first set of tests).
// If you run these tests after running the fist set, these tests errors since the server errors with something like this
// They generate an error "connect ECONNREFUSED 127.0.0.1:8080" if run a second time
// This error is generated because the server shows the following error
//     Message received {"id":"addPlayerToGame","playerName":"Player 3 - 1590393358737","gameName":"A game where first player plays1590393358737","tsSent":"2020-05-25T07:55:58.742Z"}
//     panic: send on closed channel

import { describe, it, after } from "mocha";
import { expect } from "chai";

import {
  concatMap,
  tap,
  find,
  take,
  toArray,
  delay,
  filter,
} from "rxjs/operators";

import { ScoponeServerService } from "./scopone-server.service";
import { environment } from "./environments/environment";
import { MessageFromServerIds, MessageFromServer } from "./messages";

(global as any).WebSocket = require("ws");

describe(`When a new hand is started`, () => {
  const service = new ScoponeServerService();
  service.connect(environment.serverAddress).subscribe({
    error: (err) => console.error("Error while connecting", err),
  });
  after((done) => {
    service.close();
    done();
  });

  it(`the first player can play`, (done) => {
    const playerNames = new Array(4)
      .fill(null)
      .map((_, i) => `Player ${i} - ` + Date.now());
    const gameName = "A game where first player plays" + Date.now();

    service.connect$
      .pipe(
        tap(() => {
          playerNames.forEach((playerName) =>
            service.playerEntersOsteria(playerName)
          );
        }),
        tap(() => service.newGame(gameName)),
        tap(() => {
          playerNames.forEach((playerName) =>
            service.addPlayerToGame(playerName, gameName)
          );
        }),
        tap(() => service.newHand()),
        concatMap(() => service.messages$),
        find(
          (msg) =>
            msg.id == MessageFromServerIds.HandView &&
            msg.playerName === playerNames[0]
        ),
        delay(100), // delay so that messages on the websocket do not get jammed causing problems on the server
        tap((msg) => {
          console.log("=========>>>>>>>>>>>>>>>>>> Play card");
          service.playCardForPlayer(
            playerNames[0],
            msg.handPlayerView.playerCards[0],
            []
          );
        }),
        concatMap(() => service.messages$),
        filter(
          (msg) =>
            msg.id == MessageFromServerIds.HandView &&
            (msg["responseTo"] as string).startsWith("playCard")
        ),
        // we are expecting one message HandView for player when the player
        take(4),
        toArray()
      )
      .subscribe({
        next: (handViewMessages: MessageFromServer[]) => {
          playerNames.forEach((playerName) => {
            const handView = handViewMessages.find(
              (msg) => msg.playerName === playerName
            ).handPlayerView;
            expect(handView).to.be.not.undefined;
            playerName === handView.firstPlayerName
              ? expect(handView.playerCards.length).to.equal(9) // the first player has played 1 card so it has 9 cards
              : expect(handView.playerCards.length).to.equal(10); // the other players have not played any card so they have 10 cards
          });
          done();
        },
        error: (err) => {
          console.error("Should not error", err);
          done(err);
        },
      });
  }).timeout(10000);
});
