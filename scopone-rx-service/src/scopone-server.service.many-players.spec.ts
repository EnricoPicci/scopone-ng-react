// This is a second set of tests. They run well and can be run more than once without having to restart the server
// (contrary to what happens with the first set of tests).
// If you run these tests after running the fist set, these tests errors since the server errors with something like this
// They generate an error "connect ECONNREFUSED 127.0.0.1:8080" if run a second time
// This error is generated because the server shows the following error
//     Message received {"id":"addPlayerToGame","playerName":"Player 3 - 1590393358737","gameName":"A game where first player plays1590393358737","tsSent":"2020-05-25T07:55:58.742Z"}
//     panic: send on closed channel

import { expect } from "chai";
import { describe, it } from "mocha";
import { merge } from "rxjs";
import { tap, take, toArray } from "rxjs/operators";
import {
  closeServices,
  connectServices,
  playerCreatesNewGame,
  playersEnterOsteria,
  playersJoinTheGame,
  servicesForPlayers,
} from "./test/helpers/players-actions";

(global as any).WebSocket = require("ws");

describe(`When four players enter the Osteria`, () => {
  it(`the first player receives 4 messages from the server, one after the other, telling that one after the other the 4 players enter the Osteria`, (done) => {
    // creates the players names
    const playerNames = new Array(4)
      .fill(null)
      .map((_, i) => `Player ${i} - ` + Date.now());

    // creates the services - one service per player - each service represents a separate client
    const _servicesAndPlayers = servicesForPlayers(playerNames);
    const _services = _servicesAndPlayers.map((data) => data.service);

    // create an array of Observables representing the fact that the services connect with the remote server
    const _connectServices = connectServices(_services, 1000);

    // create an array of Observables representing the fact that the players, after connecting their service, enter the Ostaria with their name
    const _playersEnterOsteria = playersEnterOsteria(_servicesAndPlayers);

    // create the Observable that represents the test
    // the first player that connects to its service receives 4 messages, on the players$ stream, containing all the names of
    // the players connected
    const firstPlayerService = _services[0];
    firstPlayerService.players$
      .pipe(
        take(4),
        toArray(),
        tap({
          next: (playersNotifications) => {
            playersNotifications.forEach((players, i) => {
              // each subsequent notification contains one more player
              const expectedPlayers = playerNames.slice(0, i + 1);
              const notExpectedPlayers = playerNames.slice(
                i + 1,
                playerNames.length
              );
              expectedPlayers.forEach((name) => {
                const pFound = players.filter((p) => p.name === name);
                expect(pFound.length).equal(1);
              });
              notExpectedPlayers.forEach((name) => {
                const pFound = players.filter((p) => p.name === name);
                expect(pFound.length).equal(0);
              });
            });
          },
        })
      )
      .subscribe({
        error: (e) => {
          done(e);
        },
        complete: () => {
          closeServices(_services);
          done();
        },
      });

    // subscribe all Obaservable to fire the actions and the test
    merge(_connectServices, ..._playersEnterOsteria).subscribe({
      error: (e) => {
        done(e);
      },
    });
  }).timeout(10000);

  it(`the last player receives a message from the server telling that the 4 players are in the Osteria`, (done) => {
    // creates the players names
    const playerNames = new Array(4)
      .fill(null)
      .map((_, i) => `Player ${i} - ` + Date.now());

    // creates the services - one service per player - each service represents a separate client
    const _servicesAndPlayers = servicesForPlayers(playerNames);
    const _services = _servicesAndPlayers.map((data) => data.service);

    // create an array of Observables representing the fact that the services connect with the remote server
    const _connectServices = connectServices(_services, 1000);

    // create an array of Observables representin the fact that the players, after connecting their service, enter the Ostaria with their name
    const _playersEnterOsteria = playersEnterOsteria(_servicesAndPlayers);

    // create the Observable that represents the test
    // the last player that connects to its service receives a message, on the players$ stream, containing all the names of
    // the players connected
    const lastPlayerService = _services[_services.length - 1];
    lastPlayerService.players$
      .pipe(
        tap({
          next: (players) => {
            playerNames.forEach((name) => {
              const pFound = players.filter((p) => p.name === name);
              expect(pFound.length).equal(1);
            });
          },
        }),
        take(1)
      )
      .subscribe({
        error: (e) => {
          done(e);
        },
        complete: () => {
          closeServices(_services);
          done();
        },
      });

    // subscribe all Obaservable to fire the actions and the test
    merge(_connectServices, ..._playersEnterOsteria).subscribe({
      error: (e) => {
        done(e);
      },
    });
  }).timeout(10000);
});

