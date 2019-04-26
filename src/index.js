import React from 'react'
import ReactDOM from 'react-dom'
import shuffle from 'shuffle-array'

import './index.css'

// Description of the Minesweeper board
const NUM_ROWS = 16;
const NUM_COLS = 30;
const NUM_MINES = 99;
const TILE_STATES = {
    HIDDEN: 0,
    REVEALED: 1,
    FLAGGED: 2,
    MINED: 3,
    DISABLED: 4,
    REDMINE: 5,
    FALSEFLAG: 6
}
const GAME_STATES = {
    PLAYING: 0,
    LOST: 1,
    WON: 2
}
const TILE_CLASSES = [
    "hidden",
    "revealed",
    "flagged",
    "mined",
    "disabled",
    "redmine",
    "falseflag"
];
const FACE_CLASSES = [
    "playing",
    "lost",
    "won"
]

function Tile(props) {
    let className = "tile tile-" + TILE_CLASSES[props.tileState]
    if (props.value && props.tileState === TILE_STATES.REVEALED) {
        className += " tile" + props.value;
    }
    return (
        <button
            className={className}
            onMouseUp={props.onMouseUp}
            onContextMenu={props.onContextMenu}
        >
        </button>
    );
}

function Face(props) {
    let className = "face face-" + FACE_CLASSES[props.gameState];
    return (
        <button
            className={className}
            onClick={props.onClick}
        >
        </button>
    );
}

class Board extends React.Component {
    renderTile(r, c) {
        return (
            <Tile
                key={r * NUM_COLS + c}
                row={r}
                col={c}
                tileState={this.props.tileStates[r][c]}
                value={this.props.tileValues[r][c]}
                onMouseUp={e => this.props.onMouseUp(e, r, c)}
                onContextMenu={e => this.props.onContextMenu(e, r, c)}
            />
        );
    }

    render() {
        this.tileMatrix = [];
        for (let i = 0; i < NUM_ROWS; i++) {
            this.tileMatrix.push([]);
            for (let j = 0; j < NUM_COLS; j++) {
                this.tileMatrix[i].push(
                    this.renderTile(i, j)
                );
            }
        }
        let displayMatrix = this.tileMatrix.map((row, i) => {
            return (
                <div className='board-row' key={'r' + i}>
                    {row}
                </div>
            );
        });
        return (
            <div>
                <h2>Minesweeper</h2>
                <div className='face-container'>
                    <hr />
                    <Face
                        gameState={this.props.gameState}
                        onClick={e => this.props.onClick(e)}
                    />
                    <hr />
                </div>
                {displayMatrix}
            </div>
        );
    }
}

class Game extends React.Component {
    constructor(props) {
        super(props);
        this.generateMines();

        this.state = {
            tileStates: this.getDefaultTileStates(),
            gameState: GAME_STATES.PLAYING,
            numTilesLeft: NUM_ROWS * NUM_COLS - NUM_MINES,
            numFlagged: 0,
            timerRunning: false,
            time: 0,
        };
    }

    resetGame() {
        clearInterval(this.timer);
        this.generateMines();

        this.setState({
            tileStates: this.getDefaultTileStates(),
            gameState: GAME_STATES.PLAYING,
            numTilesLeft: NUM_ROWS * NUM_COLS - NUM_MINES,
            numFlagged: 0,
            timerRunning: false,
            time: 0,
        });

        console.log(this.state);
    }

    getDefaultTileStates() {
        let tileStates1D = Array(NUM_ROWS * NUM_COLS).fill(TILE_STATES.HIDDEN);
        let tileStates = [];
        while (tileStates1D.length > 0) {
            tileStates.push(tileStates1D.splice(0, NUM_COLS));
        }
        return tileStates;
    }

    generateMines() {
        let hasMine1D = Array(NUM_ROWS * NUM_COLS).fill(false);
        hasMine1D.fill(true, 0, NUM_MINES);
        shuffle(hasMine1D);
        this.hasMine = [];
        while (hasMine1D.length > 0) {
            this.hasMine.push(hasMine1D.splice(0, NUM_COLS));
        }
        this.tileValues = this.calcValues();
    }

    ignoreMines(r, c) {
        let numReplaced = 0;
        let numNeighbors = 0;
        for (let i = r - 1; i <= r + 1; i++) {
            for (let j = c - 1; j <= c + 1; j++) {
                if (i < 0 || i >= NUM_ROWS || j < 0 || j >= NUM_COLS) {
                    continue;
                }
                numNeighbors++;
                if (this.hasMine[i][j]) {
                    numReplaced++;
                    this.hasMine[i][j] = false;
                }
            }
        }
        if (numReplaced === 0)
            return;
        let hasMine1D = Array(NUM_ROWS * NUM_COLS - NUM_MINES + numReplaced - numNeighbors).fill(false);
        hasMine1D.fill(true, 0, numReplaced);
        shuffle(hasMine1D);
        let index = 0;
        for (let i = 0; i < NUM_ROWS; i++) {
            for (let j = 0; j < NUM_COLS; j++) {
                if (Math.abs(r - i) <= 1 && Math.abs(c - j) <= 1)
                    continue;
                if (this.hasMine[i][j])
                    continue;
                if (hasMine1D[index]) {
                    let row = Math.trunc(index / NUM_COLS);
                    let col = index % NUM_COLS;
                    this.hasMine[row][col] = true;
                }
                index++;
            }
        }
        this.tileValues = this.calcValues();
    }

