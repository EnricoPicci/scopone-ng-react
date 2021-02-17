import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Card } from 'src/app/scopone/card';

@Component({
  selector: 'scopone-cards-picker',
  template: `
    <h1 mat-dialog-title>What do you want to take?</h1>
    <table>
      <tr *ngFor="let cards of data.cards; index as i">
        <td>
          <scopone-cards class="cards-option" [cards]="cards"></scopone-cards>
        </td>
        <td>
          <button mat-raised-button (click)="cardsSelected(i)">>></button>
        </td>
      </tr>
    </table>
  `,
  styleUrls: ['./hand.component.css'],
})
export class CardsPickerDialogueComponent implements OnInit {
  constructor(
    public dialogRef: MatDialogRef<CardsPickerDialogueComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { cards: Card[][] }
  ) {}

  ngOnInit(): void {}

  cardsSelected(i: number) {
    this.dialogRef.close(this.data.cards[i]);
  }
}
