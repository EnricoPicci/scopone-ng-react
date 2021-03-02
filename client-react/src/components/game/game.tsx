import React, { useContext, useEffect, useState } from "react";

import { ServerContext } from "../../context/top-level-context";
import SignIn from "../sign-in/sign-in";
import { map, switchMap, tap } from "rxjs/operators";
import { merge } from "rxjs";
import { PlayerState } from "../../scopone-rx-service/messages";
import { Card, CardContent, CardHeader } from "@material-ui/core";

import "./game.css";

const serverAddress = process.env.REACT_APP_SERVER_ADDRESS;

export function Game() {
  const server = useContext(ServerContext);

  const [title, setTitle] = useState("Scopone Table - sign in please");

  // navigate$ Observable manages navigation as a side effect when a Player successfully enters the osteria
  const navigate$ = server.playerEnteredOsteria$.pipe(
    tap((player) => {
      switch (player.status) {
        case PlayerState.playerNotPlaying:
          console.log("Navigate to pick-game");
          break;
        case PlayerState.playerPlaying:
          console.log("Navigate to hand");
          break;
        case PlayerState.playerObservingGames:
          console.log("Navigate to hand");
          break;
        case PlayerState.playerLookingAtHandResult:
          console.log("Navigate to hand-result");
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
  const title$ = merge(
    // when the Player enters the Osteria the title is simply its name
    server.playerEnteredOsteria$.pipe(map((player) => `${player.name}`))
  ).pipe(tap((newTitle) => setTitle(newTitle)));

  useEffect(() => {
    const subscription = server
      .connect(serverAddress)
      .pipe(switchMap(() => merge(navigate$, title$)))
      .subscribe({
        error: (err) => {
          this.errorService.error = err;
          console.error("Error while communicating with the server", err);
          this.router.navigate(["error"]);
        },
      });
    return () => {
      console.log("Unsubscribe Game subscription");
      subscription.unsubscribe();
    };
  }, []);

  return (
    <Card className="root" variant="outlined">
      <CardHeader title={title} className="header"></CardHeader>
      <CardContent>
        <SignIn />
      </CardContent>
    </Card>
  );
}
