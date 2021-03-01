import React from "react";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import {
  Button,
  TextField,
  Card,
  CardHeader,
  CardContent,
  CardActions,
} from "@material-ui/core";

import "./sign-in.css";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: "flex",
      flexWrap: "wrap",
    },
    textField: {
      marginLeft: theme.spacing(1),
      marginRight: theme.spacing(1),
      //   width: "30ch",
    },
  })
);

const keyPress = (e) => {
  console.log("valueKKKKKKKKK", e.key);
  if (e.key === "Enter") {
    console.log("valueEEEEEEEEEE", e.target.value);
    // put the login here
  }
};

export default function SignIn() {
  const classes = useStyles();

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
            onKeyPress={keyPress}
          />
        </div>
      </CardContent>
      <CardActions>
        <Button size="small">Enter</Button>
      </CardActions>
    </Card>
  );
}
