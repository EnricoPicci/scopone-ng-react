// Playes a game for a certain number of cards
// Can be used to rapidely bring a game to a certain stage and then check its behaviour manually
// e.g. we want to have a game which is almost closed and then close it manually

import { describe, it } from "mocha";

import {
  concatMap,
  tap,
  take,
  delay,
  switchMap,
  find,
  filter,
  takeUntil,
  ignoreElements,
} from "rxjs/operators";

import { ScoponeServerService } from "../scopone-server.service";
import { environment } from "../environments/environment";
// import { environment } from '../../environments/environment.prod';
import { MessageFromServer } from "../messages";
import { merge, interval, Subject } from "rxjs";

(global as any).WebSocket = require("ws");

describe(`Games are created`, () => {
  it("creates a game and plays 39 cards", (done) => {
    const numberOfCardsPlayed = 9;
    const gameName = "Game39" + new Date().toISOString();
    const players = new Array(4)
      .fill(null)
      .map((_, i) => `P${i} - ` + new Date().toISOString());

    const delayBetweenCommands = 200;

    const services = players.map(() => new ScoponeServerService());
    // connect all players - each connection is separated by a time interval to avoid jamming the WebSocket channel
    interval(2000)
      .pipe(
        switchMap((i) =>
          services[i].connect(environment.serverAddress).pipe(
            tap({
              next: () => console.log(`Player ${players[i]} connected`),
              error: (err) =>
                console.error(
                  `Error ${err} while connecting for player ${players[i]}`
                ),
            })
          )
        ),
        take(services.length)
      )
      .subscribe();

    const messagesFromServer: {
      [messageId: string]: MessageFromServer[];
    }[] = [{}, {}, {}, {}];

    // The players enter the Osteria, each with his own connection, and receive notfications about other players entering
    const playersEnterOsteria = services.map((s, i) => {
      return s.connect$.pipe(
        tap({
          error: (err) =>
            console.error(
              `Error ${err} while connecting for player ${players[i]}`
            ),
        }),
        delay(delayBetweenCommands * i),
        tap(() => {
          s.playerEntersOsteria(players[i]);
        }),
        ignoreElements()
      );
    });

    // One player creates a new game after all players have entered the Osteria and receieves notification of game creation
    const playerCreatesGame = services[0].players$.pipe(
      // this find emits when all players have entered the Osteria
      find((_players) => {
        let resp = true;
        players.forEach((p) => {
          const _player = _players.find((_p) => _p.name === p);
          resp = resp && !!_player;
        });
        return resp;
      }),
      take(1), // we are interested in checking only the first Games message
      delay(delayBetweenCommands),
      tap(() => services[0].newGame(gameName)),
      ignoreElements()
    );

    // Players receive the notification that the game has been created and join the game
    const gameCreated = services.map((s, i) => {
      return s.games_ShareReplay$.pipe(
        // We want to make sure that the players join the game after it has been created
        find((_games) => !!_games.find((_g) => _g.name === gameName)),
        delay(delayBetweenCommands * i),
        // add the player to the game
        tap(() => services[i].addPlayerToGame(players[i], gameName)),
        ignoreElements()
      );
    });

    // Players receive the notifications of the games which they can join (i.e. not yet started)
    // any time either a game is created or a player joins a game
    // In this case the player will receive 4 times this notification with an array of one game, i.e. the game which
    // has been created in the test and that has not yet 4 players.
    // The first time when the game is created, the second time when the first player is created, the third time
    // when the second player joins the game, the fourth time when the third playwer joins the game.
    // When the FOURTH PLAYER joins the the game, the game has 4 players and therefore it has to be considered
    // as STARTED and therefore "gamesNotYetStarted$" will EMIT an EMPTY array.
    // So, in total there will be 4 NOTIFICATIONS with a non-empty array of games
    const gamesNotYetStarted$_numberOfNotifications = new Array(4).fill(0);
    const gamesNotYetStarted = services.map((s, i) => {
      return s.gamesNotYetStarted$.pipe(
        tap({
          next: (games) => {
            if (games.length > 0) {
              // increment any time there is a notification with a non empty array
              gamesNotYetStarted$_numberOfNotifications[i] =
                gamesNotYetStarted$_numberOfNotifications[i] + 1;
            }
          },
        }),
        tap(),
        ignoreElements()
      );
    });

    // One player starts a new hand when the CanStartGame notifications arrives
    const startNewHand = services[0].canStartGame$.pipe(
      // when received it starts a new hand
      delay(delayBetweenCommands),
      tap(() => services[0].newHand()),
      ignoreElements()
    );

    // now play all the cards of all player in a mechanical way which does not respect scopone rules
    // every player plays one card - the players of the first team just play one card after the otherù
    // the players of the second team play always one card and take the table cards (regardless of any scopone rule)
    // in this way the second team takes all cards and makes 19 scope (2 scope per round, with the exception of
    // the last round where only one scopa is allowed)
    // the first team take no card
    let counter = 0;
    const endTest = new Subject<number>();
    const playersPlay = services.map((s, i) => {
      return s.handView_ShareReplay$.pipe(
        take(numberOfCardsPlayed * 4),
        // Filter only the hand views of a player
        filter((handView) => {
          return handView.currentPlayerName === players[i];
        }),
        // Filter only the hand views where the status is not closed
        filter((handView) => handView.status !== "closed"),
        delay(delayBetweenCommands),
        // the player plays the card using the mechanical rules which will lead
        // the first team to take no cards while the second team will take all cards
        tap({
          next: (handView) => {
            counter++;
            s.playCardForPlayer(
              players[i],
              handView.playerCards[0],
              handView.table
            );
          },
          complete: () => endTest.next(counter),
        }),
        ignoreElements()
      );
    });

    const messagesReceived = services.map((s, i) => {
      return s.connect$.pipe(
        concatMap(() => s.messages$),
        tap((msg) => {
          messagesFromServer[i][msg.id] = messagesFromServer[i][msg.id]
            ? messagesFromServer[i][msg.id]
            : [];
          messagesFromServer[i][msg.id].push(msg);
        })
      );
    });

    //let count = 0;
    merge(
      ...playersEnterOsteria,
      playerCreatesGame,
      ...gameCreated,
      ...gamesNotYetStarted,
      startNewHand,
      ...playersPlay,
      ...messagesReceived
    )
      .pipe(takeUntil(endTest))
      .subscribe({
        next: (_d) => {
          //count++;
          // console.log(count, d);
        },
        complete: () => {
          console.log("Messages received from the server", messagesFromServer);
          services.forEach((s) => s.close());
          // timeout added just to give the time to print on the console the messages that the connections have been closed
          // without timeout some of these messages do not get the time to be written on the console
          setTimeout(() => {
            done();
          }, 100);
        },
      });
  }).timeout(30000);
});
