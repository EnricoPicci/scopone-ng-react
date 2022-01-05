import { Button } from "@material-ui/core";
import React, { FC, useContext, useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { interval, merge } from "rxjs";
import { delayWhen, share, switchMap, tap } from "rxjs/operators";
import { ServerContext } from "../../context/server-context";
import { Card, TypeValues } from "../../../../scopone-rx-service/src/card";
import { Player, Team } from "../../../../scopone-rx-service/src/messages";
import { Cards } from "../cards/cards";
import { Table } from "../table/table";
import { CardsPicker } from "./cards-picker-dialogue";
import { CardsPlayedTaken } from "./cards-played-taken-dialogue";

// we define a type for the state so that we can issue a single call to the update state function and
// avoid so multiple execution of the render function
// https://stackoverflow.com/questions/53574614/multiple-calls-to-state-updater-from-usestate-in-component-causes-multiple-re-re
type HandReactState = {
  showStartButton: boolean;
  teams?: [Team, Team];
  playerCards: Card[];
  table?: Card[];
  ourScope: Card[];
  theirScope: Card[];
  currentPlayerName?: string;
  enablePlay: boolean;
};

// expoerted because used in CardsPlayedTaken
export type CardsPlayedTakenReactState = {
  cardPlayed?: Card;
  cardPlayedByPlayer?: string;
  cardsTaken?: Card[];
  finalTableTake?: {
    Cards: Card[];
    TeamTakingTable: [Player, Player];
  };
  tableTakenBy?: string;
};

// expoerted because used in CardsPicker
export type CardsTakeableReactState = {
  cardsTakeable: Card[][];
  cardsTakeableClickHandler: (cards: Card[]) => void;
};

export const Hand: FC = () => {
  const server = useContext(ServerContext);
  const history = useHistory();

  const [handReactState, setHandReactState] = useState<HandReactState>({
    playerCards: [],
    ourScope: [],
    theirScope: [],
    showStartButton: false,
    enablePlay: false,
  });
  const [cardsPlayedTakenReactState, setCardsPlayedTakenReactState] =
    useState<CardsPlayedTakenReactState>();
  const [cardsTakeableReactState, setCardsTakeableReactState] =
    useState<CardsTakeableReactState>();

  useEffect(() => {
    console.log("=======>>>>>>>>>>>>  Use Effect run in Hand");

    // myCurrentGameTeams$ Observable sets teams state as a side effect
    // when the updated info about my current game is notified on the server stream
    const myCurrentGameTeams$ = server.myCurrentOpenGameTeams$.pipe(
      tap((_teams) => {
        const teams = _teams;
        setHandReactState((prevState) => ({
          ...prevState,
          teams,
        }));
      })
    );

    // showStartButton$ Observable sets the showSartButton state as a side effect
    // when the updated info about my current game is notified on the server stream
    const showStartButton$ = server.showStartButton$.pipe(
      tap((showStartButton) => {
        setHandReactState((prevState) => ({
          ...prevState,
          showStartButton,
        }));
      })
    );

    // myObservedGame$ Observable sets teams as a side effect
    // when the updated info about my current OBSERVED game is notified on the server stream
    const myObservedGame$ = server.myCurrentObservedGame_ShareReplay$.pipe(
      tap((game) => {
        const teams = game.teams;
        setHandReactState((prevState) => ({ ...prevState, teams }));
      })
    );

    // handView$ Observable sets cards, scope and currentPlayerName as a side effect
    // when new hand views are notified on the server stream
    const handView$ = server.handView_ShareReplay$.pipe(
      tap((hv) => {
        const pCards = hv.playerCards?.sort(
          (a, b) => TypeValues.get(b.type) - TypeValues.get(a.type)
        );
        const newState: Partial<HandReactState> = {
          playerCards: pCards,
          table: hv.table,
          ourScope: hv.ourScope,
          theirScope: hv.theirScope,
          currentPlayerName: hv.currentPlayerName,
        };
        setHandReactState((prevState) => ({ ...prevState, ...newState }));
      })
    );

    // cardPlayedAndCardsTakenFromTable$ Observable listen to server.cardsPlayedAndTaken$ notification and
    // open/close the dialogue as side effect
    const cardPlayedAndCardsTakenFromTable$ = server.cardsPlayedAndTaken$.pipe(
      tap(({ cardPlayed, cardsTaken, cardPlayedByPlayer, finalTableTake }) => {
        const tableTakenBy = () => {
          if (finalTableTake.TeamTakingTable) {
            const hasOurTeamTakenTheTable = finalTableTake.TeamTakingTable.find(
              (p) => p.name === server.playerName
            );
            const usOrThem = hasOurTeamTakenTheTable ? "Us" : "Them";
            return `Table taken by ${usOrThem}`;
          }
        };

        setCardsPlayedTakenReactState({
          cardPlayed,
          cardsTaken,
          cardPlayedByPlayer,
          finalTableTake,
          tableTakenBy: finalTableTake && tableTakenBy(),
        });
      }),
      // use delayWhen to enable a variable delay time
      // if the simple delay operator were used, then the delay time would be fixed to the number set when the pipe chain is executed
      // on the contrary, in this case, we want to have a shorter delay if a card is played and no cards are taken and
      // a longer delay if some cards are taken, to give the player the time to look at the cards taken
      delayWhen((event) =>
        interval(event?.cardsTaken?.length > 0 ? 4000 : 2000)
      ),
      tap(() => setCardsPlayedTakenReactState(() => null)),
      share()
    );

    // this is an exception to the rule that the pipe in the Components should show only side effects, but the exception is justified by
    // the situation. In this case we need to react to the fact that the hand is finished (notified by handClosed$) and THEN WAIT for the pop up
    // showing the last cards played and taken before navigating to the "/hand-result" page
    const handClosed$ = server.handClosed$.pipe(
      switchMap(() => cardPlayedAndCardsTakenFromTable$),
      tap(() => history.push("/hand-result"))
    );

    const enablePlay$ = server.enablePlay$.pipe(
      tap((enablePlay) => {
        setHandReactState((prevState) => ({ ...prevState, enablePlay }));
      })
    );

    const subscription = merge(
      myCurrentGameTeams$,
      showStartButton$,
      myObservedGame$,
      handView$,
      enablePlay$,
      cardPlayedAndCardsTakenFromTable$,
      handClosed$
    ).subscribe();

    return () => {
      console.log("Unsubscribe Hand subscription");
      subscription.unsubscribe();
    };
  }, [server, history]);

  const start = () => {
    server.newHand();
  };

  const play = (card: Card) => {
    const cardsTakeable = server.cardsTakeable(card, handReactState.table);
    if (cardsTakeable.length > 1) {
      // cardsTakeableClickHandler is using currying since card and server.playerName are known values
      // which will be passed to server.playCardForPlayer - the last parameter, cardsToTake, will be actually passed
      // when this handler is invoked
      const cardsTakeableClickHandler = (cardsToTake: Card[]) => {
        server.playCardForPlayer(server.playerName, card, cardsToTake);
        // reset the state after the cards to take are chosen
        setCardsTakeableReactState(null);
      };
      setCardsTakeableReactState({ cardsTakeable, cardsTakeableClickHandler });
    } else {
      server.playCard(card, handReactState.table);
    }
  };

  return (
    <>
      {handReactState.teams && (
        <Table
          teams={handReactState.teams}
          currentPlayerName={handReactState.currentPlayerName}
          cards={handReactState.table}
        ></Table>
      )}
      {handReactState.playerCards?.length > 0 && (
        <Cards
          cards={handReactState.playerCards}
          name="My cards"
          cardClickHandler={play}
          enabled={handReactState.enablePlay}
          layout="spread-left"
        ></Cards>
      )}
      {handReactState.ourScope.length > 0 && (
        <Cards
          cards={handReactState.ourScope}
          name="Our Scope"
          layout="spread-left"
        ></Cards>
      )}
      {handReactState.theirScope.length > 0 && (
        <Cards
          cards={handReactState.theirScope}
          name="Their Scope"
          layout="spread-left"
        ></Cards>
      )}
      {handReactState.showStartButton && (
        <Button size="small" onClick={start}>
          Start
        </Button>
      )}
      {cardsPlayedTakenReactState?.cardPlayed && (
        <CardsPlayedTaken {...cardsPlayedTakenReactState}></CardsPlayedTaken>
      )}
      {cardsTakeableReactState && (
        <CardsPicker {...cardsTakeableReactState}></CardsPicker>
      )}
    </>
  );
};
