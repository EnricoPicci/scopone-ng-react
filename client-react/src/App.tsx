import React from "react";
import "./App.css";
import { CardComponent } from "./components/card/card";
import { Card, Suits, Types } from "./scopone-rx-service/card";
import { Game } from "./components/game/game";

function App() {
  const aCard: Card = {
    suit: Suits.COPPE,
    type: Types.FIVE,
  };
  return (
    <div className="App">
      <Game></Game>
      <CardComponent card={aCard}></CardComponent>
    </div>
  );
}

export default App;
