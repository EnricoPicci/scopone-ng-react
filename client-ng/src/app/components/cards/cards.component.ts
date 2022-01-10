import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Card } from '../../../../../scopone-rx-service/src/model/card';
import {
  trigger,
  transition,
  query,
  style,
  stagger,
  animate,
  keyframes,
} from '@angular/animations';

@Component({
  selector: 'scopone-cards',
  templateUrl: './cards.component.html',
  styleUrls: ['./cards.component.css'],

  animations: [
    trigger('cardAnimation', [
      transition('* => *', [
        query(':enter', style({ opacity: 0 }), { optional: true }),
        query(
          ':enter',
          stagger('100ms', [
            animate(
              '.75s cubic-bezier(0.215, 0.61, 0.355, 1)',
              keyframes([
                style({
                  opacity: 0,
                  transform: 'scale3d(0.3, 0.3, 0.3)',
                  offset: 0,
                }),
                style({
                  opacity: 0.2,
                  transform: 'scale3d(1.1, 1.1, 1.1)',
                  offset: 0.2,
                }),
                style({
                  opacity: 0.4,
                  transform: 'scale3d(0.9, 0.9, 0.9)',
                  offset: 0.4,
                }),
                style({
                  opacity: 0.6,
                  transform: 'scale3d(1.03, 1.03, 1.03)',
                  offset: 0.6,
                }),
                style({
                  opacity: 0.8,
                  transform: 'scale3d(0.97, 0.97, 0.97)',
                  offset: 0.8,
                }),
                style({
                  opacity: 1,
                  transform: 'scale3d(1, 1, 1)',
                  offset: 1.0,
                }),
              ])
            ),
          ]),
          { optional: true }
        ),
      ]),
    ]),
  ],
})
export class CardsComponent implements OnInit {
  private _enabled: boolean;

  @Input() public name: string;
  @Input() public cards: Card[];
  @Input() public set enabled(val: boolean) {
    this._enabled = val;
  }
  @Output() public cardClicked = new EventEmitter<Card>();
  constructor() {}

  ngOnInit(): void {}

  cardClick(card: Card) {
    if (this._enabled) {
      this.cardClicked.emit(card);
    }
  }
}
