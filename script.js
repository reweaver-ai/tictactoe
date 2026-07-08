/**
 * ReWeaver Tic-Tac-Toe — script.js
 * ---------------------------------------------------------------------
 * Game logic only. Nothing here needs to change to re-theme the app —
 * all visual customization lives in styles.css / design-tokens.json.
 * Keep it that way: if a "design change" request means editing this
 * file, that's a signal the token surface needs to grow instead.
 */

(() => {
  "use strict";

  const WIN_COMBOS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
    [0, 4, 8], [2, 4, 6],            // diagonals
  ];

  const SCORE_KEY = "reweaver-ttt-score";

  const boardEl = document.getElementById("board");
  const statusEl = document.getElementById("status");
  const cellTemplate = document.getElementById("cell-template");
  const scoreXEl = document.getElementById("score-x");
  const scoreOEl = document.getElementById("score-o");
  const scoreDrawEl = document.getElementById("score-draw");
  const newRoundBtn = document.getElementById("reset-round");
  const resetScoreBtn = document.getElementById("reset-score");

  /** @type {Array<'X'|'O'|null>} */
  let board = Array(9).fill(null);
  let currentPlayer = "X";
  let gameActive = true;
  let score = loadScore();

  function loadScore() {
    try {
      const raw = localStorage.getItem(SCORE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (err) {
      /* localStorage unavailable (e.g. file:// in some browsers) — fall back to in-memory */
    }
    return { X: 0, O: 0, draw: 0 };
  }

  function saveScore() {
    try {
      localStorage.setItem(SCORE_KEY, JSON.stringify(score));
    } catch (err) {
      /* ignore — score just won't persist across reloads */
    }
  }

  function markSvg(player) {
    if (player === "X") {
      return `<svg class="mark-x" viewBox="0 0 100 100" aria-hidden="true">
        <path d="M22,22 L78,78 M22,78 L78,22" />
      </svg>`;
    }
    return `<svg class="mark-o" viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="34" />
    </svg>`;
  }

  function buildBoard() {
    boardEl.innerHTML = "";
    for (let i = 0; i < 9; i++) {
      const cell = cellTemplate.content.firstElementChild.cloneNode(true);
      cell.dataset.index = String(i);
      cell.addEventListener("click", onCellClick);
      boardEl.appendChild(cell);
    }
  }

  function onCellClick(event) {
    const index = Number(event.currentTarget.dataset.index);
    if (!gameActive || board[index]) return;

    board[index] = currentPlayer;
    renderCell(index);

    const winCombo = getWinningCombo();
    if (winCombo) {
      endRound(currentPlayer, winCombo);
      return;
    }
    if (board.every((v) => v !== null)) {
      endRound(null, null);
      return;
    }

    currentPlayer = currentPlayer === "X" ? "O" : "X";
    updateStatus(`${currentPlayer}'s turn`);
  }

  function renderCell(index) {
    const cell = boardEl.children[index];
    cell.innerHTML = markSvg(board[index]);
    cell.disabled = true;
    cell.setAttribute("aria-label", `Cell ${index + 1}: ${board[index]}`);
  }

  function getWinningCombo() {
    return WIN_COMBOS.find(
      ([a, b, c]) => board[a] && board[a] === board[b] && board[a] === board[c]
    ) || null;
  }

  function endRound(winner, winCombo) {
    gameActive = false;
    Array.from(boardEl.children).forEach((cell) => (cell.disabled = true));

    if (winner) {
      winCombo.forEach((i) => boardEl.children[i].classList.add("is-winner"));
      score[winner] += 1;
      updateStatus(`${winner} wins!`);
    } else {
      score.draw += 1;
      updateStatus("It's a draw");
    }
    renderScore();
    saveScore();
  }

  function updateStatus(text) {
    statusEl.textContent = text;
  }

  function renderScore() {
    scoreXEl.textContent = String(score.X);
    scoreOEl.textContent = String(score.O);
    scoreDrawEl.textContent = String(score.draw);
  }

  function startRound() {
    board = Array(9).fill(null);
    currentPlayer = "X";
    gameActive = true;
    buildBoard();
    updateStatus("X's turn");
  }

  function resetScore() {
    score = { X: 0, O: 0, draw: 0 };
    renderScore();
    saveScore();
  }

  newRoundBtn.addEventListener("click", startRound);
  resetScoreBtn.addEventListener("click", resetScore);

  renderScore();
  startRound();
})();
