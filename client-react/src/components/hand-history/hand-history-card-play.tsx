import React, { FC } from "react";
import {
  Box,
  Collapse,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@material-ui/core";
import KeyboardArrowDownIcon from "@material-ui/icons/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@material-ui/icons/KeyboardArrowUp";
import { CardPlay } from "../../../../scopone-rx-service/src/model/player-view";
import { Card } from "../card/card";

interface IHandHistoryCardPlayProps {
  cardPlay: CardPlay;
  height: string;
}

export const HandHistoryCardPlay: FC<IHandHistoryCardPlayProps> = (props) => {
  const { cardPlay, height } = props;
  const [open, setOpen] = React.useState(false);

  return (
    <React.Fragment>
      <TableRow>
        <TableCell component="th" scope="row">
          {cardPlay.player}
        </TableCell>
        <TableCell align="right">
          {cardPlay.table?.map((card, j) => (
            <Card card={card} height={height} key={j}></Card>
          ))}
        </TableCell>
        <TableCell align="right">
          <Card card={cardPlay.cardPlayed} height={height}></Card>
        </TableCell>
        <TableCell align="right">
          {cardPlay.cardsTaken?.map((card, j) => (
            <Card card={card} height={height} key={j}></Card>
          ))}
        </TableCell>
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
      </TableRow>
      <TableRow style={{ background: "azure" }}>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={5}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box margin={1}>
              <Typography variant="h6" gutterBottom component="div">
                Situa (players cards)
              </Typography>
              <Table size="small" aria-label="Players cards">
                <colgroup>
                  <col style={{ width: "30%" }} />
                  <col style={{ width: "70%" }} />
                </colgroup>
                <TableHead>
                  <TableRow>
                    <TableCell>Player</TableCell>
                    <TableCell>Cards</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(cardPlay.playersDecks).map(([name, deck]) => (
                    <TableRow key={name}>
                      <TableCell>{name}</TableCell>
                      <TableCell>
                        {deck?.map((card, j) => (
                          <Card card={card} height={height} key={j}></Card>
                        ))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
};
