import React, { useContext, useEffect, useState } from "react";

import { Switch, Route, useHistory } from "react-router-dom";

import { ServerContext } from "../../context/server-context";
import SignIn from "../sign-in/sign-in";
import { switchMap, tap } from "rxjs/operators";
import { merge } from "rxjs";
import { PlayerState } from "../../scopone-rx-service/messages";
import { Card, CardContent, CardHeader } from "@material-ui/core";

import "./game.css";
import { PickGame } from "../pick-game/pick-game";
import { Hand } from "../hand/hand";
import { HandResult } from "../hand-result/hand-result";
import { Error } from "../error/error";
import { title$ } from "../../streams-transformations/title";
import { ErrorContext } from "../../context/error-context";
import { ScoponeError } from "../../scopone-rx-service/scopone-errors";

const serverAddress = process.env.REACT_APP_SERVER_ADDRESS;

export function Game() {
  const server = useContext(ServerContext);
  const history = useHistory();

  const [title, setTitle] = useState("Scopone Table - sign in please");
  const [errorMsg, setErrorMsg] = useState<ScoponeError>();

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
            this.errorService.error = { message: errMsg };
            console.error(errMsg);
            this.router.navigate(["error"]);
        }
      })
    );

    // title$ sets the title as a side effect
    const _title$ = title$(server).pipe(tap((newTitle) => setTitle(newTitle)));

    const subscription = server
      .connect(serverAddress)
      .pipe(switchMap(() => merge(navigate$, _title$)))
      .subscribe({
        error: (err) => {
          // this.errorService.error = err;
          console.error("Error while communicating with the server", err);
          //this.router.navigate(["error"]);
        },
      });
    return () => {
      console.log("Unsubscribe Game subscription");
      subscription.unsubscribe();
    };
  }, [server, history]);

  const setError = (error: ScoponeError) => {
    setErrorMsg(error);
  };

  return (
    <ErrorContext.Provider
      value={{ value: errorMsg, setErrorContextValue: setError }}
    >
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
          <CardHeader title={errorMsg.message} className="error"></CardHeader>
        </Card>
      )}
    </ErrorContext.Provider>
  );
}
