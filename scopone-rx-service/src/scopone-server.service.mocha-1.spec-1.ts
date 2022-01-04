// This is a first set of tests. They run well if the server is just started.
// They generate an error "connect ECONNREFUSED 127.0.0.1:8080" if run a second time
// This error is generated because the server shows the following error
//     Message received {"id":"playerEntersOsteria","playerName":"Player 0 - 1590392963071","tsSent":"2020-05-25T07:49:23.071Z"}
//     panic: send on closed channel
//
// If we add more tests in the same file, then this error is consistent. This is why I have broken the tests in different files

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
  switchMap,
  map,
} from "rxjs/operators";

import { ScoponeServerService } from "./scopone-server.service";
import { environment } from "./environments/environment";
import { MessageFromServerIds, MessageFromServer, Game } from "./messages";

(global as any).WebSocket = require("ws");

describe(`When a player enters the Osteria`, () => {
  const service = new ScoponeServerService();
  const playerName = "A name of player" + Date.now();
  after((done) => {
    service.close();
    done();
  });

  it(`Should receive a list of active players containing the player just added`, (done) => {
    let dataEmitted: MessageFromServer;

    service
      .connect(environment.serverAddress)
      .pipe(
        tap(() => service.playerEntersOsteria(playerName)),
        concatMap(() => service.messages$),
        find((msg) => msg.id == MessageFromServerIds.Players)
      )
      .subscribe({
        next: (data) => {
          dataEmitted = data;
        },
        error: (err) => {
          console.error("Should not error", err);
          done(err);
        },
        complete: () => {
          expect(dataEmitted).to.be.not.undefined;
          expect(dataEmitted.players.find((p) => p.name === playerName)).to.be
            .not.undefined;
          // service.close();
          done();
        },
      });
  }).timeout(10000);

  it(`and then tries to enter again it should receive an error`, (done) => {
    let dataEmitted: MessageFromServer;

    service.connect$
      .pipe(
        tap(() => {
          service.playerEntersOsteria(playerName);
        }),
        tap(() => service.playerEntersOsteria(playerName)),
        concatMap(() => service.messages$),
        find((msg) => msg.id == MessageFromServerIds.PlayerIsAlreadyInOsteria)
      )
      .subscribe({
        next: (data) => {
          dataEmitted = data;
        },
        error: (err) => {
          console.error("Should not error", err);
          done(err);
        },
        complete: () => {
          expect(dataEmitted).to.be.not.undefined;
          expect(dataEmitted.error).to.be.not.undefined;
          // service.close();
          done();
        },
      });
  }).timeout(10000);
});

describe(`When a player enters the Osteria and then exits`, () => {
  const service = new ScoponeServerService();

  it(`Should be able to enter again`, (done) => {
    const playerName = "A name of player who enters and exits" + Date.now();
    let dataEmitted: MessageFromServer;

    service
      .connect(environment.serverAddress)
      .pipe(
        tap(() => service.playerEntersOsteria(playerName)),
        delay(2000),
        tap(() => service.close()),
        delay(6000),
        switchMap(() => service.connect(environment.serverAddress)),
        tap(() => service.playerEntersOsteria(playerName)),
        concatMap(() => service.messages$),
        find((msg) => msg.id == MessageFromServerIds.Players)
      )
      .subscribe({
        next: (data) => {
          dataEmitted = data;
        },
        error: (err) => {
          console.error("Should not error", err);
          done(err);
        },
        complete: () => {
          expect(dataEmitted).to.be.not.undefined;
          expect(dataEmitted.players.find((p) => p.name === playerName)).to.be
            .not.undefined;
          service.close();
          done();
        },
      });
  }).timeout(30000);
});