describe(`When four players enter a game`, () => {
  it(`the first player receives 4 messages from the server, one after the other, telling that one after the other the 4 players have joined the game`, (done) => {
    // creates the players names
    const playerNames = new Array(4)
      .fill(null)
      .map((_, i) => `Player ${i} - ` + Date.now());

    const gameName = "A new game " + Date.now();

    // creates the services - one service per player - each service represents a separate client
    const _servicesAndPlayers = servicesForPlayers(playerNames);
    const _services = _servicesAndPlayers.map((data) => data.service);

    // saves the first player service in a variable representing the first palyer client
    const firstPlayerService = _services[0];

    // create an array of Observables representing the fact that the services connect with the remote server
    const _connectServices = connectServices(_services, 1000);

    // create an array of Observables representing the fact that the players, after connecting their service, enter the Ostaria with their name
    const _playersEnterOsteria = playersEnterOsteria(_servicesAndPlayers);

    // create an Observable representing the fact that the first player creates a new game
    const _firstPlayerCreatesNewGame = playerCreatesNewGame(
      firstPlayerService,
      gameName
    );

    // create an array of Observables representing the fact that the players, after receiving the notification that a new game has been created,
    // join that game
    const _playersJoinTheGame = playersJoinTheGame(
      _servicesAndPlayers,
      gameName
    );

    // create the Observable that represents the test
    // the first player receives, on the myCurrentOpenGameTeams$ stream, 4 messages containing the info that, one after the other, all the players
    // have joined the game
    firstPlayerService.myCurrentOpenGameTeams$
      .pipe(
        take(4),
        toArray(),
        tap({
          next: (teamsNotifications) => {
            teamsNotifications.forEach((teams, i) => {
              // each subsequent notification contains one more player
              const expectedPlayers = playerNames.slice(0, i + 1);
              const notExpectedPlayers = playerNames.slice(
                i + 1,
                playerNames.length
              );
              const players = [...teams[0].Players, ...teams[1].Players];
              expectedPlayers.forEach((name) => {
                const pFound = players.filter((p) => p?.name === name);
                expect(pFound.length).equal(1);
              });
              notExpectedPlayers.forEach((name) => {
                const pFound = players.filter((p) => p?.name === name);
                expect(pFound.length).equal(0);
              });
            });
          },
        })
      )
      .subscribe({
        error: (e) => {
          done(e);
        },
        complete: () => {
          closeServices(_services);
          done();
        },
      });

    // subscribe all Obaservable to fire the actions and the test
    merge(
      _connectServices,
      ..._playersEnterOsteria,
      _firstPlayerCreatesNewGame,
      ..._playersJoinTheGame
    ).subscribe({
      error: (e) => {
        done(e);
      },
    });
  }).timeout(10000);

  // it(
  //   `the server should return a message containing the game with 4 players`,
  //   (done) => {
  //     const playerNames = new Array(4)
  //       .fill(null)
  //       .map((_, i) => `Player ${i} - ` + Date.now());
  //     const gameName = "A new game with 4 players" + Date.now();
  //     let gameEmitted: Game;

  //     const services = servicesForPlayers(playerNames);

  //     const playerActions = services.map(({ service, player }) => {
  //       service.connect$.pipe(
  //         tap(() => service.playerEntersOsteria(player)),
  //         tap(() => service.newGame(gameName)),
  //         tap(() => service.addPlayerToGame(player, gameName)),
  //         concatMap(() => service.messages$),
  //         filter((msg) => msg.id == MessageFromServerIds.Games),
  //         map((msg) => msg.games.find((g) => g.name === gameName)),
  //         // find the first message which refer to a Game with 4 players
  //         find(
  //           (game) =>
  //             game && game.players && Object.keys(game.players).length === 4
  //         )
  //       );
  //     });

  //     service.connect$
  //       .pipe(
  //         tap(() =>
  //           playerNames.forEach((playerName) =>
  //             service.playerEntersOsteria(playerName)
  //           )
  //         ),
  //         tap(() => service.newGame(gameName)),
  //         tap(() =>
  //           playerNames.forEach((playerName) =>
  //             service.addPlayerToGame(playerName, gameName)
  //           )
  //         ),
  //         concatMap(() => service.messages$),
  //         filter((msg) => msg.id == MessageFromServerIds.Games),
  //         map((msg) => msg.games.find((g) => g.name === gameName)),
  //         // find the first message which refer to a Game with 4 players
  //         find(
  //           (game) =>
  //             game && game.players && Object.keys(game.players).length === 4
  //         )
  //       )
  //       .subscribe({
  //         next: (data) => {
  //           gameEmitted = data;
  //         },
  //         error: (err) => {
  //           console.error("Should not error", err);
  //           done(err);
  //         },
  //         complete: () => {
  //           expect(gameEmitted).to.be.not.undefined;
  //           playerNames.forEach((playerName) => {
  //             expect(gameEmitted.players[playerName]).to.be.not.undefined;
  //           });
  //           done();
  //         },
  //       });
  //   }
  // ).timeout(10000);

  // it(`should not be possible to add a fifth player`, (done) => {
  //   const playerNames = new Array(4)
  //     .fill(null)
  //     .map((_, i) => `Player for game with five players ${i} - ` + Date.now());
  //   const fifthPlayerName = "The player number 5";
  //   const gameName =
  //     "A new game which would like to have five players" + Date.now();
  //   let dataEmitted: MessageFromServer;

  //   service.connect$
  //     .pipe(
  //       tap(() => {
  //         playerNames.forEach((playerName) =>
  //           service.playerEntersOsteria(playerName)
  //         );
  //         service.playerEntersOsteria(fifthPlayerName);
  //       }),
  //       tap(() => service.newGame(gameName)),
  //       tap(() => {
  //         playerNames.forEach((playerName) =>
  //           service.addPlayerToGame(playerName, gameName)
  //         );
  //       }),
  //       concatMap(() => service.messages$),
  //       filter((msg) => msg.id == MessageFromServerIds.Games),
  //       // find the first message which refer to a Game with 4 players
  //       find(
  //         (msg) =>
  //           !!msg.games.find((game) => Object.keys(game.players).length === 4)
  //       ),
  //       // now we know that 4 players have joined the game since we received a message containing this info from the server
  //       // we can therefore try to add a new player to that game
  //       tap(() => {
  //         service.addPlayerToGame(fifthPlayerName, gameName);
  //       }),
  //       concatMap(() => service.messages$),
  //       find((msg) => msg.id == MessageFromServerIds.ErrorAddingPlayerToGame)
  //     )
  //     .subscribe({
  //       next: (data) => {
  //         dataEmitted = data;
  //       },
  //       error: (err) => {
  //         console.error("Should not error", err);
  //         done(err);
  //       },
  //       complete: () => {
  //         expect(dataEmitted).to.be.not.undefined;
  //         done();
  //       },
  //     });
  // }).timeout(10000);

  // it(`a new hand can be started`, (done) => {
  //   const playerNames = new Array(4)
  //     .fill(null)
  //     .map(
  //       (_, i) =>
  //         `Player for game where we start one new hand ${i} - ` + Date.now()
  //     );
  //   const gameName = "A game where we start a new game" + Date.now();

  //   service.connect$
  //     .pipe(
  //       tap(() => {
  //         playerNames.forEach((playerName) =>
  //           service.playerEntersOsteria(playerName)
  //         );
  //       }),
  //       tap(() => service.newGame(gameName)),
  //       tap(() => {
  //         playerNames.forEach((playerName) =>
  //           service.addPlayerToGame(playerName, gameName)
  //         );
  //       }),
  //       tap(() => service.newHand()),
  //       concatMap(() => service.messages$),
  //       filter((msg) => msg.id == MessageFromServerIds.HandView),
  //       // we are expecting one message HandView for player
  //       take(4),
  //       toArray()
  //     )
  //     .subscribe({
  //       next: (handViewMessages) => {
  //         playerNames.forEach((playerName) => {
  //           const handView = handViewMessages.find(
  //             (msg) => msg.playerName === playerName
  //           ).handPlayerView;
  //           expect(handView).to.be.not.undefined;
  //           expect(handView.playerCards.length).to.equal(10);
  //         });
  //         done();
  //       },
  //       error: (err) => {
  //         console.error("Should not error", err);
  //         done(err);
  //       },
  //     });
  // }).timeout(10000);
});

