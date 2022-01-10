// These tests test the behaviour more players enter the Osteria and start playing the game.
// Each player is represented by a separate service (ScoponeService instance)

import { expect } from "chai";
import { describe, it } from "mocha";
import { forkJoin, merge } from "rxjs";
import {
  tap,
  take,
  toArray,
  filter,
  find,
  delay,
  share,
  concatMap,
} from "rxjs/operators";
import { PlayerState } from "../model/player";
import { MessageFromServerIds } from "../scopone-messages";
import {
  closeServices,
  connectServices,
  gameCreated,
  playerCreatesNewGame,
  playersEnterOsteria,
  playersJoinTheGame,
  playersStartsFirstHandAndExits,
  playerStartsFirstHand,
  servicesForPlayers,
} from "./helpers/players-actions";

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

    // create an array of Observables representing the fact that the different clients connect with the remote server
    const _connectServices = connectServices(_services);

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

    // create an array of Observables representing the fact that the different clients connect with the remote server
    const _connectServices = connectServices(_services);

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

describe(`When one player creates a new game`, () => {
  it(`all players will receive a message with the newly created game`, (done) => {
    // creates the players names
    const playerNames = new Array(4)
      .fill(null)
      .map((_, i) => `Player ${i} - ` + Date.now());

    const gameName = "A new game " + Date.now();

    // creates the services - one service per player - each service represents a separate client
    const _servicesAndPlayers = servicesForPlayers(playerNames);
    const _services = _servicesAndPlayers.map((data) => data.service);

    // saves the first player service in a variable representing the first player client
    const firstPlayerService = _services[0];

    // create an array of Observables representing the fact that the different clients connect with the remote server
    const _connectServices = connectServices(_services);

    // create an array of Observables representing the fact that the players, after connecting their service, enter the Ostaria with their name
    const _playersEnterOsteria = playersEnterOsteria(_servicesAndPlayers);

    // create an Observable representing the fact that the first player creates a new game
    const _firstPlayerCreatesNewGame = playerCreatesNewGame(
      firstPlayerService,
      gameName
    );

    // create the Observable that represents the test
    // each player receives, on the gameList$ stream, a message containing the newly created game
    const _tests = _services.map((service) => {
      // the player enters the game as soon as it receives the message that the game has been created
      return gameCreated(service, gameName).pipe(
        tap((game) => {
          expect(game).to.be.not.undefined;
        })
      );
    });
    forkJoin(_tests).subscribe({
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
      _firstPlayerCreatesNewGame
    ).subscribe({
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

    // saves the first player service in a variable representing the first player client
    const firstPlayerService = _services[0];

    // create an array of Observables representing the fact that the different clients connect with the remote server
    const _connectServices = connectServices(_services);

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

  it(`a player can start the game and the game points to the right players`, (done) => {
    // creates the players names
    const playerNames = new Array(4)
      .fill(null)
      .map((_, i) => `Player ${i} - ` + Date.now());

    const gameName = "A new game that starts " + Date.now();

    // creates the services - one service per player - each service represents a separate client
    const _servicesAndPlayers = servicesForPlayers(playerNames);
    const _services = _servicesAndPlayers.map((data) => data.service);

    // saves the first player service in a variable representing the first player client
    const firstPlayerService = _services[0];

    // create an array of Observables representing the fact that the different clients connect with the remote server
    const _connectServices = connectServices(_services);

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
    // a player, the first one in this case, receives, on the canStartGame$ stream, a notification that it can start the newly created game
    // since 4 players have joined the game
    firstPlayerService.canStartGame$
      .pipe(
        filter((_game) => _game.name === gameName),
        take(1),
        tap({
          next: (_game) => {
            playerNames.forEach((_name) => {
              // each player is one of the players of the game
              expect(_game.players[_name]).not.undefined;
              // each team has 2 players
              expect(_game.teams[0].Players.length).equal(2);
              expect(_game.teams[1].Players.length).equal(2);
              // each player is in one of the teams
              expect(
                _game.teams[0].Players.some(
                  (_player) => _player.name === _name
                ) ||
                  _game.teams[1].Players.some(
                    (_player) => _player.name === _name
                  )
              ).true;
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

  it(`should not be possible to add a fifth player`, (done) => {
    // creates the players names - in these case there are 5 players
    const playerNames = new Array(5)
      .fill(null)
      .map((_, i) => `Player ${i} - ` + Date.now());

    const gameName =
      "A new game where we try to add a fifth player " + Date.now();

    // creates the services - one service per player - each service represents a separate client
    const _servicesAndPlayers = servicesForPlayers(playerNames);
    const _services = _servicesAndPlayers.map((data) => data.service);

    // saves the first player service in a variable representing the first player client
    const firstPlayerService = _services[0];

    // create an array of Observables representing the fact that the different clients connect with the remote server
    const _connectServices = connectServices(_services);

    // create an array of Observables representing the fact that the players, after connecting their service, enter the Ostaria with their name
    const _playersEnterOsteria = playersEnterOsteria(_servicesAndPlayers);

    // create an Observable representing the fact that the first player creates a new game
    const _firstPlayerCreatesNewGame = playerCreatesNewGame(
      firstPlayerService,
      gameName
    );

    // the first 4 players, after receiving the notification that a new game has been created, join that game
    const _playersJoinTheGame = playersJoinTheGame(
      _servicesAndPlayers.slice(0, 4),
      gameName
    );

    const fifthServiceAndPlayer = _servicesAndPlayers[4];
    const fifthPlayer = fifthServiceAndPlayer.player;
    const fifthPlayerService = fifthServiceAndPlayer.service;
    // once the 4 players have joined the game, try to add the fifth player
    const _addFifthPlayer = fifthPlayerService.gameList$.pipe(
      // select the first notification that contains the game created and the fact the the game can only be observed,
      // which means that it has already 4 players
      find(
        (_games) =>
          !!_games.find((_game) => {
            return _game.name === gameName && _game.canBeObservedOnly;
          })
      ),
      tap(() => {
        return fifthPlayerService.addPlayerToGame(fifthPlayer, gameName);
      })
    );

    // create the Observable that represents the test
    // the fifth player an error notification since it can not join the game
    fifthPlayerService.messages$
      //       find((msg) => msg.id == MessageFromServerIds.ErrorAddingPlayerToGame)
      .pipe(
        tap((m) => {
          console.log("==========>>>>>>>>>>", m);
        }),
        find((msg) => msg.id == MessageFromServerIds.ErrorAddingPlayerToGame),
        tap({
          next: (_message) => {
            expect(_message).not.undefined;
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
      ..._playersJoinTheGame,
      _addFifthPlayer
    ).subscribe({
      error: (e) => {
        console.error(e.stack);
        done(e);
      },
    });
  }).timeout(10000);
});

describe(`When a player starts a game`, () => {
  it(`all the players receive 10 cards and there are no cards on the table`, (done) => {
    // creates the players names
    const playerNames = new Array(4)
      .fill(null)
      .map((_, i) => `Player ${i} - ` + Date.now());

    const gameName = "A new game that starts " + Date.now();

    // creates the services - one service per player - each service represents a separate client
    const _servicesAndPlayers = servicesForPlayers(playerNames);
    const _services = _servicesAndPlayers.map((data) => data.service);

    // saves the first player service in a variable representing the first player client
    const firstPlayerService = _services[0];
    const firstPlayerName = _servicesAndPlayers[0].player;

    // create an array of Observables representing the fact that the different clients connect with the remote server
    const _connectServices = connectServices(_services);

    // create an array of Observables representing the fact that the players, after connecting their service, enter the Ostaria with their name
    const _playersEnterOsteria = playersEnterOsteria(_servicesAndPlayers);

    // create an Observable representing the fact that the first player creates a new game
    const _firstPlayerCreatesNewGame = playerCreatesNewGame(
      firstPlayerService,
      gameName
    );

    // the players, after receiving the notification that a new game has been created,
    // join that game
    const _playersJoinTheGame = playersJoinTheGame(
      _servicesAndPlayers,
      gameName
    );

    // a player, the first in this test, after receiving the notification that a new game can be started, starts the first hand
    const _playersStartsFirstHand = playerStartsFirstHand(firstPlayerService);

    // create the Observable that represents the test
    // all players receive 10 cards and there are no cards on the table
    const _playersReceiveFirst10Cards = _servicesAndPlayers.map(({ service }) =>
      service.handView_ShareReplay$.pipe(take(1))
    );
    forkJoin(_playersReceiveFirst10Cards)
      .pipe(
        tap((_playerViews) => {
          _playerViews.forEach((_playerView) => {
            expect(_playerView.playerCards.length).equal(10);
            expect(_playerView.table.length).equal(0);
            expect(_playerView.currentPlayerName).equal(firstPlayerName);
            expect(_playerView.firstPlayerName).equal(firstPlayerName);
          });
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
      ..._playersJoinTheGame,
      _playersStartsFirstHand
    ).subscribe({
      error: (e) => {
        done(e);
      },
    });
  }).timeout(10000);

  it(`only the first player can play`, (done) => {
    // creates the players names
    const playerNames = new Array(4)
      .fill(null)
      .map((_, i) => `Player ${i} - ` + Date.now());

    const gameName = "A new game that starts " + Date.now();

    // creates the services - one service per player - each service represents a separate client
    const _servicesAndPlayers = servicesForPlayers(playerNames);
    const _services = _servicesAndPlayers.map((data) => data.service);

    // saves the first player service in a variable representing the first player client
    const firstPlayerService = _services[0];

    // create an array of Observables representing the fact that the different clients connect with the remote server
    const _connectServices = connectServices(_services);

    // create an array of Observables representing the fact that the players, after connecting their service, enter the Ostaria with their name
    const _playersEnterOsteria = playersEnterOsteria(_servicesAndPlayers);

    // create an Observable representing the fact that the first player creates a new game
    const _firstPlayerCreatesNewGame = playerCreatesNewGame(
      firstPlayerService,
      gameName
    );

    // the players, after receiving the notification that a new game has been created,
    // join that game
    const _playersJoinTheGame = playersJoinTheGame(
      _servicesAndPlayers,
      gameName
    );

    // a player, the first in this test, after receiving the notification that a new game can be started, starts the first hand
    const _playersStartsFirstHand = playerStartsFirstHand(firstPlayerService);

    // create the Observable that represents the test
    // only the first player can play a card all others can not
    const _playersCanPlayCard = _servicesAndPlayers.map(({ service }) =>
      service.isMyTurnToPlay$.pipe(take(1))
    );
    forkJoin(_playersCanPlayCard)
      .pipe(
        tap((_playersCanPlay) => {
          expect(_playersCanPlay[0]).true;
          _playersCanPlay
            .slice(1)
            .forEach((_canPlay) => expect(_canPlay).false);
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
      ..._playersJoinTheGame,
      _playersStartsFirstHand
    ).subscribe({
      error: (e) => {
        done(e);
      },
    });
  }).timeout(10000);

  describe(`and then a player exits the Osteria`, () => {
    it(`all the remaining players receive a message stating that that player has left`, (done) => {
      // creates the players names
      const playerNames = new Array(4)
        .fill(null)
        .map((_, i) => `Player ${i} - ` + Date.now());

      const gameName = "A new game that starts " + Date.now();

      // creates the services - one service per player - each service represents a separate client
      const _servicesAndPlayers = servicesForPlayers(playerNames);
      const _services = _servicesAndPlayers.map((data) => data.service);

      // saves the first player service in a variable representing the first player client
      const firstPlayerService = _services[0];

      // create an array of Observables representing the fact that the different clients connect with the remote server
      const _connectServices = connectServices(_services);

      // create an array of Observables representing the fact that the players, after connecting their service, enter the Ostaria with their name
      const _playersEnterOsteria = playersEnterOsteria(_servicesAndPlayers);

      // create an Observable representing the fact that the first player creates a new game
      const _firstPlayerCreatesNewGame = playerCreatesNewGame(
        firstPlayerService,
        gameName
      );

      // the players, after receiving the notification that a new game has been created,
      // join that game
      const _playersJoinTheGame = playersJoinTheGame(
        _servicesAndPlayers,
        gameName
      );

      // a player, the first in this test, after receiving the notification that a new game can be started, starts the first hand
      // and then exits the game
      const _playersStartsFirstHandAndExits = playersStartsFirstHandAndExits(
        firstPlayerService
      ).pipe(
        // share this Observable so that it can be used to trigger the test, i.e. to check that the message about the state of the game
        // is received by the players remaining in the game AFTER this player has exited the game
        share()
      );

      // create the Observable that represents the test
      // after a player exits the game, all the remaining players receive a message stating that a player has left
      const _playerLeftNotifications = _servicesAndPlayers
        .slice(1)
        .map(({ service }) =>
          service.myCurrentOpenGameTeams$.pipe(
            // if we find a message which states that the first player has left the game, then this Observable is completed
            find((_teams) => {
              return (
                _teams[0].Players[0].status === PlayerState.playerLeftTheGame
              );
            })
          )
        );
      _playersStartsFirstHandAndExits
        .pipe(
          // each of the Observables contained in the array _playerLeftNotifications completes if it finds that the first player has left the Osteria
          // if all of them complete, then the following forkJoin notifies something
          // so the test is to check that forkJoin actually notifies
          // if it does not notify, then the test does not complete and will timeout
          concatMap(() => forkJoin(_playerLeftNotifications)),
          tap((_playerLeftNotifications) => {
            expect(_playerLeftNotifications.length).equal(3);
          })
        )
        .subscribe({
          error: (e) => {
            done(e);
          },
          complete: () => {
            closeServices(_services.slice(1));
            done();
          },
        });

      // subscribe all Obaservable to fire the actions and the test
      merge(
        _connectServices,
        ..._playersEnterOsteria,
        _firstPlayerCreatesNewGame,
        ..._playersJoinTheGame,
        _playersStartsFirstHandAndExits
      ).subscribe({
        error: (e) => {
          done(e);
        },
      });
    }).timeout(10000);

    describe(`and then the player who exited enters again in the Osteria`, () => {
      it(`all the remaining players receive a refresh of the handviews`, (done) => {
        // creates the players names
        const playerNames = new Array(4)
          .fill(null)
          .map((_, i) => `Player ${i} - ` + Date.now());

        const gameName = "A new game that starts " + Date.now();

        // creates the services - one service per player - each service represents a separate client
        const _servicesAndPlayers = servicesForPlayers(playerNames);
        const _services = _servicesAndPlayers.map((data) => data.service);

        // saves the first player service in a variable representing the first player client
        const firstServiceAndPlayer = _servicesAndPlayers[0];
        const firstPlayerService = firstServiceAndPlayer.service;
        const firstPlayerName = firstServiceAndPlayer.player;

        // create an array of Observables representing the fact that the different clients connect with the remote server
        const _connectServices = connectServices(_services);

        // create an array of Observables representing the fact that the players, after connecting their service, enter the Ostaria with their name
        const _playersEnterOsteria = playersEnterOsteria(_servicesAndPlayers);

        // create an Observable representing the fact that the first player creates a new game
        const _firstPlayerCreatesNewGame = playerCreatesNewGame(
          firstPlayerService,
          gameName
        );

        // the players, after receiving the notification that a new game has been created,
        // join that game
        const _playersJoinTheGame = playersJoinTheGame(
          _servicesAndPlayers,
          gameName
        );

        // a player, the first in this test, after receiving the notification that a new game can be started, starts the first hand
        // and then exits the game
        const _playersStartsFirstHandAndExits = playersStartsFirstHandAndExits(
          firstPlayerService
        ).pipe(
          // share this Observable so that it can be used to trigger the test, i.e. to check that the message about the state of the game
          // is received by the players remaining in the game AFTER this player has exited the game
          share()
        );

        // the player enters again the Osteria
        const _playerEntersAgain = _playersStartsFirstHandAndExits.pipe(
          // wait some time
          delay(100),
          // and then enter again
          concatMap(() => connectServices([firstPlayerService])),
          concatMap(() => playersEnterOsteria([firstServiceAndPlayer]))
        );

        // create the Observable that represents the test
        // after the player enters again the game, all the players receive a refresh of the hand view
        const _playersReceiveRefreshedHandView = _servicesAndPlayers.map(
          ({ service }) => service.handView$.pipe(take(1))
        );
        _playersStartsFirstHandAndExits
          .pipe(
            concatMap(() => forkJoin(_playersReceiveRefreshedHandView)),
            tap((_playerViews) => {
              _playerViews.forEach((_playerView) => {
                expect(_playerView.playerCards.length).equal(10);
                expect(_playerView.table.length).equal(0);
                expect(_playerView.currentPlayerName).equal(firstPlayerName);
                expect(_playerView.firstPlayerName).equal(firstPlayerName);
              });
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
          ..._playersJoinTheGame,
          _playersStartsFirstHandAndExits,
          _playerEntersAgain
        ).subscribe({
          error: (e) => {
            done(e);
          },
        });
      }).timeout(10000);
    });
  });
});
