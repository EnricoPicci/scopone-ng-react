import { Component, OnInit } from '@angular/core';

import { ScoponeService } from '../../scopone/scopone.service';

@Component({
  selector: 'scopone-new-game',
  templateUrl: './new-game.component.html',
  styleUrls: ['./new-game.component.css'],
})
export class NewGameComponent implements OnInit {
  constructor(public scoponeServer: ScoponeService) {}

  ngOnInit(): void {}

  newGame(name: string) {
    this.scoponeServer.newGame(name);
  }
}
