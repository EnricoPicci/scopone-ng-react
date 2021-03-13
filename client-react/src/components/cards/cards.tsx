import { Card, CardContent, CardHeader } from "@material-ui/core";
import React, { FC, useState } from "react";
import { Card as CardObj } from "../../rx-services/scopone-rx-service/card";
import { Card as PlayingCard } from "../card/card";

import "./cards.css";
import "../style.css";

interface ICardsProps {
  name: string;
  cards: CardObj[];
  enabled?: boolean;
  initialLayout?: Layout;
}

export type Layout = "spread" | "fan";

const calculateCardSize = (length: number, layout: Layout) => {
  let cardSize = window.innerWidth / length;
  return layout !== "spread" || cardSize > 100 ? 100 : cardSize;
};

export const Cards: FC<ICardsProps> = ({
  name,
  cards,
  enabled = false,
  initialLayout = "spread",
}) => {
  const [layout, setLayout] = useState<Layout>(initialLayout);

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
  let _curl: number;
  let _deg: number;
  let _degs: number;
  let _initialDown: number;
  let _down: number;

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

  const resetFanning = () => {
    _curl = Math.pow(cards.length, 1.3) * 10; //curl of cards in hand
    _deg = cards.length > 1 ? -cards.length * 15 : 0;
    _degs = _deg / 2;
    _initialDown = cards.length * 7;
    _down = _initialDown / 2;
    _initialOver = _curl;
    _over = _initialOver / 2;
  };
  const fanStyle = (i: number) => {
    let overHalf = i > (cards.length - 1) / 2;
    if (i > 0) {
      _degs -= _deg / (cards.length - 1);
      _down -= _initialDown / (cards.length - 1);
      _over -= _initialOver / (cards.length - 1);
    }
    return {
      zIndex: i,
      transform: `translateY(${overHalf ? -_down : _down}%) 
      translateX(${-50 + _over * -1}%) 
      rotate(${_degs}deg)`,
    };
  };

  if (layout === "fan") {
    resetFanning();
    _styleType = fanStyle;
  } else if (layout === "spread") {
    resetSpread();
    _styleType = spreadStyle;
  }

  return (
    <Card>
      {/* https://material-ui.com/customization/components/#overriding-styles-with-global-class-names */}
      {/* https://material-ui.com/customization/components/#overriding-styles-with-class-names */}
      <CardHeader title={name} className="header"></CardHeader>
      <CardContent>
        <div className="cards" style={{ height: _cardSize * 2 }}>
          {cards.map((card, i) => (
            <PlayingCard
              card={card}
              key={card.suit + card.type}
              height={_cardSize.toString()}
              style={_styleType(i)}
            ></PlayingCard>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
