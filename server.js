const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const { Chess } = require("chess.js");

const app = express();
const PORT = process.env.PORT || 3000;

const dataDir = path.join(__dirname, "data");
const uploadsDir = path.join(__dirname, "uploads");
const sessionsFile = path.join(dataDir, "sessions.json");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(sessionsFile)) {
  fs.writeFileSync(sessionsFile, JSON.stringify({ sessions: [] }, null, 2), "utf-8");
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname);
    cb(null, `${Date.now()}-${uuidv4()}${extension}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
      return;
    }
    cb(new Error("Only image uploads are allowed."));
  }
});

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use("/uploads", express.static(uploadsDir));
app.use(express.static(path.join(__dirname, "public")));

function readSessions() {
  try {
    const raw = fs.readFileSync(sessionsFile, "utf-8");
    return JSON.parse(raw);
  } catch (_error) {
    return { sessions: [] };
  }
}

function writeSessions(payload) {
  fs.writeFileSync(sessionsFile, JSON.stringify(payload, null, 2), "utf-8");
}

function scoreBoard(chess, perspective) {
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

function minimax(chess, depth, alpha, beta, perspective) {
  if (depth === 0 || chess.isGameOver()) {
    return scoreBoard(chess, perspective);
  }

  const legalMoves = chess.moves({ verbose: true });
  if (legalMoves.length === 0) {
    return scoreBoard(chess, perspective);
  }

  const maximizing = chess.turn() === perspective;

  if (maximizing) {
    let best = -Infinity;
    for (const move of legalMoves) {
      chess.move(move);
      const result = minimax(chess, depth - 1, alpha, beta, perspective);
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
    const result = minimax(chess, depth - 1, alpha, beta, perspective);
    chess.undo();
    best = Math.min(best, result);
    beta = Math.min(beta, best);
    if (beta <= alpha) {
      break;
    }
  }
  return best;
}

function findBestMove(fen, perspective, depth = 3) {
  const chess = new Chess(fen);
  const legalMoves = chess.moves({ verbose: true });

  if (legalMoves.length === 0) {
    return null;
  }

  const maximizing = chess.turn() === perspective;
  let bestScore = maximizing ? -Infinity : Infinity;
  let bestMove = legalMoves[0];

  for (const move of legalMoves) {
    chess.move(move);
    const score = minimax(chess, depth - 1, -Infinity, Infinity, perspective);
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

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/sessions", (_req, res) => {
  const payload = readSessions();
  res.json(payload.sessions);
});

app.post("/api/sessions", (req, res) => {
  const name = String(req.body?.name || "").trim();
  const sideInput = String(req.body?.side || "").trim().toLowerCase();
  const side = sideInput === "black" ? "b" : sideInput === "white" ? "w" : "";

  if (!name) {
    res.status(400).json({ error: "Session name is required." });
    return;
  }

  if (!side) {
    res.status(400).json({ error: "Side must be white or black." });
    return;
  }

  const payload = readSessions();
  const session = {
    id: uuidv4(),
    name,
    side,
    screenshotPath: null,
    createdAt: new Date().toISOString(),
    lastFen: null,
    lastRecommendation: null
  };

  payload.sessions.push(session);
  writeSessions(payload);

  res.status(201).json(session);
});

app.get("/api/sessions/:id", (req, res) => {
  const payload = readSessions();
  const session = payload.sessions.find((candidate) => candidate.id === req.params.id);
  if (!session) {
    res.status(404).json({ error: "Session not found." });
    return;
  }
  res.json(session);
});

app.delete("/api/sessions/:id", (req, res) => {
  const payload = readSessions();
  const index = payload.sessions.findIndex((candidate) => candidate.id === req.params.id);

  if (index === -1) {
    res.status(404).json({ error: "Session not found." });
    return;
  }

  const [deleted] = payload.sessions.splice(index, 1);
  writeSessions(payload);

  if (deleted?.screenshotPath) {
    const screenshotName = path.basename(deleted.screenshotPath);
    const absoluteScreenshotPath = path.join(uploadsDir, screenshotName);
    if (fs.existsSync(absoluteScreenshotPath)) {
      try {
        fs.unlinkSync(absoluteScreenshotPath);
      } catch (_error) {
        // A failed file delete should not block deleting the game session.
      }
    }
  }

  res.json({ ok: true, deletedId: deleted.id });
});

app.post("/api/sessions/:id/screenshot", upload.single("screenshot"), (req, res) => {
  const payload = readSessions();
  const session = payload.sessions.find((candidate) => candidate.id === req.params.id);

  if (!session) {
    res.status(404).json({ error: "Session not found." });
    return;
  }

  if (!req.file) {
    res.status(400).json({ error: "Screenshot file is required." });
    return;
  }

  session.screenshotPath = `/uploads/${req.file.filename}`;
  writeSessions(payload);

  res.json({ screenshotPath: session.screenshotPath });
});

app.post("/api/sessions/:id/analyze", (req, res) => {
  const payload = readSessions();
  const session = payload.sessions.find((candidate) => candidate.id === req.params.id);

  if (!session) {
    res.status(404).json({ error: "Session not found." });
    return;
  }

  const fen = String(req.body?.fen || "").trim();
  const depthInput = Number(req.body?.depth);
  const depth = Number.isInteger(depthInput) ? Math.max(1, Math.min(depthInput, 4)) : 3;

  if (!fen) {
    res.status(400).json({ error: "FEN is required for analysis." });
    return;
  }

  let chess;
  try {
    chess = new Chess(fen);
  } catch (_error) {
    res.status(400).json({ error: "Invalid FEN." });
    return;
  }

  const recommendation = findBestMove(chess.fen(), chess.turn(), depth);

  if (!recommendation) {
    res.status(400).json({ error: "No legal moves available in this position." });
    return;
  }

  session.lastFen = chess.fen();
  session.lastRecommendation = recommendation;
  writeSessions(payload);

  res.json({
    sessionId: session.id,
    fen: chess.fen(),
    recommendation
  });
});

app.get("/{*any}", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Chess Move Guide running on http://localhost:${PORT}`);
});
