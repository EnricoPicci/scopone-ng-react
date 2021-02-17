import { Component, OnInit } from '@angular/core';

import { ScoponeServerService } from 'src/app/scopone/scopone-server.service';

@Component({
  selector: 'scopone-new-game',
  templateUrl: './new-game.component.html',
  styleUrls: ['./new-game.component.css'],
})
export class NewGameComponent implements OnInit {
  constructor(public scoponeServer: ScoponeServerService) {}

  ngOnInit(): void {}

  newGame(name: string) {
    this.scoponeServer.newGame(name);
  }
}