// describe(`When a game has four players, a new hand is started and then a player exits`, () => {
//   const service = new ScoponeServerService();

//   it(`when the player enters again the server should send a refresh of the handViews`, (done) => {
//     const playerNames = new Array(4)
//       .fill(null)
//       .map(
//         (_, i) => `Player for game where somebody leaves ${i} - ` + Date.now()
//       );
//     const gameName = "A game where somebody leaves" + Date.now();

//     service
//       .connect(environment.serverAddress)
//       .pipe(
//         tap(() => {
//           playerNames.forEach((playerName) =>
//             service.playerEntersOsteria(playerName)
//           );
//           service.newGame(gameName);
//           playerNames.forEach((playerName) =>
//             service.addPlayerToGame(playerName, gameName)
//           );
//           service.newHand();
//         }),
//         delay(1000),
//         tap(() => service.close()),
//         delay(2000),
//         switchMap(() => {
//           return service.connect(environment.serverAddress);
//         }),
//         tap(() => {
//           service.playerEntersOsteria(playerNames[3]);
//         }),
//         concatMap(() => service.messages$),
//         find((msg) => msg.id == MessageFromServerIds.HandView)
//         // we are expecting JUST ONE message HandView for the player who has just entered the Osteria again
//         // the other players do not have a connection valid any more, since they shared all the same connection
//         // and when that connection was disconnected to let the player leave, all their connections got closed as well
//       )
//       .subscribe({
//         next: (handViewMessages) => {
//           const hv = handViewMessages.handPlayerView;
//           expect(hv.status).to.equal("active");
//           expect(hv.playerCards.length).to.equal(10);
//         },
//         error: (err) => {
//           console.error("Should not error", err);
//           done(err);
//         },
//         complete: () => {
//           console.log("DONE");
//           service.close();
//           done();
//         },
//       });
//   }).timeout(300000);
// });

