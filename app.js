const pieceSymbols = {
  K: "♔",
  Q: "♕",
  R: "♖",
  B: "♗",
  N: "♘",
  P: "♙",
  k: "♚",
  q: "♛",
  r: "♜",
  b: "♝",
  n: "♞",
  p: "♟",
  "": "·"
};

const pieceNames = {
  K: "King",
  Q: "Queen",
  R: "Rook",
  B: "Bishop",
  N: "Knight",
  P: "Pawn"
};

const paletteOrder = ["", "K", "Q", "R", "B", "N", "P", "k", "q", "r", "b", "n", "p"];
const localStorageKey = "cmg_sessions_v1";

const state = {
  mode: "api",
  sessionId: null,
  sessionName: "",
  side: "w",
  selectedPiece: "P",
  board: createStartingBoard()
};

const mainMenuView = document.getElementById("mainMenuView");
const gameplayView = document.getElementById("gameplayView");
const manageView = document.getElementById("manageView");
const tipsView = document.getElementById("tipsView");

const goStartGame = document.getElementById("goStartGame");
const goManageGames = document.getElementById("goManageGames");
const goTips = document.getElementById("goTips");
const backFromGame = document.getElementById("backFromGame");
const backFromManage = document.getElementById("backFromManage");
const backFromTips = document.getElementById("backFromTips");
const refreshGamesBtn = document.getElementById("refreshGamesBtn");
const gamesList = document.getElementById("gamesList");

const sessionNameInput = document.getElementById("sessionName");
const sideSelect = document.getElementById("sideSelect");
const createSessionBtn = document.getElementById("createSessionBtn");
const sessionStatus = document.getElementById("sessionStatus");
const screenshotInput = document.getElementById("screenshotInput");
const screenshotPreview = document.getElementById("screenshotPreview");
const uploadStatus = document.getElementById("uploadStatus");
const boardEl = document.getElementById("board");
const piecePalette = document.getElementById("piecePalette");
const fenOutput = document.getElementById("fenOutput");
const analyzeBtn = document.getElementById("analyzeBtn");
const resultBox = document.getElementById("resultBox");
const startPositionBtn = document.getElementById("startPositionBtn");
const clearBoardBtn = document.getElementById("clearBoardBtn");

function showView(viewName) {
  mainMenuView.classList.remove("active");
  gameplayView.classList.remove("active");
  manageView.classList.remove("active");
  tipsView.classList.remove("active");

  if (viewName === "menu") {
    mainMenuView.classList.add("active");
    return;
  }
  if (viewName === "game") {
    gameplayView.classList.add("active");
    return;
  }
  if (viewName === "manage") {
    manageView.classList.add("active");
    return;
  }
  tipsView.classList.add("active");
}

function createEmptyBoard() {
  return Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => ""));
}

function createStartingBoard() {
  return [
    ["r", "n", "b", "q", "k", "b", "n", "r"],
    ["p", "p", "p", "p", "p", "p", "p", "p"],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["P", "P", "P", "P", "P", "P", "P", "P"],
    ["R", "N", "B", "Q", "K", "B", "N", "R"]
  ];
}

function boardToFenBoard(board) {
  return board
    .map((row) => {
      let result = "";
      let emptyCount = 0;
      for (const square of row) {
        if (!square) {
          emptyCount += 1;
        } else {
          if (emptyCount > 0) {
            result += String(emptyCount);
            emptyCount = 0;
          }
          result += square;
        }
      }
      if (emptyCount > 0) {
        result += String(emptyCount);
      }
      return result;
    })
    .join("/");
}

function getFen() {
  const boardPart = boardToFenBoard(state.board);
  return `${boardPart} ${state.side} - - 0 1`;
}

function getPieceSide(piece) {
  if (!piece) {
    return null;
  }
  return piece === piece.toUpperCase() ? "white" : "black";
}

function getPieceTitle(piece) {
  if (!piece) {
    return "Clear square";
  }

  const side = getPieceSide(piece);
  const name = pieceNames[piece.toUpperCase()] || "Piece";
  return `${side === "white" ? "White" : "Black"} ${name}`;
}

