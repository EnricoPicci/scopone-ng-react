import { FC } from "react";

import "./table.css";

export const Table: FC = () => {
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
                    <div className="player player-3">playerName 1_0</div>
                  </td>
                  <td></td>
                </tr>
                <tr className="table-row">
                  <td>
                    <div className="player player-1">playerName 0_0</div>
                  </td>
                  <td></td>
                  <td>
                    <div className="player player-2">playerName 0_1</div>
                  </td>
                </tr>
                <tr className="table-row">
                  <td></td>
                  <td>
                    <div className="player player-4">playerName 1_1</div>
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
