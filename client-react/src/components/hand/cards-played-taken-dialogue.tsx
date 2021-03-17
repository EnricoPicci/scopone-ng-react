import React, { FC } from "react";
import { Dialog, DialogContent } from "@material-ui/core";
import { Cards } from "../cards/cards";
import { CardsPlayedTakenReactState } from "./hand";

export const CardsPlayedTaken: FC<CardsPlayedTakenReactState> = (props) => {
  return (
    <Dialog open={true}>
      <DialogContent>
        <Cards
          cards={[props.cardPlayed]}
          name={`Card played by ${props.cardPlayedByPlayer}`}
          layout="spread-left"
        ></Cards>
        {props.cardsTaken?.length > 0 && (
          <Cards
            cards={props.cardsTaken}
            name={`Cards taken`}
            layout="spread-left"
          ></Cards>
        )}
        {props.finalTableTake?.Cards?.length > 0 && (
          <Cards
            cards={props.finalTableTake.Cards}
            name={props.tableTakenBy}
            layout="spread-left"
          ></Cards>
        )}
      </DialogContent>
    </Dialog>
  );
};
