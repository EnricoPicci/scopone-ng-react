import React from "react";

import { BrowserRouter } from "react-router-dom";
import {
  ThemeProvider,
  unstable_createMuiStrictModeTheme,
} from "@material-ui/core/styles";

import "./App.css";
import { Game } from "./components/game/game";

// ThemeProvider added to avoid "Warning: findDOMNode is deprecated in StrictMode" issued with Material Dialogue
// https://stackoverflow.com/a/64135466/5699993
const theme = unstable_createMuiStrictModeTheme();

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <div className="App">
          <Game></Game>
        </div>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
