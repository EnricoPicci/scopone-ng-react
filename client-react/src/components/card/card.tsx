import { FC } from "react";
import "./card.css";

import {
  Card as PlayingCard,
  Suits,
  Types,
} from "../../rx-services/scopone-rx-service/card";

enum TypesView {
  Ace = "1",
  King = "k",
  Queen = "q",
  Jack = "j",
  Seven = "7",
  Six = "6",
  Five = "5",
  Four = "4",
  Three = "3",
  Two = "2",
}
const suitsMap = new Map<Suits, string>();
suitsMap.set(Suits.BASTONI, "c");
suitsMap.set(Suits.COPPE, "h");
suitsMap.set(Suits.DENARI, "d");
suitsMap.set(Suits.SPADE, "s");

interface ICardProps {
  card: PlayingCard;
  style?: any;
  height: string;
  clickHandler?: (card: any) => void;
}

export const Card: FC<ICardProps> = (props) => {
  const cardSvg = (suit: Suits, type: Types) => {
    const t = TypesView[type];
    const s = suitsMap.get(suit);
    const resourcePath = `/card-images/svg/${t}${s}.svg`;
    // https://create-react-app.dev/docs/using-the-public-folder#when-to-use-the-public-folder
    return process.env.PUBLIC_URL + resourcePath;
  };

  return (
    <img
      style={props.style}
      height={props.height}
      className="playing-card"
      src={cardSvg(props.card.suit, props.card.type)}
      alt={`${props.card.type} ${props.card.suit}`}
      onClick={() => props.clickHandler(props.card)}
    />
  );
};
