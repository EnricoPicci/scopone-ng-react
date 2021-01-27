import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>
          Are you sure you want to terminate the game ?
        </mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <p>
          If the game is terminated, it will not be possible to resume it later.
        </p>
      </mat-card-content>
      <mat-card-actions>
        <button mat-button (click)="cancel()">Cancel</button>
        <button mat-button (click)="terminate()">TERMINATE</button>
      </mat-card-actions>
    </mat-card>
  `,
  styleUrls: ['./hand-result.component.css'],
})
export class CloseGameDialogueComponent implements OnInit {
  constructor(public dialogRef: MatDialogRef<CloseGameDialogueComponent>) {}

  ngOnInit(): void {}

  cancel() {
    this.dialogRef.close(false);
  }
  terminate() {
    this.dialogRef.close(true);
  }
}
