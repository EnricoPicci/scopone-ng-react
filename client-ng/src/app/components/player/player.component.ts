import { Component, OnInit, Input } from '@angular/core';
import { Player } from 'src/app/scopone/messages';

@Component({
  selector: 'scopone-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.css'],
})
export class PlayerComponent implements OnInit {
  @Input() player: Player;
  @Input() isCurrentPlayer = false;

  constructor() {}

  ngOnInit(): void {}
}
