import React, { useState, useEffect, useRef } from "react";
import { Chess } from "chess.js";
import Toolbar from "./Toolbar";
import MoveHistory from "./MoveHistory"; // Import the new component

const getPieceImage = (piece) => {
  if (!piece) return null;

  const colorName = piece.color === "w" ? "white" : "black";
  const pieceNames = {
    p: "pawn", r: "rook", n: "knight", b: "bishop", q: "queen", k: "king",
  };
  const pieceName = pieceNames[piece.type];
  return `./src/assets/pieces-basic-png/${colorName}-${pieceName}.png`;
};

const squareColor = (i, j) =>
  (i + j) % 2 === 0 ? "bg-[#EBECD0]" : "bg-[#779556]";


const ChessBoard = () => {
  const createInitialHistory = () => ({
    fen: new Chess().fen(),
    move: null,
    san: "Initial",
    children: [],
    parent: null,
  });

  const [historyRoot, setHistoryRoot] = useState(createInitialHistory);
  const [currentNode, setCurrentNode] = useState(historyRoot);
  
  const game = new Chess(currentNode.fen);

  const [selectedSquare, setSelectedSquare] = useState(null);
  const [possibleMoves, setPossibleMoves] = useState([]);
  const [boardOrientation, setBoardOrientation] = useState("white");
  const [showPromotionDialog, setShowPromotionDialog] = useState(false);
  const [promotionMove, setPromotionMove] = useState(null);

  const [draggedPiece, setDraggedPiece] = useState(null);
  const [draggedFrom, setDraggedFrom] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const boardRef = useRef(null);
  const hasDragged = useRef(false);

  const turn = game.turn();

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        setMousePosition({ x: e.clientX, y: e.clientY });
        hasDragged.current = true;
      }
    };
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        setDraggedPiece(null);
        setDraggedFrom(null);
      }
      hasDragged.current = false;
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleGlobalMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [isDragging]);

  const resetInteractiveStates = () => {
    setSelectedSquare(null);
    setPossibleMoves([]);
    setShowPromotionDialog(false);
    setPromotionMove(null);
    setIsDragging(false);
    setDraggedPiece(null);
    setDraggedFrom(null);
  };

  const handleLoadFen = (fen) => {
    try {
      new Chess(fen); // Validate FEN
      const fenParts = fen.split(' ');

      if (fenParts.length !== 6) {
        alert("Invalid FEN: Does not contain all 6 fields.");
        return;
      }

      const turn = fenParts[1];
      const fullMoveNumber = parseInt(fenParts[5], 10);

      if (isNaN(fullMoveNumber)) {
        alert("Invalid FEN: Fullmove number is not a valid number.");
        return;
      }

      const startingPly = (fullMoveNumber - 1) * 2 + (turn === 'b' ? 1 : 0);

      const newRoot = {
        fen,
        move: { ply: startingPly - 1 },
        san: "Initial",
        children: [],
        parent: null,
      };

      setHistoryRoot(newRoot);
      setCurrentNode(newRoot);
      resetInteractiveStates();
    } catch (e) {
      alert("Invalid FEN provided. Board will not be updated.");
    }
  };
  
  const handleLoadPgn = (pgn) => {
    try {
      const tempGame = new Chess();
      const success = tempGame.loadPgn(pgn, { sloppy: true });
      if (success) {
        const pgnMoves = tempGame.history({ verbose: true });
        const newRoot = createInitialHistory();
        let current = newRoot;
        const builderGame = new Chess();

        pgnMoves.forEach(move => {
          builderGame.move(move.san);
          const newNode = {
            fen: builderGame.fen(),
            move: move,
            san: move.san,
            children: [],
            parent: current,
          };
          current.children.push(newNode);
          current = newNode;
        });

        setHistoryRoot(newRoot);
        setCurrentNode(current);
        resetInteractiveStates();
      } else {
        alert("Invalid PGN provided. Board will not be updated.");
      }
    } catch (e) {
      console.error("PGN Parsing error:", e);
      alert("PGN Parsing error. Board will not be updated.");
    }
  };

  const handleSquareClick = (i, j) => {
    if (hasDragged.current) return;
    const square = indexToSquare(i, j);
    if (selectedSquare && possibleMoves.includes(square)) {
      handleMove(selectedSquare, square);
      return;
    }
    const piece = game.get(square);
    if (piece && piece.color === turn) {
      if (selectedSquare === square) {
        setSelectedSquare(null);
        setPossibleMoves([]);
      } else {
        setSelectedSquare(square);
        const moves = game.moves({ square, verbose: true });
        setPossibleMoves(moves.map((m) => m.to));
      }
    } else {
      setSelectedSquare(null);
      setPossibleMoves([]);
    }
  };

  const handleMouseDown = (e, i, j) => {
    hasDragged.current = false;
    const square = indexToSquare(i, j);
    const piece = game.get(square);
    if (piece && piece.color === turn) {
      e.preventDefault();
      const rect = e.currentTarget.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left - rect.width / 2,
        y: e.clientY - rect.top - rect.height / 2,
      });
      setMousePosition({ x: e.clientX, y: e.clientY });
      setDraggedPiece(piece);
      setDraggedFrom(square);
      setIsDragging(true);
      setSelectedSquare(square);
      const moves = game.moves({ square, verbose: true });
      setPossibleMoves(moves.map((m) => m.to));
    }
  };

  const handleMouseUpOnSquare = (i, j) => {
    if (isDragging && draggedFrom && hasDragged.current) {
      const toSquare = indexToSquare(i, j);
      if (possibleMoves.includes(toSquare)) {
        handleMove(draggedFrom, toSquare);
      }
    }
  };

  const handleMove = (from, to) => {
    const moveDetails = game.moves({ square: from, verbose: true }).find((m) => m.to === to);
    if (!moveDetails) return;
    if (moveDetails.flags.includes("p")) {
      setPromotionMove({ from, to });
      setShowPromotionDialog(true);
      return;
    }
    makeMove(from, to);
  };


  const makeMove = (from, to, promotion = "q") => {
    const gameInstance = new Chess(currentNode.fen);
    const moveResult = gameInstance.move({ from, to, promotion });

    if (moveResult) {

      const parentPly = currentNode.move ? currentNode.move.ply : -1;
      const newPly = parentPly + 1;

      const fullMoveObject = {
        ...moveResult, // Copy all properties from the chess.js result
        ply: newPly,      // Add our correctly calculated ply
      };

      let nextNode = currentNode.children.find(child => child.san === moveResult.san);
      
      if (!nextNode) {
        nextNode = {
          fen: gameInstance.fen(),
          move: fullMoveObject, // Use our new object with the correct ply
          san: moveResult.san,
          children: [],
          parent: currentNode,
        };
        currentNode.children.push(nextNode);
      }
      
      setCurrentNode(nextNode);
      setHistoryRoot({ ...historyRoot }); // Force re-render of history panel
    }
    
    resetInteractiveStates();
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
    const newRoot = createInitialHistory();
    setHistoryRoot(newRoot);
    setCurrentNode(newRoot);
    resetInteractiveStates();
  };

  const flipBoard = () => {
    setBoardOrientation((prev) => (prev === "white" ? "black" : "white"));
  };

  const handleGoBack = () => {
    if (currentNode.parent) {
      setCurrentNode(currentNode.parent);
      resetInteractiveStates();
    }
  };

  const handleGoForward = () => {
    if (currentNode.children.length > 0) {
      setCurrentNode(currentNode.children[0]);
      resetInteractiveStates();
    }
  };

  const handleNodeClick = (node) => {
    setCurrentNode(node);
    resetInteractiveStates();
  };


  const indexToSquare = (i, j) => {
    const files = "abcdefgh";
    const rank = boardOrientation === "white" ? 8 - i : i + 1;
    const file = boardOrientation === "white" ? files[j] : files[7 - j];
    return `${file}${rank}`;
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gray-900 p-4 text-white">
      <h1 className="text-4xl font-bold mb-6">♟️ Chess Game</h1>

      {showPromotionDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="bg-white bg-opacity-90 backdrop-blur-sm p-6 rounded-lg border-2 border-gray-300 shadow-2xl">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 text-center">Choose promotion piece:</h3>
            <div className="flex gap-4 mb-4">
              {["q", "r", "b", "n"].map((p) => (
                <button
                  key={p}
                  onClick={() => onPromotionSelect(p)}
                  className="hover:bg-gray-200 hover:scale-110 p-2 rounded-lg transition-all duration-200 border border-gray-300 w-16 h-16 flex items-center justify-center"
                >
                  <img src={getPieceImage({ type: p, color: turn })} alt={`${turn === "w" ? "White" : "Black"} ${p}`} className="w-12 h-12" />
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
        <div className="fixed z-40 pointer-events-none" style={{ left: mousePosition.x - dragOffset.x, top: mousePosition.y - dragOffset.y, transform: "translate(-50%, -50%)" }}>
          <img src={getPieceImage(draggedPiece)} alt="Dragged piece" className="w-12 h-12" />
        </div>
      )}

      <div className="flex flex-row items-start gap-8">
        <Toolbar onLoadFen={handleLoadFen} onLoadPgn={handleLoadPgn} />
        
        <div className="flex flex-col items-center">
          <div className="text-xl font-semibold mb-2 text-gray-300">
            {boardOrientation === "white" ? "Player 2" : "Player 1"}
          </div>

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
                      className={`relative flex items-center justify-center aspect-square w-16 h-16 ${squareColor(row, col)} cursor-pointer transition duration-200 ease-in-out select-none ${isSelected ? "ring-4 ring-yellow-400 z-10" : ""}`}
                    >
                      {piece && !isBeingDragged && (
                        <img src={getPieceImage(piece)} alt={`${piece.color === "w" ? "White" : "Black"} ${piece.type}`} className={`w-12 h-12 ${piece && piece.color === turn ? "cursor-grab active:cursor-grabbing" : ""}`} draggable={false} />
                      )}
                      {col === 0 && (<div className="absolute left-1 top-1 text-xs text-gray-700 font-bold pointer-events-none">{boardOrientation === "white" ? 8 - row : row + 1}</div>)}
                      {row === 7 && (<div className="absolute right-1 bottom-1 text-xs text-gray-700 font-bold pointer-events-none">{boardOrientation === "white" ? "abcdefgh"[col] : "abcdefgh"[7 - col]}</div>)}
                      {isTarget && (<div className="absolute w-full h-full flex items-center justify-center"><div className="w-5 h-5 rounded-full bg-black bg-opacity-40 pointer-events-none"></div></div>)}
                    </div>
                  );
                })
              )}
            </div>
          </div>
          
          <div className="text-xl font-semibold mt-2 text-gray-300">
            {boardOrientation === "white" ? "Player 1" : "Player 2"}
          </div>

          <div className="text-center mt-4">
            <div className="text-xl">{game.isGameOver() ? "Game Over" : `Turn: ${turn === "w" ? "White" : "Black"}`}</div>
            {game.inCheck() && !game.isCheckmate() && (<div className="text-orange-400 font-semibold mt-1">{turn === "w" ? "White" : "Black"} is in check!</div>)}
            {game.isCheckmate() && (<div className="text-red-500 font-bold mt-1">{turn === "w" ? "Black" : "White"} wins by checkmate!</div>)}
            {game.isStalemate() && (<div className="text-yellow-400 mt-1">Stalemate!</div>)}
            {game.isDraw() && !game.isCheckmate() && !game.isStalemate() && (<div className="text-yellow-400 mt-1">Draw!</div>)}
          </div>

          <div className="flex gap-4 mt-4">
             <button onClick={handleGoBack} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white font-semibold">{"<"}</button>
            <button onClick={handleGoForward} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white font-semibold">{">"}</button>
            <button onClick={resetGame} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold">New Game</button>
            <button onClick={flipBoard} className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white font-semibold">Flip Board</button>
          </div>
        </div>
        <MoveHistory historyRoot={historyRoot} currentNode={currentNode} onNodeClick={handleNodeClick} />
      </div>
    </div>
  );
};

export default ChessBoard;