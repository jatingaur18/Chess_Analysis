import React, { useState, useEffect, useRef } from "react";
import { Chess } from "chess.js";

// Piece image mapping
const getPieceImage = (piece) => {
  if (!piece) return null;

  const colorName = piece.color === 'w' ? 'white' : 'black';
  const pieceNames = {
    p: 'pawn',
    r: 'rook',
    n: 'knight',
    b: 'bishop',
    q: 'queen',
    k: 'king'
  };

  const pieceName = pieceNames[piece.type];
  // Make sure to replace this path with the correct path to your assets
  return `./src/assets/pieces-basic-png/${colorName}-${pieceName}.png`;
};

const squareColor = (i, j) =>
  (i + j) % 2 === 0 ? "bg-[#EBECD0]" : "bg-[#779556]";

const ChessBoard = () => {
  const [game, setGame] = useState(new Chess());
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [possibleMoves, setPossibleMoves] = useState([]);
  const [boardOrientation, setBoardOrientation] = useState("white");
  const [showPromotionDialog, setShowPromotionDialog] = useState(false);
  const [promotionMove, setPromotionMove] = useState(null);

  // Drag and drop state
  const [draggedPiece, setDraggedPiece] = useState(null);
  const [draggedFrom, setDraggedFrom] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const boardRef = useRef(null);
  const hasDragged = useRef(false); // Ref to distinguish click from drag

  const board = game.board();
  const turn = game.turn();

  // Mouse move handler for dragging
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        setMousePosition({ x: e.clientX, y: e.clientY });
        hasDragged.current = true; // Set flag to true when mouse moves
      }
    };

    const handleGlobalMouseUp = () => {
      if (isDragging) {
        // This handles drops outside the board or invalid drops
        const from = draggedFrom;
        
        // Reset all drag-related states
        setIsDragging(false);
        setDraggedPiece(null);
        setDraggedFrom(null);

        // If it was a real drag (not a click), and we are dropping off-board,
        // clear the selection. Otherwise, let the selection from mousedown persist for a click.
        if (hasDragged.current) {
            // Check if the piece was selected by the mousedown that started this drag
            if(selectedSquare === from){
                setSelectedSquare(null);
                setPossibleMoves([]);
            }
        }
      }
      hasDragged.current = false; // Reset for next interaction
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, draggedFrom, selectedSquare]);

  const handleSquareClick = (i, j) => {
    // If a drag happened, let the drop handler deal with it.
    if (hasDragged.current) return;

    const square = indexToSquare(i, j);

    // If a piece is selected and the click is on a valid move
    if (selectedSquare && possibleMoves.includes(square)) {
      handleMove(selectedSquare, square);
      return;
    }

    // If clicking on a piece of the correct color
    const piece = game.get(square);
    if (piece && piece.color === turn) {
      // If clicking the same piece, deselect it. Otherwise, select the new one.
      if (selectedSquare === square) {
        setSelectedSquare(null);
        setPossibleMoves([]);
      } else {
        setSelectedSquare(square);
        const moves = game.moves({ square, verbose: true });
        setPossibleMoves(moves.map((m) => m.to));
      }
    } else {
      // If clicking an empty square or opponent's piece, clear selection
      setSelectedSquare(null);
      setPossibleMoves([]);
    }
  };

  const handleMouseDown = (e, i, j) => {
    hasDragged.current = false; // Reset drag flag on every mousedown
    const square = indexToSquare(i, j);
    const piece = game.get(square);
    
    if (piece && piece.color === turn) {
      e.preventDefault();
      const rect = e.currentTarget.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left - rect.width / 2,
        y: e.clientY - rect.top - rect.height / 2
      });
      setMousePosition({ x: e.clientX, y: e.clientY });
      setDraggedPiece(piece);
      setDraggedFrom(square);
      setIsDragging(true);

      // Set selection and moves immediately for visual feedback
      setSelectedSquare(square);
      const moves = game.moves({ square, verbose: true });
      setPossibleMoves(moves.map((m) => m.to));
    }
  };

  const handleMouseUpOnSquare = (i, j) => {
    // This function handles the "drop" part of a drag-and-drop
    if (isDragging && draggedFrom && hasDragged.current) {
      const toSquare = indexToSquare(i, j);
      if (possibleMoves.includes(toSquare)) {
        handleMove(draggedFrom, toSquare);
      }
    }
    // The global mouseup handler will take care of resetting drag state
  };

  const handleMove = (from, to) => {
    const moveDetails = game
      .moves({ square: from, verbose: true })
      .find((m) => m.to === to);

    if (!moveDetails) return;

    if (moveDetails.flags.includes("p")) {
      setPromotionMove({ from, to });
      setShowPromotionDialog(true);
      return;
    }

    makeMove(from, to);
  };

  const makeMove = (from, to, promotion = "q") => {
    const gameCopy = new Chess(game.fen());
    const move = gameCopy.move({ from, to, promotion });
    if (move) {
      setGame(gameCopy);
      setSelectedSquare(null);
      setPossibleMoves([]);
      setShowPromotionDialog(false);
      setPromotionMove(null);
    }
  };

  const onPromotionSelect = (piece) => {
    if (!promotionMove) return;
    makeMove(promotionMove.from, promotionMove.to, piece);
  };

  const cancelPromotion = () => {
    setShowPromotionDialog(false);
    setPromotionMove(null);
    setSelectedSquare(null);
    setPossibleMoves([]);
  };

  const resetGame = () => {
    setGame(new Chess());
    setSelectedSquare(null);
    setPossibleMoves([]);
    setPromotionMove(null);
    setShowPromotionDialog(false);
    setIsDragging(false);
    setDraggedPiece(null);
    setDraggedFrom(null);
  };

  const flipBoard = () => {
    setBoardOrientation((prev) => (prev === "white" ? "black" : "white"));
  };

  const indexToSquare = (i, j) => {
    const files = "abcdefgh";
    const rank = boardOrientation === "white" ? 8 - i : i + 1;
    const file = boardOrientation === "white" ? files[j] : files[7 - j];
    return `${file}${rank}`;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 p-4 text-white">
      <h1 className="text-3xl font-bold mb-4">♟️ Chess Game</h1>

      {showPromotionDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white bg-opacity-90 backdrop-blur-sm p-6 rounded-lg border-2 border-gray-300 shadow-2xl">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 text-center">Choose promotion piece:</h3>
            <div className="flex gap-4 mb-4">
              {["q", "r", "b", "n"].map((p) => (
                <button
                  key={p}
                  onClick={() => onPromotionSelect(p)}
                  className="hover:bg-gray-200 hover:scale-110 p-2 rounded-lg transition-all duration-200 border border-gray-300 w-16 h-16 flex items-center justify-center"
                >
                  <img
                    src={getPieceImage({ type: p, color: turn })}
                    alt={`${turn === 'w' ? 'White' : 'Black'} ${p}`}
                    className="w-12 h-12"
                  />
                </button>
              ))}
            </div>
            <button
              onClick={cancelPromotion}
              className="w-full px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors duration-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {isDragging && draggedPiece && (
        <div
          className="fixed z-40 pointer-events-none"
          style={{
            left: mousePosition.x - dragOffset.x,
            top: mousePosition.y - dragOffset.y,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <img
            src={getPieceImage(draggedPiece)}
            alt="Dragged piece"
            className="w-12 h-12"
          />
        </div>
      )}

      <div className="relative" ref={boardRef}>
        <div className="grid grid-cols-8 border-8 border-purple-600 rounded-md shadow-2xl">
          {[...Array(8)].map((_, rowIndex) =>
            [...Array(8)].map((_, colIndex) => {
              const row = boardOrientation === "white" ? rowIndex : 7 - rowIndex;
              const col = boardOrientation === "white" ? colIndex : 7 - colIndex;
              const square = indexToSquare(row, col);
              const piece = game.get(square);
              const isSelected = selectedSquare === square;
              const isTarget = possibleMoves.includes(square);
              const isBeingDragged = isDragging && draggedFrom === square;

              return (
                <div
                  key={`${row}-${col}`}
                  onClick={() => handleSquareClick(row, col)}
                  onMouseDown={(e) => handleMouseDown(e, row, col)}
                  onMouseUp={() => handleMouseUpOnSquare(row, col)}
                  className={`relative flex items-center justify-center aspect-square ${squareColor(
                    row,
                    col
                  )} cursor-pointer transition duration-200 ease-in-out select-none ${
                    isSelected ? "ring-4 ring-yellow-400" : ""
                  }`}
                >
                  {piece && !isBeingDragged && (
                    <img
                      src={getPieceImage(piece)}
                      alt={`${piece.color === 'w' ? 'White' : 'Black'} ${piece.type}`}
                      className={`w-10 h-10 md:w-12 md:h-12 ${piece && piece.color === turn ? 'cursor-grab active:cursor-grabbing' : ''}`}
                      draggable={false}
                    />
                  )}

                  {col === 0 && (
                    <div className="absolute left-1 top-1 text-xs text-gray-700 pointer-events-none">
                      {boardOrientation === 'white' ? 8 - row : row + 1}
                    </div>
                  )}
                  {row === 7 && (
                    <div className="absolute right-1 bottom-1 text-xs text-gray-700 pointer-events-none">
                      {boardOrientation === 'white' ? "abcdefgh"[col] : "abcdefgh"[7-col]}
                    </div>
                  )}
                  {isTarget && (
                    <div className="absolute w-full h-full flex items-center justify-center">
                      <div className="w-4 h-4 rounded-full bg-black opacity-40 pointer-events-none"></div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="text-xl mt-4">
        {game.isGameOver()
          ? "Game Over"
          : `Turn: ${turn === "w" ? "White" : "Black"}`}
      </div>

      {game.inCheck() && !game.isCheckmate() && (
        <div className="text-orange-400 font-semibold mt-2">
          {turn === "w" ? "White" : "Black"} is in check!
        </div>
      )}

      {game.isCheckmate() && (
        <div className="text-red-500 font-bold mt-2">
          {turn === "w" ? "Black" : "White"} wins by checkmate!
        </div>
      )}

      {game.isStalemate() && <div className="text-yellow-400 mt-2">Stalemate!</div>}
      {game.isDraw() && !game.isCheckmate() && !game.isStalemate() && (
        <div className="text-yellow-400 mt-2">Draw!</div>
      )}

      <div className="flex gap-4 mt-6">
        <button
          onClick={resetGame}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold"
        >
          New Game
        </button>
        <button
          onClick={flipBoard}
          className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white font-semibold"
        >
          Flip Board
        </button>
      </div>
    </div>
  );
};

export default ChessBoard;