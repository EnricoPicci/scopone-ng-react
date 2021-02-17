import { Component, OnInit } from '@angular/core';
import { Observable, zip } from 'rxjs';
import { Game } from 'src/app/scopone/messages';
import { ScoponeServerService } from 'src/app/scopone/scopone-server.service';
import { MatDialog } from '@angular/material/dialog';
import { MatListOption } from '@angular/material/list';
import { GamePickerDialogueComponent } from './game-picker-dialogue.component';
import { map } from 'rxjs/operators';

@Component({
  selector: 'scopone-game-list',
  templateUrl: './game-list.component.html',
  styleUrls: ['./game-list.component.css'],
})
export class GameListComponent implements OnInit {
  games$: Observable<Game[]>;
  gamesNotStarted: string[];
  gamesObservable: string[];

  constructor(
    public scoponeServer: ScoponeServerService,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.games$ = zip(
      this.scoponeServer.gamesNotYetStarted$,
      this.scoponeServer.gamesWhichCanBeObserved$
    ).pipe(
      map(([gNotStarted, gObservable]) => {
        this.gamesNotStarted = gNotStarted.map((g) => g.name);
        this.gamesObservable = gObservable.map((g) => g.name);
        return [...gNotStarted, ...gObservable];
      })
    );
  }

  gameSelected(options: MatListOption[]) {
    const game = options[0].value;
    const dialogRef = this.dialog.open(GamePickerDialogueComponent, {
      width: '400px',
      height: '150px',
      data: { game },
    });
    dialogRef.afterClosed().subscribe((OK) => {
      if (OK) {
        if (this.isGameObservable(game)) {
          this.scoponeServer.addObserverToGame(
            this.scoponeServer.playerName,
            game.name
          );
        } else {
          this.scoponeServer.addPlayerToGame(
            this.scoponeServer.playerName,
            game.name
          );
        }
      } else {
        options[0].selected = false;
      }
    });
  }
  isGameObservable(game: Game) {
    return this.gamesObservable.includes(game.name);
  }
  gameName(game: Game) {
    return this.isGameObservable(game)
      ? `${game.name} (as an Observer)`
      : game.name;
  }
}
