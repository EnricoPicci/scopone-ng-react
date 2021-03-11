import { FC } from "react";
import {
  PlayerState,
  Team,
} from "../../rx-services/scopone-rx-service/messages";

import "./table.css";

interface ITableProps {
  teams: [Team, Team];
  currentPlayerName: string;
}

export const Table: FC<ITableProps> = ({ teams, currentPlayerName }) => {
  const playerName = (tNum: number, pNum: number) => {
    let name = teams[tNum].Players[pNum] ? teams[tNum].Players[pNum].name : "-";
    name = playerLeft(tNum, pNum) ? `${name} (left the Osteria)` : name;
    name = isCurrentPlayer(tNum, pNum) ? `${name} (can play card)` : name;
    return name;
  };
  const playerLeft = (tNum: number, pNum: number) => {
    return teams && teams[tNum].Players[pNum]
      ? teams[tNum].Players[pNum].status === PlayerState.playerLeftTheGame
      : false;
  };
  const isCurrentPlayer = (tNum: number, pNum: number) => {
    return teams && teams[tNum].Players[pNum]
      ? teams[tNum].Players[pNum].name === currentPlayerName
      : false;
  };

  return (
    <>
      <div className="main">
        <div className="table">
          <div className="board">
            <table className="players-table">
              <tbody>
                <tr className="table-row">
                  <td></td>
                  <td>
                    <div
                      className={`player player-3 ${
                        playerLeft(1, 0) ? "player-absent" : ""
                      } ${isCurrentPlayer(1, 0) ? "current-player" : ""}`}
                    >
                      {playerName(1, 0)}
                    </div>
                  </td>
                  <td></td>
                </tr>
                <tr className="table-row">
                  <td>
                    <div
                      className={`player player-1 ${
                        playerLeft(0, 0) ? "player-absent" : ""
                      } ${isCurrentPlayer(0, 0) ? "current-player" : ""}`}
                    >
                      {playerName(0, 0)}
                    </div>
                  </td>
                  <td></td>
                  <td>
                    <div
                      className={`player player-2 ${
                        playerLeft(0, 1) ? "player-absent" : ""
                      } ${isCurrentPlayer(0, 1) ? "current-player" : ""}`}
                    >
                      {playerName(0, 1)}
                    </div>
                  </td>
                </tr>
                <tr className="table-row">
                  <td></td>
                  <td>
                    <div
                      className={`player player-4 ${
                        playerLeft(1, 1) ? "player-absent" : ""
                      } ${isCurrentPlayer(1, 1) ? "current-player" : ""}`}
                    >
                      {playerName(1, 1)}
                    </div>
                  </td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};
