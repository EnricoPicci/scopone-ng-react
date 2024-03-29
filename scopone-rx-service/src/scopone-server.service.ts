// The way this class has been coded requires that the strict mode is turned off from typescript
// https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-7.html#strict-class-initialization
// This is why we have added a tsconfig.json file in the same folder as this file

import {
  ReplaySubject,
  Observable,
  from,
  pipe,
  merge,
  combineLatest,
} from "rxjs";
import {
  tap,
  share,
  map,
  mergeMap,
  switchMap,
  filter,
  shareReplay,
  take,
  distinctUntilChanged,
  catchError,
} from "rxjs/operators";

import {
  MessageToServer,
  MessageFromServer,
  MessageFromServerIds,
  AddPlayerToGameMessage,
  NewHand,
  PlayCardMessage,
  PlayerEntersOsteriaMessage,
  NewGame,
  CloseGame,
  AddObserverToGameMessage,
} from "./scopone-messages";
import { HandState } from "./model/hand";
import { Team } from "./model/team";
import { Player, PlayerState } from "./model/player";
import { Game, GameState, GameForList } from "./model/game";

import { openSocket, messages } from "./observable-websocket";
import { HandHistory, PlayerView } from "./model/player-view";
import { Card, Suits, TypeValues } from "./model/card";
import { ScoponeErrors } from "./scopone-errors";

export class ScoponeServerService {
  // ====================================================================================================
  // Internal properties - not to be used by any client
  private socket: WebSocket;
  private _connect$ = new ReplaySubject<WebSocket>(1);
  readonly connect$ = this._connect$.asObservable(); // not private only because it is used by tests
  private closedByClient = false;

  // ====================================================================================================
  // Public Observable streams which clients of this service can subscribe to
  messages$: Observable<MessageFromServer>;

  players$: Observable<Player[]>;
  playerEnteredOsteria$: Observable<Player>;
  playerIsAlreadyInOsteria$: Observable<string>;
  playerLeftOsteria$: Observable<string>;

  games_ShareReplay$: Observable<Game[]>;
  gamesOpen$: Observable<Game[]>;
  gamesNotYetStarted$: Observable<Game[]>;
  gamesWhichCanBeObserved$: Observable<Game[]>;
  gameList$: Observable<GameForList[]>;
  gameWithSameNamePresent_ShareReplay$: Observable<string>;

  allMyGames$: Observable<Game[]>;
  myCurrentOpenGame_ShareReplay$: Observable<Game>;
  myCurrentOpenGameTeams$: Observable<[Team, Team]>;
  showStartButton$: Observable<boolean>;
  myCurrentOpenGameWithAll4PlayersIn_ShareReplay$: Observable<boolean>;
  myCurrentGameClosed$: Observable<Game>;
  myCurrentGameClosed_ShareReplay$: Observable<Game>;
  myCurrentObservedGame_ShareReplay$: Observable<Game>;
  myCurrentGame$: Observable<Game>;

  canStartGame$: Observable<Game>;

  allHandViews$: Observable<PlayerView[]>;
  allHandViews_ShareReplay$: Observable<PlayerView[]>;
  handView$: Observable<PlayerView>;
  handView_ShareReplay$: Observable<PlayerView>;
  handClosed$: Observable<PlayerView>;
  handClosed_ShareReplay$: Observable<PlayerView>;
  handHistory$: Observable<HandHistory>;

  cardsPlayedAndTaken$: Observable<{
    cardPlayed: Card;
    cardsTaken: Card[];
    cardPlayedByPlayer: string;
    finalTableTake: {
      Cards: Card[];
      TeamTakingTable: [Player, Player];
    };
  }>;

  currentPlayer$: Observable<string>;
  isMyTurnToPlay$: Observable<boolean>;
  enablePlay$: Observable<boolean>;

  title$: Observable<string>;

  // ====================================================================================================
  // Private properties
  private _playerName: string;
  get playerName() {
    return this._playerName;
  }
  private _gameName: string;
  get gameName() {
    return this._gameName;
  }

  // observing is true if the Game is entered as an Observer of the Game and not as a Player
  private _observing = false;
  get observing() {
    return this._observing;
  }

  private _logMessages = true;
  set logMessages(log: boolean) {
    this._logMessages = log;
  }
  // END Private properties

