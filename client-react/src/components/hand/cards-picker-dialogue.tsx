import React, { FC } from "react";
import { Button, Dialog, DialogContent } from "@material-ui/core";
import { Cards } from "../cards/cards";
import { CardsTakeableReactState } from "./hand";

export const CardsPicker: FC<CardsTakeableReactState> = (props) => {
  const handleClick = (i: number) => {
    props.cardsTakeableClickHandler(props.cardsTakeable[i]);
  };

  return (
    <Dialog open={true}>
      <DialogContent>
        {props.cardsTakeable.map((cards, i) => (
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
