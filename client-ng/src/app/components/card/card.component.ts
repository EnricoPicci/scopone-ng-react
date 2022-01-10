import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Card, Suits } from '../../../../../scopone-rx-service/src/model/card';

const trevigianeSuitsMap = new Map<Suits, string>();
trevigianeSuitsMap[Suits.BASTONI] = 'B';
trevigianeSuitsMap[Suits.COPPE] = 'C';
trevigianeSuitsMap[Suits.DENARI] = 'D';
trevigianeSuitsMap[Suits.SPADE] = 'S';
@Component({
  selector: 'scopone-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss'],
})
export class CardComponent {
  @Input() public card: Card;
  @Output() public cardClicked = new EventEmitter<Card>();
  bastoni = Suits.BASTONI;
  spade = Suits.SPADE;

  constructor() {}

  type() {
    enum TypeViews {
      Ace = 'A',
      King = 'K',
      Queen = 'Q',
      Jack = 'J',
      Seven = '7',
      Six = '6',
      Five = '5',
      Four = '4',
      Three = '3',
      Two = '2',
    }
    return TypeViews[this.card.type];
  }

  trevigianeType() {
    enum TrevigianeTypeMap {
      Ace = 'Asso',
      King = 'Re',
      Queen = 'Cavallo',
      Jack = 'Fante',
      Seven = '7',
      Six = '6',
      Five = '5',
      Four = '4',
      Three = '3',
      Two = '2',
    }
    return TrevigianeTypeMap[this.card.type];
  }
  trevigianeSuite() {
    return trevigianeSuitsMap[this.card.suit];
  }

  trevigianeImageUrl() {
    return `./assets/Cartetrevisane/${this.trevigianeSuite()} ${this.trevigianeType()}.jpg`;
  }

  click() {
    this.cardClicked.emit(this.card);
  }
}
