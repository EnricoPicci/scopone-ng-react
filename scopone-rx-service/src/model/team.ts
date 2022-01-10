import { Card } from "./card";
import { Player } from "./player";

export type Team = {
  Players: Player[];
  TakenCards: Card[];
  ScopeDiScopone: Card[];
};
