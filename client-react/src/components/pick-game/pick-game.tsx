import React, { FC, useContext, useEffect } from "react";

import { useHistory } from "react-router-dom";
import { tap } from "rxjs/operators";
import { ErrorContext } from "../../context/error-context";

import { ServerContext } from "../../context/server-context";
import { GameState } from "../../rx-services/scopone-rx-service/messages";
import { myCurrentOpenGame$ } from "../../rx-services/streams-transformations/my-current-open-game";
import { GameList } from "../game-list/game-list";
import { NewGame } from "../new-game/new-game";

export const PickGame: FC = () => {
  const server = useContext(ServerContext);
  const errorService = useContext(ErrorContext);

  const history = useHistory();

  useEffect(() => {
    console.log("=======>>>>>>>>>>>>  Use Effect run in PickGame");

    // navigate$ Observable manages navigation as a side effect when a Game is picked
    const navigate$ = myCurrentOpenGame$(server).pipe(
      tap((game) => {
        errorService.setError(null);
        game.state === GameState.GameClosed
          ? history.push("/hand")
          : history.push("/hand-result");
      })
    );

    const subscription = navigate$.subscribe();

    return () => {
      console.log("Unsubscribe PickGame subscription");
      subscription.unsubscribe();
    };
  }, [server, errorService, history]);

  return (
    <>
      <NewGame></NewGame>
      <GameList></GameList>
    </>
  );
};
