import { Card } from "./card";
import { PlayerView } from "./player-view";

export enum MessageToServerIds {
  PLAYER_ENTERS_OSTERIA = "playerEntersOsteria",
  NEW_GAME = "newGame",
  ADD_PLAYER_TO_GAME = "addPlayerToGame",
  ADD_OBSERVER_TO_GAME = "addObserverToGame",
  NEW_HAND = "newHand",
  PLAY_CARD = "playCard",
  CLOSE_GAME = "closeGame",
}

export abstract class MessageToServer {
  id: MessageToServerIds;
  tsSent: Date;
  // these are the data that can be sent to the server
  // which data is sent depends on the type of message
  playerName: string;
  gameName: string;
  cardPlayed: Card;
  cardsTaken: Card[];

  send(conn: WebSocket) {
    this.tsSent = new Date();
    const msg = JSON.stringify(this);
    conn.send(msg);
  }
}

export class PlayerEntersOsteriaMessage extends MessageToServer {
  constructor(name: string) {
    super();
    this.id = MessageToServerIds.PLAYER_ENTERS_OSTERIA;
    this.playerName = name;
  }
}

export class NewGame extends MessageToServer {
  constructor(gameName: string) {
    super();
    this.id = MessageToServerIds.NEW_GAME;
    this.gameName = gameName;
  }
}

export class AddPlayerToGameMessage extends MessageToServer {
  constructor(playerName: string, gameName: string) {
    super();
    this.id = MessageToServerIds.ADD_PLAYER_TO_GAME;
    this.playerName = playerName;
    this.gameName = gameName;
  }
}

export class AddObserverToGameMessage extends MessageToServer {
  constructor(observerName: string, gameName: string) {
    super();
    this.id = MessageToServerIds.ADD_OBSERVER_TO_GAME;
    this.playerName = observerName;
    this.gameName = gameName;
  }
}

export class NewHand extends MessageToServer {
  constructor(gameName: string) {
    super();
    this.id = MessageToServerIds.NEW_HAND;
    this.gameName = gameName;
  }
}

export class PlayCardMessage extends MessageToServer {
  constructor(
    gameName: string,
    playerName: string,
    card: Card,
    cardsTaken: Card[]
  ) {
    super();
    this.id = MessageToServerIds.PLAY_CARD;
    this.playerName = playerName;
    this.cardPlayed = card;
    this.cardsTaken = cardsTaken;
    this.gameName = gameName;
  }
}

export class CloseGame extends MessageToServer {
  constructor(gameName: string) {
    super();
    this.id = MessageToServerIds.CLOSE_GAME;
    this.gameName = gameName;
  }
}

export enum MessageFromServerIds {
  Players = "Players",
  PlayerAdded = "PlayerAdded",
  playerLeffMsgID = "PlayerLeftOsteria",
  PlayerIsAlreadyInOsteria = "PlayerIsAlreadyInOsteria",
  Games = "Games",
  ErrorAddingPlayerToGame = "ErrorAddingPlayerToGame",
  GameWithSameNamePresent = "GameWithSameNamePresent",
  CardsPlayedAndTaken = "CardsPlayedAndTaken",

  TeamsFormed = "TeamsFormed",
  NewHandReady = "NewHandReady",
  HandView = "HandView",
}

export type MessageFromServer = {
  receiver?: string;
  id: MessageFromServerIds;
  tsSent?: string;
  playerName?: string;
  players?: Player[];
  games?: Game[];
  teams?: string[][];
  handPlayerView?: PlayerView;
  allHandPlayerViews?: PlayerView[];
  error?: string;
  gameName?: string;
  cardPlayed?: Card;
  cardsTaken?: Card[];
  cardPlayedByPlayer?: string;
  finalTableTake?: {
    Cards: Card[];
    TeamTakingTable: [Player, Player];
  };
};

export type Game = {
  name: string;
  teams: [Team, Team];
  players: { [name: string]: Player };
  observers: { [name: string]: Player };
  hands: Hand[];
  state: GameState;
  closedBy: string;
};

export type GameForList = Game & { canBeObservedOnly: boolean };

export enum GameState {
  GameCreated = "created",
  TeamsForming = "teamsForming",
  GameOpen = "open",
  GameSuspended = "suspended",
  GameClosed = "closed",
}

export type Player = {
  name: string;
  status: PlayerState;
};

export enum PlayerState {
  playerPlaying = "playing",
  playerLookingAtHandResult = "lookingAtHandResult",
  playerNotPlaying = "notPlayingAnyGame",
  playerLeftTheGame = "leftOsteriaMaybeMomentarely",
  playerObservingGames = "observingGames",
}

export type Team = {
  Players: Player[];
  TakenCards: Card[];
  ScopeDiScopone: Card[];
};

export type Hand = {
  state: HandState;
};

export enum HandState {
  active = "active",
  closed = "closed",
}
