import React, { useState, useEffect, useRef, useCallback } from "react";
import { Chess } from "chess.js";
import Toolbar from "./Toolbar";
import MoveHistory from "./MoveHistory";

const getPieceImage = (piece) => {
  if (!piece) return null;
  const colorName = piece.color === "w" ? "white" : "black";
  const pieceNames = { p: "pawn", r: "rook", n: "knight", b: "bishop", q: "queen", k: "king" };
  const pieceName = pieceNames[piece.type];
  return `.\\src\\assets\\pieces-basic-png\\${colorName}-${pieceName}.png`;
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
      
      hasDragged.current = false;
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleGlobalMouseUp);
    
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [isDragging]);

  const resetInteractiveStates = useCallback(() => {
    setSelectedSquare(null);
    setPossibleMoves([]);
    setShowPromotionDialog(false);
    setPromotionMove(null);
    setIsDragging(false);
    setDraggedPiece(null);
    setDraggedFrom(null);
    setIsPlaying(false);
  }, []);

  const handleGoForward = useCallback(() => {
    if (currentNode.children.length > 0) {
      setCurrentNode(currentNode.children[0]);
      setSelectedSquare(null);
      setPossibleMoves([]);
    }
  }, [currentNode]);

  const handleGoBack = () => {
    if (currentNode.parent) {
      setCurrentNode(currentNode.parent);
      resetInteractiveStates();
    }
  };

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
      if (selectedSquare === square) { 
        setSelectedSquare(null); 
        setPossibleMoves([]); 
      }
      else {
        setSelectedSquare(square);
        setPossibleMoves(game.moves({ square, verbose: true }).map((m) => m.to));
      }
    } else {
      setSelectedSquare(null); 
      setPossibleMoves([]);
    }
  };

  const handleMouseDown = (e, i, j) => {
    hasDragged.current = false;
    const square = indexToSquare(i, j);

    if (e.button === 2) {
      e.preventDefault();
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

    // Handle piece drag and drop
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
    <div className="min-h-screen w-full bg-[#121212] text-[#E0E0E0]">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl md:text-4xl font-light text-center mb-8 text-[#E0E0E0]">
          Chess Analysis
        </h1>

        {showPromotionDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
            <div className="bg-[#1e1e1e] p-6 rounded-lg border border-[#444444] shadow-2xl">
              <h3 className="text-lg font-medium mb-4 text-[#E0E0E0] text-center">
                Choose promotion piece
              </h3>
              <div className="flex gap-4 mb-4">
                {["q", "r", "b", "n"].map((p) => (
                  <button
                    key={p}
                    onClick={() => onPromotionSelect(p)}
                    className="hover:bg-[#333333] p-2 rounded-lg transition-colors border border-[#444444] w-16 h-16 flex items-center justify-center"
                  >
                    <img
                      src={getPieceImage({ type: p, color: turn })}
                      alt={`${turn === "w" ? "White" : "Black"} ${p}`}
                      className="w-12 h-12"
                    />
                  </button>
                ))}
              </div>
              <button
                onClick={cancelPromotion}
                className="w-full px-4 py-2 bg-[#333333] hover:bg-[#444444] text-[#E0E0E0] rounded-lg transition-colors"
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
              left: mousePosition.x - dragOffset.x + 32,
              top: mousePosition.y - dragOffset.y + 32,
              transform: "translate(-50%, -50%)"
            }}
          >
            <img src={getPieceImage(draggedPiece)} alt="Dragged piece" className="w-12 h-12" />
          </div>
        )}

        {/* Desktop Layout */}
        <div className="hidden lg:flex gap-6 pt-10 items-start justify-center max-w-7xl mx-auto">
          <div className="flex-shrink-0">
            <Toolbar
              onLoadFen={handleLoadFen}
              onLoadPgn={handleLoadPgn}
              onGoBack={handleGoBack}
              onGoForward={handleGoForward}
              onPlay={() => setIsPlaying(p => !p)}
              onReset={resetGame}
              onFlip={flipBoard}
              isPlaying={isPlaying}
              canGoBack={!!currentNode.parent}
              canGoForward={currentNode.children.length > 0}
              currentTurn={turn}
            />
          </div>

          <div className="flex flex-col items-center flex-shrink-0">
            <div className="relative" ref={boardRef} onContextMenu={handleContextMenu}>
              <div className="grid grid-cols-8 border-2 border-[#444444] rounded-lg shadow-2xl overflow-hidden">
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
                        onMouseUp={() => handleMouseUpOnSquare(rowIndex, colIndex)}
                        className={`relative flex items-center justify-center aspect-square w-16 h-16 ${squareColor(rowIndex, colIndex)} cursor-pointer transition duration-200 ease-in-out select-none ${isSelected ? "ring-2 ring-[#888888] z-10" : ""}`}
                      >
                        {piece && !isBeingDragged && (
                          <img
                            src={getPieceImage(piece)}
                            alt=""
                            className={`w-12 h-12 ${piece.color === turn ? "cursor-grab active:cursor-grabbing" : ""}`}
                            draggable={false}
                          />
                        )}
                        {colIndex === 0 && (
                          <div className="absolute left-1 top-1 text-xs text-gray-700 font-bold pointer-events-none">
                            {boardOrientation === "white" ? 8 - rowIndex : rowIndex + 1}
                          </div>
                        )}
                        {rowIndex === 7 && (
                          <div className="absolute right-1 bottom-1 text-xs text-gray-700 font-bold pointer-events-none">
                            {boardOrientation === "white" ? "abcdefgh"[colIndex] : "abcdefgh"[7 - colIndex]}
                          </div>
                        )}
                        {isTarget && (
                          <div className="absolute w-full h-full flex items-center justify-center">
                            <div className="w-5 h-5 rounded-full bg-black bg-opacity-40 pointer-events-none"></div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="flex items-center justify-between w-full max-w-md mt-3 px-4">
              <div className="text-lg font-medium text-[#B0B0B0]">
                {boardOrientation === "white" ? player2Name : player1Name}
                <span className="text-sm text-[#666666] ml-2">Black</span>
              </div>
              <div className="text-lg font-medium text-[#B0B0B0]">
                {boardOrientation === "white" ? player1Name : player2Name}
                <span className="text-sm text-[#666666] ml-2">White</span>
              </div>
            </div>

            <div className="text-center mt-6">
              {game.inCheck() && !game.isCheckmate() && (
                <div className="text-orange-400 font-medium">Check</div>
              )}
              {game.isCheckmate() && (
                <div className="text-red-400 font-bold">
                  {turn === "w" ? "Black" : "White"} wins
                </div>
              )}
              {game.isStalemate() && (
                <div className="text-yellow-400">Stalemate</div>
              )}
              {game.isDraw() && !game.isCheckmate() && !game.isStalemate() && (
                <div className="text-yellow-400">Draw</div>
              )}
            </div>
          </div>

          <div className="flex-shrink-0">
            <MoveHistory
              historyRoot={historyRoot}
              currentNode={currentNode}
              onNodeClick={handleNodeClick}
            />
          </div>
        </div>

        <div className="lg:hidden flex flex-col items-center max-w-lg mx-auto space-y-6">
          <div className="flex items-center justify-between w-full max-w-[90vw] px-4">
            <div className="text-lg font-medium text-[#B0B0B0]">
              {boardOrientation === "white" ? player2Name : player1Name}
              <span className="text-sm text-[#666666] ml-2">Black</span>
            </div>
            <div className="text-lg font-medium text-[#B0B0B0]">
              {boardOrientation === "white" ? player1Name : player2Name}
              <span className="text-sm text-[#666666] ml-2">White</span>
            </div>
          </div>

          <div className="relative w-full max-w-[90vw]" ref={boardRef} onContextMenu={handleContextMenu}>
            <div className="grid grid-cols-8 border-2 border-[#444444] rounded-lg shadow-2xl overflow-hidden w-full">
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
                      onMouseUp={() => handleMouseUpOnSquare(rowIndex, colIndex)}
                      className={`relative flex items-center justify-center aspect-square ${squareColor(rowIndex, colIndex)} cursor-pointer transition duration-200 ease-in-out select-none ${isSelected ? "ring-2 ring-[#888888] z-10" : ""}`}
                    >
                      {piece && !isBeingDragged && (
                        <img
                          src={getPieceImage(piece)}
                          alt=""
                          className={`w-[70%] h-[70%] ${piece.color === turn ? "cursor-grab active:cursor-grabbing" : ""}`}
                          draggable={false}
                        />
                      )}
                      {colIndex === 0 && (
                        <div className="absolute left-1 top-1 text-xs text-gray-700 font-bold pointer-events-none">
                          {boardOrientation === "white" ? 8 - rowIndex : rowIndex + 1}
                        </div>
                      )}
                      {rowIndex === 7 && (
                        <div className="absolute right-1 bottom-1 text-xs text-gray-700 font-bold pointer-events-none">
                          {boardOrientation === "white" ? "abcdefgh"[colIndex] : "abcdefgh"[7 - colIndex]}
                        </div>
                      )}
                      {isTarget && (
                        <div className="absolute w-full h-full flex items-center justify-center">
                          <div className="w-[25%] h-[25%] rounded-full bg-black bg-opacity-40 pointer-events-none"></div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="text-center">
            {game.inCheck() && !game.isCheckmate() && (
              <div className="text-orange-400 font-medium">Check</div>
            )}
            {game.isCheckmate() && (
              <div className="text-red-400 font-bold">
                {turn === "w" ? "Black" : "White"} wins
              </div>
            )}
            {game.isStalemate() && (
              <div className="text-yellow-400">Stalemate</div>
            )}
            {game.isDraw() && !game.isCheckmate() && !game.isStalemate() && (
              <div className="text-yellow-400">Draw</div>
            )}
          </div>

          <div className="w-full max-w-[90vw] space-y-6">
            <Toolbar
              onLoadFen={handleLoadFen}
              onLoadPgn={handleLoadPgn}
              onGoBack={handleGoBack}
              onGoForward={handleGoForward}
              onPlay={() => setIsPlaying(p => !p)}
              onReset={resetGame}
              onFlip={flipBoard}
              isPlaying={isPlaying}
              canGoBack={!!currentNode.parent}
              canGoForward={currentNode.children.length > 0}
              currentTurn={turn}
            />

            <MoveHistory
              historyRoot={historyRoot}
              currentNode={currentNode}
              onNodeClick={handleNodeClick}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChessBoard;