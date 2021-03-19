import React, { FC } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@material-ui/core";
import { TerminateGameState } from "./hand-result";

export const TerminateDialogue: FC<TerminateGameState> = (props) => {
  return (
    <Dialog open={true}>
      <DialogTitle>{`Are you sure you want to terminate the game ?`}</DialogTitle>
      <DialogContent>
        <p>
          If the game is terminated, it will not be possible to resume it later.
        </p>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.handleTerminateGame} color="primary">
          OK
        </Button>
        <Button onClick={props.handleCancel} color="primary" autoFocus>
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};
