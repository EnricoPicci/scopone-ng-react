export enum Suits {
  DENARI = 'Denari',
  BASTONI = 'Bastoni',
  SPADE = 'Spade',
  COPPE = 'Coppe',
}
export enum Types {
  ACE = 'Ace',
  KING = 'King',
  QUEEN = 'Queen',
  JACK = 'Jack',
  SEVEN = 'Seven',
  SIX = 'Six',
  FIVE = 'Five',
  FOUR = 'Four',
  THREE = 'Three',
  TWO = 'Two',
}
export const TypeValues = new Map<Types, number>();
TypeValues[Types.ACE] = 1;
TypeValues[Types.TWO] = 2;
TypeValues[Types.THREE] = 3;
TypeValues[Types.FOUR] = 4;
TypeValues[Types.FIVE] = 5;
TypeValues[Types.SIX] = 6;
TypeValues[Types.SEVEN] = 7;
TypeValues[Types.JACK] = 8;
TypeValues[Types.QUEEN] = 9;
TypeValues[Types.KING] = 10;

export type Card = {
  suit: Suits;
  type: Types;
};
