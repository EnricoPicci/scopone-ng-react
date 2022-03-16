import { interval } from "rxjs";
import { switchMap, tap, take, filter, delay } from "rxjs/operators";
import { environment } from "../../environments/environment.test";
import { ScoponeServerService } from "../../scopone-server.service";

// creates the names of 4 players
function playerNames(numOfPlayers = 4) {
  return new Array(numOfPlayers)
    .fill(null)
    .map((_, i) => `Player ${i} - ` + Date.now());
}

// creates the player names and their respective services
export function playersAndServices(numOfPlayers = 4, log = false) {
  const _playerNames = playerNames(numOfPlayers);
  const services = _playerNames.map(() => {
    const service = new ScoponeServerService();
    service.logMessages = log;
    return service;
  });
  return [_playerNames, services] as [string[], ScoponeServerService[]];
}

// connect all players - each connection is separated by a time interval to avoid jamming the WebSocket channel
export function connectServices(
  services: ScoponeServerService[],
  interalMs = 100
) {
  return interval(interalMs).pipe(
    switchMap((i) =>
      services[i].connect(environment.serverAddress).pipe(
        tap({
          next: () => {
            console.log(`Service${i} connected`);
          },
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
  playerNames: string[],
  services: ScoponeServerService[]
) {
  return services.map((service, i) => {
    const player = playerNames[i];
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
    // after a player enters the Osteria, it creates a new game
    tap(() => service.newGame(gameName))
  );
}

// notifies when a game has been created
export function gameCreated(service: ScoponeServerService, gameName: string) {
  return service.gameList$.pipe(
    // the player enters the game as soon as it receives the message that the game has been created
    filter(
      (list) =>
        !!list.find((g) => {
          return g.name === gameName;
        })
    ),
    take(1)
  );
}

// players join a game
export function playersJoinTheGame(
  playerNames: string[],
  services: ScoponeServerService[],
  gameName: string
) {
  return services.map((service, i) => {
    const player = playerNames[i];
    // the player enters the game as soon as it receives the message that the game has been created
    return gameCreated(service, gameName).pipe(
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

// a player starts a game with the first hand
export function playerStartsFirstHand(service: ScoponeServerService) {
  return service.canStartGame$.pipe(
    // a player starts the game after it receives the notification that it can start it
    tap(() => service.newHand()),
    take(1)
  );
}

// a player starts a game with the first hand and then, after some time, exits the Osteria
export function playersStartsFirstHandAndExits(service: ScoponeServerService) {
  return playerStartsFirstHand(service).pipe(
    // after some time
    delay(100),
    // exit the game
    tap(() => service.close())
  );
}

// close all the services
export function closeServices(services: ScoponeServerService[]) {
  services.forEach((s) => {
    s.close();
  });
}
