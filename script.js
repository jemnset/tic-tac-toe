/** 
 * Create a Cell factory to represent each cell on the board 
 * - the Cell only knows it's own value and can return that value
*/
function Cell (){
    let value = 0;

    const addToken = (token) => value = token;
    const getValue = () => value;

    return {
        addToken,
        getValue
    }
}

/**
 * GameBoard that uses the IIFE model for encapsulation and to allow only one instance to be created
 * GameBoard maintains a double array of Cell objects which represents the board. 
 * GameBoard allows the user to place a token 
 * GameBoard allows the user to print the GameBoard
 * GameBoard checks lines to find if there is three in a row
 */

const GameBoard = (function() {
    const rows = 3;
    const cols = 3;
    const board = [];

    //generate a 2-d array of Cell objects that represents the board
    for(let i = 0; i < rows; i++){
        board[i] = [];
        for(let j = 0; j < cols; j++){
            board[i].push(Cell());
        }
    }

    //returns the board object
    const getBoard = () => board;

    const placeToken = (row, col, token) => {
        
        //place the token if there cell is empty otherwise do nothing
        //usualy we would do error handling but this will be handled in
        //UI by disabling the cell once it has a token
        if(board[row][col].getValue() === 0 ) 
            board[row][col].addToken(token) 
        
    }

    //reset the board 
    const reset = () => {
        board.map((row) =>{
            return row.map((cell) => {
                return cell.addToken(0);
            });
        });
    };

    //print the board
    const print = () => {
        board.forEach((row) => {
            let rowString = "";
            row.forEach((cell) => {
                rowString += (cell.getValue()) + " ";
            });
            console.log(rowString);
        });
    };

     /**
     * Check row, column, diagonals to see if we have three in a row.
     * We need only check from current cell:
     * - if this is a corner cell: check row, check column, check one diagnol
     * - if this is an edge piece: check row, check column
     * - if this is a middle piece: check row, check column, check both diagnol
     * 
     * if there are no more empty cells and no winning line is found it's a draw
     */
    const checkLines = (row, col, token) => {

        //check row
        let tally = board[row].filter((cell) => cell.getValue() === token);

        if(tally.length === rows) return true;

        //check column
        tally = board.filter((row) => row[col].getValue() === token);

        if(tally.length === cols) return true;

        //if piece played was the middle square then check both diagonals
        if(row === 1 && col === 1){
            return checkMajorDiagonal(token) || checkMinorDiagonal(token);
        }

        //if corner piece then work out which diagonal needs to be checked
        if(row != 1 && col != 1){
            return row === col ? checkMajorDiagonal(token) : checkMinorDiagonal(token);
        }

        return false;
    };

    //diagonal from 0,0 to 1,1 to 2,2
    const checkMajorDiagonal = (token) => {
        let col = 0;
        const tally = board.filter((row) => row[col++].getValue() === token); 

        return tally.length === rows;
    };

    //diagonal from 0,2 -> 1,1 -> 2,0
    const checkMinorDiagonal = (token) => {
        let col = 2;
        const tally = board.filter((row) => row[col--].getValue() === token); 
        
        return tally.length === rows;
    };

    //check to see if there are any more empty spaces on the board to play
    const hasEmptyCells = () => {
        const emptyCells = board.filter((row) => {
            return row
                    .filter((cell) => cell.getValue() === 0)
                    .length > 0;
        });

        return emptyCells.length > 0;
    };

    return {
        getBoard,
        placeToken,
        print,
        reset,
        checkLines,
        hasEmptyCells
    }
})();

/**
 * Player factory which stores the player name and a token number
 */
const Player = function(playerName, playerToken) {
    const name = playerName;
    const token = playerToken;
    
    const getPlayerName = () => name;
    
    const getPlayerToken = () => token;

    return {
        getPlayerName,
        getPlayerToken
    }
};

/**
 * Game Controller that uses the IIFE model for encapsulation and to allow only one instance to be created
 * 
 */
const GameController = (function() {

    let players = [];
    const tokens = [1, 2];
    const GameState = {
            "PLAY": 1,
            "WIN": 2,
            "DRAW": 3};
   
    let activePlayer = null;
    let currentGameState = GameState.PLAY;

    const getActivePlayer = () => activePlayer;
    const getGameState = () => currentGameState;

    const startNewGame = (player1, player2) => {
        //setup new players
        players[0] = Player(player1, tokens[0]);
        players[1] = Player(player2, tokens[1]);

        activePlayer = players[0];

        console.log(`New game: ${players[0].getPlayerName()} vs ${players[1].getPlayerName()}`)
        
        currentGameState = GameState.PLAY;
        GameBoard.reset();
        GameBoard.print();
    };

    const playRound = (row, col) => {

        console.log(`Player ${activePlayer.getPlayerName()} makes their move!`);
        GameBoard.placeToken(row, col, activePlayer.getPlayerToken());
        GameBoard.print();

        //check lines to see if there is three in a row
        const result = GameBoard.checkLines(row, col, activePlayer.getPlayerToken());

        //active player won
        if(result === true){
            console.log(`Congratulations, ${activePlayer.getPlayerName()}! You won!`);
            currentGameState = GameState.WIN;
            return;
        }

        //no more empty cells and no winner so it's a draw
        if(GameBoard.hasEmptyCells() === false){
            console.log("It's a draw!");
            currentGameState = GameState.DRAW;
            return;
        }
        
        switchPlayers();
        currentGameState = GameState.PLAY;
        
    };

    const switchPlayers = () => {
        activePlayer === players[0] ? activePlayer = players[1] : activePlayer = players[0];
    };

    return {
        getActivePlayer,
        startNewGame,
        playRound,
        GameState,
        getGameState
    }
})();

//dom rendering object
//player interacting with dom 
const ScreenController = (function() {
    GameController.startNewGame("X", "O");
    const boardElement = document.querySelector(".board");
    const messageElement = document.querySelector(".message");
    const playButton = document.querySelector(".newGameBtn");
    
    const updateDisplay = () =>{
        
        const board = GameBoard.getBoard();
        const gameState = GameController.getGameState();

        //clear the board display
        boardElement.textContent = "";

        console.log("gamestate: " +gameState);
        //render the cells
        board.forEach((row, rowIdx) => {
            row.forEach((col, colIdx) => {
                let cell = document.createElement("button");
                cell.classList.add("cell");
                cell.dataset.row = rowIdx;
                cell.dataset.col = colIdx;
                cell.textContent = col.getValue();
                cell.disabled = true;
                
                if(gameState === GameController.GameState.PLAY && col.getValue() === 0)
                    cell.disabled = false;

                boardElement.appendChild(cell);
            });
        });
    }

    //event listeners for cells
    function clickHandlerCell(e) {
        const cell = e.target;
        GameController.playRound(cell.dataset.row, cell.dataset.col);

        switch(GameController.getGameState()){
            case GameController.GameState.WIN:
                messageElement.textContent = `Player ${GameController.getActivePlayer().getPlayerName()} won!`;
                break;
            case GameController.GameState.DRAW:
                messageElement.textContent = `It's a draw!`;
                break;
            default:
                messageElement.textContent = `Player ${GameController.getActivePlayer().getPlayerName()}'s turn`;
        }     
        updateDisplay();  
    }

    function clickHandlerPlayBtn(e) {
        //let's hard code this for now
        GameController.startNewGame("X", "O");
        messageElement.textContent = "Let's play a new game!";
        updateDisplay();
    }

    //setup event listeners
    playButton.addEventListener("click", clickHandlerPlayBtn);
    boardElement.addEventListener("click",clickHandlerCell);

    updateDisplay();

})();