import { interval } from "rxjs";
import { switchMap, tap, take, filter } from "rxjs/operators";
import { environment } from "../../environments/environment.test";
import { ScoponeServerService } from "../../scopone-server.service";

// creates the services for different players
export function servicesForPlayers(playerNames: string[]) {
  return playerNames.map((player) => {
    const service = new ScoponeServerService();
    service.logMessages = false;
    return {
      service,
      player,
    };
  });
}

// connect all players - each connection is separated by a time interval to avoid jamming the WebSocket channel
export function connectServices(
  services: ScoponeServerService[],
  interalMs: number
) {
  return interval(interalMs).pipe(
    switchMap((i) =>
      services[i].connect(environment.serverAddress).pipe(
        tap({
          next: () => console.log(`Service${i} connected`),
          error: (err) =>
            console.error(`Error ${err} while connecting for service ${i}`),
        })
      )
    ),
    take(services.length)
  );
}

// players enter the Osteria
export function playersEnterOsteria(
  servicesAndPlayers: {
    service: ScoponeServerService;
    player: string;
  }[]
) {
  return servicesAndPlayers.map(({ service, player }) => {
    return service.connect$.pipe(
      tap(() => service.playerEntersOsteria(player))
    );
  });
}

// a player creates a game
export function playerCreatesNewGame(
  service: ScoponeServerService,
  gameName: string
) {
  return service.playerEnteredOsteria$.pipe(
    // after the first player has enetered Osteria, it will create a new game
    tap(() => service.newGame(gameName))
  );
}

// players join a game
export function playersJoinTheGame(
  servicesAndPlayers: {
    service: ScoponeServerService;
    player: string;
  }[],
  gameName: string
) {
  return servicesAndPlayers.map(({ service, player }) => {
    return service.gameList$.pipe(
      // the player enters the game as soon as it receives the message that the game has been created
      filter(
        (list) =>
          !!list.find((g) => {
            return g.name === gameName;
          })
      ),
      take(1),
      tap(() => {
        service.addPlayerToGame(player, gameName);
      })
    );
  });
}

// close all the services
export function closeServices(services: ScoponeServerService[]) {
  services.forEach((s) => {
    s.close();
  });
}