function renderPalette() {
  piecePalette.innerHTML = "";

  for (const piece of paletteOrder) {
    const button = document.createElement("button");
    button.type = "button";
    button.title = getPieceTitle(piece);
    button.className = "palette-piece";

    const side = getPieceSide(piece);
    if (side) {
      button.classList.add(`side-${side}`);
    }

    const symbol = document.createElement("span");
    symbol.className = `palette-piece-symbol ${side ? `piece-${side}` : ""}`;
    symbol.textContent = pieceSymbols[piece];

    const sideLabel = document.createElement("span");
    sideLabel.className = "palette-piece-side";
    sideLabel.textContent = piece ? (side === "white" ? "W" : "B") : "CLR";

    button.appendChild(symbol);
    button.appendChild(sideLabel);

    if (state.selectedPiece === piece) {
      button.classList.add("active");
    }

    button.addEventListener("click", () => {
      state.selectedPiece = piece;
      renderPalette();
    });

    piecePalette.appendChild(button);
  }
}

function renderBoard() {
  boardEl.innerHTML = "";

  const reverse = state.side === "b";
  const rowIndexes = reverse ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];
  const colIndexes = reverse ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];

  for (const row of rowIndexes) {
    for (const col of colIndexes) {
      const piece = state.board[row][col];
      const square = document.createElement("button");
      square.type = "button";
      square.className = `square ${(row + col) % 2 === 0 ? "light" : "dark"}`;

      if (piece) {
        const side = getPieceSide(piece);
        const pieceEl = document.createElement("span");
        pieceEl.className = `piece piece-${side}`;
        pieceEl.textContent = pieceSymbols[piece];

        const sideBadge = document.createElement("span");
        sideBadge.className = `piece-side-badge side-${side}`;
        sideBadge.textContent = side === "white" ? "W" : "B";

        square.title = getPieceTitle(piece);
        square.appendChild(pieceEl);
        square.appendChild(sideBadge);
      } else {
        square.title = "Empty square";
      }

      square.addEventListener("click", () => {
        state.board[row][col] = state.selectedPiece;
        fenOutput.value = getFen();
        renderBoard();
      });

      boardEl.appendChild(square);
    }
  }

  fenOutput.value = getFen();
}

function readLocalSessions() {
  try {
    const raw = localStorage.getItem(localStorageKey);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_error) {
    return [];
  }
}

function writeLocalSessions(sessions) {
  localStorage.setItem(localStorageKey, JSON.stringify(sessions));
}

function updateLocalSessionById(sessionId, updater) {
  const sessions = readLocalSessions();
  const next = sessions.map((candidate) => {
    if (candidate.id !== sessionId) {
      return candidate;
    }
    return updater(candidate);
  });
  writeLocalSessions(next);
}

function createClientId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
}

async function detectMode() {
  try {
    const response = await fetch("/api/health", { cache: "no-store" });
    state.mode = response.ok ? "api" : "local";
  } catch (_error) {
    state.mode = "local";
  }
}

function getModeLabel() {
  return state.mode === "api" ? "Server mode" : "GitHub Pages mode";
}

function scoreBoardClient(chess, perspective) {
  if (chess.isCheckmate()) {
    return chess.turn() === perspective ? -99999 : 99999;
  }
  if (chess.isDraw() || chess.isStalemate() || chess.isThreefoldRepetition()) {
    return 0;
  }

  const values = {
    p: 100,
    n: 320,
    b: 330,
    r: 500,
    q: 900,
    k: 20000
  };

  const board = chess.board();
  let score = 0;
  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 8; col += 1) {
      const piece = board[row][col];
      if (!piece) {
        continue;
      }
      const pieceValue = values[piece.type] || 0;
      score += piece.color === perspective ? pieceValue : -pieceValue;
    }
  }
  return score;
}

