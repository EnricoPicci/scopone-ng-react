import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { ScoponeService } from '../../scopone/scopone.service';
import { MatDialog } from '@angular/material/dialog';
import { CloseGameDialogueComponent } from './close-game-dialogue.component';
import { Observable } from 'rxjs';
import { PlayerView } from '../../../../../scopone-rx-service/src/model/player-view';
import { map, share, tap } from 'rxjs/operators';
import { Card } from '../../../../../scopone-rx-service/src/model/card';

@Component({
  selector: 'scopone-hand-result',
  templateUrl: './hand-result.component.html',
  styleUrls: ['./hand-result.component.css'],
})
export class HandResultComponent implements OnInit {
  finalHandView$: Observable<PlayerView>;
  finalHandScore$: Observable<string>;
  gameScore$: Observable<string>;
  ourCards$: Observable<Card[]>;
  theirCards$: Observable<Card[]>;
  ourScope$: Observable<Card[]>;
  theirScope$: Observable<Card[]>;

  constructor(
    public scoponeService: ScoponeService,
    private router: Router,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.finalHandView$ = this.scoponeService.handClosed_ShareReplay$;

    this.finalHandScore$ = this.finalHandView$.pipe(
      map(
        (finalHandView) =>
          `Hand score: "Us" ${finalHandView.ourFinalScore} - "Them" ${finalHandView.theirFinalScore}`
      )
    );

    this.gameScore$ = this.finalHandView$.pipe(
      map(
        (finalHandView) =>
          `Game score: "Us" ${finalHandView.ourCurrentGameScore} - "Them" ${finalHandView.theirCurrentGameScore}`
      )
    );

    this.ourCards$ = this.finalHandView$.pipe(
      map((finalHandView) => finalHandView.ourScorecard.carte)
    );

    this.theirCards$ = this.finalHandView$.pipe(
      map((finalHandView) => finalHandView.theirScorecard.carte)
    );

    this.ourScope$ = this.finalHandView$.pipe(
      map((finalHandView) => finalHandView.ourScope)
    );

    this.theirScope$ = this.finalHandView$.pipe(
      map((finalHandView) => finalHandView.theirScope)
    );
  }

  continue() {
    this.scoponeService.newHand();
    this.router.navigate(['hand']);
  }
  close() {
    const dialogRef = this.dialog.open(CloseGameDialogueComponent, {
      width: '400px',
      height: '200px',
    });
    dialogRef.afterClosed().subscribe((terminate) => {
      if (terminate) {
        this.scoponeService.closeCurrentGame();
        // the navigation to the 'bye' page is governed by the GameComponent so that, when a game is closed by one player,
        // all players are automatically brought to the 'bye' page and not only the player who has actualle closed the game
        // this.router.navigate(['bye']);
      }
    });
  }
}
