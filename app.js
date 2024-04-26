const grid = document.getElementById("grid"),
  background = grid.querySelector(".background"), // for grid design
  playground = grid.querySelector(".playground"); // for inserting block

// Get the with of Cells from CSS.. Depends on Screen Size
let unit = parseFloat(getComputedStyle(grid).getPropertyValue("--unit"));
// Create the Background of the game
let colsCount = parseFloat(
    getComputedStyle(grid).getPropertyValue("--cols-count")
  ),
  rowsCount = parseFloat(
    getComputedStyle(grid).getPropertyValue("--rows-count")
  );
function displayBackground() {
  unit = parseFloat(getComputedStyle(grid).getPropertyValue("--unit"));
  // remove old line then creat new
  let horizontalLines = document.getElementsByClassName("horizontal-line"),
    verticalLines = document.getElementsByClassName("vertical-line");
  if (horizontalLines.length > 0) {
    lines = Array.from(horizontalLines).forEach((line) => line.remove());
  }
  if (verticalLines.length > 0) {
    lines = Array.from(verticalLines).forEach((line) => line.remove());
  }
  for (let i = 1; i < rowsCount; i++) {
    let horizontalLine = document.createElement("div");
    horizontalLine.className = "horizontal-line";
    horizontalLine.style.bottom = `${i * unit}px`;
    background.append(horizontalLine);
  }
  for (let i = 1; i < colsCount; i++) {
    let verticalLine = document.createElement("div");
    verticalLine.className = "vertical-line";
    verticalLine.style.left = `${i * unit}px`;
    background.append(verticalLine);
  }
}
displayBackground();
window.addEventListener("resize", displayBackground);

// Create Grid from arrs to save the position of block
let gridCols; // gridCols[x,y]
function resetGrid() {
  gridCols = new Array();
  // create cols
  for (let i = 0; i < colsCount; i++) {
    let col = new Array();
    // create Empty Cells in every col
    for (let i = 0; i < rowsCount; i++) {
      col.push(undefined);
    }
    gridCols.push(col);
  }
}

// Need Variables In Game
let colIsFull = false, // will be changed to true if the is no space for the current block
  difficulty = 1,
  fallTime = 1000 / difficulty;

// Check If The Cells Are Stucked Or Not Depending on Index {x: -, y: -}
function ifStucked(direction, ...cellsIndex) {
  let stucked = false;
  if (direction === "top") {
    for (let i = 0; i < cellsIndex.length; i++) {
      if (gridCols[cellsIndex[i].x][cellsIndex[i].y - 1] !== undefined) {
        stucked = true;
        break;
      }
    }
  } else if (direction === "right") {
    for (let i = 0; i < cellsIndex.length; i++) {
      if (
        cellsIndex[i].x >= colsCount - 1 ||
        gridCols[cellsIndex[i].x + 1][cellsIndex[i].y] !== undefined
      ) {
        stucked = true;
        break;
      }
    }
  } else if (direction === "down") {
    for (let i = 0; i < cellsIndex.length; i++) {
      if (
        cellsIndex[i].y == rowsCount - 1 ||
        gridCols[cellsIndex[i].x][cellsIndex[i].y + 1] !== undefined
      ) {
        stucked = true;
        break;
      }
    }
  } else if (direction === "left") {
    for (let i = 0; i < cellsIndex.length; i++) {
      if (
        cellsIndex[i].x <= 0 ||
        gridCols[cellsIndex[i].x - 1][cellsIndex[i].y] !== undefined
      ) {
        stucked = true;
        break;
      }
    }
  }
  return stucked;
}

