import {
  Component,
  OnInit,
  Input,
  ChangeDetectionStrategy,
} from '@angular/core';
import { Card } from '../../../../../scopone-rx-service/src/card';
import {
  PlayerState,
  Team,
} from '../../../../../scopone-rx-service/src/messages';

@Component({
  selector: 'scopone-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableComponent implements OnInit {
  @Input() teams: [Team, Team];
  @Input() public currentPlayerName: string;
  @Input() public cards: Card[];

  constructor() {}

  ngOnInit(): void {}

  playerName(tNum: number, pNum: number) {
    let name = this.teams
      ? this.teams[tNum].Players[pNum]
        ? this.teams[tNum].Players[pNum].name
        : '-'
      : '';
    name = this.playerLeft(tNum, pNum) ? `${name} (left the Osteria)` : name;
    name = this.isCurrentPlayer(tNum, pNum) ? `${name} (can play card)` : name;
    return name;
  }
  playerLeft(tNum: number, pNum: number) {
    return this.teams && this.teams[tNum].Players[pNum]
      ? this.teams[tNum].Players[pNum].status === PlayerState.playerLeftTheGame
      : false;
  }
  isCurrentPlayer(tNum: number, pNum: number) {
    return this.teams && this.teams[tNum].Players[pNum]
      ? this.teams[tNum].Players[pNum].name === this.currentPlayerName
      : false;
  }
  marginLeft(i: number) {
    return `${i * 12}%`;
  }
}
