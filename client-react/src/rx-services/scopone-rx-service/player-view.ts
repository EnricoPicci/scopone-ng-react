import { Card } from "./card";
import { HandState } from "./messages";

export type PlayerView = {
  id?: string;
  gameName?: string;
  playerCards?: Card[];
  table?: Card[];
  ourScope?: Card[];
  theirScope?: Card[];
  status?: HandState;
  firstPlayerName?: string;
  currentPlayerName?: string;
  ourFinalScore?: number;
  theirFinalScore?: number;
  ourScorecard?: ScoreCard;
  theirScorecard?: ScoreCard;
  ourCurrentGameScore?: number;
  theirCurrentGameScore?: number;
  history?: HandHistory;
};

export type ScoreCard = {
  settebello: boolean;
  denari: Card[];
  primiera: any;
  carte: Card[];
  scope: Card[];
  napoli: Card[];
};

export type HandHistory = {
  cardPlaySequence: CardPlay[];
  playerDecks: { [playersName: string]: Card[] };
};

export type CardPlay = {
  player: string;
  table: Card[];
  cardPlayed: Card;
  cardsTaken: Card[];
  playersDecks: { [playersName: string]: Card[] };
};
