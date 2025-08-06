import React, { useState, useRef } from "react";

const Toolbar = ({ onLoadFen, onLoadPgn }) => {
  const [fenInput, setFenInput] = useState("");
  const [pgnInput, setPgnInput] = useState("");
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
    }
  };

  const handleLoadPgnFromText = () => {
    const sanitizedPgn = sanitizePgn(pgnInput);
    if (sanitizedPgn && sanitizedPgn.trim() !== "") {
      onLoadPgn(sanitizedPgn);
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
    <div className="flex flex-col gap-6 bg-gray-800 p-4 rounded-lg shadow-lg w-64">
      <div>
        <h3 className="text-lg font-semibold mb-2 text-white">Load FEN</h3>
        <input
          type="text"
          value={fenInput}
          onChange={(e) => setFenInput(e.target.value)}
          placeholder="Enter FEN string"
          className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <button
          onClick={handleLoadFen}
          className="w-full mt-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition-colors duration-200"
        >
          Load FEN
        </button>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2 text-white">Load PGN</h3>
        <textarea
          value={pgnInput}
          onChange={(e) => setPgnInput(e.target.value)}
          placeholder="Paste PGN here"
          rows="6"
          className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
        ></textarea>
        <button
          onClick={handleLoadPgnFromText}
          className="w-full mt-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition-colors duration-200"
        >
          Load from Text
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pgn"
          className="hidden"
        />
        <button
          onClick={handleLoadPgnFromFile}
          className="w-full mt-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg font-semibold transition-colors duration-200"
        >
          Load from File
        </button>
      </div>
    </div>
  );
};

export default Toolbar;