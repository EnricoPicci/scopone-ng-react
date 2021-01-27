import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Card } from 'src/app/scopone/card';
import { Player } from 'src/app/scopone/messages';
import { ScoponeServerService } from 'src/app/scopone/scopone-server.service';

@Component({
  template: `
    <mat-card>
      <mat-card-content>
        <scopone-cards
          [cards]="cardPlayed()"
          [name]="cardPlayedByPlayer()"
        ></scopone-cards>
        <scopone-cards
          *ngIf="showCardsTaken()"
          [cards]="cardsTaken()"
          name="Cards Taken"
        ></scopone-cards>
        <scopone-cards
          *ngIf="showFinalTableTake()"
          [cards]="finalTableTake()"
          [name]="tableTakenBy()"
        ></scopone-cards>
      </mat-card-content>
    </mat-card>
  `,
  styleUrls: ['./hand.component.css'],
})
export class CardsTakenDialogueComponent implements OnInit {
  constructor(
    public dialogRef: MatDialogRef<CardsTakenDialogueComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      cardPlayed: Card;
      cardsTaken: Card[];
      cardPlayedByPlayer: string;
      finalTableTake: {
        Cards: Card[];
        TeamTakingTable: [Player, Player];
      };
    },
    private scoponeServerService: ScoponeServerService
  ) {}

  ngOnInit(): void {
    setTimeout(
      () => {
        this.dialogRef.close();
      },
      this.showCardsTaken() ? 4000 : 2000
    ); // timeout shorter if there are no cards taken to show
  }

  cardPlayedByPlayer() {
    return `Card played by ${this.data.cardPlayedByPlayer}`;
  }
  cardPlayed() {
    return [this.data.cardPlayed];
  }
  cardsTaken() {
    return this.data.cardsTaken;
  }
  showCardsTaken() {
    return !!this.data.cardsTaken && this.data.cardsTaken.length > 0;
  }
  finalTableTake() {
    return this.data.finalTableTake.Cards;
  }
  tableTakenBy() {
    const hasOurTeamTakenTheTable = this.data.finalTableTake.TeamTakingTable.find(
      (p) => p.name === this.scoponeServerService.playerName
    );
    const usOrThem = hasOurTeamTakenTheTable ? 'Us' : 'Them';
    return `Table taken by ${usOrThem}`;
  }
  showFinalTableTake() {
    return (
      !!this.data.finalTableTake &&
      !!this.data.finalTableTake.Cards &&
      this.data.finalTableTake.Cards.length > 0
    );
  }
}