// Create the (Square) block
class Smashboy {
  constructor(color) {
    this.color = color;
    this.cells = new Array(); // cells will be added on creating the block
    this.cellsShadow = new Array(); // shadow will be added on creating the block
    // the position of every cell [x,y]
    this.cellsPosByPixel = [
      { x: 5 * unit, y: unit * -1 },
      { x: 6 * unit, y: unit * -1 },
      { x: 5 * unit, y: 0 },
      { x: 6 * unit, y: 0 },
    ];
    this.cellsPosByIndex = [
      { x: 5, y: -1 },
      { x: 6, y: -1 },
      { x: 5, y: 0 },
      { x: 6, y: 0 },
    ];
    this.cellsShadowIndex = [];
    this.autoFall; // interval to fall down
    this.stopped = false;
  }
  // Create Block And Add It To PlayGround
  createBlock() {
    // check if the col is full then end the game else append the block and create the shadow
    this.cellsPosByIndex.forEach((pos) => {
      if (gridCols[pos.x][pos.y] !== undefined) {
        colIsFull = true;
      }
    });
    // Check If Losed Or Not
    if (colIsFull) {
      endGame();
    } else {
      // create the Cells
      for (let i = 0; i < 4; i++) {
        let cell = document.createElement("div");

        cell.classList = "cell";
        cell.style.backgroundColor = this.color;

        playground.append(cell);
        this.cells.push(cell);
      }
      this.changePos();
      // create the Cells Shadow
      for (let i = 0; i < 4; i++) {
        let shadow = document.createElement("div");

        shadow.classList = "cell-shadow";
        shadow.style.backgroundColor = this.color;

        background.append(shadow);
        this.cellsShadow.push(shadow);
      }
      this.setShadow();
      this.startMove();
      holdedBefore = false;
    }
  }
  // Show the Block In (Next & Hold)
  showInContainer(containerId) {
    // Clone the position
    let cellsNewPos = new Array();
    this.cellsPosByIndex.forEach((pos) => {
      cellsNewPos.push({ ...pos });
    });
    // Change the position to start in x = 0, y = 0
    function increaseY() {
      cellsNewPos.forEach((pos) => {
        if (pos.y < 0) {
          cellsNewPos.forEach((position) => {
            position.y += 1;
          });
          increaseY();
        }
      });
    }
    increaseY();
    cellsNewPos.forEach((pos) => {
      pos.x -= 10;
    });
    function increaseX() {
      cellsNewPos.forEach((pos) => {
        if (pos.x < 0) {
          cellsNewPos.forEach((position) => {
            position.x += 1;
          });
          increaseX();
        }
      });
    }
    increaseX();
    // Create cells
    let container = document.getElementById(containerId);
    container.innerHTML = "";
    for (let i = 0; i < 4; i++) {
      let cell = document.createElement("div");
      cell.classList.add("cell");
      cell.style.backgroundColor = this.color;
      cell.style.left = cellsNewPos[i].x * unit + "px";
      cell.style.top = cellsNewPos[i].y * unit + "px";
      container.appendChild(cell);
    }
    // Change Container Width
    let cellsXPos = new Array();
    cellsNewPos.forEach((pos) => {
      cellsXPos.push(parseFloat(pos.x));
    });
    let maxCellsInRow = new Set(cellsXPos);
    container.style.width = `calc(${maxCellsInRow.size} * var(--unit))`;
    // Change Container Height
    let cellsYPos = new Array();
    cellsNewPos.forEach((pos) => {
      cellsYPos.push(parseFloat(pos.y));
    });
    let maxCellsInCol = new Set(cellsYPos);
    container.style.height = `calc(${maxCellsInCol.size} * var(--unit))`;
  }
  // Change The Shadow Position
  setShadow() {
    // set default value for shadow pos
    for (let i = 0; i < 4; i++) {
      let cellx = `${this.cellsPosByIndex[i].x}`,
        celly = `${this.cellsPosByIndex[i].y}`,
        pos = {
          x: parseInt(cellx),
          y: parseInt(celly),
        };
      this.cellsShadowIndex[i] = pos;
    }
    // check for the height cell
    for (let i = 0; i < 4; i++) {
      if (
        (gridCols[this.cellsShadowIndex[i].x][this.cellsShadowIndex[i].y] ===
          undefined ||
          this.cells.includes(
            gridCols[this.cellsShadowIndex[i].x][this.cellsShadowIndex[i].y]
          )) &&
        this.cellsShadowIndex[i].y < rowsCount
      ) {
        if (i == 3) {
          this.cellsShadowIndex.forEach((shadowPos) => {
            shadowPos.y += 1;
          });
          i = -1;
        }
      } else {
        this.cellsShadowIndex.forEach((shadowPos) => {
          shadowPos.y -= 1;
        });
        this.cellsShadowIndex.forEach((shadowPos, index) => {
          this.cellsShadow[index].style.left = shadowPos.x * unit + "px";
          this.cellsShadow[index].style.top = shadowPos.y * unit + "px";
        });
        break;
      }
    }
  }

  startMove() {
    // Auto Fall Interval
    this.autoFall = setInterval(() => {
      this.move("down");
    }, fallTime);
  }
  resetFallInterval() {
    clearInterval(this.autoFall);
    this.startMove();
  }
  stopBlock() {
    this.stopped = true;
    // clear fall interval
    clearInterval(this.autoFall);
    // remove the shadow from body
    this.cellsShadow.forEach((cellShadow) => {
      cellShadow.remove();
    });
    // reset Fall Time if (instant fall) used
    fallTime = 1000 / difficulty;
    // create new block
    checkIfCompleted();
    newBlock();
  }
  removeBlock() {
    this.cells.forEach((cell) => {
      cell.remove();
    });
    this.cellsShadow.forEach((shadow) => {
      shadow.remove();
    });
    this.cellsPosByIndex.forEach((pos) => {
      gridCols[pos.x][pos.y] = undefined;
    });
    clearInterval(this.autoFall);
  }

  /*  remove the block cells from (gridCols)
      => so you can change the position and add cells again */
  removeFromGrid() {
    this.cells.forEach((cell, index) => {
      gridCols[this.cellsPosByIndex[index].x][this.cellsPosByIndex[index].y] =
        undefined;
    });
  }
  // modify (cellsPosByPx) , (style.left & style.top) & (gridCols) depending on (cellsPosByIndex)
  changePos() {
    this.cellsPosByIndex.forEach((cellPos, index) => {
      // modify (gridCols)
      gridCols[cellPos.x][cellPos.y] = this.cells[index];
      // modify (cellsPosByPx)
      this.cellsPosByPixel[index].x = cellPos.x * unit;
      this.cellsPosByPixel[index].y = cellPos.y * unit;
      // modify (style)
      this.cells[index].style.left = this.cellsPosByPixel[index].x + "px";
      this.cells[index].style.top = this.cellsPosByPixel[index].y + "px";
    });
  }

  move(direction) {
    // Move To Specific Direction If The Space Is Free And The Block Didn't Reach To Bottom
    if (direction === "rotate") {
      this.rotate();
    } else if (direction === "down") {
      if (this.stuckedDown()) {
        this.stopBlock();
      } else {
        // remove the block from the grid
        this.removeFromGrid();
        // modify the position to the new position
        this.cellsPosByIndex.forEach((cellPox) => {
          cellPox.y += 1;
        });
        // refresh the postion
        this.changePos();
      }
    }
    if (direction === "left") {
      if (this.stuckedLeft()) {
        return;
      } else {
        // remove the block from the grid
        this.removeFromGrid();
        // modify the position to the new position
        this.cellsPosByIndex.forEach((cellPox) => {
          cellPox.x -= 1;
        });
        // refresh the postion
        this.changePos();
      }
    }
    if (direction === "right") {
      if (this.stuckedRight()) {
        return;
      } else {
        // remove the block from the grid
        this.removeFromGrid();
        // modify the position to the new position
        this.cellsPosByIndex.forEach((cellPox) => {
          cellPox.x += 1;
        });
        // refresh the postion
        this.changePos();
      }
    }
    // reposition the shadow
    this.setShadow();
  }
  rotate() {
    return;
  }

