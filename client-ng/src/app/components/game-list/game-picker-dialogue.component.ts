import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Game } from 'src/app/scopone/messages';
import { ScoponeServerService } from 'src/app/scopone/scopone-server.service';

@Component({
  selector: 'scopone-game-picker-dialogue',
  template: `
    <mat-card>
      <mat-card-content>
        <p [innerHTML]="confirmationText()"></p>
      </mat-card-content>
      <mat-card-actions>
        <button mat-button (click)="ok()">OK</button>
        <button mat-button (click)="notOk()">NO</button>
      </mat-card-actions>
    </mat-card>
  `,
  styleUrls: ['./game-list.component.css'],
})
export class GamePickerDialogueComponent implements OnInit {
  constructor(
    public scoponeService: ScoponeServerService,
    public dialogRef: MatDialogRef<GamePickerDialogueComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { game: Game }
  ) {}

  ngOnInit(): void {}

  ok() {
    this.dialogRef.close(true);
  }

  notOk() {
    this.dialogRef.close(false);
  }

  confirmationText() {
    const game = this.data.game;
    let desc = this.scoponeService.observing
      ? `Want to observe <b>${game.name}</b>`
      : `Confirm to join <b>${game.name}</b>`;
    const players = Object.keys(game.players);
    if (players.length > 0) {
      desc = desc + ' with players ';
      players.forEach((p) => (desc = desc + ` <b> <i>${p} </i> </b> `));
    }
    desc = desc + '?';
    return desc;
  }
}
