import { FC } from "react";
import "./card.css";

import { Card, Suits, Types } from "../../rx-services/scopone-rx-service/card";

enum TyepsView {
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
  card: Card;
  clickHandler?: () => void;
}

export const CardComponent: FC<ICardProps> = (props) => {
  return (
    <div>
      <img
        // style={this.state.style}
        // height={this.state.height}
        className="playing-card"
        src={cardSvg(props.card.suit, props.card.type)}
        // alt={this.state.flipped === true ? 'Hidden Card' : PlayingCardsList[this.state.card]}
        alt={""}
        onClick={props.clickHandler}
      />
    </div>
  );
};

const cardSvg = (suit: Suits, type: Types) => {
  const t = TyepsView[type];
  const s = suitsMap.get(suit);
  const resourcePath = `/card-images/svg/${t}${s}.svg`;
  // https://create-react-app.dev/docs/using-the-public-folder#when-to-use-the-public-folder
  return process.env.PUBLIC_URL + resourcePath;
};
