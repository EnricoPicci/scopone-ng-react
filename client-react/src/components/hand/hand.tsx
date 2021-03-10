import React, { FC, useContext, useEffect, useState } from "react";
import { merge } from "rxjs";
import { tap } from "rxjs/operators";
import { ServerContext } from "../../context/server-context";
import { HandState, Team } from "../../rx-services/scopone-rx-service/messages";
import { Table } from "../table/table";

export const Hand: FC = () => {
  const server = useContext(ServerContext);
  // const errorService = useContext(ErrorContext);

  // const history = useHistory();

  const [showStartButton, setShowStartButton] = useState(false);
  const [teams, setTeams] = useState<[Team, Team]>(null);

  useEffect(() => {
    console.log("=======>>>>>>>>>>>>  Use Effect run in Hand");

    // myCurrentGame$ Observable manages set teams and showSartButton state as a side effect
    // when the updated info about my current game is notified on the server stream
    const myCurrentGame$ = server.myCurrentOpenGame_ShareReplay$.pipe(
      tap((game) => {
        setTeams(game.teams);
        // decide whether to show or not the Start Game button
        const gameWith4PlayersAndNoHand =
          Object.keys(game.players).length === 4 && game.hands.length === 0;
        const lastHandClosed = game.hands
          ? game.hands.length > 0
            ? game.hands[game.hands.length - 1].state === HandState.closed
            : false
          : false;
        setShowStartButton(gameWith4PlayersAndNoHand || lastHandClosed);
      })
    );

    const subscription = merge(myCurrentGame$).subscribe();

    return () => {
      console.log("Unsubscribe Hand subscription");
      subscription.unsubscribe();
    };
  }, [server]);
  return (
    <>
      {teams && (
        <Table teams={teams} currentPlayerName={server.playerName}></Table>
      )}
    </>
  );
};
