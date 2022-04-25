'use strict'

const FLOOR = 'FLOOR'
const WALL = 'WALL'
const TARGET = 'TARGET'
const PLAYER = 'PLAYER'
const BOX = 'BOX'
const CLOCK = 'CLOCK'
const GLUE = 'GLUE'
const GOLD = 'GOLD'

const PLAYER_IMG = '<img src="img/player.png" />'
const BOX_IMG = '<img src="img/box.jpg" />'
const CLOCK_IMG = '<img src="img/clock.png" />'
const GLUE_IMG = '<img src="img/glue.png" />'
const GOLD_IMG = '<img src="img/gold.png" />'

var gPlayerPos
var gBoxPos = [{ i: 7, j: 7 }, { i: 4, j: 4 }]
var gTargetPos = [{ i: 9, j: 4 }, { i: 2, j: 8 }]
var gBoard
var gIsGameOver
var gScore
var gAddClockIntervalId
var gAddGlueIntervalId
var gAddGoldIntervalId
var gClockTimeOut
var gGlueTimeOut
var gGoldTimeOut
var gIsGlued

var gElScore = document.querySelector(".score")
var gElModal = document.querySelector(".modal")


function initGame() {

    gBoard = createBoard()
    renderBoard(gBoard)

    gIsGameOver = false
    gIsGlued = false
    gScore = 100
    gElScore.innerText = 'Score: ' + gScore
    gAddClockIntervalId = setInterval(addClock, 10000)
    gAddGlueIntervalId = setInterval(addGlue, 10000)
    gAddGoldIntervalId = setInterval(addGold, 10000)
}


function easyLevel() {
    gBoxPos = [{ i: 7, j: 7 }, { i: 4, j: 4 }]
    gTargetPos = [{ i: 9, j: 4 }, { i: 2, j: 8 }]
    resetGame()
}


function mediumLevel() {
    gBoxPos = [{ i: 7, j: 7 }, { i: 4, j: 4 }, { i: 4, j: 3 }, { i: 2, j: 3 }, { i: 6, j: 6 }, { i: 8, j: 4 }]
    gTargetPos = [{ i: 9, j: 4 }, { i: 2, j: 8 }, { i: 8, j: 3 }, { i: 5, j: 5 }, { i: 1, j: 10 }, { i: 10, j: 1 }]
    resetGame()
}


function hardLevel() {
    gBoxPos = [{ i: 7, j: 7 }, { i: 4, j: 4 }, { i: 4, j: 3 }, { i: 2, j: 3 }, { i: 6, j: 6 }, { i: 8, j: 4 }, { i: 7, j: 1 }, { i: 3, j: 10 }, { i: 3, j: 4 }, { i: 3, j: 2 }]
    gTargetPos = [{ i: 9, j: 4 }, { i: 2, j: 8 }, { i: 8, j: 3 }, { i: 5, j: 5 }, { i: 1, j: 10 }, { i: 10, j: 1 }, { i: 3, j: 5 }, { i: 9, j: 1 }, { i: 1, j: 5 }, { i: 10, j: 10 }]
    resetGame()
}


function createBoard() {

    // Create the Matrix

    var board = createMat(12, 12)
    gPlayerPos = { i: 3, j: 3 }


    // Put FLOOR everywhere and WALL at edges
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[0].length; j++) {
            // Put FLOOR in a regular cell
            var cell = { type: FLOOR, gameElement: null }

            // Put WALL at edges
            if (i === 0 || i === board.length - 1 || j === 0 || j === board[0].length - 1) {
                cell.type = WALL
            }

            // Add created cell to The game board
            board[i][j] = cell
        }
    }

    // Place the PLAYER at selected position
    board[gPlayerPos.i][gPlayerPos.j].gameElement = PLAYER


    for (var k = 0; k < gBoxPos.length; k++) {
        // Place the BOX at selected position
        board[gBoxPos[k].i][gBoxPos[k].j].gameElement = BOX

        // Place the TARGET at selected position
        board[gTargetPos[k].i][gTargetPos[k].j].type = TARGET
    }

    return board
}

// Render the board to an HTML table
function renderBoard(board) {

    var strHTML = ''
    for (var i = 0; i < board.length; i++) {
        strHTML += '<tr>\n'
        for (var j = 0; j < board[0].length; j++) {
            var currCell = board[i][j]

            var cellClass = getClassName({ i: i, j: j })

            if (currCell.type === FLOOR) {
                cellClass += ' floor'
            } else if (currCell.type === WALL) {
                cellClass += ' wall'
            } else if (currCell.type === TARGET) {
                cellClass += ' target'
            }

            strHTML += '\t<td class="cell ' + cellClass + '" onclick="moveTo(' + i + ',' + j + ')" >\n'

            if (currCell.gameElement === PLAYER) {
                strHTML += PLAYER_IMG
            } else if (currCell.gameElement === BOX) {
                strHTML += BOX_IMG
            }

            strHTML += '\t</td>\n';
        }
        strHTML += '</tr>\n';
    }

    var elBoard = document.querySelector('.board')
    elBoard.innerHTML = strHTML
}


