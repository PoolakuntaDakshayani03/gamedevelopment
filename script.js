const board = document.getElementById("chessboard");
const whiteCapturedDiv = document.getElementById("whiteCaptured");
const blackCapturedDiv = document.getElementById("blackCaptured");

let boardState = [
  ["b_rook", "b_knight", "b_bishop", "b_queen", "b_king", "b_bishop", "b_knight", "b_rook"],
  ["b_pawn", "b_pawn", "b_pawn", "b_pawn", "b_pawn", "b_pawn", "b_pawn", "b_pawn"],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["w_pawn", "w_pawn", "w_pawn", "w_pawn", "w_pawn", "w_pawn", "w_pawn", "w_pawn"],
  ["w_rook", "w_knight", "w_bishop", "w_queen", "w_king", "w_bishop", "w_knight", "w_rook"]
];

let selected = null;
let turn = "w"; // white starts
let whiteCaptured = [];
let blackCaptured = [];

function createBoard() {
  board.innerHTML = "";

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const square = document.createElement("div");
      square.classList.add("square", (row + col) % 2 === 0 ? "white" : "black");
      square.dataset.row = row;
      square.dataset.col = col;

      const piece = boardState[row][col];
      if (piece) {
        const img = document.createElement("img");
        img.src = piece + ".png";  // Image path
        img.classList.add("piece");
        img.dataset.piece = piece;
        img.dataset.row = row;
        img.dataset.col = col;
        square.appendChild(img);
      }

      board.appendChild(square);
    }
  }
  updateCapturedPieces();
}

function updateCapturedPieces() {
  whiteCapturedDiv.innerHTML = "<h3>White Captured</h3>";
  blackCapturedDiv.innerHTML = "<h3>Black Captured</h3>";

  // Show captured white pieces
  whiteCaptured.forEach(piece => {
    const img = document.createElement("img");
    img.src = "assets/" + piece + ".png";
    img.classList.add("captured-piece");
    whiteCapturedDiv.appendChild(img);
  });

  // Show captured black pieces
  blackCaptured.forEach(piece => {
    const img = document.createElement("img");
    img.src = "assets/" + piece + ".png";
    img.classList.add("captured-piece");
    blackCapturedDiv.appendChild(img);
  });
}

board.addEventListener("click", (e) => {
  const square = e.target.closest(".square");
  if (!square) return;

  const row = parseInt(square.dataset.row);
  const col = parseInt(square.dataset.col);
  const piece = boardState[row][col];

  if (selected === null) {
    if (piece && piece.startsWith(turn)) {
      selected = { piece, row, col };
      highlightSelected(row, col);
      showHints(row, col); // Show movement hints
    }
    return;
  }

  if (square.classList.contains("hint")) {
    const targetPiece = boardState[row][col];

    // If there's a piece of the opponent, add it to the captured pieces
    if (targetPiece && targetPiece[0] !== selected.piece[0]) {
      if (targetPiece.startsWith("w")) {
        whiteCaptured.push(targetPiece.split("_")[1]);
      } else {
        blackCaptured.push(targetPiece.split("_")[1]);
      }
    }

    // Move the selected piece
    boardState[row][col] = selected.piece;
    boardState[selected.row][selected.col] = "";
    turn = turn === "w" ? "b" : "w";
    selected = null;
    clearHighlights();
    createBoard();
    return;
  }

  selected = null;
  clearHighlights();
  createBoard();
});

function highlightSelected(row, col) {
  document.querySelectorAll(".square").forEach(sq => {
    if (parseInt(sq.dataset.row) === row && parseInt(sq.dataset.col) === col) {
      sq.classList.add("selected");
    } else {
      sq.classList.remove("selected");
    }
  });
}

function showHints(row, col) {
  clearHighlights();

  const type = boardState[row][col].split("_")[1];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (isValidMove({ piece: boardState[row][col], row, col }, r, c)) {
        const hintSquare = document.querySelector(`.square[data-row="${r}"][data-col="${c}"]`);
        if (hintSquare) {
          hintSquare.classList.add("hint");
        }
      }
    }
  }
}

function clearHighlights() {
  document.querySelectorAll(".square").forEach(sq => {
    sq.classList.remove("selected", "hint");
  });
}

function isValidMove(selected, targetRow, targetCol) {
  const { piece, row, col } = selected;
  const targetPiece = boardState[targetRow][targetCol];

  if (targetPiece && targetPiece[0] === piece[0]) return false;

  const type = piece.split("_")[1];
  const dr = targetRow - row;
  const dc = targetCol - col;

  switch (type) {
    case "pawn":
      return validatePawn(piece, row, col, targetRow, targetCol);
    case "rook":
      return (dr === 0 || dc === 0) && clearPath(row, col, targetRow, targetCol);
    case "bishop":
      return Math.abs(dr) === Math.abs(dc) && clearPath(row, col, targetRow, targetCol);
    case "queen":
      return (dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc)) &&
        clearPath(row, col, targetRow, targetCol);
    case "king":
      return Math.abs(dr) <= 1 && Math.abs(dc) <= 1;
    case "knight":
      return (Math.abs(dr) === 2 && Math.abs(dc) === 1) || (Math.abs(dr) === 1 && Math.abs(dc) === 2);
  }
  return false;
}

function validatePawn(piece, row, col, targetRow, targetCol) {
  const direction = piece.startsWith("w") ? -1 : 1;
  const startRow = piece.startsWith("w") ? 6 : 1;

  if (col === targetCol && boardState[targetRow][targetCol] === "") {
    if (row + direction === targetRow) return true;
    if (row === startRow && row + 2 * direction === targetRow &&
        boardState[row + direction][col] === "") return true;
  }

  if (Math.abs(col - targetCol) === 1 && row + direction === targetRow) {
    return boardState[targetRow][targetCol] !== "";
  }

  return false;
}

function clearPath(r1, c1, r2, c2) {
  const dr = Math.sign(r2 - r1);
  const dc = Math.sign(c2 - c1);
  let row = r1 + dr;
  let col = c1 + dc;
  while (row !== r2 || col !== c2) {
    if (boardState[row][col] !== "") return false;
    row += dr;
    col += dc;
  }
  return true;
}

createBoard();