function minimaxClient(chess, depth, alpha, beta, perspective) {
  if (depth === 0 || chess.isGameOver()) {
    return scoreBoardClient(chess, perspective);
  }

  const legalMoves = chess.moves({ verbose: true });
  if (legalMoves.length === 0) {
    return scoreBoardClient(chess, perspective);
  }

  const maximizing = chess.turn() === perspective;

  if (maximizing) {
    let best = -Infinity;
    for (const move of legalMoves) {
      chess.move(move);
      const result = minimaxClient(chess, depth - 1, alpha, beta, perspective);
      chess.undo();
      best = Math.max(best, result);
      alpha = Math.max(alpha, best);
      if (beta <= alpha) {
        break;
      }
    }
    return best;
  }

  let best = Infinity;
  for (const move of legalMoves) {
    chess.move(move);
    const result = minimaxClient(chess, depth - 1, alpha, beta, perspective);
    chess.undo();
    best = Math.min(best, result);
    beta = Math.min(beta, best);
    if (beta <= alpha) {
      break;
    }
  }
  return best;
}

function findBestMoveClient(fen, depth = 3) {
  if (typeof Chess !== "function") {
    throw new Error("Chess engine failed to load.");
  }

  const chess = new Chess(fen);
  const perspective = chess.turn();
  const legalMoves = chess.moves({ verbose: true });

  if (legalMoves.length === 0) {
    return null;
  }

  const maximizing = chess.turn() === perspective;
  let bestScore = maximizing ? -Infinity : Infinity;
  let bestMove = legalMoves[0];

  for (const move of legalMoves) {
    chess.move(move);
    const score = minimaxClient(chess, depth - 1, -Infinity, Infinity, perspective);
    chess.undo();

    if (maximizing && score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
    if (!maximizing && score < bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return {
    from: bestMove.from,
    to: bestMove.to,
    san: bestMove.san,
    promotion: bestMove.promotion || null,
    score: bestScore
  };
}

function loadFenBoard(boardPart) {
  const rows = boardPart.split("/");
  if (rows.length !== 8) {
    return;
  }

  const nextBoard = createEmptyBoard();
  for (let row = 0; row < 8; row += 1) {
    let col = 0;
    for (const token of rows[row]) {
      if (/\d/.test(token)) {
        col += Number(token);
      } else if (col < 8) {
        nextBoard[row][col] = token;
        col += 1;
      }
    }
  }
  state.board = nextBoard;
}

function hydrateSession(session) {
  state.sessionId = session.id;
  state.sessionName = session.name;
  state.side = session.side;
  sessionNameInput.value = session.name;
  sideSelect.value = session.side === "b" ? "black" : "white";
  sessionStatus.textContent = `Active: ${session.name} (${session.side === "w" ? "White" : "Black"}) | ${getModeLabel()}`;

  if (session.screenshotPath) {
    screenshotPreview.src = session.screenshotPath;
    screenshotPreview.style.display = "block";
    uploadStatus.textContent = "Screenshot loaded from saved session.";
  } else {
    screenshotPreview.removeAttribute("src");
    screenshotPreview.style.display = "none";
    uploadStatus.textContent = "No screenshot uploaded for this session yet.";
  }

  if (session.lastFen) {
    const parts = session.lastFen.split(" ");
    const boardPart = parts[0];
    state.side = parts[1] === "b" ? "b" : "w";
    sideSelect.value = state.side === "b" ? "black" : "white";
    loadFenBoard(boardPart);
  } else {
    state.board = createStartingBoard();
  }

  if (session.lastRecommendation) {
    resultBox.textContent = `Last: ${session.lastRecommendation.san} (${session.lastRecommendation.from} to ${session.lastRecommendation.to})`;
    resultBox.className = "result good";
  } else {
    resultBox.textContent = "Recommendation will appear here.";
    resultBox.className = "result";
  }

  renderBoard();
}

async function createSession() {
  const name = sessionNameInput.value.trim();
  const side = sideSelect.value;

  if (!name) {
    sessionStatus.textContent = "Enter a session name first.";
    return;
  }

  if (state.mode === "api") {
    const response = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, side })
    });

    const payload = await response.json();
    if (!response.ok) {
      sessionStatus.textContent = payload.error || "Unable to create session.";
      return;
    }

    hydrateSession(payload);
    resultBox.textContent = "Recommendation will appear here.";
    resultBox.className = "result";
    return;
  }

  const sessions = readLocalSessions();
  const localSession = {
    id: createClientId(),
    name,
    side: side === "black" ? "b" : "w",
    screenshotPath: null,
    createdAt: new Date().toISOString(),
    lastFen: null,
    lastRecommendation: null
  };

  sessions.push(localSession);
  writeLocalSessions(sessions);
  hydrateSession(localSession);
  resultBox.textContent = "Recommendation will appear here.";
  resultBox.className = "result";
}

