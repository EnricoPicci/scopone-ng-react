import React from "react";
import logo from "./logo.svg";
import "./App.css";
import { CardComponent } from "./components/card/card";
import { Card, Suits, Types } from "./scopone-rx-service/card";
import SignIn from "./components/sign-in/sign-in";

function App() {
  const aCard: Card = {
    suit: Suits.COPPE,
    type: Types.FIVE,
  };
  return (
    <div className="App">
      <SignIn></SignIn>
      <CardComponent card={aCard}></CardComponent>
    </div>
  );
}

export default App;