  stuckedDown() {
    return ifStucked("down", this.cellsPosByIndex[2], this.cellsPosByIndex[3]);
  }
  stuckedLeft() {
    return ifStucked("left", this.cellsPosByIndex[0], this.cellsPosByIndex[2]);
  }
  stuckedRight() {
    return ifStucked("right", this.cellsPosByIndex[1], this.cellsPosByIndex[3]);
  }
}

// Create the (Row) block
class Hero extends Smashboy {
  constructor(color) {
    super(color);
    this.cells = new Array(); // cells will be added on creating the block
    // the position of every cell [x,y]
    this.cellsPosByPixel = [
      { x: 4 * unit, y: 0 },
      { x: 5 * unit, y: 0 },
      { x: 6 * unit, y: 0 },
      { x: 7 * unit, y: 0 },
    ];
    this.cellsPosByIndex = [
      { x: 4, y: 0 },
      { x: 5, y: 0 },
      { x: 6, y: 0 },
      { x: 7, y: 0 },
    ];
    this.cellsShadowIndex = [];
    this.autoFall; // interval to fall down
    this.stopped = false;
    this.angle = 0; // used for (rotate) function
  }

  // rotate function
  rotate() {
    // remove the block from the grid
    this.removeFromGrid();

    if (this.angle == 0 || this.angle == 180) {
      // switch from horizontal to vertical

      /* if the space is free aroun cell[1] the rotate around it
      else if the space is free aroun cell[2] the rotate around it
         else do nothing */
      if (
        gridCols[this.cellsPosByIndex[1].x][this.cellsPosByIndex[1].y + 1] ==
          undefined &&
        gridCols[this.cellsPosByIndex[1].x][this.cellsPosByIndex[1].y - 1] ==
          undefined &&
        gridCols[this.cellsPosByIndex[1].x][this.cellsPosByIndex[1].y - 2] ==
          undefined &&
        this.cellsPosByIndex[1].y < rowsCount - 1
      ) {
        this.cellsPosByIndex[0].x += 1;
        this.cellsPosByIndex[0].y += 1;

        this.cellsPosByIndex[2].x -= 1;
        this.cellsPosByIndex[2].y -= 1;

        this.cellsPosByIndex[3].x -= 2;
        this.cellsPosByIndex[3].y -= 2;
      } else if (
        gridCols[this.cellsPosByIndex[2].x][this.cellsPosByIndex[2].y + 1] ==
          undefined &&
        gridCols[this.cellsPosByIndex[2].x][this.cellsPosByIndex[2].y - 1] ==
          undefined &&
        gridCols[this.cellsPosByIndex[2].x][this.cellsPosByIndex[2].y - 2] ==
          undefined &&
        this.cellsPosByIndex[2].y < rowsCount - 1
      ) {
        this.cellsPosByIndex[0].x += 2;
        this.cellsPosByIndex[0].y += 1;

        this.cellsPosByIndex[1].x += 1;

        this.cellsPosByIndex[2].y -= 1;

        this.cellsPosByIndex[3].x -= 1;
        this.cellsPosByIndex[3].y -= 2;
      }
    } else {
      // switch from vertical to horizontal

      /* if the space is free aroun cell[1] the rotate around it
      else if the space is free aroun cell[0] the rotate around it
      else do nothing */
      if (
        gridCols[this.cellsPosByIndex[1].x - 1][this.cellsPosByIndex[1].y] ==
          undefined &&
        gridCols[this.cellsPosByIndex[1].x + 1][this.cellsPosByIndex[1].y] ==
          undefined &&
        gridCols[this.cellsPosByIndex[1].x + 2][this.cellsPosByIndex[1].y] ==
          undefined
      ) {
        this.cellsPosByIndex[0].x -= 1;
        this.cellsPosByIndex[0].y -= 1;

        this.cellsPosByIndex[2].x += 1;
        this.cellsPosByIndex[2].y += 1;

        this.cellsPosByIndex[3].x += 2;
        this.cellsPosByIndex[3].y += 2;
      } else if (
        gridCols[this.cellsPosByIndex[0].x - 1][this.cellsPosByIndex[0].y] ==
          undefined &&
        gridCols[this.cellsPosByIndex[0].x + 1][this.cellsPosByIndex[0].y] ==
          undefined &&
        gridCols[this.cellsPosByIndex[0].x + 2][this.cellsPosByIndex[0].y] ==
          undefined
      ) {
        this.cellsPosByIndex[0].x -= 1;

        this.cellsPosByIndex[1].y += 1;

        this.cellsPosByIndex[2].x += 1;
        this.cellsPosByIndex[2].y += 2;

        this.cellsPosByIndex[3].x += 2;
        this.cellsPosByIndex[3].y += 3;
      }
    }
    // refresh the position
    this.changePos();
    // change the angle
    this.angle += 90;
    if (this.angle == 360) {
      this.angle = 0;
    }
  }

  stuckedDown() {
    if (this.angle == 0 || this.angle == 180) {
      return ifStucked("down", ...this.cellsPosByIndex);
    } else {
      return ifStucked("down", this.cellsPosByIndex[0]);
    }
  }
  stuckedLeft() {
    if (this.angle == 0 || this.angle == 180) {
      return ifStucked("left", this.cellsPosByIndex[0]);
    } else {
      return ifStucked("left", ...this.cellsPosByIndex);
    }
  }
  stuckedRight() {
    if (this.angle == 0 || this.angle == 180) {
      return ifStucked("right", this.cellsPosByIndex[3]);
    } else {
      return ifStucked("right", ...this.cellsPosByIndex);
    }
  }
}

// Create the (wasd) block
class Teewee extends Smashboy {
  constructor(color) {
    super(color);
    this.cells = new Array(); // cells will be added on creating the block
    // the position of every cell [x,y]
    this.cellsPosByPixel = [
      { x: 5 * unit, y: -1 * unit },
      { x: 4 * unit, y: 0 },
      { x: 5 * unit, y: 0 },
      { x: 6 * unit, y: 0 },
    ];
    this.cellsPosByIndex = [
      { x: 5, y: -1 },
      { x: 4, y: 0 },
      { x: 5, y: 0 },
      { x: 6, y: 0 },
    ];
    this.cellsShadowIndex = [];
    this.autoFall; // interval to fall down
    this.stopped = false;
    this.angle = 0; // used for (rotate) function
  }

