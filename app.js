// app.js -- connectors
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const CELL_SIZE = 100;
const HALF_CELL = ~~(CELL_SIZE / 2);
const NODE_RADIUS = ~~(CELL_SIZE / 8); // a node is the small circle in the middle of a cell
const NUM_COLS = ~~(canvas.width / CELL_SIZE);
const NUM_ROWS = ~~(canvas.height / CELL_SIZE);

function Cell(x, y) {
  this.x = x;
  this.y = y;
  this.selected = false;
  return this;
}

const state = {
  cells: new Array(NUM_COLS).fill()
    .map((_, x) => new Array(NUM_ROWS).fill()
    .map((_, y) => new Cell(x, y))),
  path: [],
  mouse: {
    hasMouse: false,
    x: undefined,
    y: undefined,
    xCell: undefined,
    yCell: undefined,
    isDown: false
  },
  snapCell: undefined
};

const update = (time) => {
  const { mouse, path } = state;

  // if the mouse is within 5 pixels of the center of a cell
  // that is not the current, snap to it

  // for this to work, we only care about the four cells around the current,
  // north, east, south, west.

  // Since we know the distance between centers is CELL_SIZE, we can see if
  // the mouse is within range of the current cell

  // All the work below is requiring the mouse position, so bail if we don't have it
  if (!mouse.hasMouse) return;

  const currCell = path.pop();
  const currCellX = currCell.x * CELL_SIZE + HALF_CELL;
  const currCellY = currCell.y * CELL_SIZE + HALF_CELL;
  state.currCell = {
    cell: currCell,
    x: currCellX,
    y: currCellY
  };

  const snapDistance = NODE_RADIUS;
  const xDiff = (mouse.x - currCellX);
  const yDiff = (mouse.y - currCellY);
  const angleInRads = Math.atan2(yDiff, xDiff);

  const isInNodeRadius = (x, y) => {
    const xWithinCell = x % CELL_SIZE;
    const yWithinCell = y % CELL_SIZE;
    // Now shift the position by half a cell,
    // so we can use the pythagorean theorem
    // to determine if the mouse is within the node radius
    const xOffset = xWithinCell - HALF_CELL;
    const yOffset = yWithinCell - HALF_CELL;
    const length = Math.sqrt((xOffset * xOffset) + (yOffset * yOffset));
    return length <= NODE_RADIUS;
  };

  // If the mouse is in a node,
  // check if it is a neighbour of the current cell
  // and snap to it if it is
  state.snapCell = undefined;
  if (isInNodeRadius(mouse.x, mouse.y)) {
    const mouseCellX = ~~(mouse.x / CELL_SIZE);
    const mouseCellY = ~~(mouse.y / CELL_SIZE);
    const isCurrCell = (
      (mouseCellX === currCell.x) &&
      (mouseCellY === currCell.y)
    );
    if (!isCurrCell) {
      const isHorizontalNeighbour = (
        (Math.abs(mouseCellX - currCell.x) === 1) &&
        ((mouseCellY - currCell.y) === 0)
      );
      const isVerticalNeighbour = (
        (Math.abs(mouseCellY - currCell.y) === 1) &&
        ((mouseCellX - currCell.x) === 0)
      );
      const isNeighbour = isHorizontalNeighbour || isVerticalNeighbour;
      if (isNeighbour) {
        // one last thing, the neighbour shouldn't be in the path
        const isValidNeighbour = state.path.findIndex(cell => (
          (cell.x === mouseCellX) && (cell.y === mouseCellY)
        )) === -1;
        if (isValidNeighbour) {
          state.snapCell = state.cells[mouseCellX][mouseCellY];
        }
      }
    }
  }

  path.push(currCell);

  // If the snapCell is assigned, and the mouse is down
  // then add the cell to the path
  if (state.snapCell instanceof Cell && mouse.isDown) {
    state.snapCell.selected = true;
    path.push(state.snapCell);
    state.snapCell = undefined;
  }
};