// Move the player to a specific location
function moveTo(i, j) {

    if (gIsGameOver) return
    if (gIsGlued) return

    var targetCell = gBoard[i][j]

    // Calculate distance to make sure we are moving to a neighbor cell
    var iAbsDiff = Math.abs(i - gPlayerPos.i)
    var jAbsDiff = Math.abs(j - gPlayerPos.j)
    var iDiff = i - gPlayerPos.i
    var jDiff = j - gPlayerPos.j

    // If the clicked Cell is one of the allowed
    if ((iAbsDiff === 1 && jAbsDiff === 0) || (jAbsDiff === 1 && iAbsDiff === 0)) {
        if (targetCell.type === WALL) return

        if (targetCell.gameElement === BOX) {
            gBoxPos.i = i + iDiff
            gBoxPos.j = j + jDiff
            if (gBoard[gBoxPos.i][gBoxPos.j].type === WALL || gBoard[gBoxPos.i][gBoxPos.j].gameElement !== null) return

            gBoard[gBoxPos.i][gBoxPos.j].gameElement = BOX
            gBoard[i][j].gameElement = null

            if (checkVictory()) gameOver()

            renderCell(gBoxPos, BOX_IMG)

        } else if (targetCell.gameElement === GLUE) {
            gIsGlued = true
            gScore -= 4
            cellBackgroundColor(i, j, 'red')
        } else if (targetCell.gameElement === GOLD) {
            gScore += 101
            cellBackgroundColor(i, j, 'gold')
        } else if (targetCell.gameElement === CLOCK) {
            gScore += 11
            cellBackgroundColor(i, j, 'green')
        }

        // MOVING from current position
        // Model:
        gBoard[gPlayerPos.i][gPlayerPos.j].gameElement = null
        // Dom:
        renderCell(gPlayerPos, '')

        // MOVING to selected position
        // Model:
        gPlayerPos.i = i
        gPlayerPos.j = j
        gBoard[gPlayerPos.i][gPlayerPos.j].gameElement = PLAYER
        // DOM:
        renderCell(gPlayerPos, PLAYER_IMG)

        getScore()
    }
}


// Convert a location object {i, j} to a selector and render a value in that element
function renderCell(position, value) {

    var cellSelector = '.' + getClassName(position)
    var elCell = document.querySelector(cellSelector)
    elCell.innerHTML = value
}


// Move the player by keyboard arrows
function handleKey(event) {

    var i = gPlayerPos.i
    var j = gPlayerPos.j

    switch (event.key) {
        case 'ArrowLeft':
            moveTo(i, j - 1)
            break
        case 'ArrowRight':
            moveTo(i, j + 1)
            break
        case 'ArrowUp':
            moveTo(i - 1, j)
            break
        case 'ArrowDown':
            moveTo(i + 1, j)
            break
    }
}


function checkVictory() {

    var isVictory = true
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[0].length; j++) {
            var currCell = gBoard[i][j]

            if (currCell.type === TARGET && currCell.gameElement !== BOX) isVictory = false
        }
    }
    return (isVictory)
}


function getScore() {

    gScore--
    gElScore.innerText = 'Score: ' + gScore
}


function getEmptyRandomCell(gBoard) {

    var emptyCells = []

    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[i].length; j++) {
            var cell = gBoard[i][j]

            if (cell.gameElement === null && cell.type === FLOOR) emptyCells.push({ cell, i, j })
        }
    }

    var randomIdx = getRandomInt(0, emptyCells.length)
    var randomCell = emptyCells[randomIdx]

    return randomCell
}


function addClock() {

    var randomCell = getEmptyRandomCell(gBoard)
    randomCell.cell.gameElement = CLOCK
    renderCell({ i: randomCell.i, j: randomCell.j }, CLOCK_IMG)

    gClockTimeOut = setTimeout(removeClock, 5000, randomCell.i, randomCell.j)
}


function removeClock(i, j) {

    cellBackgroundColor(i, j, 'gray')

    if (gBoard[i][j].gameElement === PLAYER) return

    gBoard[i][j].gameElement = null
    renderCell({ i, j }, '')
}


function addGlue() {

    var randomCell = getEmptyRandomCell(gBoard)
    randomCell.cell.gameElement = GLUE
    renderCell({ i: randomCell.i, j: randomCell.j }, GLUE_IMG)

    gGlueTimeOut = setTimeout(removeGlue, 5000, randomCell.i, randomCell.j)
}


function removeGlue(i, j) {

    gIsGlued = false

    cellBackgroundColor(i, j, 'gray')

    if (gBoard[i][j].gameElement === PLAYER) return

    gBoard[i][j].gameElement = null
    renderCell({ i, j }, '')
}


function addGold() {

    var randomCell = getEmptyRandomCell(gBoard)
    randomCell.cell.gameElement = GOLD
    renderCell({ i: randomCell.i, j: randomCell.j }, GOLD_IMG)

    gGoldTimeOut = setTimeout(removeGold, 5000, randomCell.i, randomCell.j)
}


function removeGold(i, j) {

    cellBackgroundColor(i, j, 'gray')
    if (gBoard[i][j].gameElement === PLAYER) return

    gBoard[i][j].gameElement = null
    renderCell({ i, j }, '')
}


function cellBackgroundColor(i, j, backgroundColor) {

    var elCell = document.querySelector('.' + getClassName({ i: i, j: j }))
    elCell.style.backgroundColor = backgroundColor
}


function gameOver() {

    gIsGameOver = true
    gElModal.style.display = 'block'
    clearIntervals()
}


function clearIntervals() {

    clearInterval(gAddClockIntervalId)
    clearInterval(gAddGlueIntervalId)
    clearInterval(gAddGoldIntervalId)
    clearInterval(gClockTimeOut)
    clearInterval(gGlueTimeOut)
    clearInterval(gGoldTimeOut)
}


function resetGame() {

    gElModal.style.display = 'none'
    clearIntervals()
    initGame()
}