  // parameters have to be passed to the constructor if, for instance for testing purposes, we want to set the stateof the service
  // For instance an rxJs.Subject can be passed as messagesSource if we want to simulate the stream of messages coming from the web socket
  constructor(
    messagesSource?: Observable<MessageFromServer>,
    _playerName?: string,
    _gameName?: string
  ) {
    this.initialize(messagesSource);
    this._playerName = _playerName;
    this._gameName = _gameName;
  }

  initialize(messagesSource?: Observable<MessageFromServer>) {
    // messages$ is the source Observable for everything
    this.messages$ = messagesSource
      ? messagesSource
      : this._connect$.pipe(
          switchMap((ws) => this.messages(ws)),
          tap((d) => {
            if (this._logMessages) {
              console.log("Message received from server", d);
            }
          }),
          // we share the source stream to make sure that all downstream transformations share the same source
          share()
        );

    // ====================================================================================================
    // From here we start initializing the various public Observables offered to clients for subscription
    this.players$ = this.messages$.pipe(
      filter((m) => m.id === MessageFromServerIds.Players),
      map((m) => m.players),
      share()
    );

    this.playerEnteredOsteria$ = this.players$.pipe(
      map((players) => players.find((p) => p.name === this._playerName)),
      filter((p) => !!p),
      // close after first notification - otherwise this would emit any time we receive a refreshed list of players
      take(1),
      shareReplay(1)
    );

    this.playerIsAlreadyInOsteria$ = this.messages$.pipe(
      filter((m) => m.id === MessageFromServerIds.PlayerIsAlreadyInOsteria),
      map((m) => m.playerName),
      share()
    );

    this.playerLeftOsteria$ = this.messages$.pipe(
      filter((m) => m.id === MessageFromServerIds.playerLeffMsgID),
      map((m) => m.playerName),
      share()
    );

    this.games_ShareReplay$ = this.messages$.pipe(
      filter((m) => m.id === MessageFromServerIds.Games),
      map((m) => m.games),
      shareReplay(1)
    );

    this.gameWithSameNamePresent_ShareReplay$ = this.messages$.pipe(
      filter((m) => m.id === MessageFromServerIds.GameWithSameNamePresent),
      map((m) => m.gameName),
      shareReplay(1)
    );

    this.gamesOpen$ = this.games_ShareReplay$.pipe(
      map((allGames) =>
        allGames ? allGames.filter((g) => g.state === GameState.GameOpen) : []
      ),
      share()
    );

    this.gamesWhichCanBeObserved$ = this.games_ShareReplay$.pipe(
      map((allGames) =>
        allGames
          ? allGames.filter(
              (g) =>
                (g.state === GameState.GameOpen ||
                  g.state === GameState.GameSuspended) &&
                Object.keys(g.players).length === 4 &&
                !Object.keys(g.players).includes(this._playerName)
            )
          : []
      ),
      share()
    );

    this.gamesNotYetStarted$ = this.games_ShareReplay$.pipe(
      map((allGames) =>
        allGames
          ? allGames.filter((g) => Object.keys(g.players).length < 4)
          : []
      ),
      share()
    );

    this.allMyGames$ = this.games_ShareReplay$.pipe(
      map((allGames) =>
        allGames
          ? allGames.filter((g) => {
              return [
                ...Object.keys(g.players || []),
                ...Object.keys(g.observers || []),
              ].includes(this._playerName);
            })
          : []
      ),
      shareReplay(1)
    );

    this.gameList$ = combineLatest([
      this.gamesNotYetStarted$,
      this.gamesWhichCanBeObserved$,
    ]).pipe(
      map(([gNotStarted, gObservable]) => {
        const gamesNotStarted = gNotStarted.map(
          (g) => ({ ...g, canBeObservedOnly: false } as GameForList)
        );
        const gamesObservable = gObservable.map(
          (g) => ({ ...g, canBeObservedOnly: true } as GameForList)
        );
        return [...gamesNotStarted, ...gamesObservable];
      })
    );

    this.myCurrentOpenGame_ShareReplay$ = this.allMyGames$.pipe(
      // we place shareReplay before filtering for not-closed games since we do not want to emit
      // anything if there are no not-closed games. In other words, if the current game is closed
      // shareReplay will replay the last set of messages relative to allMyGames$ received
      // but then the filter will filter out the closed game and therefore this Observable will not notigy
      shareReplay(1),
      map((myGames) =>
        myGames.filter(
          (g) => g.state !== GameState.GameClosed && g.players[this._playerName]
        )
      ),
      filter((games) => games.length > 0),
      map((games) => {
        if (games.length > 1) {
          throw new Error(
            `${this._playerName} is playing more than one game which is not closed`
          );
        }
        const game = games[0];
        this._gameName = game.name;
        return game;
      })
    );

    this.myCurrentOpenGameTeams$ = this.myCurrentOpenGame_ShareReplay$.pipe(
      map((game) => {
        return game.teams;
      }),
      distinctUntilChanged(
        (prev, curr) =>
          prev[0].Players[0]?.name === curr[0].Players[0]?.name &&
          prev[0].Players[0]?.status === curr[0].Players[0]?.status &&
          prev[0].Players[1]?.name === curr[0].Players[1]?.name &&
          prev[0].Players[1]?.status === curr[0].Players[1]?.status &&
          prev[1].Players[0]?.name === curr[1].Players[0]?.name &&
          prev[1].Players[0]?.status === curr[1].Players[0]?.status &&
          prev[1].Players[1]?.name === curr[1].Players[1]?.name &&
          prev[1].Players[1]?.status === curr[1].Players[1]?.status
      )
    );

    this.showStartButton$ = this.myCurrentOpenGame_ShareReplay$.pipe(
      map((game) => {
        // decide whether to show or not the Start Game button
        const gameWith4PlayersAndNoHand =
          Object.keys(game.players).length === 4 && game.hands.length === 0;
        const lastHandClosed = game.hands
          ? game.hands.length > 0
            ? game.hands[game.hands.length - 1].state === HandState.closed
            : false
          : false;
        return gameWith4PlayersAndNoHand || lastHandClosed;
      })
    );

    this.myCurrentObservedGame_ShareReplay$ = this.allMyGames$.pipe(
      // we place shareReplay before filtering for not-closed games since we do not want to emit
      // anything if there are no not-closed games. In other words, if the current game is closed
      // shareReplay will replay the last set of messages relative to allMyGames$ received
      // but then the filter will filter out the closed game and therefore this Observable will not notigy
      shareReplay(1),
      map((myObservedGames) =>
        myObservedGames.filter(
          (g) =>
            g.state !== GameState.GameClosed &&
            g.observers &&
            g.observers[this._playerName]
        )
      ),
      filter((games) => games.length > 0),
      map((games) => {
        if (games.length > 1) {
          throw new Error(
            `${this._playerName} is observing more than one game which is not closed`
          );
        }
        const game = games[0];
        this._gameName = game.name;
        return game;
      })
    );

    this.myCurrentGame$ = merge(
      this.myCurrentOpenGame_ShareReplay$,
      this.myCurrentObservedGame_ShareReplay$
    );

    this.myCurrentOpenGameWithAll4PlayersIn_ShareReplay$ =
      this.myCurrentOpenGame_ShareReplay$.pipe(
        map(
          (game) =>
            Object.values(game.players).filter(
              (p) => p.status === PlayerState.playerPlaying
            ).length === 4
        )
      );

    this.myCurrentGameClosed$ = this.allMyGames$.pipe(
      map((games) => games.find((g) => g.name === this._gameName)),
      filter((game) => !!game && game.state === GameState.GameClosed),
      // we want to notify only once when a game has been closed, hence the use of distinctUnitlChanged
      distinctUntilChanged((a, b) => a.name === b.name)
    );
    this.myCurrentGameClosed_ShareReplay$ = this.myCurrentGameClosed$.pipe(
      shareReplay(1)
    );

    this.canStartGame$ = this.messages$.pipe(
      filter((m) => m.id === MessageFromServerIds.Games),
      map((m) => {
        const games = m.games;
        const myOpenGames = games.filter(
          (g) => g.state === "open" && !!g.players[this._playerName]
        );
        if (myOpenGames.length > 1) {
          throw new Error(
            `Player ${
              this._playerName
            } is in more than one open Game \n ${JSON.stringify(
              myOpenGames,
              null,
              2
            )}`
          );
        }
        return myOpenGames;
      }),
      // do not emit if there are no games for the player or if the current hand is not yet complete
      filter((games) => {
        let canStartGame = false;
        if (games.length === 1) {
          const game = games[0];
          canStartGame =
            Object.keys(game.players).length === 4 &&
            (game.hands.length === 0 ||
              game.hands[game.hands.length - 1].state === HandState.active);
        }
        return canStartGame;
      }),
      map((games) => {
        return games[0];
      }),
      share()
    );

    this.allHandViews$ = this.messages$.pipe(
      filter((m) => m.id === MessageFromServerIds.HandView),
      map((m) => {
        return m.allHandPlayerViews;
      }),
      filter((handViews) => !!handViews)
    );

    this.allHandViews_ShareReplay$ = this.allHandViews$.pipe(shareReplay(1));
    this.handView$ = this.messages$.pipe(
      filter((m) => m.id === MessageFromServerIds.HandView),
      map((m) => {
        const hv = m.handPlayerView;
        if (!hv.table) {
          hv.table = [];
        }
        return hv;
      }),
      // For players who are observing a game, the HandView message arrives with an empty "handPlayerView" property
      // while the property "allHandPlayerViews" contains the playerViews for all players actively palying the game
      // so we need to filter out the case when the handView is empty to avoid that the Player observing a game
      // reacts to a non event
      filter((hv) => hv && hv.gameName.trim() !== "")
    );

    this.handView_ShareReplay$ = this.handView$.pipe(shareReplay(1));

    const finalHandViewPipe = pipe(
      filter((hv: PlayerView) => hv.status === HandState.closed)
    );

    this.handClosed$ = merge(
      this.handView$.pipe(finalHandViewPipe),
      this.allHandViews$
        .pipe(
          map((handViews) => {
            const hv = Object.values(handViews)[0];
            return handViews[hv.currentPlayerName];
          })
        )
        .pipe(finalHandViewPipe)
    );

    this.handClosed_ShareReplay$ = merge(
      this.handView_ShareReplay$.pipe(finalHandViewPipe),
      this.allHandViews_ShareReplay$
        .pipe(
          map((handViews) => {
            const hv = Object.values(handViews)[0];
            return handViews[hv.currentPlayerName];
          })
        )
        .pipe(finalHandViewPipe)
    );

    this.handHistory$ = this.handView_ShareReplay$.pipe(
      map((handView) => handView.history)
    );

    this.cardsPlayedAndTaken$ = this.messages$.pipe(
      filter((m) => m.id === MessageFromServerIds.CardsPlayedAndTaken),
      map((m) => {
        return {
          cardPlayed: m.cardPlayed,
          cardsTaken: m.cardsTaken,
          cardPlayedByPlayer: m.cardPlayedByPlayer,
          finalTableTake: m.finalTableTake,
        };
      })
    );

    this.currentPlayer$ = this.handView_ShareReplay$.pipe(
      map((hv) => hv.currentPlayerName)
    );
    this.isMyTurnToPlay$ = this.currentPlayer$.pipe(
      map((name) => name === this._playerName),
      share()
    );
    this.enablePlay$ = combineLatest([
      this.isMyTurnToPlay$,
      this.myCurrentOpenGameWithAll4PlayersIn_ShareReplay$,
    ]).pipe(map(([isMyTurn, all4PlayersIn]) => isMyTurn && all4PlayersIn));

    this.title$ = merge(
      // when the Player enters the Osteria the title is simply its name
      this.playerEnteredOsteria$.pipe(map((player) => `${player.name}`)),
      // title shown when the Player enters the game
      this.myCurrentOpenGame_ShareReplay$.pipe(
        map((game) => {
          let title = `${this._playerName} - Game "${game.name}"`;
          title =
            title +
            (game.hands.length > 0
              ? ` - Hand ${game.hands.length}`
              : " not yet started");
          return title;
        })
      ),
      // title shown when the Observer enters the game
      this.myCurrentObservedGame_ShareReplay$.pipe(
        map((game) => {
          let title = `${this._playerName} - Observing Game "${game.name}"`;
          title =
            title +
            (game.hands.length > 0
              ? ` - Hand ${game.hands.length}`
              : " not yet started");
          return title;
        })
      ),
      // title shown to the Player when a new of an hand is received, i.e. after a card has been played
      this.handView_ShareReplay$.pipe(
        map((hv) => {
          return `${this._playerName} - Game "${hv.gameName}" - Hand ${hv.id} ("us" ${hv.ourCurrentGameScore} - "them" ${hv.theirCurrentGameScore})`;
        })
      ),
      // title shown to the Ibserver when a new of an hand is received, i.e. after a card has been played
      this.allHandViews_ShareReplay$.pipe(
        map((handViews) => {
          const hv = Object.values(handViews)[0];
          return `${this._playerName} - Observing "${hv.currentPlayerName}" playing Game "${hv.gameName}" - Hand ${hv.id} ("${hv.currentPlayerName} team" ${hv.ourCurrentGameScore} - "the other team" ${hv.theirCurrentGameScore})`;
        })
      )
    );
  }

