from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np

app = Flask(__name__)
CORS(app)

ROWS = 6
COLUMNS = 7
WINNING_LENGTH = 4

def is_valid_move(board, col):
    return board[0][col] == 0

def make_move(board, row, col, player):
    board[row][col] = player

def undo_move(board, row, col):
    board[row][col] = 0

def get_next_open_row(board, col):
    for row in range(ROWS - 1, -1, -1):
        if board[row][col] == 0:
            return row
    return -1

def is_winning_move(board, row, col, player):
    row_count = len(board)
    col_count = len(board[0])

    def count_consecutive(row, col, dr, dc):
        count = 0
        r, c = row + dr, col + dc
        while 0 <= r < row_count and 0 <= c < col_count and board[r][c] == player:
            count += 1
            r += dr
            c += dc
        return count

    directions = [
        (0, 1),  # horizontal
        (1, 0),  # vertical
        (1, 1),  # diagonal up-right
        (1, -1)  # diagonal up-left
    ]

    for dr, dc in directions:
        count = 1
        count += count_consecutive(row, col, dr, dc)
        count += count_consecutive(row, col, -dr, -dc)

        if count >= 4:
            return True

    return False

def minimax(board, depth, maximizing_player, alpha, beta):
    if depth == 0:
        return 0

    valid_moves = [col for col in range(COLUMNS) if is_valid_move(board, col)]
    if not valid_moves:
        return 0

    if maximizing_player:
        max_eval = float('-inf')
        for col in valid_moves:
            row = get_next_open_row(board, col)
            make_move(board, row, col, 2)
            if is_winning_move(board, row, col, 2):
                undo_move(board, row, col)
                return 1000
            evaluation = minimax(board, depth - 1, False, alpha, beta)
            undo_move(board, row, col)
            max_eval = max(max_eval, evaluation)
            alpha = max(alpha, evaluation)
            if beta <= alpha:
                break
        return max_eval
    else:
        min_eval = float('inf')
        for col in valid_moves:
            row = get_next_open_row(board, col)
            make_move(board, row, col, 1)
            if is_winning_move(board, row, col, 1):
                undo_move(board, row, col)
                return -1000
            evaluation = minimax(board, depth - 1, True, alpha, beta)
            undo_move(board, row, col)
            min_eval = min(min_eval, evaluation)
            beta = min(beta, evaluation)
            if beta <= alpha:
                break
        return min_eval

@app.route("/api/make-move", methods=["POST"])
def make_computer_move():
    board = np.array(request.json["board"])
    best_move = None
    best_score = float('-inf')

    for col in range(COLUMNS):
        if is_valid_move(board, col):
            row = get_next_open_row(board, col)
            make_move(board, row, col, 2)
            score = minimax(board, 4, False, float('-inf'), float('inf'))
            undo_move(board, row, col)
            if score > best_score:
                best_score = score
                best_move = col

    return jsonify({"column": best_move})

if __name__ == "__main__":
    app.run(debug=True)