  rotate() {
    // rotate with Clockwise

    // remove the block from the grid
    this.removeFromGrid();

    // save the current position
    let savedIndexs = new Array();
    this.cellsPosByIndex.forEach((pos) => {
      savedIndexs.push({ ...pos });
    });

    // Change Position By Index
    /* Used (this.cellsPosByIndex[-].x) in conditions to prevent setting values on:
     (gridCols[-n]) , (gridCols[colsCount + n]) or (gridCols[-][rowsCount + n]) */
    if (this.angle == 0 && this.cellsPosByIndex[1].y < rowsCount - 1) {
      // W cell
      this.cellsPosByIndex[0].x += 1;
      this.cellsPosByIndex[0].y += 1;
      // A cell
      this.cellsPosByIndex[1].x += 1;
      this.cellsPosByIndex[1].y -= 1;
      // D cell
      this.cellsPosByIndex[3].x -= 1;
      this.cellsPosByIndex[3].y += 1;
    } else if (this.angle == 90 && this.cellsPosByIndex[1].x > 0) {
      // W cell
      this.cellsPosByIndex[0].x -= 1;
      this.cellsPosByIndex[0].y += 1;
      // A cell
      this.cellsPosByIndex[1].x += 1;
      this.cellsPosByIndex[1].y += 1;
      // D cell
      this.cellsPosByIndex[3].x -= 1;
      this.cellsPosByIndex[3].y -= 1;
    } else if (this.angle == 180) {
      // W cell
      this.cellsPosByIndex[0].x -= 1;
      this.cellsPosByIndex[0].y -= 1;
      // A cell
      this.cellsPosByIndex[1].x -= 1;
      this.cellsPosByIndex[1].y += 1;
      // D cell
      this.cellsPosByIndex[3].x += 1;
      this.cellsPosByIndex[3].y -= 1;
    } else if (this.angle == 270 && this.cellsPosByIndex[1].x < colsCount - 1) {
      // W cell
      this.cellsPosByIndex[0].x += 1;
      this.cellsPosByIndex[0].y -= 1;
      // A cell
      this.cellsPosByIndex[1].x -= 1;
      this.cellsPosByIndex[1].y -= 1;
      // D cell
      this.cellsPosByIndex[3].x += 1;
      this.cellsPosByIndex[3].y += 1;
    } else {
      // no rotate so reduce the angle because it will be increased in the end of the methode
      this.angle -= 90;
    }

    // if the block is stucked get the old postion back
    for (let i = 0; i < this.cellsPosByIndex.length; i++) {
      if (
        gridCols[this.cellsPosByIndex[i].x][this.cellsPosByIndex[i].y] !==
        undefined
      ) {
        this.cellsPosByIndex = savedIndexs;
        this.angle -= 90;
        break;
      }
    }

    // refresh the position
    this.changePos();
    // Change The Angle
    this.angle += 90;
    if (this.angle == 360) {
      this.angle = 0;
    }
  }

  stuckedDown() {
    switch (this.angle) {
      case 0:
        return ifStucked(
          "down",
          this.cellsPosByIndex[1],
          this.cellsPosByIndex[2],
          this.cellsPosByIndex[3]
        );
      case 90:
        return ifStucked(
          "down",
          this.cellsPosByIndex[0],
          this.cellsPosByIndex[3]
        );
      case 180:
        return ifStucked(
          "down",
          this.cellsPosByIndex[0],
          this.cellsPosByIndex[1],
          this.cellsPosByIndex[3]
        );
      case 270:
        return ifStucked(
          "down",
          this.cellsPosByIndex[0],
          this.cellsPosByIndex[1]
        );
    }
  }
  stuckedLeft() {
    switch (this.angle) {
      case 0:
        return ifStucked(
          "left",
          this.cellsPosByIndex[0],
          this.cellsPosByIndex[1]
        );
      case 90:
        return ifStucked(
          "left",
          this.cellsPosByIndex[1],
          this.cellsPosByIndex[2],
          this.cellsPosByIndex[3]
        );
      case 180:
        return ifStucked(
          "left",
          this.cellsPosByIndex[0],
          this.cellsPosByIndex[3]
        );
      case 270:
        return ifStucked(
          "left",
          this.cellsPosByIndex[0],
          this.cellsPosByIndex[1],
          this.cellsPosByIndex[3]
        );
    }
  }
  stuckedRight() {
    switch (this.angle) {
      case 0:
        return ifStucked(
          "right",
          this.cellsPosByIndex[0],
          this.cellsPosByIndex[3]
        );
      case 90:
        return ifStucked(
          "right",
          this.cellsPosByIndex[0],
          this.cellsPosByIndex[1],
          this.cellsPosByIndex[3]
        );
      case 180:
        return ifStucked(
          "right",
          this.cellsPosByIndex[0],
          this.cellsPosByIndex[1]
        );
      case 270:
        return ifStucked(
          "right",
          this.cellsPosByIndex[1],
          this.cellsPosByIndex[2],
          this.cellsPosByIndex[3]
        );
    }
  }
}

// Create the (Orange Ricky) Block
class OrangeRicky extends Smashboy {
  constructor(color) {
    super(color);
    this.cells = new Array(); // cells will be added on creating the block
    // the position of every cell [x,y]
    this.cellsPosByPixel = [
      { x: 4 * unit, y: 0 },
      { x: 5 * unit, y: 0 },
      { x: 6 * unit, y: 0 },
      { x: 6 * unit, y: -1 * unit },
    ];
    this.cellsPosByIndex = [
      { x: 4, y: 0 },
      { x: 5, y: 0 },
      { x: 6, y: 0 },
      { x: 6, y: -1 },
    ];
    this.cellsShadowIndex = [];
    this.autoFall; // interval to fall down
    this.stopped = false;
    this.angle = 0; // used for (rotate) function
  }