  connect(url: string) {
    if (this.socket) {
      throw new Error(
        "WebSocket server already connected - use connect$ Observable to listen to connect notification"
      );
    }
    return openSocket(url).pipe(
      tap((socket) => {
        this.socket = socket;
      }),
      // manage errors that can be raised during connection
      catchError((err) => {
        console.error("Connection error to the server failed", err);
        switch (err.type) {
          case "error":
            throw ScoponeErrors.ConnectionError;
          case "close":
            throw ScoponeErrors.Closed;
          default:
            throw ScoponeErrors.GenericConnectionError;
        }
      }),
      tap((socket) => this._connect$.next(socket)),
      // the websocket is not returned since it is inteded to be private to this class
      map(() => null),
      share()
    );
  }

  private messages(socket: WebSocket): Observable<MessageFromServer> {
    return messages(socket).pipe(
      tap({
        // if the socket is closed not using the method 'close()' of this class, then it means that something upstream went wrong
        // in this case the source observable is anyways completed but we do have the variable 'this.closedByClient' set as false
        // therefore, if the source observable is completed but 'this.closedByClient' is false we want to signal an error
        complete: () => {
          if (!this.closedByClient) {
            throw new Error(
              "WebSocket connection closed - this is something unexpected"
            );
          }
        },
      }),
      mergeMap((msg) => {
        const _messages: MessageFromServer[] = msg.data
          .split("\n")
          .map((m: string) => JSON.parse(m));
        return from(_messages);
      })
    );
  }

