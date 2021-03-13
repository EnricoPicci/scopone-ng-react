import React from "react";

import { BrowserRouter } from "react-router-dom";

import "./App.css";
import { Game } from "./components/game/game";

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Game></Game>
      </div>
    </BrowserRouter>
  );
}

export default App;