describe(`When a request to create a game is sent`, () => {
  const service = new ScoponeServerService();
  after((done) => {
    service.close();
    done();
  });

  it(`a game should be created and a list of the games which a Player can join is returned`, (done) => {
    const playerName = "A player who wants to create a new game" + Date.now();
    const gameName = "A new game" + Date.now();
    let dataEmitted: MessageFromServer;

    service
      .connect(environment.serverAddress)
      .pipe(
        // we need that a player enters the osteria since this is the moment when the client gets registered and
        // can therefore receive messages from the server. If no player enters the Osteria, then no messages are broadcasted
        // by the server
        tap(() => service.playerEntersOsteria(playerName)),
        tap(() => service.newGame(gameName)),
        concatMap(() => service.messages$),
        find(
          (msg) =>
            msg.id == MessageFromServerIds.Games &&
            (msg["responseTo"] as string).startsWith("newGame")
        )
      )
      .subscribe({
        next: (data) => {
          dataEmitted = data;
        },
        error: (err) => {
          console.error("Should not error", err);
          done(err);
        },
        complete: () => {
          expect(dataEmitted).to.be.not.undefined;
          const game = dataEmitted.games.find((g) => g.name === gameName);
          expect(game).to.be.not.undefined;
          expect(service.canPlayerJoinGame(game)).to.be.true;
          // service.close();
          done();
        },
      });
  }).timeout(10000);
});

describe(`When a player enters a game`, () => {
  const service = new ScoponeServerService();
  after((done) => {
    service.close();
    done();
  });

  it(`a refresh of all games should be received`, (done) => {
    const playerName = "A player who wants to play" + Date.now();
    const gameName = "A new game to be played" + Date.now();
    let dataEmitted: MessageFromServer;

    service
      .connect(environment.serverAddress)
      .pipe(
        tap(() => service.playerEntersOsteria(playerName)),
        tap(() => service.newGame(gameName)),
        tap(() => service.addPlayerToGame(playerName, gameName)),
        concatMap(() => service.messages$),
        filter((msg) => msg.id == MessageFromServerIds.Games),
        // there are 3 "Games" messages sent from the server: the first as result of "playerEntersOsteria"
        // the second after "newGame"
        // the third as result of "addPlayerToGame"
        // this is why we take 3 messages and then we complete
        take(3)
      )
      .subscribe({
        next: (data) => {
          dataEmitted = data;
        },
        error: (err) => {
          console.error("Should not error", err);
          done(err);
        },
        complete: () => {
          expect(dataEmitted).to.be.not.undefined;
          const game = dataEmitted.games.find((g) => g.name === gameName);
          expect(game).to.be.not.undefined;
          expect(Object.keys(game.players).length).to.equal(1);
          expect(game.players[playerName].name).to.equal(playerName);
          done();
        },
      });
  }).timeout(10000);
});

