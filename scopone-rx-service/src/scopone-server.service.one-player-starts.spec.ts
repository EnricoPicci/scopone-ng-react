// These tests test the correct behaviour when one single player enters the Osteria and starts a game
// It tests only one single player, not a real game with different players

import { describe, it } from "mocha";
import { expect } from "chai";

import {
  concatMap,
  tap,
  find,
  delay,
  switchMap,
  filter,
  take,
} from "rxjs/operators";

import { ScoponeServerService } from "./scopone-server.service";
import { environment } from "./environments/environment";
import { MessageFromServerIds, MessageFromServer } from "./messages";

(global as any).WebSocket = require("ws");

describe(`When a player enters the Osteria`, () => {
  const service = new ScoponeServerService();
  service.logMessages = false;
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
  service.logMessages = false;

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
  service.logMessages = false;
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
  service.logMessages = false;
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
