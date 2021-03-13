import { Button } from "@material-ui/core";
import React, { FC, useContext, useEffect, useState } from "react";
import { merge } from "rxjs";
import { tap } from "rxjs/operators";
import { ServerContext } from "../../context/server-context";
import { Card, TypeValues } from "../../rx-services/scopone-rx-service/card";
import { HandState, Team } from "../../rx-services/scopone-rx-service/messages";
import { Cards } from "../cards/cards";
import { Table } from "../table/table";

export const Hand: FC = () => {
  const server = useContext(ServerContext);
  // const errorService = useContext(ErrorContext);

  // const history = useHistory();

  const [showStartButton, setShowStartButton] = useState(false);
  const [teams, setTeams] = useState<[Team, Team]>(null);
  const [playerCards, setPlayerCards] = useState<Card[]>(null);
  const [table, setTable] = useState<Card[]>(null);
  const [ourScope, setOurScope] = useState<Card[]>(null);
  const [theirScope, setTheirScope] = useState<Card[]>(null);
  const [currentPlayerName, setCurrentPlayerName] = useState<string>(null);

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

    // myCurrentGame$ Observable manages set teams and showSartButton state as a side effect
    // when the updated info about my current OBSERVED game is notified on the server stream
    const myObservedGame$ = server.myCurrentObservedGame_ShareReplay$.pipe(
      tap((game) => {
        setTeams(game.teams);
        setShowStartButton(false);
      })
    );

    const handView$ = server.handView_ShareReplay$.pipe(
      tap((hv) => {
        const pCards = hv.playerCards?.sort(
          (a, b) => TypeValues[b.type] - TypeValues[a.type]
        );
        setPlayerCards(pCards);
        setTable(hv.table);
        setOurScope(hv.ourScope);
        setTheirScope(hv.theirScope);
        setCurrentPlayerName(hv.currentPlayerName);
      })
    );

    const subscription = merge(
      myCurrentGame$,
      myObservedGame$,
      handView$
    ).subscribe();

    return () => {
      console.log("Unsubscribe Hand subscription");
      subscription.unsubscribe();
    };
  }, [server]);

  const start = () => {
    server.newHand();
  };

  return (
    <>
      {teams && (
        <Table teams={teams} currentPlayerName={currentPlayerName}></Table>
      )}
      {playerCards && <Cards cards={playerCards} name="My cards"></Cards>}
      {showStartButton && (
        <Button size="small" onClick={start}>
          Start
        </Button>
      )}
    </>
  );
};
