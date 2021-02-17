import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ScoponeServerService } from '../../../../../scopone-rx-service/src/scopone-server.service';
import { Observable, Subscription, merge } from 'rxjs';
import { startWith, map, tap, catchError, switchMap } from 'rxjs/operators';
import { PlayerState } from '../../../../../scopone-rx-service/src/messages';
import { ErrorService } from 'src/app/errors/error-service';
import { ScoponeErrors } from 'src/app/errors/scopone-errors';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'scopone-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css'],
})
export class GameComponent implements OnInit, OnDestroy {
  title$: Observable<string>;
  error$ = this.errorService.error$.pipe(map((e) => e.message));
  subscriptions: Subscription[] = [];

  observing = false;

  constructor(
    private router: Router,
    public scoponeServer: ScoponeServerService,
    private errorService: ErrorService
  ) {}

  ngOnInit(): void {
    const subConnect = this.scoponeServer
      // first connect to theserver
      .connect(environment.serverAddress)
      .pipe(
        // manage errors that can be raised during connection
        catchError((err) => {
          console.error('Connection error to the server failed', err);
          switch (err.type) {
            case 'error':
              throw ScoponeErrors.ConnectionError;
            case 'close':
              throw ScoponeErrors.Closed;
            default:
              throw ScoponeErrors.GenericConnectionError;
          }
        }),
        // when the player tries to enter the Osteria via login, playerEnteredOsteria$ notifies in case of success
        // while playerAlreadyInOsteria$ notifies in case the player is already in the Osteria
        // Both observables take care of their routing
        switchMap(() => merge(playerEntersOsteria$, playerAlreadyInOsteria$))
      )
      .subscribe({
        error: (err) => {
          this.errorService.error = err;
          console.error('Error while communicating with the server', err);
          this.router.navigate(['error']);
        },
      });
    this.subscriptions.push(subConnect);

    // this Observable notifies when a Player successfully enters the osteria adn then navigates towards
    // the right page, depending on the state of the Player
    const playerEntersOsteria$ = this.scoponeServer.playerEnteredOsteria$.pipe(
      tap((player) => {
        switch (player.status) {
          case PlayerState.playerNotPlaying:
            this.router.navigate(['pick-game']);
            break;
          case PlayerState.playerPlaying:
            this.router.navigate(['hand']);
            break;
          case PlayerState.playerObservingGames:
            this.router.navigate(['hand']);
            break;
          case PlayerState.playerLookingAtHandResult:
            this.router.navigate(['hand-result']);
            break;
          default:
            const errMsg = `State "${player.status}" is not expected - look at the console for more details`;
            this.errorService.error = { message: errMsg };
            console.error(errMsg);
            this.router.navigate(['error']);
        }
      })
    );

    // this Observable notifies if the Player is already in the Osteria and navigate to Error page
    const playerAlreadyInOsteria$ = this.scoponeServer.playerIsAlreadyInOsteria$.pipe(
      tap((pName) => {
        const errMsg = `Player "${pName}" is already in the Osteria`;
        this.errorService.error = { message: errMsg };
        console.error(errMsg);
        this.router.navigate(['error']);
      })
    );

    this.title$ = merge(
      this.scoponeServer.playerEnteredOsteria$.pipe(
        map((player) => `${player.name}`),
        startWith('Scopone Table - sign in please')
      ),
      this.scoponeServer.myCurrentOpenGame_ShareReplay$.pipe(
        map((game) => {
          let title = `${this.scoponeServer.playerName} - Game "${game.name}"`;
          title =
            title +
            (game.hands.length > 0
              ? ` - Hand ${game.hands.length}`
              : ' not yet started');
          return title;
        })
      ),
      this.scoponeServer.myCurrentObservedGame_ShareReplay$.pipe(
        map((game) => {
          let title = `${this.scoponeServer.playerName} - Observing Game "${game.name}"`;
          title =
            title +
            (game.hands.length > 0
              ? ` - Hand ${game.hands.length}`
              : ' not yet started');
          return title;
        })
      ),
      this.scoponeServer.handView_ShareReplay$.pipe(
        map((hv) => {
          return `${this.scoponeServer.playerName} - Game "${hv.gameName}" - Hand ${hv.id} ("us" ${hv.ourCurrentGameScore} - "them" ${hv.theirCurrentGameScore})`;
        })
      ),
      this.scoponeServer.allHandViews_ShareReplay$.pipe(
        map((handViews) => {
          const hv = Object.values(handViews)[0];
          return `${this.scoponeServer.playerName} - Observing "${hv.currentPlayerName}" playing Game "${hv.gameName}" - Hand ${hv.id} ("${hv.currentPlayerName} team" ${hv.ourCurrentGameScore} - "the other team" ${hv.theirCurrentGameScore})`;
        })
      )
    );

    const subGameClosed = this.scoponeServer.myCurrentGameClosed$.subscribe({
      next: () => {
        this.router.navigate(['bye']);
      },
    });
    this.subscriptions.push(subGameClosed);
  }

  ngOnDestroy() {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