  private send(msg: MessageToServer) {
    msg.send(this.socket);
  }

  // ====================================================================================================
  // From here we have the methods which represent the requests we can sent to the server
  public close() {
    this.closedByClient = true;
    this.socket.close();
    this.socket = null;
  }

  public playerEntersOsteria(playerName: string) {
    this._playerName = playerName;
    const playergntersMsg = new PlayerEntersOsteriaMessage(playerName);
    this.send(playergntersMsg);
  }

  public newGame(gameName: string) {
    const newGameMsg = new NewGame(gameName);
    this.send(newGameMsg);
  }

  public closeCurrentGame() {
    const closeGameMsg = new CloseGame(this._gameName);
    this.send(closeGameMsg);
  }

  public canPlayerJoinGame(game: Game) {
    return game.players.length ? Object.keys(game.players).length < 4 : true;
  }

  public addPlayerToGame(playerName: string, gameName: string) {
    this._playerName = playerName;
    this._gameName = gameName;
    const addPlayerMsg = new AddPlayerToGameMessage(playerName, gameName);
    this.send(addPlayerMsg);
  }

  public addObserverToGame(observerName: string, gameName: string) {
    this._playerName = observerName;
    this._gameName = gameName;
    const addPlayerMsg = new AddObserverToGameMessage(observerName, gameName);
    this.send(addPlayerMsg);
  }