async function fetchSessions() {
  if (state.mode === "api") {
    const response = await fetch("/api/sessions");
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || "Unable to load sessions.");
    }
    return payload;
  }
  return readLocalSessions();
}

async function deleteSession(sessionId) {
  if (state.mode === "api") {
    const response = await fetch(`/api/sessions/${sessionId}`, {
      method: "DELETE"
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || "Unable to remove game.");
    }
    return;
  }

  const next = readLocalSessions().filter((session) => session.id !== sessionId);
  writeLocalSessions(next);
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read the image file."));
    reader.readAsDataURL(file);
  });
}

async function uploadScreenshot(file) {
  if (!state.sessionId) {
    uploadStatus.textContent = "Create a session before uploading.";
    uploadStatus.className = "status-line bad";
    return;
  }

  uploadStatus.textContent = "Uploading screenshot...";

  if (state.mode === "api") {
    const formData = new FormData();
    formData.append("screenshot", file);

    const response = await fetch(`/api/sessions/${state.sessionId}/screenshot`, {
      method: "POST",
      body: formData
    });

    const payload = await response.json();
    if (!response.ok) {
      uploadStatus.textContent = payload.error || "Upload failed.";
      return;
    }

    uploadStatus.textContent = "Screenshot uploaded. Use the board mapper to mirror your position.";
    if (payload.screenshotPath) {
      screenshotPreview.src = payload.screenshotPath;
      screenshotPreview.style.display = "block";
    }
    return;
  }

  const dataUrl = await readFileAsDataUrl(file);
  updateLocalSessionById(state.sessionId, (session) => ({
    ...session,
    screenshotPath: dataUrl
  }));

  screenshotPreview.src = dataUrl;
  screenshotPreview.style.display = "block";
  uploadStatus.textContent = "Screenshot saved to browser storage for this game.";
}

