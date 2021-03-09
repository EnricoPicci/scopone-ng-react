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

const serverAddress = process.env.REACT_APP_SERVER_ADDRESS;

export const Game: FC = () => {
  const server = useContext(ServerContext);
  const errorService = useContext(ErrorContext);

  const [errorMsg, setErrorMsg] = useState(null);

  const history = useHistory();

  const [title, setTitle] = useState("Scopone Table - sign in please");

  useEffect(() => {
    console.log("=======>>>>>>>>>>>>  Use Effect run in Game");
    // navigate$ Observable manages navigation as a side effect when a Player successfully enters the osteria
    const navigate$ = server.playerEnteredOsteria$.pipe(
      tap((player) => {
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

    // error$ sets the errorMsg state variable as a side effect
    const error$ = errorService.error$.pipe(
      tap((errMsg) => setErrorMsg(errMsg))
    );

    // title$ sets the title as a side effect
    const _title$ = title$(server).pipe(tap((newTitle) => setTitle(newTitle)));

    const subscription = server
      .connect(serverAddress)
      .pipe(switchMap(() => merge(navigate$, error$, _title$)))
      .subscribe({
        error: (err) => {
          console.log("Error while communicating with the server", err);
          setErrorMsg(err.message);
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
        <CardHeader title={title} className="header"></CardHeader>
        <CardContent>
          <Switch>
            <Route path="/" component={SignIn} exact />
            <Route path="/pick-game" component={PickGame} />
            <Route path="/hand" component={Hand} />
            <Route path="/hand-result" component={HandResult} />
            <Route component={Error} />
          </Switch>
        </CardContent>
      </Card>
      {errorMsg && (
        <Card className="root" variant="outlined">
          <CardHeader title={errorMsg} className="error"></CardHeader>
        </Card>
      )}
    </>
  );
};
