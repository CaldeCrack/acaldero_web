const ROWS = 6
const COLS = 7
const EMPTY = 0
const HUMAN = 1
const AI = 2

const boardEl = document.getElementById("board")
const statusEl = document.getElementById("status")
const newRoundButton = document.getElementById("new-round")
const scoreHumanEl = document.getElementById("score-human")
const scoreAiEl = document.getElementById("score-ai")
const scoreDrawEl = document.getElementById("score-draw")

let board = createBoard()
let roundLocked = false
let aiThinking = false

const score = {
  human: 0,
  ai: 0,
  draw: 0,
}

function createBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(EMPTY))
}

function createUi() {
  boardEl.innerHTML = ""

  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      const cell = document.createElement("div")
      cell.className = "cell"
      cell.dataset.row = String(row)
      cell.dataset.col = String(col)
      boardEl.appendChild(cell)
    }
  }
}

function updateScores() {
  scoreHumanEl.textContent = String(score.human)
  scoreAiEl.textContent = String(score.ai)
  scoreDrawEl.textContent = String(score.draw)
}

function getCellElement(row, col) {
  return boardEl.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`)
}

function paintBoard() {
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      const cell = getCellElement(row, col)
      if (!cell) {
        continue
      }

      cell.classList.remove("human", "ai")
      if (board[row][col] === HUMAN) {
        cell.classList.add("human")
      } else if (board[row][col] === AI) {
        cell.classList.add("ai")
      }
    }
  }
}

function validColumns(state) {
  const columns = []
  for (let col = 0; col < COLS; col += 1) {
    if (state[0][col] === EMPTY) {
      columns.push(col)
    }
  }
  return columns
}

function findDropRow(state, col) {
  for (let row = ROWS - 1; row >= 0; row -= 1) {
    if (state[row][col] === EMPTY) {
      return row
    }
  }
  return -1
}

function cloneBoard(state) {
  return state.map((row) => row.slice())
}

function placeDisc(state, col, token) {
  const row = findDropRow(state, col)
  if (row === -1) {
    return null
  }

  state[row][col] = token
  return { row, col }
}

function isBoardFull(state) {
  return validColumns(state).length === 0
}

function checkWin(state, token) {
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS - 3; col += 1) {
      if (
        state[row][col] === token &&
        state[row][col + 1] === token &&
        state[row][col + 2] === token &&
        state[row][col + 3] === token
      ) {
        return true
      }
    }
  }

  for (let col = 0; col < COLS; col += 1) {
    for (let row = 0; row < ROWS - 3; row += 1) {
      if (
        state[row][col] === token &&
        state[row + 1][col] === token &&
        state[row + 2][col] === token &&
        state[row + 3][col] === token
      ) {
        return true
      }
    }
  }

  for (let row = 0; row < ROWS - 3; row += 1) {
    for (let col = 0; col < COLS - 3; col += 1) {
      if (
        state[row][col] === token &&
        state[row + 1][col + 1] === token &&
        state[row + 2][col + 2] === token &&
        state[row + 3][col + 3] === token
      ) {
        return true
      }
    }
  }

  for (let row = 3; row < ROWS; row += 1) {
    for (let col = 0; col < COLS - 3; col += 1) {
      if (
        state[row][col] === token &&
        state[row - 1][col + 1] === token &&
        state[row - 2][col + 2] === token &&
        state[row - 3][col + 3] === token
      ) {
        return true
      }
    }
  }

  return false
}

function evaluateWindow(window) {
  const aiCount = window.filter((v) => v === AI).length
  const humanCount = window.filter((v) => v === HUMAN).length
  const emptyCount = window.filter((v) => v === EMPTY).length

  if (aiCount === 4) {
    return 1000
  }

  if (aiCount === 3 && emptyCount === 1) {
    return 20
  }

  if (aiCount === 2 && emptyCount === 2) {
    return 6
  }

  if (humanCount === 3 && emptyCount === 1) {
    return -18
  }

  if (humanCount === 2 && emptyCount === 2) {
    return -4
  }

  return 0
}

function scorePosition(state) {
  let scoreValue = 0

  const centerCol = Math.floor(COLS / 2)
  let centerCount = 0
  for (let row = 0; row < ROWS; row += 1) {
    if (state[row][centerCol] === AI) {
      centerCount += 1
    }
  }
  scoreValue += centerCount * 3

  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS - 3; col += 1) {
      scoreValue += evaluateWindow([
        state[row][col],
        state[row][col + 1],
        state[row][col + 2],
        state[row][col + 3],
      ])
    }
  }

  for (let col = 0; col < COLS; col += 1) {
    for (let row = 0; row < ROWS - 3; row += 1) {
      scoreValue += evaluateWindow([
        state[row][col],
        state[row + 1][col],
        state[row + 2][col],
        state[row + 3][col],
      ])
    }
  }

  for (let row = 0; row < ROWS - 3; row += 1) {
    for (let col = 0; col < COLS - 3; col += 1) {
      scoreValue += evaluateWindow([
        state[row][col],
        state[row + 1][col + 1],
        state[row + 2][col + 2],
        state[row + 3][col + 3],
      ])
    }
  }

  for (let row = 3; row < ROWS; row += 1) {
    for (let col = 0; col < COLS - 3; col += 1) {
      scoreValue += evaluateWindow([
        state[row][col],
        state[row - 1][col + 1],
        state[row - 2][col + 2],
        state[row - 3][col + 3],
      ])
    }
  }

  return scoreValue
}

function chooseAiColumn(state) {
  const columns = validColumns(state)

  for (const col of columns) {
    const trial = cloneBoard(state)
    placeDisc(trial, col, AI)
    if (checkWin(trial, AI)) {
      return col
    }
  }

  for (const col of columns) {
    const trial = cloneBoard(state)
    placeDisc(trial, col, HUMAN)
    if (checkWin(trial, HUMAN)) {
      return col
    }
  }

  let bestScore = -Infinity
  let bestColumns = []

  for (const col of columns) {
    const trial = cloneBoard(state)
    placeDisc(trial, col, AI)
    const value = scorePosition(trial)

    if (value > bestScore) {
      bestScore = value
      bestColumns = [col]
    } else if (value === bestScore) {
      bestColumns.push(col)
    }
  }

  if (bestColumns.length === 0) {
    return columns[0]
  }

  return bestColumns[Math.floor(Math.random() * bestColumns.length)]
}

function clearHoverColumn() {
  const highlighted = boardEl.querySelectorAll(".column-hover")
  highlighted.forEach((cell) => cell.classList.remove("column-hover"))
}

function highlightColumn(col) {
  clearHoverColumn()

  if (roundLocked || aiThinking || findDropRow(board, col) === -1) {
    return
  }

  const columnCells = boardEl.querySelectorAll(`.cell[data-col="${col}"]`)
  columnCells.forEach((cell) => cell.classList.add("column-hover"))
}

function setBoardInteractive(enabled) {
  boardEl.classList.toggle("playable", enabled)
}

function endRound(message) {
  roundLocked = true
  aiThinking = false
  statusEl.textContent = message
  clearHoverColumn()
  setBoardInteractive(false)
}

function evaluateRoundAfterMove(playerToken) {
  if (checkWin(board, playerToken)) {
    if (playerToken === HUMAN) {
      score.human += 1
      updateScores()
      endRound("You win! Nice read.")
    } else {
      score.ai += 1
      updateScores()
      endRound("AI wins this round.")
    }
    return true
  }

  if (isBoardFull(board)) {
    score.draw += 1
    updateScores()
    endRound("Draw round.")
    return true
  }

  return false
}

function runAiTurn() {
  aiThinking = true
  statusEl.textContent = "AI is thinking..."
  clearHoverColumn()
  setBoardInteractive(false)

  window.setTimeout(() => {
    if (roundLocked) {
      return
    }

    const chosenCol = chooseAiColumn(board)
    placeDisc(board, chosenCol, AI)
    paintBoard()

    if (!evaluateRoundAfterMove(AI)) {
      aiThinking = false
      statusEl.textContent = "Your turn."
      setBoardInteractive(true)
    }
  }, 320)
}

function onBoardClick(event) {
  if (roundLocked || aiThinking) {
    return
  }

  const cell = event.target.closest(".cell")
  if (!cell) {
    return
  }

  const col = Number(cell.dataset.col)
  if (Number.isNaN(col)) {
    return
  }

  const result = placeDisc(board, col, HUMAN)
  if (!result) {
    return
  }

  paintBoard()

  if (!evaluateRoundAfterMove(HUMAN)) {
    runAiTurn()
  }
}

function onBoardMove(event) {
  const cell = event.target.closest(".cell")
  if (!cell) {
    clearHoverColumn()
    return
  }

  const col = Number(cell.dataset.col)
  if (Number.isNaN(col)) {
    clearHoverColumn()
    return
  }

  highlightColumn(col)
}

function startRound() {
  board = createBoard()
  roundLocked = false
  aiThinking = false
  statusEl.textContent = "Your turn."
  paintBoard()
  clearHoverColumn()
  setBoardInteractive(true)
}

boardEl.addEventListener("click", onBoardClick)
boardEl.addEventListener("mousemove", onBoardMove)
boardEl.addEventListener("mouseleave", clearHoverColumn)
newRoundButton.addEventListener("click", startRound)

createUi()
updateScores()
startRound()
