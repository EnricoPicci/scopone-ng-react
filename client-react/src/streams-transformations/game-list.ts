import { combineLatest } from "rxjs";
import { map } from "rxjs/operators";
import { Game } from "../scopone-rx-service/messages";
import { ScoponeServerService } from "../scopone-rx-service/scopone-server.service";

export type GameForList = Game & { canBeObservedOnly: boolean };

export const gameList$ = (server: ScoponeServerService) => {
  return combineLatest([
    server.gamesNotYetStarted$,
    server.gamesWhichCanBeObserved$,
  ]).pipe(
    map(([gNotStarted, gObservable]) => {
      const gamesNotStarted = gNotStarted.map(
        (g) => ({ ...g, canBeObservedOnly: false } as GameForList)
      );
      const gamesObservable = gObservable.map(
        (g) => ({ ...g, canBeObservedOnly: true } as GameForList)
      );
      return [...gamesNotStarted, ...gamesObservable];
    })
  );
};