// describe(`When a new hand is started`, () => {
//   const service = new ScoponeServerService();
//   service.connect(environment.serverAddress).subscribe({
//     error: (err) => console.error("Error while connecting", err),
//   });
//   after((done) => {
//     service.close();
//     done();
//   });

//   it(`the first player can play`, (done) => {
//     const playerNames = new Array(4)
//       .fill(null)
//       .map((_, i) => `Player ${i} - ` + Date.now());
//     const gameName = "A game where first player plays" + Date.now();

//     service.connect$
//       .pipe(
//         tap(() => {
//           playerNames.forEach((playerName) =>
//             service.playerEntersOsteria(playerName)
//           );
//         }),
//         tap(() => service.newGame(gameName)),
//         tap(() => {
//           playerNames.forEach((playerName) =>
//             service.addPlayerToGame(playerName, gameName)
//           );
//         }),
//         tap(() => service.newHand()),
//         concatMap(() => service.messages$),
//         find(
//           (msg) =>
//             msg.id == MessageFromServerIds.HandView &&
//             msg.playerName === playerNames[0]
//         ),
//         delay(100), // delay so that messages on the websocket do not get jammed causing problems on the server
//         tap((msg) => {
//           console.log("=========>>>>>>>>>>>>>>>>>> Play card");
//           service.playCardForPlayer(
//             playerNames[0],
//             msg.handPlayerView.playerCards[0],
//             []
//           );
//         }),
//         concatMap(() => service.messages$),
//         filter(
//           (msg) =>
//             msg.id == MessageFromServerIds.HandView &&
//             (msg["responseTo"] as string).startsWith("playCard")
//         ),
//         // we are expecting one message HandView for player when the player
//         take(4),
//         toArray()
//       )
//       .subscribe({
//         next: (handViewMessages: MessageFromServer[]) => {
//           playerNames.forEach((playerName) => {
//             const handView = handViewMessages.find(
//               (msg) => msg.playerName === playerName
//             ).handPlayerView;
//             expect(handView).to.be.not.undefined;
//             playerName === handView.firstPlayerName
//               ? expect(handView.playerCards.length).to.equal(9) // the first player has played 1 card so it has 9 cards
//               : expect(handView.playerCards.length).to.equal(10); // the other players have not played any card so they have 10 cards
//           });
//           done();
//         },
//         error: (err) => {
//           console.error("Should not error", err);
//           done(err);
//         },
//       });
//   }).timeout(10000);
// });
