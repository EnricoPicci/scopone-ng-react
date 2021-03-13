import { FC, useState } from "react";
import { Card as PalyingCard } from "../../rx-services/scopone-rx-service/card";
import { Card } from "../card/card";

interface ICardsProps {
  name: string;
  cards: PalyingCard[];
  enabled?: boolean;
}

export type Layout = "stack" | "spread" | "fan";

const calculateCardSize = (length: number, layout: Layout = "spread") => {
  let cardSize = window.innerWidth / length;
  return layout !== "spread" || cardSize > 100 ? 100 : cardSize;
};

export const Cards: FC<ICardsProps> = ({ name, cards, enabled = false }) => {
  const [layout, setLayout] = useState<Layout>("spread");

  // Variables which are not considered as state since their values depend only on the layout state variable value
  const _cardSize = calculateCardSize(cards.length, layout);
  let _initialOver: number;
  let _over: number;
  let _styleType: (
    i: number
  ) => {
    zIndex: number;
    transform: string;
  };

  const resetSpread = () => {
    _initialOver = 110 * (cards.length - 1);
    _over = _initialOver / 2;
  };
  const spreadStyle = (i: number) => {
    if (i > 0) {
      _over -= _initialOver / (cards.length - 1);
    }
    return {
      zIndex: i,
      transform: `translateX(${-50 + _over * -1}%)`,
    };
  };

  if (layout === "fan") {
    console.error("yet to be implememted");
    // throw new Error("yet to be implememted");
    // resetFanning();
    // fanStyle();
  } else if (layout === "spread") {
    resetSpread();
    _styleType = spreadStyle;
  } else if (layout === "stack") {
    console.error("yet to be implememted");
    // throw new Error("yet to be implememted");
    // resetStack();
    // styleType = this.stackStyle;
  }

  console.log("=========>>>>>>>>>>>>>  Cards Render");
  return (
    <div
      className="cards"
      style={{ height: layout === "stack" ? _cardSize : _cardSize * 2 }}
    >
      {cards.map((card, i) => (
        <Card
          card={card}
          key={card.suit + card.type}
          height={_cardSize.toString()}
          style={_styleType(i)}
        ></Card>
      ))}
    </div>
  );
};
