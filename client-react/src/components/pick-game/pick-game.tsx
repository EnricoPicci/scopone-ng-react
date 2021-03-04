import React from "react";
import { GameList } from "../game-list/game-list";
import { NewGame } from "../new-game/new-game";

export const PickGame = () => {
  return (
    <>
      <NewGame></NewGame>
      <GameList></GameList>
    </>
  );
};
