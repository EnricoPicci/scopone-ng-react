import React, { useContext } from "react";

import { TopLevelContext } from "../../context/top-level-context";
import SignIn from "../sign-in/sign-in";
import { switchMap, tap } from "rxjs/operators";
import { merge } from "rxjs";
import { PlayerState } from "../../scopone-rx-service/messages";

const serverAddress = process.env.REACT_APP_SERVER_ADDRESS;

export function Game() {
  const server = useContext(TopLevelContext);

  // this Observable notifies when a Player successfully enters the osteria
  const playerEntersOsteria$ = server.playerEnteredOsteria$.pipe(
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

  server
    .connect(serverAddress)
    .pipe(switchMap(() => merge(playerEntersOsteria$)))
    .subscribe({
      error: (err) => {
        this.errorService.error = err;
        console.error("Error while communicating with the server", err);
        this.router.navigate(["error"]);
      },
    });

  return <SignIn />;
}
