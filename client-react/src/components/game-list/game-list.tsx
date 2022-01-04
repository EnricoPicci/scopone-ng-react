import {
  Button,
  Dialog,
  DialogActions,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
} from "@material-ui/core";

import React, { FC, useContext, useEffect, useState } from "react";
import { ServerContext } from "../../context/server-context";
import { Game } from "../../../../scopone-rx-service/src/messages";
import { tap } from "rxjs/operators";

type GameForList = Game & { canBeObservedOnly: boolean };

// we define a type for the state so that we can issue a single call to the update state function and
// avoid so multiple execution of the render function
// https://stackoverflow.com/questions/53574614/multiple-calls-to-state-updater-from-usestate-in-component-causes-multiple-re-re
type GameListReactState = {
  games: Array<GameForList>;
  selectedGame?: GameForList;
  openConfirmationDialogue: boolean;
};

export const GameList: FC = () => {
  const [gameListReactState, setGameListReactState] =
    useState<GameListReactState>({
      games: [],
      openConfirmationDialogue: false,
    });

  const server = useContext(ServerContext);

  useEffect(() => {
    console.log(
      "=======<<<<<<<<<<<<<<<>>>>>>>>>>>>  Use Effect run in GameList"
    );

    const subscription = server.gameList$
      .pipe(
        tap({
          next: (games) =>
            setGameListReactState((prevState) => ({ ...prevState, games })),
        })
      )
      .subscribe();

    return () => {
      console.log("Unsubscribe GameList subscription");
      subscription.unsubscribe();
    };
  }, [server]);

  const gameName = (game: GameForList) => {
    return game.canBeObservedOnly ? `${game.name} (as an Observer)` : game.name;
  };

  const handleSelect = (selectedGame: GameForList) => {
    setGameListReactState((prevState) => ({
      ...prevState,
      selectedGame,
      openConfirmationDialogue: true,
    }));
  };

  const handleConfirm = () => {
    const selectedGame = gameListReactState.selectedGame;
    selectedGame.canBeObservedOnly
      ? server.addObserverToGame(server.playerName, selectedGame.name)
      : server.addPlayerToGame(server.playerName, selectedGame.name);
    handleDialogueClose();
  };
  const handleDialogueClose = () => {
    setGameListReactState((prevState) => ({
      ...prevState,
      openConfirmationDialogue: false,
    }));
  };

  return (
    <>
      <div className="root">
        <List component="nav">
          {gameListReactState.games.map((game, i) => (
            <ListItem
              key={game.name}
              button
              onClick={(event) => handleSelect(game)}
            >
              <ListItemText
                primary={gameName(game)}
                primaryTypographyProps={
                  game.canBeObservedOnly
                    ? {
                        style: {
                          color: "red",
                        },
                      }
                    : {}
                }
              />
            </ListItem>
          ))}
        </List>
      </div>
      <Dialog
        open={gameListReactState.openConfirmationDialogue}
        onClose={handleDialogueClose}
      >
        <DialogTitle>{`Confirm to join ${
          gameListReactState.selectedGame
            ? gameListReactState.selectedGame.name
            : ""
        }?`}</DialogTitle>
        <DialogActions>
          <Button onClick={handleConfirm} color="primary">
            OK
          </Button>
          <Button onClick={handleDialogueClose} color="primary" autoFocus>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