  rotate() {
    // rotate with Clockwise

    // remove the block from the grid
    this.removeFromGrid();

    // save the current position
    let savedIndexs = new Array();
    this.cellsPosByIndex.forEach((pos) => {
      savedIndexs.push({ ...pos });
    });

    // Change Position By Index
    /* Used (this.cellsPosByIndex[-].x) in conditions to prevent setting values on:
     (gridCols[-n]) , (gridCols[colsCount + n]) or (gridCols[-][rowsCount + n]) */
    if (this.angle == 0 && this.cellsPosByIndex[0].y < rowsCount - 1) {
      this.cellsPosByIndex[0].x += 1;
      this.cellsPosByIndex[0].y -= 1;

      this.cellsPosByIndex[2].x -= 1;
      this.cellsPosByIndex[2].y += 1;

      this.cellsPosByIndex[3].y += 2;
    } else if (this.angle == 90 && this.cellsPosByIndex[0].x > 0) {
      this.cellsPosByIndex[0].x += 1;
      this.cellsPosByIndex[0].y += 1;

      this.cellsPosByIndex[2].x -= 1;
      this.cellsPosByIndex[2].y -= 1;

      this.cellsPosByIndex[3].x -= 2;
    } else if (this.angle == 180) {
      this.cellsPosByIndex[0].x -= 1;
      this.cellsPosByIndex[0].y += 1;

      this.cellsPosByIndex[2].x += 1;
      this.cellsPosByIndex[2].y -= 1;

      this.cellsPosByIndex[3].y -= 2;
    } else if (this.angle == 270 && this.cellsPosByIndex[0].x < colsCount - 1) {
      // W cell
      this.cellsPosByIndex[0].x -= 1;
      this.cellsPosByIndex[0].y -= 1;
      // A cell
      this.cellsPosByIndex[2].x += 1;
      this.cellsPosByIndex[2].y += 1;
      // D cell
      this.cellsPosByIndex[3].x += 2;
    } else {
      // no rotate so reduce the angle because it will be increased in the end of the methode
      this.angle -= 90;
    }

    // if the block is stucked get the old postion back
    for (let i = 0; i < this.cellsPosByIndex.length; i++) {
      if (
        gridCols[this.cellsPosByIndex[i].x][this.cellsPosByIndex[i].y] !==
        undefined
      ) {
        this.cellsPosByIndex = savedIndexs;
        this.angle -= 90;
        break;
      }
    }

    // refresh the position
    this.changePos();
    // Change The Angle
    this.angle += 90;
    if (this.angle == 360) {
      this.angle = 0;
    }
  }

  stuckedDown() {
    switch (this.angle) {
      case 0:
        return ifStucked(
          "down",
          this.cellsPosByIndex[0],
          this.cellsPosByIndex[1],
          this.cellsPosByIndex[2]
        );
      case 90:
        return ifStucked(
          "down",
          this.cellsPosByIndex[2],
          this.cellsPosByIndex[3]
        );
      case 180:
        return ifStucked(
          "down",
          this.cellsPosByIndex[0],
          this.cellsPosByIndex[1],
          this.cellsPosByIndex[3]
        );
      case 270:
        return ifStucked(
          "down",
          this.cellsPosByIndex[0],
          this.cellsPosByIndex[3]
        );
    }
  }
  stuckedLeft() {
    switch (this.angle) {
      case 0:
        return ifStucked(
          "left",
          this.cellsPosByIndex[0],
          this.cellsPosByIndex[3]
        );
      case 90:
        return ifStucked(
          "left",
          this.cellsPosByIndex[0],
          this.cellsPosByIndex[1],
          this.cellsPosByIndex[2]
        );
      case 180:
        return ifStucked(
          "left",
          this.cellsPosByIndex[2],
          this.cellsPosByIndex[3]
        );
      case 270:
        return ifStucked(
          "left",
          this.cellsPosByIndex[0],
          this.cellsPosByIndex[1],
          this.cellsPosByIndex[3]
        );
    }
  }
  stuckedRight() {
    switch (this.angle) {
      case 0:
        return ifStucked(
          "right",
          this.cellsPosByIndex[2],
          this.cellsPosByIndex[3]
        );
      case 90:
        return ifStucked(
          "right",
          this.cellsPosByIndex[0],
          this.cellsPosByIndex[1],
          this.cellsPosByIndex[3]
        );
      case 180:
        return ifStucked(
          "right",
          this.cellsPosByIndex[0],
          this.cellsPosByIndex[3]
        );
      case 270:
        return ifStucked(
          "right",
          this.cellsPosByIndex[0],
          this.cellsPosByIndex[1],
          this.cellsPosByIndex[2]
        );
    }
  }
}

// Create the (Blue Ricky) Block
class BlueRicky extends Smashboy {
  constructor(color) {
    super(color);
    this.cells = new Array(); // cells will be added on creating the block
    // the position of every cell [x,y]
    this.cellsPosByPixel = [
      { x: 4 * unit, y: 0 },
      { x: 5 * unit, y: 0 },
      { x: 6 * unit, y: 0 },
      { x: 4 * unit, y: -1 * unit },
    ];
    this.cellsPosByIndex = [
      { x: 4, y: 0 },
      { x: 5, y: 0 },
      { x: 6, y: 0 },
      { x: 4, y: -1 },
    ];
    this.cellsShadowIndex = [];
    this.autoFall; // interval to fall down
    this.stopped = false;
    this.angle = 0; // used for (rotate) function
  }

