import { Card, CardContent, CardHeader } from "@material-ui/core";
import React, { FC } from "react";
import { Card as CardObj } from "../../../../scopone-rx-service/src/model/card";
import { Card as PlayingCard } from "../card/card";

import "./cards.css";
import "../style.css";

interface ICardsProps {
  name?: string;
  cards: CardObj[];
  enabled?: boolean;
  layout?: Layout;
  cardClickHandler?: (card: CardObj) => void;
  style?: React.CSSProperties;
}

export type Layout = "spread" | "fan" | "spread-left";

const calculateCardSize = (length: number, layout: Layout) => {
  let cardSize = window.innerWidth / length;
  return layout !== "spread" || cardSize > 100 ? 100 : cardSize;
};

export const Cards: FC<ICardsProps> = ({
  name,
  cards,
  enabled = false,
  layout = "spread",
  cardClickHandler,
  style,
}) => {
  // Variables which are not considered as state since their values depend only on the layout state variable value
  const _cardSize = calculateCardSize(cards.length, layout);
  let _initialOver: number;
  let _over: number;
  let _styleType: (i: number) => {
    zIndex: number;
    transform?: string;
  };
  let _curl: number;
  let _deg: number;
  let _degs: number;
  let _initialDown: number;
  let _down: number;
  let _canPlayCard = true;

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
  const spreadStyleLeft = (i: number) => {
    return {
      zIndex: i,
      marginLeft: "30px",
      position: "static",
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
  } else if (layout === "spread-left") {
    _styleType = spreadStyleLeft;
  }

  const clickHandler = (card: CardObj) => {
    if (enabled && _canPlayCard) {
      _canPlayCard = false;
      cardClickHandler(card);
    }
  };

  const _divStyle = () => {
    let _style: React.CSSProperties =
      layout === "fan"
        ? {
            height: _cardSize * 2,
          }
        : {};
    _style =
      layout === "spread-left" ? { ..._style, textAlign: "left" } : _style;
    return _style;
  };
  return (
    <Card style={style}>
      {/* https://material-ui.com/customization/components/#overriding-styles-with-global-class-names */}
      {/* https://material-ui.com/customization/components/#overriding-styles-with-class-names */}
      {/*  */}
      {/* Do not render the header if there is no title to reduce the heigth of the component */}
      {name?.length > 0 && (
        <CardHeader title={name} className="header"></CardHeader>
      )}
      <CardContent>
        <div className="cards" style={_divStyle()}>
          {cards.map((card, i) => (
            <PlayingCard
              card={card}
              key={card.suit + card.type}
              height={_cardSize.toString()}
              style={_styleType(i)}
              clickHandler={clickHandler}
            ></PlayingCard>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
