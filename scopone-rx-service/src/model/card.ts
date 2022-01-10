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
export const TypeValues = new Map<Types, number>();
TypeValues.set(Types.ACE, 1);
TypeValues.set(Types.TWO, 2);
TypeValues.set(Types.THREE, 3);
TypeValues.set(Types.FOUR, 4);
TypeValues.set(Types.FIVE, 5);
TypeValues.set(Types.SIX, 6);
TypeValues.set(Types.SEVEN, 7);
TypeValues.set(Types.JACK, 8);
TypeValues.set(Types.QUEEN, 9);
TypeValues.set(Types.KING, 10);

export type Card = {
  suit: Suits;
  type: Types;
};
