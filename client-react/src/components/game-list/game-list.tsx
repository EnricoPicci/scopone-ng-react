import { List, ListItem, ListItemText } from "@material-ui/core";
import React, { useContext, useEffect, useState } from "react";
import { combineLatest } from "rxjs";
import { map } from "rxjs/operators";
import { ServerContext } from "../../context/server-context";
import { Game } from "../../scopone-rx-service/messages";

type GameForList = Game & { canBeObservedOnly: boolean };

export const GameList = () => {
  const [games, setGames] = useState<Array<GameForList>>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>();
  const server = useContext(ServerContext);

  useEffect(() => {
    console.log(
      "=======<<<<<<<<<<<<<<<>>>>>>>>>>>>  Use Effect run in GameList"
    );
    const subscription = combineLatest([
      server.gamesNotYetStarted$,
      server.gamesWhichCanBeObserved$,
    ])
      .pipe(
        map(([gNotStarted, gObservable]) => {
          const gamesNotStarted = gNotStarted.map(
            (g) => ({ ...g, canBeObservedOnly: false } as GameForList)
          );
          const gamesObservable = gObservable.map(
            (g) => ({ ...g, canBeObservedOnly: true } as GameForList)
          );
          return [...gamesNotStarted, ...gamesObservable];
        })
      )
      .subscribe({
        next: setGames,
      });
    return () => subscription.unsubscribe();
  }, [server]);

  const gameName = (game: GameForList) => {
    return game.canBeObservedOnly ? `${game.name} (as an Observer)` : game.name;
  };

  const handleListItemClick = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
    index: number
  ) => {
    setSelectedIndex(index);
  };

  return (
    <div className="root">
      <List component="nav">
        {games.map((game, i) => (
          <ListItem
            // className={game.canBeObservedOnly ? "observableOnly" : ""}
            key={game.name}
            button
            selected={selectedIndex === i}
            onClick={(event) => handleListItemClick(event, i)}
          >
            <ListItemText
              primary={gameName(game)}
              className="observableOnly"
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
  );
};
