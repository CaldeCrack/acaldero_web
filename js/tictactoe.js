const HUMAN = "X";
const AI = "O";
const WIN_LINES = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
];

const boardEl = document.getElementById("board");
const statusEl = document.getElementById("status");
const newRoundButton = document.getElementById("new-round");
const swapStarterButton = document.getElementById("swap-start");
const scoreHumanEl = document.getElementById("score-human");
const scoreAiEl = document.getElementById("score-ai");
const scoreDrawEl = document.getElementById("score-draw");
const cells = Array.from(document.querySelectorAll(".cell"));

let board = Array(9).fill(null);
let roundLocked = false;
let humanStarts = true;
const score = {
    human: 0,
    ai: 0,
    draw: 0
};

function getWinner(state) {
    for (const [a, b, c] of WIN_LINES) {
        if (state[a] && state[a] === state[b] && state[a] === state[c]) {
            return state[a];
        }
    }
    return null;
}

function isBoardFull(state) {
    return state.every((cell) => cell !== null);
}

function getAvailableMoves(state) {
    return state
        .map((cell, index) => (cell === null ? index : -1))
        .filter((index) => index !== -1);
}

// Minimax with alpha-beta pruning. Scores are from AI's perspective.
function minimax(state, isAiTurn, alpha, beta) {
    const winner = getWinner(state);

    if (winner === AI) {
        return { score: 1 };
    }

    if (winner === HUMAN) {
        return { score: -1 };
    }

    if (isBoardFull(state)) {
        return { score: 0 };
    }

    const moves = getAvailableMoves(state);
    let bestMove = null;

    if (isAiTurn) {
        let bestScore = -Infinity;

        for (const move of moves) {
            state[move] = AI;
            const result = minimax(state, false, alpha, beta);
            state[move] = null;

            if (result.score > bestScore) {
                bestScore = result.score;
                bestMove = move;
            }

            alpha = Math.max(alpha, bestScore);
            if (beta <= alpha) {
                break;
            }
        }

        return { score: bestScore, move: bestMove };
    }

    let bestScore = Infinity;

    for (const move of moves) {
        state[move] = HUMAN;
        const result = minimax(state, true, alpha, beta);
        state[move] = null;

        if (result.score < bestScore) {
            bestScore = result.score;
            bestMove = move;
        }

        beta = Math.min(beta, bestScore);
        if (beta <= alpha) {
            break;
        }
    }

    return { score: bestScore, move: bestMove };
}

function bestAiMove() {
    return minimax(board.slice(), true, -Infinity, Infinity).move;
}

function paintBoard() {
    cells.forEach((cell, index) => {
        const value = board[index];
        cell.textContent = value || "";
        cell.classList.toggle("x", value === HUMAN);
        cell.classList.toggle("o", value === AI);
        cell.disabled = roundLocked || value !== null;
    });
}

function updateScores() {
    scoreHumanEl.textContent = String(score.human);
    scoreAiEl.textContent = String(score.ai);
    scoreDrawEl.textContent = String(score.draw);
}

function endRound(message) {
    roundLocked = true;
    statusEl.textContent = message;
    paintBoard();
}

function evaluateRoundAfterMove() {
    const winner = getWinner(board);

    if (winner === HUMAN) {
        score.human += 1;
        updateScores();
        endRound("You win. The impossible happened.");
        return true;
    }

    if (winner === AI) {
        score.ai += 1;
        updateScores();
        endRound("AI wins. Perfect play is unforgiving.");
        return true;
    }

    if (isBoardFull(board)) {
        score.draw += 1;
        updateScores();
        endRound("Draw. That's the best guaranteed result.");
        return true;
    }

    return false;
}

function runAiTurn() {
    if (roundLocked) {
        return;
    }

    statusEl.textContent = "AI is thinking...";

    window.setTimeout(() => {
        const move = bestAiMove();
        if (move === undefined || move === null) {
            return;
        }

        board[move] = AI;
        paintBoard();

        if (!evaluateRoundAfterMove()) {
            statusEl.textContent = "Your turn.";
        }
    }, 180);
}

function startRound() {
    board = Array(9).fill(null);
    roundLocked = false;
    paintBoard();

    if (humanStarts) {
        statusEl.textContent = "Your turn.";
        return;
    }

    statusEl.textContent = "AI starts this round.";
    runAiTurn();
}

function onCellClick(event) {
    if (roundLocked) {
        return;
    }

    const target = event.target.closest(".cell");
    if (!target) {
        return;
    }

    const index = Number(target.dataset.index);
    if (Number.isNaN(index) || board[index] !== null) {
        return;
    }

    board[index] = HUMAN;
    paintBoard();

    if (!evaluateRoundAfterMove()) {
        runAiTurn();
    }
}

boardEl.addEventListener("click", onCellClick);
newRoundButton.addEventListener("click", startRound);
swapStarterButton.addEventListener("click", () => {
    humanStarts = !humanStarts;
    startRound();
});

updateScores();
startRound();
