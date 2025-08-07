# Chess Analysis Board

## Overview

This is a sophisticated, front-end chess analysis board built with React. It leverages the `chess.js` library for robust game logic and state management. The application provides a fully interactive interface for loading, playing through, and analyzing chess games, complete with support for complex variations. The user interface is styled with Tailwind CSS for a clean, modern, and responsive design.

***

## Core Features

### Game and Position Loading
* **PGN Support**: Load full chess games using Portable Game Notation (PGN). The tool supports pasting PGN text directly or uploading `.pgn` files. It correctly parses headers (like player names) and the movetext, including comments and variations.
* **FEN Support**: Set up any specific board position using a Forsyth-Edwards Notation (FEN) string. This allows for instant analysis starting from any point in a game.

### Interactive Analysis Board
* **Piece Movement**: Move pieces with intuitive drag-and-drop or click-to-move functionality.
* **Visual Feedback**: The board provides clear visual cues for the currently selected piece, all its legal moves, and check situations.
* **Pawn Promotion**: A clean dialog appears automatically for pawn promotion, allowing the user to select a queen, rook, bishop, or knight.
* **Board Orientation**: Flip the board at any time to view the position from either White's or Black's perspective.

### Advanced Move Navigation
* **Step-Through Controls**: Easily navigate the game move-by-move with forward and backward buttons.
* **Auto-Play**: Automatically play through the main line of a loaded game with a simple play/pause control. The speed can be configured within the code.
* **Variation Management**: The application's key feature is its ability to manage and display multiple lines of play (variations). The move history panel renders the main line and all sub-variations in a nested, easy-to-read format. Users can click on any move in any variation to instantly see it on the board and explore that line further.

***

## Technology Stack

* **React**: The core front-end library for building the user interface and managing component state.
* **chess.js**: A powerful JavaScript library used for chess move generation, validation, and position evaluation (FEN/PGN handling).
* **Tailwind CSS**: A utility-first CSS framework for creating the responsive and modern user interface.