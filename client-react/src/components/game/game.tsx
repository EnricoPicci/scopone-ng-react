import React, { FC, useContext, useEffect, useState } from "react";

import { Switch, Route, useHistory } from "react-router-dom";

import { ServerContext } from "../../context/server-context";
import { SignIn } from "../sign-in/sign-in";
import { switchMap, tap } from "rxjs/operators";
import { merge } from "rxjs";
import { PlayerState } from "../../rx-services/scopone-rx-service/messages";
import { Card, CardContent, CardHeader } from "@material-ui/core";

import "./game.css";
import { PickGame } from "../pick-game/pick-game";
import { Hand } from "../hand/hand";
import { HandResult } from "../hand-result/hand-result";
import { Error } from "../error/error";
import { title$ } from "../../rx-services/streams-transformations/title";
import { ErrorContext } from "../../context/error-context";
import { Bye } from "../bye/bye";

const serverAddress = process.env.REACT_APP_SERVER_ADDRESS;

// we define a type for the state so that we can issue a single call to the update state function and
// avoid so multiple execution of the render function
// https://stackoverflow.com/questions/53574614/multiple-calls-to-state-updater-from-usestate-in-component-causes-multiple-re-re
type GameReactState = {
  title: string;
  errorMsg?: string;
};

export const Game: FC = () => {
  const server = useContext(ServerContext);
  const errorService = useContext(ErrorContext);

  const [gameReactState, setGameReactState] = useState<GameReactState>({
    title: "Scopone Table - sign in please",
  });

  const history = useHistory();

  useEffect(() => {
    console.log("=======>>>>>>>>>>>>  Use Effect run in Game");
    // navigate$ Observable manages navigation as a side effect when a Player successfully enters the osteria
    const navigate$ = server.playerEnteredOsteria$.pipe(
      tap((player) => {
        setGameReactState((prevState) => ({ ...prevState, errorMsg: null }));
        switch (player.status) {
          case PlayerState.playerNotPlaying:
            history.push("/pick-game");
            break;
          case PlayerState.playerPlaying:
            history.push("/hand");
            break;
          case PlayerState.playerObservingGames:
            history.push("/hand");
            break;
          case PlayerState.playerLookingAtHandResult:
            history.push("/hand-result");
            break;
          default:
            const errMsg = `State "${player.status}" is not expected - look at the console for more details`;
            console.error(errMsg);
        }
      })
    );

    //
    const gameClosed$ = server.myCurrentGameClosed$.pipe(
      tap(() => history.push("/bye"))
    );

    // error$ sets the errorMsg state variable as a side effect
    const error$ = errorService.error$.pipe(
      tap((errorMsg) =>
        setGameReactState((prevState) => ({ ...prevState, errorMsg }))
      )
    );

    // title$ sets the title as a side effect
    const _title$ = title$(server).pipe(
      tap((newTitle) =>
        setGameReactState((prevState) => ({ ...prevState, title: newTitle }))
      )
    );

    const subscription = server
      .connect(serverAddress)
      .pipe(switchMap(() => merge(navigate$, gameClosed$, error$, _title$)))
      .subscribe({
        error: (err) => {
          console.log("Error while communicating with the server", err);
          setGameReactState((prevState) => ({
            ...prevState,
            errorMsg: err.message,
          }));
        },
      });
    return () => {
      console.log("Unsubscribe Game subscription");
      subscription.unsubscribe();
    };
  }, [server, errorService, history]);

  return (
    <>
      <Card className="root" variant="outlined">
        <CardHeader
          title={gameReactState.title}
          className="header"
        ></CardHeader>
        <CardContent>
          <Switch>
            <Route path="/" component={SignIn} exact />
            <Route path="/pick-game" component={PickGame} />
            <Route path="/hand" component={Hand} />
            <Route path="/hand-result" component={HandResult} />
            <Route path="/bye" component={Bye} />
            <Route component={Error} />
          </Switch>
        </CardContent>
      </Card>
      {gameReactState.errorMsg && (
        <Card className="root" variant="outlined">
          <CardHeader
            title={gameReactState.errorMsg}
            className="error"
          ></CardHeader>
        </Card>
      )}
    </>
  );
};