  public newHand() {
    if (!this._gameName) {
      throw new Error("Game name not set");
    }
    const newHandMsg = new NewHand(this._gameName);
    this.send(newHandMsg);
  }

  // these 2 methods for playing a card are different because one allows to specify which are the cards to take
  // while the other automatically calculates which are the cards to take
  // thie first one is required since there may be cases when there is more than one combination of cards that can be take
  // (e.g the table has 4, Ace, 3, and 2 - the player plays a 5 - then the player needs to decide whether to take 4+Ace or 3+2)
  public playCardForPlayer(playerName: string, card: Card, cardsTaken: Card[]) {
    const playCardMsg = new PlayCardMessage(
      this._gameName,
      playerName,
      card,
      cardsTaken
    );
    this.send(playCardMsg);
  }
  // this method is used when there is just one or zero combinations of cards to take
  // in this case this method calculates automatically the cards to take
  public playCard(card: Card, table: Card[]) {
    const _cardsTakeable = this.cardsTakeable(card, table);
    if (_cardsTakeable.length === 1) {
      this.playCardForPlayer(this._playerName, card, _cardsTakeable[0]);
      return;
    }
    if (_cardsTakeable.length === 0) {
      this.playCardForPlayer(this._playerName, card, []);
      return;
    }
    if (_cardsTakeable.length > 1) {
      // we can not choose here which cards to take - it has to be managed outside - use the playCardForPlayer
      // to specify the precise set of cards to take in case there are more options
      throw new Error(`there are more than one choice of cards to take`);
    }
  }