  rotate() {
    // rotate with Clockwise

    // remove the block from the grid
    this.removeFromGrid();

    // save the current position
    let savedIndexs = new Array();
    this.cellsPosByIndex.forEach((pos) => {
      savedIndexs.push({ ...pos });
    });

    // Change Position By Index
    /* Used (this.cellsPosByIndex[-].x) in conditions to prevent setting values on:
     (gridCols[-n]) , (gridCols[colsCount + n]) or (gridCols[-][rowsCount + n]) */
    if (this.angle == 0 && this.cellsPosByIndex[0].y < rowsCount - 1) {
      this.cellsPosByIndex[0].x += 1;
      this.cellsPosByIndex[0].y -= 1;

      this.cellsPosByIndex[2].x -= 1;
      this.cellsPosByIndex[2].y += 1;

      this.cellsPosByIndex[3].x += 2;
    } else if (this.angle == 90 && this.cellsPosByIndex[0].x > 0) {
      this.cellsPosByIndex[0].x += 1;
      this.cellsPosByIndex[0].y += 1;

      this.cellsPosByIndex[2].x -= 1;
      this.cellsPosByIndex[2].y -= 1;

      this.cellsPosByIndex[3].y += 2;
    } else if (this.angle == 180) {
      this.cellsPosByIndex[0].x -= 1;
      this.cellsPosByIndex[0].y += 1;

      this.cellsPosByIndex[2].x += 1;
      this.cellsPosByIndex[2].y -= 1;

      this.cellsPosByIndex[3].x -= 2;
    } else if (this.angle == 270 && this.cellsPosByIndex[0].x < colsCount - 1) {
      // W cell
      this.cellsPosByIndex[0].x -= 1;
      this.cellsPosByIndex[0].y -= 1;
      // A cell
      this.cellsPosByIndex[2].x += 1;
      this.cellsPosByIndex[2].y += 1;
      // D cell
      this.cellsPosByIndex[3].y -= 2;
    } else {
      // no rotate so reduce the angle because it will be increased in the end of the methode
      this.angle -= 90;
    }

    // if the block is stucked get the old postion back
    for (let i = 0; i < this.cellsPosByIndex.length; i++) {
      if (
        gridCols[this.cellsPosByIndex[i].x][this.cellsPosByIndex[i].y] !==
        undefined
      ) {
        this.cellsPosByIndex = savedIndexs;
        this.angle -= 90;
        break;
      }
    }

    // refresh the position
    this.changePos();
    // Change The Angle
    this.angle += 90;
    if (this.angle == 360) {
      this.angle = 0;
    }
  }

  stuckedDown() {
    switch (this.angle) {
      case 0:
        return ifStucked(
          "down",
          this.cellsPosByIndex[0],
          this.cellsPosByIndex[1],
          this.cellsPosByIndex[2]
        );
      case 90:
        return ifStucked(
          "down",
          this.cellsPosByIndex[2],
          this.cellsPosByIndex[3]
        );
      case 180:
        return ifStucked(
          "down",
          this.cellsPosByIndex[1],
          this.cellsPosByIndex[2],
          this.cellsPosByIndex[3]
        );
      case 270:
        return ifStucked(
          "down",
          this.cellsPosByIndex[0],
          this.cellsPosByIndex[3]
        );
    }
  }
  stuckedLeft() {
    switch (this.angle) {
      case 0:
        return ifStucked(
          "left",
          this.cellsPosByIndex[0],
          this.cellsPosByIndex[3]
        );
      case 90:
        return ifStucked(
          "left",
          this.cellsPosByIndex[0],
          this.cellsPosByIndex[1],
          this.cellsPosByIndex[2]
        );
      case 180:
        return ifStucked(
          "left",
          this.cellsPosByIndex[2],
          this.cellsPosByIndex[3]
        );
      case 270:
        return ifStucked(
          "left",
          this.cellsPosByIndex[1],
          this.cellsPosByIndex[2],
          this.cellsPosByIndex[3]
        );
    }
  }
  stuckedRight() {
    switch (this.angle) {
      case 0:
        return ifStucked(
          "right",
          this.cellsPosByIndex[2],
          this.cellsPosByIndex[3]
        );
      case 90:
        return ifStucked(
          "right",
          this.cellsPosByIndex[1],
          this.cellsPosByIndex[2],
          this.cellsPosByIndex[3]
        );
      case 180:
        return ifStucked(
          "right",
          this.cellsPosByIndex[0],
          this.cellsPosByIndex[3]
        );
      case 270:
        return ifStucked(
          "right",
          this.cellsPosByIndex[0],
          this.cellsPosByIndex[1],
          this.cellsPosByIndex[2]
        );
    }
  }
}

// Create the (Cleveland Z) Block
class ClevelandZ extends Smashboy {
  constructor(color) {
    super(color);
    this.cells = new Array(); // cells will be added on creating the block
    // the position of every cell [x,y]
    this.cellsPosByPixel = [
      { x: 4 * unit, y: -1 * unit },
      { x: 5 * unit, y: -1 * unit },
      { x: 5 * unit, y: 0 },
      { x: 6 * unit, y: 0 },
    ];
    this.cellsPosByIndex = [
      { x: 4, y: -1 },
      { x: 5, y: -1 },
      { x: 5, y: 0 },
      { x: 6, y: 0 },
    ];
    this.cellsShadowIndex = [];
    this.autoFall; // interval to fall down
    this.stopped = false;
    this.angle = 0; // used for (rotate) function
  }

