import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ScoponeServerService } from '../../../../../scopone-rx-service/src/scopone-server.service';
import { tap, takeUntil } from 'rxjs/operators';
import { Subject, merge } from 'rxjs';
import { ScoponeError } from 'src/app/errors/scopone-errors';
import { ErrorService } from 'src/app/errors/error-service';

@Component({
  selector: 'scopone-pick-game',
  templateUrl: './pick-game.component.html',
  styleUrls: ['./pick-game.component.css'],
})
export class PickGameComponent implements OnInit, OnDestroy {
  constructor(
    protected scoponeServer: ScoponeServerService,
    private router: Router,
    private errorService: ErrorService
  ) {}

  private complete$ = new Subject<void>();

  ngOnInit(): void {
    if (!this.scoponeServer.playerName) {
      this.router.navigate(['']);
    }

    merge(
      this.scoponeServer.myCurrentOpenGame_ShareReplay$,
      this.scoponeServer.myCurrentObservedGame_ShareReplay$
    )
      .pipe(
        tap((game) => {
          this.router.navigate(['hand']);
        }),
        takeUntil(this.complete$)
      )
      .subscribe();

    this.scoponeServer.gameWithSameNamePresent_ShareReplay$
      .pipe(
        tap((gameName) => {
          const err: ScoponeError = {
            message: `A game with the same name "${gameName}" has been already defined`,
          };
          this.errorService.notifyError(err);
        }),
        takeUntil(this.complete$)
      )
      .subscribe();
  }

  ngOnDestroy() {
    this.complete$.next();
  }
}
