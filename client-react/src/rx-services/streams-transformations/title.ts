import { merge } from "rxjs";
import { map } from "rxjs/operators";
import { ScoponeServerService } from "../../../../scopone-rx-service/src/scopone-server.service";

export const title$ = (server: ScoponeServerService) => {
  return merge(
    // when the Player enters the Osteria the title is simply its name
    server.playerEnteredOsteria$.pipe(map((player) => `${player.name}`)),
    // title shown when the Player enters the game
    server.myCurrentOpenGame_ShareReplay$.pipe(
      map((game) => {
        let title = `${server.playerName} - Game "${game.name}"`;
        title =
          title +
          (game.hands.length > 0
            ? ` - Hand ${game.hands.length}`
            : " not yet started");
        return title;
      })
    ),
    // title shown when the Observer enters the game
    server.myCurrentObservedGame_ShareReplay$.pipe(
      map((game) => {
        let title = `${server.playerName} - Observing Game "${game.name}"`;
        title =
          title +
          (game.hands.length > 0
            ? ` - Hand ${game.hands.length}`
            : " not yet started");
        return title;
      })
    ),
    // title shown to the Player when a new of an hand is received, i.e. after a card has been played
    server.handView_ShareReplay$.pipe(
      map((hv) => {
        return `${server.playerName} - Game "${hv.gameName}" - Hand ${hv.id} ("us" ${hv.ourCurrentGameScore} - "them" ${hv.theirCurrentGameScore})`;
      })
    ),
    // title shown to the Ibserver when a new of an hand is received, i.e. after a card has been played
    server.allHandViews_ShareReplay$.pipe(
      map((handViews) => {
        const hv = Object.values(handViews)[0];
        return `${server.playerName} - Observing "${hv.currentPlayerName}" playing Game "${hv.gameName}" - Hand ${hv.id} ("${hv.currentPlayerName} team" ${hv.ourCurrentGameScore} - "the other team" ${hv.theirCurrentGameScore})`;
      })
    )
  );
};