  rotate() {
    // rotate with Clockwise

    // remove the block from the grid
    this.removeFromGrid();

    // save the current position
    let savedIndexs = new Array();
    this.cellsPosByIndex.forEach((pos) => {
      savedIndexs.push({ ...pos });
    });

    // Change Position By Index
    /* Used (this.cellsPosByIndex[-].x) in conditions to prevent setting values on:
     (gridCols[-n]) , (gridCols[colsCount + n]) or (gridCols[-][rowsCount + n]) */
    if (this.angle == 0) {
      this.cellsPosByIndex[0].x += 2;
      this.cellsPosByIndex[0].y -= 1;

      this.cellsPosByIndex[1].x += 1;

      this.cellsPosByIndex[2].y -= 1;

      this.cellsPosByIndex[3].x -= 1;
    } else if (this.angle == 90 && this.cellsPosByIndex[2].x > 0) {
      this.cellsPosByIndex[0].x -= 2;
      this.cellsPosByIndex[0].y += 1;

      this.cellsPosByIndex[1].x -= 1;

      this.cellsPosByIndex[2].y += 1;

      this.cellsPosByIndex[3].x += 1;
    } else {
      // no rotate so reduce the angle because it will be increased in the end of the methode
      this.angle -= 90;
    }

    // if the block is stucked get the old postion back
    for (let i = 0; i < this.cellsPosByIndex.length; i++) {
      if (
        gridCols[this.cellsPosByIndex[i].x][this.cellsPosByIndex[i].y] !==
        undefined
      ) {
        this.cellsPosByIndex = savedIndexs;
        this.angle -= 90;
        break;
      }
    }

    // refresh the position
    this.changePos();
    // Change The Angle
    this.angle += 90;
    if (this.angle == 180) {
      this.angle = 0;
    }
  }

  stuckedDown() {
    switch (this.angle) {
      case 0:
        return ifStucked(
          "down",
          this.cellsPosByIndex[0],
          this.cellsPosByIndex[2],
          this.cellsPosByIndex[3]
        );
      case 90:
        return ifStucked(
          "down",
          this.cellsPosByIndex[1],
          this.cellsPosByIndex[3]
        );
    }
  }
  stuckedLeft() {
    switch (this.angle) {
      case 0:
        return ifStucked(
          "left",
          this.cellsPosByIndex[0],
          this.cellsPosByIndex[2]
        );
      case 90:
        return ifStucked(
          "left",
          this.cellsPosByIndex[0],
          this.cellsPosByIndex[2],
          this.cellsPosByIndex[3]
        );
    }
  }
  stuckedRight() {
    switch (this.angle) {
      case 0:
        return ifStucked(
          "right",
          this.cellsPosByIndex[1],
          this.cellsPosByIndex[3]
        );
      case 90:
        return ifStucked(
          "right",
          this.cellsPosByIndex[0],
          this.cellsPosByIndex[1],
          this.cellsPosByIndex[3]
        );
    }
  }
}

// Create the (Rhode Island Z) Block
class RhodeIslandZ extends Smashboy {
  constructor(color) {
    super(color);
    this.cells = new Array(); // cells will be added on creating the block
    // the position of every cell [x,y]
    this.cellsPosByPixel = [
      { x: 6 * unit, y: -1 * unit },
      { x: 5 * unit, y: -1 * unit },
      { x: 5 * unit, y: 0 },
      { x: 4 * unit, y: 0 },
    ];
    this.cellsPosByIndex = [
      { x: 6, y: -1 },
      { x: 5, y: -1 },
      { x: 5, y: 0 },
      { x: 4, y: 0 },
    ];
    this.cellsShadowIndex = [];
    this.autoFall; // interval to fall down
    this.stopped = false;
    this.angle = 0; // used for (rotate) function
  }

  rotate() {
    // rotate with Clockwise

    // remove the block from the grid
    this.removeFromGrid();

    // save the current position
    let savedIndexs = new Array();
    this.cellsPosByIndex.forEach((pos) => {
      savedIndexs.push({ ...pos });
    });

    // Change Position By Index
    /* Used (this.cellsPosByIndex[-].x) in conditions to prevent setting values on:
     (gridCols[-n]) , (gridCols[colsCount + n]) or (gridCols[-][rowsCount + n]) */
    if (this.angle == 0) {
      this.cellsPosByIndex[0].y += 1;

      this.cellsPosByIndex[1].x += 1;

      this.cellsPosByIndex[2].y -= 1;

      this.cellsPosByIndex[3].x += 1;
      this.cellsPosByIndex[3].y -= 2;
    } else if (this.angle == 90 && this.cellsPosByIndex[2].x > 0) {
      this.cellsPosByIndex[0].y -= 1;

      this.cellsPosByIndex[1].x -= 1;

      this.cellsPosByIndex[2].y += 1;

      this.cellsPosByIndex[3].x -= 1;
      this.cellsPosByIndex[3].y += 2;
    } else {
      // no rotate so reduce the angle because it will be increased in the end of the methode
      this.angle -= 90;
    }

    // if the block is stucked get the old postion back
    for (let i = 0; i < this.cellsPosByIndex.length; i++) {
      if (
        gridCols[this.cellsPosByIndex[i].x][this.cellsPosByIndex[i].y] !==
        undefined
      ) {
        this.cellsPosByIndex = savedIndexs;
        this.angle -= 90;
        break;
      }
    }

    // refresh the position
    this.changePos();
    // Change The Angle
    this.angle += 90;
    if (this.angle == 180) {
      this.angle = 0;
    }
  }

  stuckedDown() {
    switch (this.angle) {
      case 0:
        return ifStucked(
          "down",
          this.cellsPosByIndex[0],
          this.cellsPosByIndex[2],
          this.cellsPosByIndex[3]
        );
      case 90:
        return ifStucked(
          "down",
          this.cellsPosByIndex[0],
          this.cellsPosByIndex[2]
        );
    }
  }
  stuckedLeft() {
    switch (this.angle) {
      case 0:
        return ifStucked(
          "left",
          this.cellsPosByIndex[1],
          this.cellsPosByIndex[3]
        );
      case 90:
        return ifStucked(
          "left",
          this.cellsPosByIndex[0],
          this.cellsPosByIndex[2],
          this.cellsPosByIndex[3]
        );
    }
  }
  stuckedRight() {
    switch (this.angle) {
      case 0:
        return ifStucked(
          "right",
          this.cellsPosByIndex[0],
          this.cellsPosByIndex[2]
        );
      case 90:
        return ifStucked(
          "right",
          this.cellsPosByIndex[0],
          this.cellsPosByIndex[1],
          this.cellsPosByIndex[3]
        );
    }
  }
}