const drawActiveLine = () => {
  const { mouse, snapCell } = state;
  if (!mouse.hasMouse) {
    // mouse hasn't enter the canvas, or mouse has left the canvas
    return;
  }
  // draw a connector from the current cell (if in range)
  const currCell = state.path.pop();
  const xDist = (mouse.x - ((currCell.x * CELL_SIZE) + HALF_CELL));
  const yDist = (mouse.y - ((currCell.y * CELL_SIZE) + HALF_CELL));
  const distCurrCellToMouse = Math.sqrt((xDist * xDist) + (yDist * yDist));
  const isInRange = distCurrCellToMouse <= CELL_SIZE;
  if (snapCell instanceof Cell) {
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(currCell.x * CELL_SIZE + HALF_CELL, currCell.y * CELL_SIZE + HALF_CELL);
    ctx.lineTo(snapCell.x * CELL_SIZE + HALF_CELL, snapCell.y * CELL_SIZE + HALF_CELL);
    ctx.stroke();
  } else {
    ctx.strokeStyle = 'blue';
    ctx.lineWidth = 3;
    ctx.beginPath();
    const startX = currCell.x * CELL_SIZE + HALF_CELL;
    const startY = currCell.y * CELL_SIZE + HALF_CELL;
    const endX = mouse.x;
    const endY = mouse.y;
    if (Math.abs(endX - startX) <= CELL_SIZE && Math.abs(endY - startY) <= CELL_SIZE) {
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    } else {
      // determine the angle and draw a line CELL_SIZE length long at same angle
      ctx.strokeStyle = 'yellow';
      const angle = Math.atan2(endY-startY, endX-startX);
      const newX = startX + Math.cos(angle) * CELL_SIZE;
      const newY = startY + Math.sin(angle) * CELL_SIZE;
      ctx.moveTo(startX, startY);
      ctx.lineTo(newX, newY);
      ctx.stroke();
    }
  }
  state.path.push(currCell);
};


const calcCellCenter = (cellIndex) => cellIndex * CELL_SIZE + HALF_CELL;
const drawPathLine = (startCell, endCell) => {
  const startX = calcCellCenter(startCell.x);
  const startY = calcCellCenter(startCell.y);
  const endX = calcCellCenter(endCell.x);
  const endY = calcCellCenter(endCell.y);

  ctx.lineWidth = CELL_SIZE * 0.1;
  ctx.strokeStyle = 'green';
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.stroke();
};
const drawPath = () => {
  // This function is only concerned with drawing the lines between
  // the nodes, and the nodes will be filled in later
  const { path } = state;
  if (path.length > 1) { // need more than one node to draw a line
    for (let i = 0; i < path.length - 1; i++) {
      drawPathLine(path[i], path[i+1]);
    }
  }
};


const drawCells = () => {
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'white';
  const radius = NODE_RADIUS;
  const startAngle = 0;
  const endAngle = Math.PI * 2;
  const offset = ~~(CELL_SIZE / 2);
  state.cells.forEach((col, cellX) => {
    col.forEach((cell, cellY) => {
      const x = cellX * CELL_SIZE + offset;
      const y = cellY * CELL_SIZE + offset;
      if (cell.selected) {
	ctx.fillStyle = 'blue';
        ctx.beginPath();
        ctx.arc(x, y, radius * 1.25, startAngle, endAngle);
        ctx.fill();
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(x, y, radius * 0.75, startAngle, endAngle);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(x, y, radius, startAngle, endAngle);
        ctx.stroke();
      }
    });
  });
};

const clearBackground = () => {
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
};

const drawText = () => {
  const { mouse } = state;
  const FONT_SIZE = 30; // pixels
  const SPACE_BETWEEN_LINES = 10; // pixels
  ctx.font = `${FONT_SIZE}px Arial`;
  ctx.textBaseline = 'top';
  ctx.fillStyle = 'white';
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'black';
  const text = (txt, line) => {
    const x = SPACE_BETWEEN_LINES;
    const y = (line * (FONT_SIZE + SPACE_BETWEEN_LINES)) + SPACE_BETWEEN_LINES;
    ctx.strokeText(txt, x, y);
    ctx.fillText(txt, x, y);
  };
  const messages = [];
  /*
  if (mouse.hasMouse) {
    messages.push(`Mouse (${mouse.y}, ${mouse.x}) [${mouse.xCell}, ${mouse.yCell}]`);
  }
  */
  messages.forEach(text);
};

const draw = (time) => {
  clearBackground();
  drawPath();
  drawCells();
  drawActiveLine();
  drawText();
};

const loop = (time) => {
  update(time);
  draw(time);
  requestAnimationFrame(loop);
};

const onMouseDown = () => {
  state.mouse.isDown = true;
};

const onMouseUp = ()=> {
  state.mouse.isDown = false;
};

const onMouseMove = () => {
  const { offsetX, offsetY } = window.event;
  Object.assign(state.mouse, {
    hasMouse: true,
    x: offsetX,
    y: offsetY,
    xCell: ~~(offsetX / CELL_SIZE),
    yCell: ~~(offsetY / CELL_SIZE)
  });
};

const onMouseOut = () => {
  Object.assign(state.mouse, {
    hasMouse: false,
    x: undefined,
    y: undefined,
    xCell: undefined,
    yCell: undefined
  });
};

const init = () => {
  console.log('Connectors!');
  const firstCell = state.cells[0][0];
  firstCell.selected = true;
  state.path.push(firstCell);
  canvas.addEventListener('mousedown', onMouseDown);
  canvas.addEventListener('mouseup', onMouseUp);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mouseout', onMouseOut);
  requestAnimationFrame(loop);
};

init();