async function analyzePosition() {
  if (!state.sessionId) {
    resultBox.textContent = "Create a session first.";
    resultBox.className = "result bad";
    return;
  }

  const fen = getFen();

  if (state.mode === "api") {
    const response = await fetch(`/api/sessions/${state.sessionId}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fen, depth: 3 })
    });

    const payload = await response.json();
    if (!response.ok) {
      resultBox.textContent = payload.error || "Analysis failed.";
      resultBox.className = "result bad";
      return;
    }

    const rec = payload.recommendation;
    resultBox.textContent = `Best move: ${rec.san} (${rec.from} to ${rec.to}) | Eval: ${rec.score}`;
    resultBox.className = "result good";
    return;
  }

  try {
    const recommendation = findBestMoveClient(fen, 3);
    if (!recommendation) {
      resultBox.textContent = "No legal moves available in this position.";
      resultBox.className = "result bad";
      return;
    }

    updateLocalSessionById(state.sessionId, (session) => ({
      ...session,
      lastFen: fen,
      lastRecommendation: recommendation
    }));

    resultBox.textContent = `Best move: ${recommendation.san} (${recommendation.from} to ${recommendation.to}) | Eval: ${recommendation.score}`;
    resultBox.className = "result good";
  } catch (error) {
    resultBox.textContent = error.message || "Analysis failed.";
    resultBox.className = "result bad";
  }
}

async function renderGamesList() {
  gamesList.innerHTML = "Loading games...";
  let sessions = [];
  try {
    sessions = await fetchSessions();
  } catch (error) {
    gamesList.innerHTML = "";
    const line = document.createElement("div");
    line.className = "status-line bad";
    line.textContent = error.message || "Unable to load games.";
    gamesList.appendChild(line);
    return;
  }

  gamesList.innerHTML = "";
  if (sessions.length === 0) {
    const line = document.createElement("div");
    line.className = "status-line";
    line.textContent = "No saved games yet. Start a new game from the main menu.";
    gamesList.appendChild(line);
    return;
  }

  for (const session of sessions) {
    const row = document.createElement("div");
    row.className = "game-row";

    const meta = document.createElement("div");
    meta.className = "game-meta";

    const name = document.createElement("div");
    name.className = "game-name";
    name.textContent = session.name;

    const details = document.createElement("div");
    details.className = "game-details";
    details.textContent = `Side: ${session.side === "w" ? "White" : "Black"} | Created: ${new Date(session.createdAt).toLocaleString()}`;

    const openButton = document.createElement("button");
    openButton.className = "btn small";
    openButton.textContent = "Open";
    openButton.addEventListener("click", () => {
      hydrateSession(session);
      showView("game");
    });

    const removeButton = document.createElement("button");
    removeButton.className = "btn small danger";
    removeButton.textContent = "Remove";
    removeButton.addEventListener("click", async () => {
      const accepted = window.confirm(`Remove game \"${session.name}\"?`);
      if (!accepted) {
        return;
      }

      try {
        await deleteSession(session.id);
        if (state.sessionId === session.id) {
          state.sessionId = null;
          state.sessionName = "";
          sessionStatus.textContent = `No active session. ${getModeLabel()}.`;
        }
        await renderGamesList();
      } catch (error) {
        const line = document.createElement("div");
        line.className = "status-line bad";
        line.textContent = error.message || "Unable to remove game.";
        gamesList.prepend(line);
      }
    });

    const actions = document.createElement("div");
    actions.className = "game-actions";
    actions.appendChild(openButton);
    actions.appendChild(removeButton);

    meta.appendChild(name);
    meta.appendChild(details);
    row.appendChild(meta);
    row.appendChild(actions);
    gamesList.appendChild(row);
  }
}

createSessionBtn.addEventListener("click", () => {
  createSession().catch((error) => {
    sessionStatus.textContent = error.message || "Unexpected error while creating session.";
  });
});

screenshotInput.addEventListener("change", () => {
  const file = screenshotInput.files && screenshotInput.files[0];
  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    screenshotPreview.src = String(event.target && event.target.result ? event.target.result : "");
    screenshotPreview.style.display = "block";
  };
  reader.readAsDataURL(file);

  uploadScreenshot(file).catch((error) => {
    uploadStatus.textContent = error.message || "Unexpected upload error.";
  });
});

analyzeBtn.addEventListener("click", () => {
  analyzePosition().catch((error) => {
    resultBox.textContent = error.message || "Unexpected analysis error.";
    resultBox.className = "result bad";
  });
});

startPositionBtn.addEventListener("click", () => {
  state.board = createStartingBoard();
  renderBoard();
});

clearBoardBtn.addEventListener("click", () => {
  state.board = createEmptyBoard();
  renderBoard();
});

sideSelect.addEventListener("change", () => {
  state.side = sideSelect.value === "black" ? "b" : "w";
  renderBoard();
});

goStartGame.addEventListener("click", () => {
  showView("game");
});

goManageGames.addEventListener("click", () => {
  showView("manage");
  renderGamesList().catch(() => {
    gamesList.textContent = "Unable to load games.";
  });
});

goTips.addEventListener("click", () => {
  showView("tips");
});

backFromGame.addEventListener("click", () => {
  showView("menu");
});

backFromManage.addEventListener("click", () => {
  showView("menu");
});

backFromTips.addEventListener("click", () => {
  showView("menu");
});

refreshGamesBtn.addEventListener("click", () => {
  renderGamesList().catch(() => {
    gamesList.textContent = "Unable to refresh games.";
  });
});

async function init() {
  renderPalette();
  renderBoard();
  showView("menu");
  await detectMode();
  sessionStatus.textContent = `No active session. ${getModeLabel()}.`;
}

init().catch(() => {
  sessionStatus.textContent = "No active session.";
});
