import React, { FC } from "react";
import { Button, Dialog, DialogContent } from "@material-ui/core";
import { Card } from "../../rx-services/scopone-rx-service/card";
import { Cards } from "../cards/cards";

interface ICardsPickerProps {
  open: boolean;
  takeableCards: Card[][];
  clickHandler: (cards: Card[]) => void;
}

export const CardsPicker: FC<ICardsPickerProps> = ({
  open,
  takeableCards,
  clickHandler,
}) => {
  const handleClick = (i: number) => {
    clickHandler(takeableCards[i]);
  };

  return (
    <Dialog open={open}>
      <DialogContent>
        {takeableCards.map((cards, i) => (
          <React.Fragment key={i}>
            <Cards
              cards={cards}
              layout="spread-left"
              style={{ display: "inline-block" }}
            ></Cards>
            <Button
              onClick={() => handleClick(i)}
              color="primary"
              autoFocus
              style={{ marginBottom: "10%" }}
            >
              Pick me
            </Button>
          </React.Fragment>
        ))}
      </DialogContent>
    </Dialog>
  );
};
