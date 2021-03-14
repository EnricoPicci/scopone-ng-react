export enum Suits {
  DENARI = "Denari",
  BASTONI = "Bastoni",
  SPADE = "Spade",
  COPPE = "Coppe",
}
export enum Types {
  ACE = "Ace",
  KING = "King",
  QUEEN = "Queen",
  JACK = "Jack",
  SEVEN = "Seven",
  SIX = "Six",
  FIVE = "Five",
  FOUR = "Four",
  THREE = "Three",
  TWO = "Two",
}

export const TypeValues = new Map<Types, number>([
  [Types.ACE, 1],
  [Types.TWO, 2],
  [Types.THREE, 3],
  [Types.FOUR, 4],
  [Types.FIVE, 5],
  [Types.SIX, 6],
  [Types.SEVEN, 7],
  [Types.JACK, 8],
  [Types.QUEEN, 9],
  [Types.KING, 10],
]);

export type Card = {
  suit: Suits;
  type: Types;
};
