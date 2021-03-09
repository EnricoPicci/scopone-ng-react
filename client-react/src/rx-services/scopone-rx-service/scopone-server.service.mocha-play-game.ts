// This is a test where an entire hand is played.
//
// Here I apply the following testing strategy
//
// First I create one connection with the server per player.
// Then I create different streams to represent different phases of a game
// and insert into them the assertions specific to that phase. The streams are
// - the players enter the Osteria
// - the players receive the notification that they have actually entered the Osteria
// - a new game is created
// - the players join the game
// - a new hand is started
// - cards are played by each player
// - final score is received at the end of the hand
//
// There is also another stream which receives all messages received from the server
// and collect them in a set of arrays, one array per player
//
// All these streams are eventually merged and subscriebd

import { expect } from "chai";
import { describe, it } from "mocha";

import {
  concatMap,
  tap,
  take,
  delay,
  switchMap,
  last,
  find,
  filter,
  takeUntil,
  ignoreElements,
  toArray,
} from "rxjs/operators";

import { ScoponeServerService } from "./scopone-server.service";
import { environment } from "./environments/environment";
import { MessageFromServer, GameState } from "./messages";
import { merge, interval, forkJoin } from "rxjs";

(global as any).WebSocket = require("ws");

describe(`When a hand is played until the last card`, () => {
  it("all expected messages are received and the the last ones signal that the hand is completed", (done) => {
    const delayBetweenCommands = 200;

    const players = new Array(4)
      .fill(null)
      .map((_, i) => `player - ${i} - ` + new Date().toISOString());

    const gameName = "Game " + new Date().toISOString();

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
        // start listening to the Players messages
        switchMap(() => s.players$),
        // the first player entering the Osteria will receive 4 Players messages, one per each player entering
        // the second player entering the Osteria will receive 3 messages, one for himself and the other 2 for the players
        // who will enter after him
        // the third player entering the Osteria will receive 2 messages
        // the last one will receive only one Players message, the message triggered by the fact tha he entered the Osteria
        take(4 - i),
        // for all players, the last Players message will contain all the names of the players entered in the Osteria
        last(),
        tap((_players) => {
          players.forEach((pName) => {
            const _player = _players.find((_p) => _p.name === pName);
            expect(_player).to.be.not.undefined;
          });
          console.log(
            `"players" (for ${players[i]}) messages received correctly after players have entered the Osteria`
          );
        }),
        ignoreElements()
      );
    });

    // Players receive the notification that they have entered the Osteria
    const playersEntered = services.map((s, i) => {
      return s.playerEnteredOsteria$.pipe(
        tap((player) => {
          expect(player.name).equal(players[i]);
          console.log(
            `"playerEnteredOsteria$" (for ${players[i]}) notification received correctly after a player has joined the game`
          );
        }),
        ignoreElements()
      );
    });

    // When entering Osteria each Player should be notified that he does not have any game
    const allGamesOfEachPlayer = services.map((s, i) => {
      return s.allMyGames$.pipe(
        // consider just the first message in the stream allMyGames$ - subsequent messages of this stream
        // may actually signal that the Players have some games, e.g. the one just created above
        take(1),
        tap((games) => {
          expect(games.length).equal(0);
          console.log(
            `"allMyGames$" (for ${players[i]}) notification received correctly after a player has joined the game`
          );
        }),
        ignoreElements()
      );
    });

    // One player creates a new game after all players have entered the Osteria and receieves notification of game creation
    let myGameMessageReceived = false;
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
      concatMap(() => services[0].games_ShareReplay$),
      // consider only the first Games message that contains a game which has just been created
      // there may be previous Games messages containing games that are present in the server in any state
      // but these should not contain any newly created Game, unless somebody has created it manually
      find(
        (_games) => !!_games.find((_g) => _g.state === GameState.GameCreated)
      ),
      tap((games) => {
        const myGame = games.find((g) => g.name === gameName);
        myGameMessageReceived = myGameMessageReceived || !!myGame;
        expect(myGame).to.be.not.undefined;
        console.log(
          `"Games" message received correctly by the player who created the new game`
        );
      }),
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
        concatMap(() => s.games_ShareReplay$),
        // consider only the first Games message that contains a game for which the teams are forming
        // there may be previous Games messages containing games that are present in the server in any state
        // but these should not contain any newly created Game, unless somebody has created it manually
        find(
          (_games) => !!_games.find((_g) => _g.state === GameState.TeamsForming)
        ),
        // take(i + 1),
        // last(),
        // tap((_games) => {
        //   const _game = _games.find((_g) => _g.name === gameName);
        //   // check that the player is reported as one player of the game
        //   expect(_game.players[players[i]]).to.be.not.undefined;
        //   console.log(
        //     `"Games" (for ${players[i]}) message received correctly after a player has joined the game`
        //   );
        // }),
        ignoreElements()
      );
    });

    // Players receive the notifications of the state of games which they can join (i.e. not yet started)
    // any time either a game is created or a player joins a game
    const gamesUpdates = services.map((s) => {
      return s.games_ShareReplay$.pipe(
        // Each player receives 5 notifications about games, the fist one when the game is created
        // and then 1 notification any time a player joins the game
        take(5),
        toArray(),
        // the first Games message containes the new game just created and therefore has no players
        // the second Games message is emitted when the first player joins the game, and therfore contains 1 playerù
        // the third Games message is emitted when the second player joins the game and therefore has 2 players
        // and so on and so forth
        // tap((arrayOfGames) => {
        //   arrayOfGames.forEach((aG, j) => {
        //     const _game = aG.find((g) => g.name === gameName);
        //     expect(Object.keys(_game.players).length).equal(j);
        //   });
        //   console.log(
        //     `ALL "Games" (for ${players[i]}) messages received correctly by all players`
        //   );
        // }),
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
    const playersPlay = services.map((s, i) => {
      return s.handView_ShareReplay$.pipe(
        // Filter only the hand views of a player
        filter((handView) => {
          return handView.currentPlayerName === players[i];
        }),
        // Filter only the hand views where the status is not closed
        filter((handView) => handView.status !== "closed"),
        delay(delayBetweenCommands),
        // the player plays the card using the mechanical rules which will lead
        // the first team to take no cards while the second team will take all cards
        tap((handView) => {
          s.playCardForPlayer(
            players[i],
            handView.playerCards[0],
            handView.table
          );
        }),
        ignoreElements()
      );
    });

    // the cards taken are notified to all clients
    let cardsPlayedCounters = new Array(4).fill(0);
    const cardsPlayed = services.map((s, i) => {
      return s.cardsPlayedAndTaken$.pipe(
        tap(() => {
          cardsPlayedCounters[i] = cardsPlayedCounters[i] + 1;
        })
      );
    });

    // The hand is closed
    let handViewCounters = new Array(4).fill(0);
    const handClosed = services.map((s, i) => {
      return s.handView_ShareReplay$.pipe(
        tap(() => {
          handViewCounters[i] = handViewCounters[i] + 1;
        }),
        // Filter only the hand views where the status is closed, i.e. the last ones
        filter((handView) => handView.status === "closed"),
        tap((handView) => {
          // each player receives 41 notifications of handViews, the first one when the hand is started
          // and the one for each card played
          expect(handViewCounters[i]).equal(41);
          console.log(
            `ALL "HandView" (for ${players[i]}) notifications received correctly`
          );
          // the first second player, i.e. team 1, have no points neither scope
          if (i < 2) {
            expect(handView.ourCurrentGameScore).equal(0);
            expect(handView.theirCurrentGameScore).equal(33);
            expect(handView.ourScope.length).equal(0);
            expect(handView.theirScope.length).equal(19);
          } else {
            expect(handView.ourCurrentGameScore).equal(33);
            expect(handView.theirCurrentGameScore).equal(0);
            expect(handView.ourScope.length).equal(19);
            expect(handView.theirScope.length).equal(0);
          }
          console.log(
            `"HandView" (for ${players[i]}) messages received correctly when the hand is closed`
          );
        }),
        ignoreElements()
      );
    });

    const allPlayersReceiveHandClosed = services.map((s) =>
      s.handView_ShareReplay$.pipe(
        find((handView) => handView.status === "closed")
      )
    );
    // endTest waits for all players to receive handViews with status 'closed'
    // we then wait a bit to let the logic of the assertions run before we let endTest emit
    // when endTest emits, the main Observable running the test is completed
    const endTest = forkJoin(allPlayersReceiveHandClosed).pipe(delay(100));

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
      ...playersEntered,
      ...allGamesOfEachPlayer,
      playerCreatesGame,
      ...gameCreated,
      ...gamesUpdates,
      ...gamesNotYetStarted,
      startNewHand,
      ...playersPlay,
      ...cardsPlayed,
      ...handClosed,
      ...messagesReceived
    )
      .pipe(takeUntil(endTest))
      .subscribe({
        next: () => {
          //count++;
          // console.log(count, d);
        },
        complete: () => {
          // Run here all tests that have to be run when the Observable completes
          //
          // Test gamesNotYetStarted$ expected behaviour
          // see the comment close to the definition of "gamesNotYetStarted$_numberOfNotifications" to understand the logic
          // if you encounter an error here, it is worth restarting the server to make sure it has the correct state
          gamesNotYetStarted$_numberOfNotifications.forEach(
            (numberOfNotifications) => {
              expect(numberOfNotifications).equal(4);
              console.log(
                `All "gamesNotYetStarted" notifications have been received as expected`
              );
            }
          );
          //
          // Test that cardsPlayedCounters have the expected numbers
          cardsPlayedCounters.forEach((numberOfNotifications) => {
            expect(numberOfNotifications).equal(40);
            console.log(
              `All "cardsPlayedAndTaken" notifications have been received as expected`
            );
          });
          //
          // Now we can close the connections
          services.forEach((s) => s.close());
          // timeout added just to give the time to print on the console the messages that the connections have been closed
          // without timeout some of these messages do not get the time to be written on the console
          setTimeout(() => {
            done();
          }, 100);
        },
      });
  }).timeout(60000);
});