  // ====================================================================================================
  // From here we have other utility functions that contain the logic that the clients can invoke
  //
  // cardsTakeable
  // return an array of arrays of cards where each array contained in the responce is one option for the player to choose from
  // If there is only one array contained in the array of response it means that player has no choice but one
  // If there are more than one array in the array returned than the player has to choose
  // If there are no elements in the array returned, it means that the card does not take any card from the table
  //
  // EX 1
  // If the table has 7-denari and the player plays 7-bastoni this is what happens
  // cardsTakeable(7-bastoni, [7-denari]) => [[7-denari]]
  // cardsTakeable(7-bastoni, [7-denari, 3-bastoni]) => [[7-denari]]
  //
  // EX 2
  // the player has to choose which card to take from the table
  // cardsTakeable(7-bastoni, [7-denari, 7-spade]) => [[7-denari], [7-spade]]
  //
  // EX 3
  // there is no card that can be taken from the table
  // cardsTakeable(7-bastoni, [3-denari, 5-spade]) => []
  //
  // EX 4
  // A card takes the sum of 2 or more cards
  // cardsTakeable(7-bastoni, [3-denari, 4-spade]) => [[3-denari, 4-spade]]
  // cardsTakeable(7-bastoni, [3-denari, 4-spade, 5-spade, 2-denari]) => [[3-denari, 4-spade], [5-spade, 2-denari]]
  //
  public cardsTakeable(cardPlayed: Card, table: Card[]) {
    const sameType = table.filter((c) => c.type === cardPlayed.type);
    if (sameType.length > 0) {
      return sameType.map((st) => [st]);
    }
    // https://stackoverflow.com/a/55298156/5699993
    return this.combinationsOfCards(table).filter(
      (subsetOfCards) =>
        subsetOfCards.reduce(this.add, 0) === TypeValues.get(cardPlayed.type)
    );
  }
  private add(sum: number, card: Card) {
    return sum + TypeValues.get(card.type);
  }
  combinationsOfCards(cards: Card[]) {
    return (
      new Array<Card[]>(2 ** cards.length)
        .fill(null)
        /* tslint:disable:no-bitwise */
        .map((_cs, i) => cards.filter((_c, j) => i & (2 ** j)))
    );
    /* tslint:enable:no-bitwise */
  }

  sortCardsByType(cards: Card[]) {
    return cards.sort(
      (a, b) => TypeValues.get(b.type) - TypeValues.get(a.type)
    );
  }
  groupCardsBySuit(cards: Card[]) {
    return cards.reduce((acc, card) => {
      if (!acc.get(card.suit)) {
        acc.set(card.suit, []);
      }
      acc.get(card.suit).push(card);
      return acc;
    }, new Map<Suits, Card[]>());
  }
  sortCardsBySuitAndType(cards: Card[]) {
    const sortedCards: Card[] = [];
    const suits = [...this.groupCardsBySuit(cards).keys()].sort();
    const cardsBySuit = this.groupCardsBySuit(cards);
    suits.forEach((s) =>
      sortedCards.push(...this.sortCardsByType(cardsBySuit.get(s)))
    );
    return sortedCards;
  }
}
