import { Hand } from "./hand";
import { Team } from "./team";
import { Player } from "./player";

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
