import { Component, OnInit, OnDestroy } from '@angular/core';
import { ScoponeServerService } from '../../../../../scopone-rx-service/src/scopone-server.service';
import { Card, TypeValues } from '../../../../../scopone-rx-service/src/card';
import { tap, takeUntil, concatMap, switchMap, map } from 'rxjs/operators';
import { Observable, Subject, merge, combineLatest } from 'rxjs';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CardsPickerDialogueComponent } from './cards-picker-dialogue.component';
import { Router } from '@angular/router';
import { ErrorService } from 'src/app/errors/error-service';
import {
  Player,
  HandState,
  Team,
} from '../../../../../scopone-rx-service/src/messages';
import { CardsTakenDialogueComponent } from './cards-taken-dialogue.component';

@Component({
  selector: 'scopone-hand',
  templateUrl: './hand.component.html',
  styleUrls: ['./hand.component.css'],
})
export class HandComponent implements OnInit, OnDestroy {
  playerCards: Card[];
  table: Card[];
  ourScope: Card[];
  theirScope: Card[];
  teams: [Team, Team];
  currentPlayerName: string;

  showStartButton = false;

  enablePlay$: Observable<boolean>;
  // canSendCardToServer is used to avoid that fast double clicks on the Play button cause the same card, which the player has
  // chosen to play, to be sent twice in a fast sequence to the server
  canSendCardToServer = false;

  unsubscribe = new Subject<void>();

  constructor(
    protected scoponeService: ScoponeServerService,
    public dialog: MatDialog,
    private router: Router,
    private errorService: ErrorService
  ) {}

  ngOnInit(): void {
    if (!this.scoponeService.playerName) {
      this.router.navigate(['']);
    }
    const myCurrentGame$ = this.scoponeService.myCurrentOpenGame_ShareReplay$.pipe(
      tap((game) => {
        this.teams = game.teams;
        // decide whether to show or not the Start Game button
        const gameWith4PlayersAndNoHand =
          Object.keys(game.players).length === 4 && game.hands.length === 0;
        const lastHandClosed = game.hands
          ? game.hands.length > 0
            ? game.hands[game.hands.length - 1].state === HandState.closed
            : false
          : false;
        this.showStartButton = gameWith4PlayersAndNoHand || lastHandClosed;
      })
    );

    const myObservedGame$ = this.scoponeService.myCurrentObservedGame_ShareReplay$.pipe(
      tap((game) => {
        this.teams = game.teams;
        this.showStartButton = false;
      })
    );

    const handView$ = this.scoponeService.handView_ShareReplay$.pipe(
      tap((hv) => {
        this.playerCards = hv.playerCards
          ? hv.playerCards.sort(
              (a, b) => TypeValues[b.type] - TypeValues[a.type]
            )
          : null;
        this.table = hv.table;
        this.ourScope = hv.ourScope;
        this.theirScope = hv.theirScope;
        this.currentPlayerName = hv.currentPlayerName;
      })
    );
    const allHandViews$ = this.scoponeService.allHandViews_ShareReplay$.pipe(
      tap((handViews) => {
        const currentPlayer = Object.values(handViews)[0].currentPlayerName;
        const currentPlayerHandView = handViews[currentPlayer];
        this.playerCards = currentPlayerHandView.playerCards
          ? currentPlayerHandView.playerCards.sort(
              (a, b) => TypeValues[b.type] - TypeValues[a.type]
            )
          : null;
        this.table = currentPlayerHandView.table;
        this.ourScope = currentPlayerHandView.ourScope;
        this.theirScope = currentPlayerHandView.theirScope;
        this.currentPlayerName = currentPlayerHandView.currentPlayerName;
      })
    );

    // we need to use cardsTakenDialogueRef to control that HandCompleteDialogueComponent is opened after
    // CardsTakenDialogueComponent is closed, so that the players can see the card played and the cards taken also
    // after the last play of the hand
    let cardsTakenDialogueRef: MatDialogRef<CardsTakenDialogueComponent, any>;
    const cardPlayedAndCardsTakenFromTable$ = this.scoponeService.cardsPlayedAndTaken$.pipe(
      concatMap(
        ({ cardPlayed, cardsTaken, cardPlayedByPlayer, finalTableTake }) => {
          cardsTakenDialogueRef = this.dialog.open(
            CardsTakenDialogueComponent,
            {
              width: '650px',
              height: heightOfCardsTakenDialogue(cardsTaken, finalTableTake),
              data: {
                cardPlayed,
                cardsTaken,
                cardPlayedByPlayer,
                finalTableTake,
              },
            }
          );
          cardsTakenDialogueRef.disableClose = true;
          return cardsTakenDialogueRef.afterClosed();
        }
      )
    );
    const heightOfCardsTakenDialogue = (
      cardsTaken: Card[],
      finalTableTake: {
        Cards: Card[];
        TeamTakingTable: [Player, Player];
      }
    ) => {
      const areCardsTaken = !!cardsTaken && cardsTaken.length > 0;
      const areFinalCardsTaken =
        !!finalTableTake &&
        !!finalTableTake.Cards &&
        finalTableTake.Cards.length > 0;
      return areCardsTaken && areFinalCardsTaken
        ? '900px'
        : !areCardsTaken && !areFinalCardsTaken
        ? '300px'
        : '600px';
    };

    const handClosed$ = this.scoponeService.handClosed$.pipe(
      switchMap(() => {
        return cardsTakenDialogueRef
          ? // after CardsTakenDialogueComponent has been closed we navigate to the hand-result page
            cardsTakenDialogueRef.afterClosed().pipe(
              tap(() => {
                this.router.navigate(['hand-result']);
              })
            )
          : // cardsTakenDialogueRef can be null in case we enter this page as a person who wants to observe
            // this game hand and the hand has been closed while a new one has not been yet opened
            this.router.navigate(['hand-result']);
      })
    );

    // merge all the streams we are interested to in orderd to have a single subscription
    merge(
      myCurrentGame$,
      myObservedGame$,
      handView$,
      allHandViews$,
      cardPlayedAndCardsTakenFromTable$,
      handClosed$
    )
      .pipe(takeUntil(this.unsubscribe))
      .subscribe({
        error: (err) => {
          this.errorService.error = err;
          console.error('Error while communicating with the server', err);
          this.router.navigate(['error']);
        },
      });

    this.enablePlay$ = combineLatest(
      this.scoponeService.isMyTurnToPlay$,
      this.scoponeService.myCurrentOpenGameWithAll4PlayersIn_ShareReplay$
    ).pipe(
      map(([isMyTurn, all4PlayersIn]) => {
        const enable = isMyTurn && all4PlayersIn;
        this.canSendCardToServer = enable;
        return enable;
      })
    );
  }
  ngOnDestroy() {
    this.unsubscribe.next();
  }

  start() {
    this.scoponeService.newHand();
  }

  play(card: Card) {
    this.canSendCardToServer = false;
    const cardsTakeable = this.scoponeService.cardsTakeable(card, this.table);
    if (cardsTakeable.length > 1) {
      const dialogRef = this.dialog.open(CardsPickerDialogueComponent, {
        width: '1250px',
        height: '600px',
        data: { cards: cardsTakeable },
      });
      dialogRef.afterClosed().subscribe((cardsToTake) => {
        console.log('The player has chosen', cardsToTake);
        this.scoponeService.playCardForPlayer(
          this.scoponeService.playerName,
          card,
          cardsToTake
        );
      });
    } else {
      this.scoponeService.playCard(card, this.table);
    }
  }
}