// Insert a new random block
let blocks = [
    { block: Smashboy, color: "#00c100" },
    { block: Hero, color: "#d27ef7" },
    { block: Teewee, color: "#ffff00" },
    { block: OrangeRicky, color: "#ffbf4a" },
    { block: BlueRicky, color: "#6b6bff" },
    { block: ClevelandZ, color: "#ff7b7b" },
    { block: RhodeIslandZ, color: "#21c9ff" },
  ],
  currentBlocks = new Array(4);
// Set Next Blocks
function chooseNextBlocks() {}
for (let i = 1; i < currentBlocks.length; i++) {
  let blockIndex = Math.floor(Math.random() * blocks.length);
  currentBlocks[i] = new blocks[blockIndex].block(blocks[blockIndex].color);
}
function newBlock() {
  // reduce the index of the next block
  for (let i = 0; i < currentBlocks.length - 1; i++) {
    currentBlocks[i] = currentBlocks[i + 1];
  }
  // choose new block for the third-next
  let blockIndex = Math.floor(Math.random() * blocks.length);
  currentBlocks[currentBlocks.length - 1] = new blocks[blockIndex].block(
    blocks[blockIndex].color
  );
  // display the three next blocks
  currentBlocks[1].showInContainer(`first-next`);
  currentBlocks[2].showInContainer(`second-next`);
  currentBlocks[3].showInContainer(`third-next`);
  // create the Current Block
  currentBlocks[0].createBlock();
}
//  Hold Block
let holdedBlock,
  holdedBefore = false; /* to prevent spamming on holding blocks 
  => will be changed in (creatBlock & holdBlock())*/
function holdBlock() {
  if (holdedBefore) {
    return;
  }
  currentBlocks[0].removeBlock();
  if (holdedBlock === undefined) {
    blocks.forEach((block, index) => {
      if (block.block.name == currentBlocks[0].constructor.name) {
        holdedBlock = new block.block(block.color);
      }
    });
    newBlock();
  } else {
    let willBeHolded = currentBlocks[0].constructor.name;
    currentBlocks[0] = holdedBlock;
    blocks.forEach((block, index) => {
      if (block.block.name == willBeHolded) {
        holdedBlock = new block.block(block.color);
      }
    });
    currentBlocks[0].createBlock();
  }
  holdedBlock.showInContainer("block-holder");
  holdedBefore = true;
}

// End The Game
let score = 0;
function endGame() {
  grid.querySelector(".game-alert h1").innerText = `Score: ${score}`;
  grid.querySelector(".game-alert button").innerText = "Try Again";
  grid.querySelector(".game-alert").style.display = "flex";
}

// Start Game
grid.querySelector(".game-alert button").onclick = function () {
  playground.innerHTML = "";
  resetGrid();
  colIsFull = false;
  this.parentElement.style.display = "none";
  chooseNextBlocks();
  // reset holded block
  holdedBlock = undefined;
  document.getElementById("block-holder").innerHTML = "";
  newBlock();
};

// Adding Controls To Current Block
window.addEventListener("keydown", (e) => {
  if (currentBlocks[0].stopped || colIsFull === true) {
    return;
  }
  switch (e.keyCode) {
    case 83: /// s
    case 40: // down arrow
      // Reset the ramain time to fall down > move down
      currentBlocks[0].resetFallInterval();
      currentBlocks[0].move("down");
      break;
    case 65: // a
    case 37: // left arrow
      currentBlocks[0].move("left");
      break;
    case 68: // d
    case 39: // right arrow
      currentBlocks[0].move("right");
      break;
    case 87: // w
    case 38: // up arrow
      currentBlocks[0].move("rotate");
      break;
    case 32: // space
      fallTime = 0;
      currentBlocks[0].resetFallInterval();
      break;
    case 16: // shift
      holdBlock();
      break;
  }
});
// Controls For Touch Devices
Array.from(document.getElementById("controls").children).forEach((btn) => {
  btn.addEventListener("touchstart", () => {
    switch (btn.className) {
      case "down":
        currentBlocks[0].resetFallInterval();
        currentBlocks[0].move("down");
        break;
      case "left":
        currentBlocks[0].move("left");
        break;
      case "right":
        currentBlocks[0].move("right");
        break;
      case "rotate":
        currentBlocks[0].move("rotate");
        break;
      case "instant-fall":
        fallTime = 0;
        currentBlocks[0].resetFallInterval();
        break;
      case "hold":
        holdBlock();
        break;
    }
  });
});

// Check If There Are Completed Rows
function checkIfCompleted() {
  const completedRowsIndex = new Array();
  // loop on the rows
  for (let i = 0; i < rowsCount; i++) {
    // loop on the cells in the row
    for (let c = 0; c < colsCount; c++) {
      /* if the cell is free break the loop in the row
          else => if this is the last cell and not free push Row Index into the Array*/
      if (gridCols[c][i] === undefined) {
        break;
      } else if (c == colsCount - 1) {
        completedRowsIndex.push(i);
      }
    }
  }
  // remove completed rows
  if (completedRowsIndex.length > 0) {
    for (let i = 0; i < completedRowsIndex.length; i++) {
      // delete cells from Grid and Body
      for (let c = 0; c < colsCount; c++) {
        gridCols[c][completedRowsIndex[i]].remove();
        delete gridCols[c][completedRowsIndex[i]];
      }
      // make the heigher rows fall down
      for (let r = completedRowsIndex[i]; r >= 0; r--) {
        for (let c = 0; c < colsCount; c++) {
          // if there are any cell heigher make it fall down
          if (gridCols[c][r - 1] != undefined) {
            gridCols[c][r - 1].style.top = r * unit + "px";
          }
          // change the pos in grid even if undefined
          gridCols[c][r] = gridCols[c][r - 1];
        }
      }
    }
  }

  score += completedRowsIndex.length * Math.ceil(Math.random() * 64);
  document.querySelector("#score span").innerText = score;

  difficulty = 1 + Math.floor(score / 500) / 2;
  // score: 500 => difficulty: 1.5, 1000 => 2, 1500 => 2.5, ...
}
