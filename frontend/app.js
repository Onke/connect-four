fetch("http://localhost:5000", { method: "OPTIONS" });

document.addEventListener("DOMContentLoaded", () => {
    const gameTable = document.getElementById("game-table");
    createGameBoard(gameTable);

    const cells = document.querySelectorAll(".cell");
    const playerClasses = ["player1", "player2"];
    let currentPlayer = 0;
    let scores = [0, 0];
    let gameBoard = [...Array(6)].map(() => Array(7).fill(null));

    cells.forEach((cell) => {
        cell.addEventListener("click", handleClick);
    });

    const resetButton = document.getElementById("reset");
    resetButton.addEventListener("click", resetGame);

    updateUI();

    function createGameBoard(gameTable) {
        for (let i = 0; i < 6; i++) {
            const row = gameTable.insertRow();

            for (let j = 0; j < 7; j++) {
                const cell = row.insertCell();
                const div = document.createElement("div");
                div.classList.add("cell");
                div.dataset.row = i;
                div.dataset.col = j;
                cell.appendChild(div);
            }
        }
    }

    async function handleClick(e) {
        const row = parseInt(e.target.dataset.row);
        const col = parseInt(e.target.dataset.col);
        const newRow = dropPiece(row, col);

        if (newRow >= 0) {
            updateUIState(e, newRow, col);
            gameBoard[newRow][col] = currentPlayer;

            // Wait for the animation to complete before checking the win and switching turns
            await new Promise((resolve) => setTimeout(resolve, 800));

            if (checkWin(newRow, col)) {
                scores[currentPlayer]++;
                updateUI();
                setTimeout(() => {
                    alert(`Player ${currentPlayer + 1} wins!`);
                    clearBoard();
                }, 9000);
            } else {
                if (currentPlayer === 0) {
                    currentPlayer = 1;
                    updateUI();
                    const computerTurnOverlay = document.getElementById("computer-turn-overlay");
                    computerTurnOverlay.classList.remove("hidden");

                    setTimeout(async () => {
                        const computerCol = await getComputerMove(gameBoard);
                        const computerNewRow = dropPiece(0, computerCol);

                        if (computerNewRow >= 0) {
                            updateUIState(e, computerNewRow, computerCol);
                            gameBoard[computerNewRow][computerCol] = currentPlayer;

                            // Wait for the animation to complete before checking the win and switching turns
                            await new Promise((resolve) => setTimeout(resolve, 800));

                            if (checkWin(computerNewRow, computerCol)) {
                                scores[currentPlayer]++;
                                updateUI();
                                setTimeout(() => {
                                    alert(`Player ${currentPlayer + 1} wins!`);
                                    clearBoard();
                                }, 10);
                            }
                        }

                        currentPlayer = 0;
                        updateUI();
                        computerTurnOverlay.classList.add("hidden");
                    }, 3000); // 3 second delay between turns
                }
            }
        }
    }

    async function getComputerMove(gameBoard) {
        const convertedBoard = gameBoard.map(row => row.map(cell => cell === null ? 0 : cell + 1));

        const response = await fetch("http://localhost:5000/api/make-move", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ board: convertedBoard }),
        });

        const data = await response.json();
        return data.column;
    }

    function updateUIState(e, newRow, col) {
        const targetCell = e.target.parentNode.parentNode.parentNode.rows[newRow].cells[col].firstChild;
        const initialTop = targetCell.style.top;
        targetCell.style.top = "-300px";
        targetCell.classList.add(playerClasses[currentPlayer]);

        setTimeout(() => {
            targetCell.style.top = initialTop;
        }, 300);
    }

    function updateUI() {
        // const currentPlayerIndicator = document.getElementById("current-player");
        // currentPlayerIndicator.innerText = currentPlayer + 1;

        const player1ScoreElement = document.getElementById("player1-score");
        const player2ScoreElement = document.getElementById("player2-score");
        player1ScoreElement.innerText = scores[0];
        player2ScoreElement.innerText = scores[1];
    }

    function dropPiece(row, col) {
        for (let i = 5; i >= 0; i--) {
            if (gameBoard[i][col] === null) {
                return i;
            }
        }
        return -1;
    }

    function checkWin(row, col) {
        const player = gameBoard[row][col];
        const directions = [
            { dr: -1, dc: 0 }, // vertical
            { dr: 0, dc: -1 }, // horizontal
            { dr: -1, dc: -1 }, // diagonal up-left
            { dr: -1, dc: 1 } // diagonal up-right
        ];

        for (const { dr, dc } of directions) {
            let count = 1;
            count += countConsecutive(row, col, dr, dc, player);
            count += countConsecutive(row, col, -dr, -dc, player);

            if (count >= 4) {
                return true;
            }
        }

        return false;
    }

    function countConsecutive(row, col, dr, dc, player) {
        let count = 0;
        let r = row + dr;
        let c = col + dc;

        while (r >= 0 && r < 6 && c >= 0 && c < 7 && gameBoard[r][c] === player) {
            count++;
            r += dr;
            c += dc;
        } return count;
    }

    function clearBoard() {
        gameBoard = [...Array(6)].map(() => Array(7).fill(null));

        cells.forEach((cell) => {
            cell.classList.remove("player1", "player2");
        });

        currentPlayer = 0;
        updateUI();
    }

    function resetGame() {
        clearBoard();
        scores = [0, 0];
    }

});
