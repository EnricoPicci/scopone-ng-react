import {
  Button,
  Dialog,
  DialogActions,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
} from "@material-ui/core";

import React, { useContext, useEffect, useState } from "react";
import { ServerContext } from "../../context/server-context";
import { Game } from "../../scopone-rx-service/messages";
import { gameList$ } from "../../streams-transformations/game-list";

type GameForList = Game & { canBeObservedOnly: boolean };

export const GameList = () => {
  const [games, setGames] = useState<Array<GameForList>>([]);
  const [selectedGame, setSelectedGame] = useState<GameForList>();
  const [
    openConfirmationDialogue,
    setOpenConfirmationDialogue,
  ] = React.useState(false);

  const server = useContext(ServerContext);

  useEffect(() => {
    console.log(
      "=======<<<<<<<<<<<<<<<>>>>>>>>>>>>  Use Effect run in GameList"
    );

    const subscription = gameList$(server).subscribe(setGames);

    return () => subscription.unsubscribe();
  }, [server]);

  const gameName = (game: GameForList) => {
    return game.canBeObservedOnly ? `${game.name} (as an Observer)` : game.name;
  };

  const handleSelect = (game: GameForList) => {
    setSelectedGame(game);
    setOpenConfirmationDialogue(true);
  };

  const handleConfirm = () => {
    server.addPlayerToGame(server.playerName, selectedGame.name);
    handleDialogueClose();
  };
  const handleDialogueClose = () => {
    setOpenConfirmationDialogue(false);
  };

  return (
    <>
      <div className="root">
        <List component="nav">
          {games.map((game, i) => (
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
      <Dialog open={openConfirmationDialogue} onClose={handleDialogueClose}>
        <DialogTitle>{`Confirm to join ${handleSelect.name}?`}</DialogTitle>
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
