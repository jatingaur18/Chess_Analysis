import React, { useState, useEffect, useRef, useCallback } from "react";
import { Chess } from "chess.js";
import Toolbar from "./Toolbar";
import MoveHistory from "./MoveHistory";

const getPieceImage = (piece) => {
  if (!piece) return null;
  const colorName = piece.color === "w" ? "white" : "black";
  const pieceNames = { p: "pawn", r: "rook", n: "knight", b: "bishop", q: "queen", k: "king" };
  const pieceName = pieceNames[piece.type];
  return `./src/assets/pieces-basic-png/${colorName}-${pieceName}.png`;
};

const squareColor = (i, j) => (i + j) % 2 === 0 ? "bg-[#EBECD0]" : "bg-[#779556]";

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
  const [player1Name, setPlayer1Name] = useState("Player 1");
  const [player2Name, setPlayer2Name] = useState("Player 2");

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

  const [arrows, setArrows] = useState([]);
  const [arrowStart, setArrowStart] = useState(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const turn = game.turn();

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        setMousePosition({ x: e.clientX, y: e.clientY });
        hasDragged.current = true;
      }
    };
    const handleGlobalMouseUp = (e) => {
      if (isDragging) {
        setIsDragging(false);
        setDraggedPiece(null);
        setDraggedFrom(null);
      }
      if (arrowStart && e.button === 2) {
        const boardRect = boardRef.current?.getBoundingClientRect();
        if (!boardRect || e.clientX < boardRect.left || e.clientX > boardRect.right || e.clientY < boardRect.top || e.clientY > boardRect.bottom) {
          setArrowStart(null);
        }
      }
      hasDragged.current = false;
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleGlobalMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [isDragging, arrowStart]);

  const resetInteractiveStates = useCallback(() => {
    setSelectedSquare(null);
    setPossibleMoves([]);
    setShowPromotionDialog(false);
    setPromotionMove(null);
    setIsDragging(false);
    setDraggedPiece(null);
    setDraggedFrom(null);
    setArrows([]);
    setArrowStart(null);
    setIsPlaying(false); // Stop playing on any interaction
  }, []);

  const handleGoForward = useCallback(() => {
    if (currentNode.children.length > 0) {
      setCurrentNode(currentNode.children[0]);
      setSelectedSquare(null);
      setPossibleMoves([]);
      setArrows([]);
    }
  }, [currentNode]);

  useEffect(() => {
    if (isPlaying && currentNode.children.length > 0) {
      const timerId = setTimeout(() => {
        handleGoForward();
      }, 500);
      return () => clearTimeout(timerId);
    } else if (isPlaying && currentNode.children.length === 0) {
      setIsPlaying(false);
    }
  }, [isPlaying, currentNode, handleGoForward]);

  const handleLoadFen = (fen) => {
    try {
      new Chess(fen);
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
      setPlayer1Name("Player 1");
      setPlayer2Name("Player 2");
    } catch (e) {
      alert("Invalid FEN provided. Board will not be updated.");
    }
  };

  const handleLoadPgn = (pgn) => {
    try {
      const headers = {};
      const headerRegex = /\[\s*(\w+)\s*"(.*?)"\s*\]/g;
      let pgnWithoutHeaders = pgn.replace(headerRegex, (match, key, value) => {
        headers[key] = value;
        return "";
      });
      const movetext = pgnWithoutHeaders
        .replace(/\{[^}]*\}/g, "").replace(/\$\d+/g, "").replace(/(1-0|0-1|1\/2-1\/2|\*)$/, "")
        .replace(/\(/g, " ( ").replace(/\)/g, " ) ").replace(/\s\s+/g, ' ').trim();
      const tokens = movetext.split(' ');
      const root = createInitialHistory();
      let currentPgnNode = root;
      const variationStack = [];
      const tempGame = new Chess();
      for (const token of tokens) {
        if (!token || token.match(/^\d+\.+$/)) continue;
        if (token === '(') { variationStack.push(currentPgnNode); continue; }
        if (token === ')') { if (variationStack.length > 0) { currentPgnNode = variationStack.pop(); } continue; }
        tempGame.load(currentPgnNode.fen);
        const moveResult = tempGame.move(token, { sloppy: true });
        if (moveResult) {
          const newPly = (currentPgnNode.move ? currentPgnNode.move.ply : -1) + 1;
          const newNode = {
            fen: tempGame.fen(), move: { ...moveResult, ply: newPly }, san: moveResult.san,
            children: [], parent: currentPgnNode,
          };
          currentPgnNode.children.push(newNode);
          currentPgnNode = newNode;
        }
      }
      setPlayer1Name(headers.White || "Player 1");
      setPlayer2Name(headers.Black || "Player 2");
      let lastNode = root;
      while (lastNode.children.length > 0) { lastNode = lastNode.children[0]; }
      setHistoryRoot(root);
      setCurrentNode(lastNode);
      resetInteractiveStates();
    } catch (e) {
      console.error("PGN Parsing error:", e);
      alert("PGN Parsing error. Please check the PGN format.");
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
      if (selectedSquare === square) { setSelectedSquare(null); setPossibleMoves([]); }
      else {
        setSelectedSquare(square);
        setPossibleMoves(game.moves({ square, verbose: true }).map((m) => m.to));
      }
    } else {
      setSelectedSquare(null); setPossibleMoves([]);
    }
  };

  const handleMouseDown = (e, i, j) => {
    hasDragged.current = false;
    const square = indexToSquare(i, j);

    if (e.button === 2) {
      e.preventDefault();
      setArrowStart(square);
      return;
    }

    const piece = game.get(square);
    if (piece && piece.color === turn) {
      e.preventDefault();
      const rect = e.currentTarget.getBoundingClientRect();
      setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      setMousePosition({ x: e.clientX, y: e.clientY });
      setDraggedPiece(piece);
      setDraggedFrom(square);
      setIsDragging(true);
      setSelectedSquare(square);
      setPossibleMoves(game.moves({ square, verbose: true }).map((m) => m.to));
    }
  };

  const handleMouseUpOnSquare = (i, j) => {
    const toSquare = indexToSquare(i, j);

    if (arrowStart && !isDragging) {
      if (arrowStart === toSquare) {
        setArrows([]);
      } else {
        setArrows(prev => [...prev, { from: arrowStart, to: toSquare }]);
      }
      setArrowStart(null);
      return;
    }

    if (isDragging && draggedFrom && hasDragged.current) {
      if (possibleMoves.includes(toSquare)) {
        handleMove(draggedFrom, toSquare);
      }
    }
  };

  const handleContextMenu = (e) => e.preventDefault();

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
      const newPly = (currentNode.move ? currentNode.move.ply : -1) + 1;
      const fullMoveObject = { ...moveResult, ply: newPly };
      let nextNode = currentNode.children.find(child => child.san === moveResult.san);
      if (!nextNode) {
        nextNode = {
          fen: gameInstance.fen(), move: fullMoveObject, san: moveResult.san,
          children: [], parent: currentNode,
        };
        currentNode.children.push(nextNode);
      }
      setCurrentNode(nextNode);
      setHistoryRoot({ ...historyRoot });
    }
    resetInteractiveStates();
  };

  const onPromotionSelect = (piece) => {
    if (!promotionMove) return;
    makeMove(promotionMove.from, promotionMove.to, piece);
  };

  const cancelPromotion = () => {
    setShowPromotionDialog(false); setPromotionMove(null); setSelectedSquare(null); setPossibleMoves([]);
  };

  const resetGame = () => {
    const newRoot = createInitialHistory();
    setHistoryRoot(newRoot); setCurrentNode(newRoot); resetInteractiveStates();
    setPlayer1Name("Player 1"); setPlayer2Name("Player 2");
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

  const squareToCoords = (square) => {
    const files = "abcdefgh";
    const file = square[0];
    const rank = parseInt(square[1], 10);
    const fileIndex = files.indexOf(file);
    const rankIndex = 8 - rank;

    const col = boardOrientation === "white" ? fileIndex : 7 - fileIndex;
    const row = boardOrientation === "white" ? rankIndex : 7 - rankIndex;

    const squareSize = boardRef.current ? boardRef.current.offsetWidth / 8 : 64;
    return {
      x: col * squareSize + squareSize / 2,
      y: row * squareSize + squareSize / 2,
    };
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
                <button key={p} onClick={() => onPromotionSelect(p)} className="hover:bg-gray-200 hover:scale-110 p-2 rounded-lg transition-all duration-200 border border-gray-300 w-16 h-16 flex items-center justify-center">
                  <img src={getPieceImage({ type: p, color: turn })} alt={`${turn === "w" ? "White" : "Black"} ${p}`} className="w-12 h-12" />
                </button>
              ))}
            </div>
            <button onClick={cancelPromotion} className="w-full px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors duration-200">Cancel</button>
          </div>
        </div>
      )}

      {isDragging && draggedPiece && (
        <div className="fixed z-40 pointer-events-none" style={{ left: mousePosition.x - dragOffset.x + 32, top: mousePosition.y - dragOffset.y + 32, transform: "translate(-50%, -50%)" }}>
          <img src={getPieceImage(draggedPiece)} alt="Dragged piece" className="w-12 h-12" />
        </div>
      )}

      <div className="flex flex-row items-start gap-8">
        <Toolbar onLoadFen={handleLoadFen} onLoadPgn={handleLoadPgn} />
        <div className="flex flex-col items-center">
          <div className="text-xl font-semibold mb-2 text-gray-300 h-8">
            {boardOrientation === "white" ? player2Name : player1Name}
          </div>
          <div className="relative" ref={boardRef} onContextMenu={handleContextMenu}>
            <div className="grid grid-cols-8 border-8 border-purple-600 rounded-md shadow-2xl">
              {[...Array(8)].map((_, rowIndex) =>
                [...Array(8)].map((_, colIndex) => {
                  const square = indexToSquare(rowIndex, colIndex);
                  const piece = game.get(square);
                  const isSelected = selectedSquare === square;
                  const isTarget = possibleMoves.includes(square);
                  const isBeingDragged = isDragging && draggedFrom === square;
                  return (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      onClick={() => handleSquareClick(rowIndex, colIndex)}
                      onMouseDown={(e) => handleMouseDown(e, rowIndex, colIndex)}
                      onMouseUp={(e) => { e.button !== 2 && handleMouseUpOnSquare(rowIndex, colIndex) }}
                      onMouseUpCapture={(e) => { e.button === 2 && handleMouseUpOnSquare(rowIndex, colIndex) }}
                      className={`relative flex items-center justify-center aspect-square w-16 h-16 ${squareColor(rowIndex, colIndex)} cursor-pointer transition duration-200 ease-in-out select-none ${isSelected ? "ring-4 ring-yellow-400 z-10" : ""}`}
                    >
                      {piece && !isBeingDragged && <img src={getPieceImage(piece)} alt="" className={`w-12 h-12 ${piece.color === turn ? "cursor-grab active:cursor-grabbing" : ""}`} draggable={false} />}
                      {colIndex === 0 && (<div className="absolute left-1 top-1 text-xs text-gray-700 font-bold pointer-events-none">{boardOrientation === "white" ? 8 - rowIndex : rowIndex + 1}</div>)}
                      {rowIndex === 7 && (<div className="absolute right-1 bottom-1 text-xs text-gray-700 font-bold pointer-events-none">{boardOrientation === "white" ? "abcdefgh"[colIndex] : "abcdefgh"[7 - colIndex]}</div>)}
                      {isTarget && (<div className="absolute w-full h-full flex items-center justify-center"><div className="w-5 h-5 rounded-full bg-black bg-opacity-40 pointer-events-none"></div></div>)}
                    </div>
                  );
                })
              )}
            </div>
            <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-20">
              <defs>
                <marker id="arrowhead" markerWidth="2.5" markerHeight="3.5" refX="2.2" refY="1.75" orient="auto">
                  <polygon points="0 0, 2.5 1.75, 0 3.5" fill="#facc15" />
                </marker>
              </defs>
              {arrows.map((arrow, i) => {
                const from = squareToCoords(arrow.from);
                const to = squareToCoords(arrow.to);
                return <line key={i} x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="#facc15" strokeWidth="6" strokeOpacity="0.8" markerEnd="url(#arrowhead)" />;
              })}
            </svg>
          </div>
          <div className="text-xl font-semibold mt-2 text-gray-300 h-8">
            {boardOrientation === "white" ? player1Name : player2Name}
          </div>
          <div className="text-center mt-4">
            <div className="text-xl">{game.isGameOver() ? "Game Over" : `Turn: ${turn === "w" ? "White" : "Black"}`}</div>
            {game.inCheck() && !game.isCheckmate() && (<div className="text-orange-400 font-semibold mt-1">{turn === "w" ? "White" : "Black"} is in check!</div>)}
            {game.isCheckmate() && (<div className="text-red-500 font-bold mt-1">{turn === "w" ? "Black" : "White"} wins by checkmate!</div>)}
            {game.isStalemate() && (<div className="text-yellow-400 mt-1">Stalemate!</div>)}
            {game.isDraw() && !game.isCheckmate() && !game.isStalemate() && (<div className="text-yellow-400 mt-1">Draw!</div>)}
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            <button onClick={handleGoBack} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white font-semibold">{"<"}</button>
            <button onClick={handleGoForward} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white font-semibold">{">"}</button>
            <button
              onClick={() => setIsPlaying(p => !p)}
              className="w-24 px-6 py-2 bg-teal-600 hover:bg-teal-700 rounded-lg text-white font-semibold transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
              disabled={!isPlaying && currentNode.children.length === 0}
            >
              {isPlaying ? 'Pause' : 'Play'}
            </button>
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