describe(`When a game has four players`, () => {
  const service = new ScoponeServerService();
  service.connect(environment.serverAddress).subscribe({
    error: (err) => console.error("Error while connecting", err),
  });
  after((done) => {
    service.close();
    done();
  });

  it(`the server should return a message containing the game with 4 players`, (done) => {
    const playerNames = new Array(4)
      .fill(null)
      .map((_, i) => `Player ${i} - ` + Date.now());
    const gameName = "A new game with 4 players" + Date.now();
    let gameEmitted: Game;

    service.connect$
      .pipe(
        tap(() =>
          playerNames.forEach((playerName) =>
            service.playerEntersOsteria(playerName)
          )
        ),
        tap(() => service.newGame(gameName)),
        tap(() =>
          playerNames.forEach((playerName) =>
            service.addPlayerToGame(playerName, gameName)
          )
        ),
        concatMap(() => service.messages$),
        filter((msg) => msg.id == MessageFromServerIds.Games),
        map((msg) => msg.games.find((g) => g.name === gameName)),
        // find the first message which refer to a Game with 4 players
        find(
          (game) =>
            game && game.players && Object.keys(game.players).length === 4
        )
      )
      .subscribe({
        next: (data) => {
          gameEmitted = data;
        },
        error: (err) => {
          console.error("Should not error", err);
          done(err);
        },
        complete: () => {
          expect(gameEmitted).to.be.not.undefined;
          playerNames.forEach((playerName) => {
            expect(gameEmitted.players[playerName]).to.be.not.undefined;
          });
          done();
        },
      });
  }).timeout(10000);

  it(`should not be possible to add a fifth player`, (done) => {
    const playerNames = new Array(4)
      .fill(null)
      .map((_, i) => `Player for game with five players ${i} - ` + Date.now());
    const fifthPlayerName = "The player number 5";
    const gameName =
      "A new game which would like to have five players" + Date.now();
    let dataEmitted: MessageFromServer;

    service.connect$
      .pipe(
        tap(() => {
          playerNames.forEach((playerName) =>
            service.playerEntersOsteria(playerName)
          );
          service.playerEntersOsteria(fifthPlayerName);
        }),
        tap(() => service.newGame(gameName)),
        tap(() => {
          playerNames.forEach((playerName) =>
            service.addPlayerToGame(playerName, gameName)
          );
        }),
        concatMap(() => service.messages$),
        filter((msg) => msg.id == MessageFromServerIds.Games),
        // find the first message which refer to a Game with 4 players
        find(
          (msg) =>
            !!msg.games.find((game) => Object.keys(game.players).length === 4)
        ),
        // now we know that 4 players have joined the game since we received a message containing this info from the server
        // we can therefore try to add a new player to that game
        tap(() => {
          service.addPlayerToGame(fifthPlayerName, gameName);
        }),
        concatMap(() => service.messages$),
        find((msg) => msg.id == MessageFromServerIds.ErrorAddingPlayerToGame)
      )
      .subscribe({
        next: (data) => {
          dataEmitted = data;
        },
        error: (err) => {
          console.error("Should not error", err);
          done(err);
        },
        complete: () => {
          expect(dataEmitted).to.be.not.undefined;
          done();
        },
      });
  }).timeout(10000);

  it(`a new hand can be started`, (done) => {
    const playerNames = new Array(4)
      .fill(null)
      .map(
        (_, i) =>
          `Player for game where we start one new hand ${i} - ` + Date.now()
      );
    const gameName = "A game where we start a new game" + Date.now();

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
        filter((msg) => msg.id == MessageFromServerIds.HandView),
        // we are expecting one message HandView for player
        take(4),
        toArray()
      )
      .subscribe({
        next: (handViewMessages) => {
          playerNames.forEach((playerName) => {
            const handView = handViewMessages.find(
              (msg) => msg.playerName === playerName
            ).handPlayerView;
            expect(handView).to.be.not.undefined;
            expect(handView.playerCards.length).to.equal(10);
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

describe(`When a game has four players, a new hand is started and then a player exits`, () => {
  const service = new ScoponeServerService();

  it(`when the player enters again the server should send a refresh of the handViews`, (done) => {
    const playerNames = new Array(4)
      .fill(null)
      .map(
        (_, i) => `Player for game where somebody leaves ${i} - ` + Date.now()
      );
    const gameName = "A game where somebody leaves" + Date.now();

    service
      .connect(environment.serverAddress)
      .pipe(
        tap(() => {
          playerNames.forEach((playerName) =>
            service.playerEntersOsteria(playerName)
          );
          service.newGame(gameName);
          playerNames.forEach((playerName) =>
            service.addPlayerToGame(playerName, gameName)
          );
          service.newHand();
        }),
        delay(1000),
        tap(() => service.close()),
        delay(2000),
        switchMap(() => {
          return service.connect(environment.serverAddress);
        }),
        tap(() => {
          service.playerEntersOsteria(playerNames[3]);
        }),
        concatMap(() => service.messages$),
        find((msg) => msg.id == MessageFromServerIds.HandView)
        // we are expecting JUST ONE message HandView for the player who has just entered the Osteria again
        // the other players do not have a connection valid any more, since they shared all the same connection
        // and when that connection was disconnected to let the player leave, all their connections got closed as well
      )
      .subscribe({
        next: (handViewMessages) => {
          const hv = handViewMessages.handPlayerView;
          expect(hv.status).to.equal("active");
          expect(hv.playerCards.length).to.equal(10);
        },
        error: (err) => {
          console.error("Should not error", err);
          done(err);
        },
        complete: () => {
          console.log("DONE");
          service.close();
          done();
        },
      });
  }).timeout(300000);
});
