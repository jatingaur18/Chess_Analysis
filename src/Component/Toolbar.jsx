import React, { useState, useRef } from "react";

const Toolbar = ({ 
  onLoadFen, 
  onLoadPgn, 
  onGoBack, 
  onGoForward, 
  onPlay, 
  onReset, 
  onFlip,
  isPlaying,
  canGoBack,
  canGoForward,
  currentTurn
}) => {
  const [fenInput, setFenInput] = useState("");
  const [pgnInput, setPgnInput] = useState("");
  const [isExpanded, setIsExpanded] = useState(true);
  const fileInputRef = useRef(null);

  const sanitizePgn = (rawPgn) => {
    const headers = [];
    const headerRegex = /\[[^\]]+\]/g;
    const movetext = rawPgn.replace(headerRegex, (match) => {
      headers.push(match);
      return "";
    });

    const sanitizedMovetext = movetext.trim().replace(/\s+/g, " ");
    return headers.join("\n") + "\n\n" + sanitizedMovetext;
  };

  const handleLoadFen = () => {
    const fen = fenInput.trim();
    if (fen) {
      onLoadFen(fen);
      setFenInput("");
    }
  };

  const handleLoadPgnFromText = () => {
    const sanitizedPgn = sanitizePgn(pgnInput);
    if (sanitizedPgn && sanitizedPgn.trim() !== "") {
      onLoadPgn(sanitizedPgn);
      setPgnInput("");
    } else {
      alert("Please paste PGN data into the text area first.");
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const rawPgn = e.target.result;
      if (rawPgn) {
        onLoadPgn(sanitizePgn(rawPgn));
      }
    };
    reader.onerror = () => {
      console.error("Failed to read the file.");
      alert("Error: Could not read the selected file.");
    };
    reader.readAsText(file);
    event.target.value = null;
  };

  const handleLoadPgnFromFile = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="bg-[#1e1e1e] border border-[#444444] rounded-lg shadow-lg w-full">
      <div className="p-4 border-b border-[#444444]">
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-1">
            <button
              onClick={onGoBack}
              disabled={!canGoBack}
              className="p-2 text-[#B0B0B0] hover:text-[#E0E0E0] hover:bg-[#333333] rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              title="Previous move"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={onGoForward}
              disabled={!canGoForward}
              className="p-2 text-[#B0B0B0] hover:text-[#E0E0E0] hover:bg-[#333333] rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              title="Next move"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <button
            onClick={onPlay}
            disabled={!isPlaying && !canGoForward}
            className="p-2 text-[#B0B0B0] hover:text-[#E0E0E0] hover:bg-[#333333] rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          <button
            onClick={onFlip}
            className="p-2 text-[#B0B0B0] hover:text-[#E0E0E0] hover:bg-[#333333] rounded transition-colors"
            title="Flip board"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </button>

          <button
            onClick={onReset}
            className="p-2 text-[#B0B0B0] hover:text-[#E0E0E0] hover:bg-[#333333] rounded transition-colors"
            title="New game"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 text-[#B0B0B0] hover:text-[#E0E0E0] hover:bg-[#333333] rounded transition-colors"
            title={isExpanded ? "Collapse" : "Expand"}
          >
            <svg className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      <div className={`h-2 ${currentTurn === 'w' ? 'bg-white' : 'bg-gray-800'} transition-colors duration-300`}></div>

      {isExpanded && (
        <div className="p-4 space-y-6">
          <div>
            <h3 className="text-sm font-medium mb-3 text-[#E0E0E0] uppercase tracking-wide">
              Load Position (FEN)
            </h3>
            <div className="space-y-3">
              <input
                type="text"
                value={fenInput}
                onChange={(e) => setFenInput(e.target.value)}
                placeholder="Enter FEN string"
                className="w-full p-3 rounded-lg bg-[#2a2a2a] text-[#E0E0E0] border border-[#444444] focus:outline-none focus:border-[#888888] transition-colors text-sm"
              />
              <button
                onClick={handleLoadFen}
                className="w-full py-2 px-4 bg-[#333333] hover:bg-[#444444] text-[#E0E0E0] rounded-lg transition-colors text-sm font-medium"
              >
                Load FEN
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-3 text-[#E0E0E0] uppercase tracking-wide">
              Load Game (PGN)
            </h3>
            <div className="space-y-3">
              <textarea
                value={pgnInput}
                onChange={(e) => setPgnInput(e.target.value)}
                placeholder="Paste PGN here"
                rows="4"
                className="w-full p-3 rounded-lg bg-[#2a2a2a] text-[#E0E0E0] border border-[#444444] focus:outline-none focus:border-[#888888] transition-colors text-sm resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleLoadPgnFromText}
                  className="flex-1 py-2 px-4 bg-[#333333] hover:bg-[#444444] text-[#E0E0E0] rounded-lg transition-colors text-sm font-medium"
                >
                  Load Text
                </button>
                <button
                  onClick={handleLoadPgnFromFile}
                  className="flex-1 py-2 px-4 bg-[#2a2a2a] hover:bg-[#333333] text-[#E0E0E0] rounded-lg transition-colors text-sm font-medium border border-[#444444]"
                >
                  Load File
                </button>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pgn"
                className="hidden"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Toolbar;