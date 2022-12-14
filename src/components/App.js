import {
  compareLocations,
  constructMatrix,
  getLocation,
  MATRIX_ROTATION_DIRECTIONS,
  rotateMatrix,
  updateMatrix,
} from "functional-game-utils";
import React, { useState } from "react";
import { createGlobalStyle, ThemeProvider } from "styled-components";
import Grid from "./Grid";
import testLevel from "../../assets/levels/test.txt";
import useKeyPress from "../hooks/useKeyPress";

const theme = {
  tileSize: 32,
};

const GlobalStyle = createGlobalStyle`
  * {
    box-sizing: border-box;
  }

  body {
    display: flex;
    justify-content: center;
    align-items: center;
  }
`;

const parseLevel = (levelText) => {
  const SECTION_DIV = "---";
  const SUB_SECTION_DIV = "***";
  const [metadataString, targetsString, findersString] =
    levelText.split(SECTION_DIV);

  const metadata = metadataString
    .trim()
    .split("\n")
    .map((value) => {
      const [width, height] = value
        .trim()
        .split(",")
        .map((val) => parseInt(val, 10));

      return { width, height };
    });

  const targets = targetsString
    .trim()
    .split(SUB_SECTION_DIV)
    .map((targetString) => targetString.trim().split("\n"))
    .map((target) => {
      const locationString = target.pop();
      const [row, col] = locationString
        .split(",")
        .map((val) => parseInt(val, 10));

      const location = {
        row,
        col,
      };

      const rows = target.map((row) => row.split(" "));

      return { location, rows };
    });

  const finders = findersString
    .trim()
    .split(SUB_SECTION_DIV)
    .map((val) => val.trim().split("\n"))
    .map((rows) => {
      return { rows: rows.map((row) => row.split(" ")) };
    });

  return { metadata, targets, finders };
};

const createTile = (location) => {
  return {
    revealed: false,
    target: false,
  };
};

const getShapeLocations = (shape) => {
  const shapeLocations = [];

  shape.rows.forEach((row, rowIndex) => {
    row.forEach((col, colIndex) => {
      if (col === "X") {
        shapeLocations.push({
          row: shape.location.row + rowIndex,
          col: shape.location.col + colIndex,
        });
      }
    });
  });

  return shapeLocations;
};

const isLocationInShape = (location, shape) => {
  const shapeLocations = getShapeLocations(shape);

  return shapeLocations.some((shapeLocation) =>
    compareLocations(shapeLocation, location)
  );
};

const createFromLevel = (levelText) => {
  const { metadata, targets } = parseLevel(levelText);

  return constructMatrix((location) => {
    let newTile = createTile(location);

    if (targets.some((target) => isLocationInShape(location, target))) {
      newTile.target = true;
    }

    return newTile;
  }, metadata[0]);
};

const getFindersFromLevel = (levelText) => {
  const { finders } = parseLevel(levelText);
  return finders;
};

const getTargetsFromLevel = (levelText) => {
  const { targets } = parseLevel(levelText);
  return targets;
};

const initialTiles = createFromLevel(testLevel);
const initialFinders = getFindersFromLevel(testLevel);
const initialTargets = getTargetsFromLevel(testLevel);

const App = () => {
  const [tiles, setTiles] = useState(initialTiles);
  const [finders, setFinders] = useState(initialFinders);
  const [targets, setTargets] = useState(initialTargets);
  const [actionCount, setActionCount] = useState(0);
  // 0, 1, 2, 3
  const [finderRotation, setFinderRotation] = useState(0);
  const [hoveredLocation, setHoveredLocation] = useState();
  useKeyPress({
    KeyR: () => {
      const newRotation = (finderRotation + 1) % 4;

      setFinderRotation(newRotation);
    },
  });

  let newRows = finders[0].rows;
  for (let i = 0; i < finderRotation; i += 1) {
    newRows = rotateMatrix(
      { direction: MATRIX_ROTATION_DIRECTIONS.CLOCKWISE },
      newRows
    );
  }

  const currentFinder = {
    rows: newRows,
  };

  return (
    <>
      <h1>Object Finder</h1>
      <Grid
        tiles={tiles}
        renderTile={(tile, location) => {
          let icon = "?";

          if (tile.revealed && tile.target) {
            icon = "X";
          } else if (tile.revealed) {
            icon = ".";
          }

          let finderLocations = [];

          if (hoveredLocation) {
            finderLocations = getShapeLocations({
              ...currentFinder,
              location: hoveredLocation,
            });
          }

          const isHovered = finderLocations.some((finderLocation) =>
            compareLocations(finderLocation, location)
          );

          return (
            <div
              style={{
                border: isHovered ? "1px solid black" : "1px solid transparent",
              }}
              key={JSON.stringify(location)}
              onMouseMove={() => setHoveredLocation(location)}
              onMouseLeave={() => setHoveredLocation()}
              onClick={() => {
                const finderLocations = getShapeLocations({
                  ...currentFinder,
                  location,
                });

                let newTiles = tiles;

                finderLocations.forEach((finderLocation) => {
                  const targetTile = getLocation(newTiles, finderLocation);

                  newTiles = updateMatrix(
                    finderLocation,
                    { ...targetTile, revealed: true },
                    newTiles
                  );
                });

                const firstFinder = finders[0];
                const newFinders = [...finders.slice(1), firstFinder];

                setActionCount(actionCount + 1);
                setTiles(newTiles);
                setFinders(newFinders);
                setFinderRotation(0);
              }}
            >
              {icon}
            </div>
          );
        }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "row",
        }}
      >
        <div style={{ marginRight: "1rem" }}>
          <h2>Your Pieces</h2>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
            }}
          >
            {finders.map((finder, index) => {
              return (
                <li key={index} style={{ borderBottom: "1px solid black" }}>
                  <Grid
                    tiles={finder.rows}
                    renderTile={(tile) => <div>{tile}</div>}
                  />
                </li>
              );
            })}
          </ul>
        </div>
        <div style={{ marginRight: "1rem" }}>
          <h2>Targets</h2>
          <ul
            style={{
              listStyle: "none",
              padding: 0,
            }}
          >
            {targets.map((target, index) => {
              return (
                <li key={index} style={{ borderBottom: "1px solid black" }}>
                  <Grid
                    tiles={target.rows}
                    renderTile={(tile) => <div>{tile}</div>}
                  />
                </li>
              );
            })}
          </ul>
        </div>
        <div>
          <h2>Actions</h2>
          <p>{actionCount}</p>
        </div>
      </div>
      <div style={{ maxWidth: "800px", lineHeight: "1.5rem" }}>
        <p>
          Find all the hidden targets in the grid. Click on the grid to use your
          pieces and reveal shapes on the grid. Cells with "?" are unrevealed,
          "." are empty, and "X" have one of your targets in them.
        </p>
        <p>Press "R" to rotate your currently selected piece.</p>
        <p>
          Try to reveal all of your targets in the fewest actions possible. An
          action is each time you use one of your pieces.
        </p>
      </div>
    </>
  );
};

const withProviders = (WrappedComponent) => {
  return () => {
    return (
      <ThemeProvider theme={theme}>
        <GlobalStyle />
        <WrappedComponent />
      </ThemeProvider>
    );
  };
};

export default withProviders(App);
