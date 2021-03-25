import React, { ChangeEvent, FC, useContext, useEffect, useState } from "react";
import {
  Button,
  TextField,
  Card,
  CardHeader,
  CardContent,
  CardActions,
} from "@material-ui/core";

import "../style.css";
import { ServerContext } from "../../context/server-context";
import { useStyles } from "../style-material-ui";
import { ErrorContext } from "../../context/error-context";
import { tap } from "rxjs/operators";

export const SignIn: FC = () => {
  const [playerName, setPlayerName] = useState("");
  const server = useContext(ServerContext);
  const errorService = useContext(ErrorContext);

  const classes = useStyles();

  useEffect(() => {
    console.log("=======>>>>>>>>>>>>  Use Effect run in SignIn");

    // playerAlreadyInOsteria$ notifies if the Player is already in the Osteria and navigate to Error page
    const playerAlreadyInOsteria$ = server.playerIsAlreadyInOsteria$.pipe(
      tap((pName) => {
        errorService.setError(`Player "${pName}" is already in the Osteria`);
      })
    );

    const subscription = playerAlreadyInOsteria$.subscribe();

    return () => {
      console.log("Unsubscribe SignIn subscription");
      subscription.unsubscribe();
    };
  }, [server, errorService]);

  const handleChange = (
    event: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => {
    setPlayerName(event.target.value);
  };

  const keyPress = (e: { key: string }) => {
    if (e.key === "Enter") {
      enterOsteria();
    }
  };

  const enterOsteria = () => {
    if (!playerName.trim()) {
      errorService.setError("Please provide a name");
      return;
    }
    server.playerEntersOsteria(playerName);
  };

  return (
    <Card>
      {/* https://material-ui.com/customization/components/#overriding-styles-with-global-class-names */}
      {/* <CardHeader title="Player" classes={{ title: "header" }}></CardHeader> */}
      {/* https://material-ui.com/customization/components/#overriding-styles-with-class-names */}
      <CardHeader title="Player" className="header"></CardHeader>
      <CardContent>
        <div className={classes.root}>
          <TextField
            id="standard-full-width"
            label="Name"
            style={{ margin: 8 }}
            placeholder="Your name as player"
            helperText="Use the same name if you loose session and want to riconnect"
            fullWidth
            margin="normal"
            InputLabelProps={{
              shrink: true,
            }}
            onChange={handleChange}
            onKeyPress={keyPress}
          />
        </div>
      </CardContent>
      <CardActions>
        <Button size="small" onClick={enterOsteria}>
          Enter
        </Button>
      </CardActions>
    </Card>
  );
};
