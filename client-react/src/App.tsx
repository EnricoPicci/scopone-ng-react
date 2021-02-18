import React from "react";
import logo from "./logo.svg";
import "./App.css";
import { CardComponent } from "./components/card";
import { Card, Suits, Types } from "./scopone-rx-service/card";

function App() {
  const aCard: Card = {
    suit: Suits.COPPE,
    type: Types.FIVE,
  };
  return (
    <div className="App">
      {/* <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header> */}
      <CardComponent card={aCard}></CardComponent>
    </div>
  );
}

export default App;