    calcValues() {
        let tileValues = Array(NUM_ROWS);
        for (let i = 0; i < NUM_ROWS; i++) {
            tileValues[i] = Array(NUM_COLS);
            for (let j = 0; j < NUM_COLS; j++) {
                tileValues[i][j] = 0;
            }
        }
        for (let i = 0; i < NUM_ROWS; i++) {
            for (let j = 0; j < NUM_COLS; j++) {
                if (!this.hasMine[i][j])
                    continue;
                for (let r = i - 1; r <= i + 1; r++) {
                    for (let c = j - 1; c <= j + 1; c++) {
                        if (r < 0 || r >= NUM_ROWS || c < 0 || c >= NUM_COLS) {
                            continue;
                        }
                        if (r === i && c === j) {
                            continue;
                        }
                        tileValues[r][c]++;
                    }
                }
            }
        }
        return tileValues;
    }

    revealDFS(r, c) {
        let tileStates = this.state.tileStates.slice();
        let numTilesLeft = this.state.numTilesLeft;
        for (let i = r - 1; i <= r + 1; i++) {
            for (let j = c - 1; j <= c + 1; j++) {
                if (i < 0 || i >= NUM_ROWS || i < 0 || i >= NUM_COLS) {
                    continue;
                }
                if ((r === i && c === j) || tileStates[i][j] !== TILE_STATES.HIDDEN) {
                    continue;
                }
                tileStates[i][j] = TILE_STATES.REVEALED;
                numTilesLeft--;
                if (this.tileValues[i][j] === 0) {
                    this.revealDFS(i, j);
                }
            }
        }
        this.setState({
            tileStates: tileStates,
            numTilesLeft: numTilesLeft,
        })
    }

    handleMouseUp(e, r, c) {
        if (e.button !== 0)
            return;
        if (this.state.gameState !== GAME_STATES.PLAYING)
            return;
        if (this.state.tileStates[r][c] !== TILE_STATES.HIDDEN)
            return;
        if (!this.state.timerRunning) {
            this.ignoreMines(r, c);
            this.setState({
                timerRunning: true,
                time: 1,
            });
            this.timer = setInterval(() => {
                let nextTime = this.state.time + 1;
                this.setState({
                    time: nextTime,
                });
            }, 1000);
        }
        const tileStates = this.state.tileStates.slice();
        let numTilesLeft = this.state.numTilesLeft - 1;
        tileStates[r][c] = TILE_STATES.REVEALED;
        let gameState = this.state.gameState;
        let timerRunning = true;
        if (this.hasMine[r][c]) {
            clearInterval(this.timer);
            timerRunning = false;
            numTilesLeft++;
            gameState = GAME_STATES.LOST;
            for (let i = 0; i < NUM_ROWS; i++) {
                for (let j = 0; j < NUM_COLS; j++) {
                    if (tileStates[i][j] === TILE_STATES.FLAGGED) {
                        tileStates[i][j] = this.hasMine[i][j] ?
                            TILE_STATES.FLAGGED : TILE_STATES.FALSEFLAG;
                    } else if (tileStates[i][j] === TILE_STATES.HIDDEN) {
                        tileStates[i][j] = this.hasMine[i][j] ?
                            TILE_STATES.MINED : TILE_STATES.DISABLED;
                    }
                }
            }
            tileStates[r][c] = TILE_STATES.REDMINE;
        } else if (this.tileValues[r][c] === 0) {
            this.revealDFS(r, c);
        }
        if (numTilesLeft === NUM_MINES) {
            gameState = GAME_STATES.WON;
            timerRunning = false;
            for (let i = 0; i < NUM_ROWS; i++) {
                for (let j = 0; j < NUM_COLS; j++) {
                    if (tileStates[i][j] === TILE_STATES.HIDDEN) {
                        tileStates[i][j] = TILE_STATES.FLAGGED;
                    }
                }
            }
        }
        this.setState({
            tileStates: tileStates,
            gameState: gameState,
            numTilesLeft: numTilesLeft,
            timerRunning: timerRunning,
        })
    }

    handleContextMenu(e, r, c) {
        if (this.state.gameState !== GAME_STATES.PLAYING)
            return;
        let tileState = this.state.tileStates[r][c];
        let numFlagged = this.state.numFlagged;
        if (tileState === TILE_STATES.FLAGGED) {
            tileState = TILE_STATES.HIDDEN;
            numFlagged--;
        } else if (tileState === TILE_STATES.HIDDEN) {
            tileState = TILE_STATES.FLAGGED;
            numFlagged++;
        } else {
            return;
        }
        const tileStates = this.state.tileStates.slice();
        tileStates[r][c] = tileState;
        this.setState({
            tileStates: tileStates,
            numFlagged: numFlagged,
        })
    }

    handleFaceClick(e) {
        this.resetGame();
    }

    render() {
        console.log(this.state);
        return (
            <div className='game'>
                <div className='game-board'>
                    <Board
                        tileStates={this.state.tileStates}
                        tileValues={this.tileValues}
                        onClick={e => this.handleFaceClick(e)}
                        onMouseUp={(e, r, c) => this.handleMouseUp(e, r, c)}
                        onContextMenu={(e, r, c) => this.handleContextMenu(e, r, c)}
                        gameState={this.state.gameState}
                    />
                    <p>Mines left: {NUM_MINES - this.state.numFlagged}</p>
                    <p>{this.state.time}</p>
                </div>
            </div>
        );
    }
}

ReactDOM.render(
    <Game />,
    document.getElementById('root')
);
