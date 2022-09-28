import {
  compareLocations,
  constructMatrix,
  getLocation,
  updateMatrix,
} from "functional-game-utils";
import React, { useState } from "react";
import { createGlobalStyle, ThemeProvider } from "styled-components";
import Grid from "./Grid";
import testLevel from "../../assets/levels/test.txt";

const theme = {
  tileSize: 32,
};

const GlobalStyle = createGlobalStyle`
  * {
    box-sizing: border-box;
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
  const { metadata, targets, finders } = parseLevel(levelText);

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

const initialTiles = createFromLevel(testLevel);
const initialFinders = getFindersFromLevel(testLevel);

const App = () => {
  const [tiles, setTiles] = useState(initialTiles);
  const [finders, setFinders] = useState(initialFinders);
  const [hoveredLocation, setHoveredLocation] = useState();

  return (
    <>
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
              ...finders[0],
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
                  ...finders[0],
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

                setTiles(newTiles);
              }}
            >
              {icon}
            </div>
          );
        }}
      />
      <ul>
        {finders.map((finder, index) => {
          return (
            <li key={index}>
              <Grid
                tiles={finder.rows}
                renderTile={(tile) => <div>{tile}</div>}
              />
            </li>
          );
        })}
      </ul>
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
