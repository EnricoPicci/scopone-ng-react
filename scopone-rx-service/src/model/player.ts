export type Player = {
  name: string;
  status: PlayerState;
};

export enum PlayerState {
  playerPlaying = "playing",
  playerLookingAtHandResult = "lookingAtHandResult",
  playerNotPlaying = "notPlayingAnyGame",
  playerLeftTheGame = "leftOsteriaMaybeMomentarely",
  playerObservingGames = "observingGames",
}
