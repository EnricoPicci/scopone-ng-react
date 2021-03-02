import React from "react";

import { BrowserRouter } from "react-router-dom";

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
    <BrowserRouter>
      <div className="App">
        <Game></Game>
        <CardComponent card={aCard}></CardComponent>
      </div>
    </BrowserRouter>
  );
}

export default App;
