import React, { FC, useContext, useEffect, useState } from "react";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@material-ui/core";
import { merge } from "rxjs";
import { tap } from "rxjs/operators";
import { ServerContext } from "../../context/server-context";
import { HandHistory as HandHistoryObj } from "../../rx-services/scopone-rx-service/player-view";
import { handHistoryShareReplay$ } from "../../rx-services/streams-transformations/hand-history";
import { HandHistoryCardPlay } from "./hand-history-card-play";

export const HandHistory: FC = () => {
  const server = useContext(ServerContext);

  const [handHistory, setHandHistory] = useState<HandHistoryObj>();

  useEffect(() => {
    console.log("=======>>>>>>>>>>>>  Use Effect run in HandHistory");

    const _handHistoryShareReplay$ = handHistoryShareReplay$(server).pipe(
      tap((handHistory) => {
        setHandHistory(handHistory);
      })
    );

    const subscription = merge(_handHistoryShareReplay$).subscribe();

    return () => {
      console.log("Unsubscribe HandHistory subscription");
      subscription.unsubscribe();
    };
  }, [server]);

  const cardHeight = "50";
  return (
    <>
      {handHistory && (
        <TableContainer component={Paper}>
          <Table stickyHeader aria-label="hand history">
            <TableHead>
              <TableRow>
                <TableCell>Player</TableCell>
                <TableCell align="right">Table</TableCell>
                <TableCell align="right">Card Played</TableCell>
                <TableCell align="right">Cards taken</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {handHistory.cardPlaySequence.map((cardPlay, i) => (
                <HandHistoryCardPlay
                  cardPlay={cardPlay}
                  height={cardHeight}
                  key={`${i}`}
                ></HandHistoryCardPlay>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </>
  );
};
