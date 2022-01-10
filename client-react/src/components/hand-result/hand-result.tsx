import React, { FC, useContext, useEffect, useState } from "react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  DialogActions,
} from "@material-ui/core";

import { ServerContext } from "../../context/server-context";
import { Card as CardObj } from "../../../../scopone-rx-service/src/model/card";
import { Cards } from "../cards/cards";
import { tap } from "rxjs/operators";
import { useHistory } from "react-router-dom";
import { TerminateDialogue } from "./terminate-game-dialogue";

// we define a type for the state so that we can issue a single call to the update state function and
// avoid so multiple execution of the render function
// https://stackoverflow.com/questions/53574614/multiple-calls-to-state-updater-from-usestate-in-component-causes-multiple-re-re
type HandResultState = {
  finalHandScore: string;
  gameScore: string;
  ourCards: CardObj[];
  theirCards: CardObj[];
  ourScope: CardObj[];
  theirScope: CardObj[];
  observing: boolean;
};
export type TerminateGameState = {
  handleTerminateGame: () => void;
  handleCancel: () => void;
};

export const HandResult: FC = () => {
  const server = useContext(ServerContext);
  const history = useHistory();

  const [handResultState, setHandResultState] = useState<HandResultState>();

  const [terminateGameState, setTerminateGameState] =
    useState<TerminateGameState>();

  useEffect(() => {
    console.log("=======>>>>>>>>>>>>  Use Effect run in HandResult");

    const finalHandView$ = server.handClosed_ShareReplay$.pipe(
      tap((finalHandView) => {
        const finalHandScore = `Hand score: "Us" ${finalHandView.ourFinalScore} - "Them" ${finalHandView.theirFinalScore}`;
        const gameScore = `Game score: "Us" ${finalHandView.ourCurrentGameScore} - "Them" ${finalHandView.theirCurrentGameScore}`;
        setHandResultState({
          finalHandScore,
          gameScore,
          ourCards: finalHandView.ourScorecard.carte,
          theirCards: finalHandView.theirScorecard.carte,
          ourScope: finalHandView.ourScope,
          theirScope: finalHandView.theirScope,
          observing: server.observing,
        });
      })
    );

    const subscription = finalHandView$.subscribe();

    return () => {
      console.log("Unsubscribe HandResult subscription");
      subscription.unsubscribe();
    };
  }, [server]);

  const handleContinue = () => {
    server.newHand();
    history.push("/hand");
  };
  const handleTerminateGame = () => {
    const handleTerminateGame = () => {
      server.closeCurrentGame();
    };
    const handleCancel = () => {
      setTerminateGameState(null);
    };
    setTerminateGameState({
      handleTerminateGame,
      handleCancel,
    });
  };
  const handleViewHistory = () => {
    history.push("/hand-history");
  };

  return (
    <>
      {handResultState && (
        <Card className="root" variant="outlined">
          <CardHeader
            title={handResultState.finalHandScore}
            className="header"
          ></CardHeader>
          <CardHeader
            title={handResultState.gameScore}
            className="header"
          ></CardHeader>
          <CardContent>
            <Cards
              cards={handResultState.ourCards}
              name="Our cards"
              layout="spread-left"
            ></Cards>
            <Cards
              cards={handResultState.ourScope}
              name="Our scope"
              layout="spread-left"
            ></Cards>
            <Cards
              cards={handResultState.theirCards}
              name="Their cards"
              layout="spread-left"
            ></Cards>
            <Cards
              cards={handResultState.theirScope}
              name="Their scope"
              layout="spread-left"
            ></Cards>
          </CardContent>
          <DialogActions>
            <Button onClick={handleContinue} color="primary">
              Continue
            </Button>
            {!handResultState.observing && (
              <Button onClick={handleTerminateGame} color="primary" autoFocus>
                Terminate Game
              </Button>
            )}
            <Button onClick={handleViewHistory} color="primary" autoFocus>
              View History
            </Button>
          </DialogActions>
        </Card>
      )}
      {terminateGameState && (
        <TerminateDialogue {...terminateGameState}></TerminateDialogue>
      )}
    </>
  );
};
