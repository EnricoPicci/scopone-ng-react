import { Card } from './card';
import { HandState } from './messages';

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
};

export type ScoreCard = {
  settebello: boolean;
  denari: Card[];
  primiera: any;
  carte: Card[];
  scope: Card[];
  napoli: Card[];
};
