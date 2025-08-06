import React from 'react';

const RecursiveVariationView = ({ moveNode, currentNode, onNodeClick }) => {
  const move = moveNode.move;
  const isWhiteMove = move.color === 'w';
  const moveNumber = Math.floor(move.ply / 2) + 1;

  const mainContinuation = moveNode.children.length > 0 ? moveNode.children[0] : null;
  const variations = moveNode.children.slice(1);

  const moveStyle = `cursor-pointer hover:bg-gray-600 px-1 rounded ${
    currentNode === moveNode ? 'bg-purple-700' : ''
  }`;

  return (
    <>
      <span className="text-gray-500">
        {moveNumber}{isWhiteMove ? '. ' : '... '}
      </span>
      <span className={moveStyle} onClick={() => onNodeClick(moveNode)}>
        {moveNode.san}
      </span>
      &nbsp;

      {variations.length > 0 && (
        variations.map((varNode, index) => (
           <div key={index} className="block pl-4">
              <RecursiveVariationView moveNode={varNode} currentNode={currentNode} onNodeClick={onNodeClick} />
           </div>
        ))
      )}
      
      {mainContinuation && (
        <RecursiveVariationView moveNode={mainContinuation} currentNode={currentNode} onNodeClick={onNodeClick} />
      )}
    </>
  );
};


const SingleMoveView = ({ moveNode, currentNode, onNodeClick }) => {
  if (!moveNode) return null;

  const moveStyle = `cursor-pointer hover:bg-gray-600 px-1 rounded ${
    currentNode === moveNode ? 'bg-purple-700' : ''
  }`;
  const variations = moveNode.children.slice(1);

  return (
    <div>
      <span className={moveStyle} onClick={() => onNodeClick(moveNode)}>
        {moveNode.san}
      </span>

      {variations.length > 0 && (
        <div className="text-gray-400 mt-1">
          {variations.map((varNode, index) => (
            <div key={index} className="block">
              ( <RecursiveVariationView moveNode={varNode} currentNode={currentNode} onNodeClick={onNodeClick} /> )
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const MoveHistory = ({ historyRoot, currentNode, onNodeClick }) => {
  const mainLineMoves = [];
  let node = historyRoot;
  while (node && node.children.length > 0) {
    const mainMoveNode = node.children[0];
    mainLineMoves.push(mainMoveNode);
    node = mainMoveNode;
  }

  const movePairs = [];
  for (let i = 0; i < mainLineMoves.length; i++) {
    const moveNode = mainLineMoves[i];
    if (moveNode.move.color === 'w') {
      movePairs.push([moveNode, null]);
    } else {
      if (movePairs.length > 0 && movePairs[movePairs.length - 1][1] === null) {
        movePairs[movePairs.length - 1][1] = moveNode;
      } else {
        movePairs.push([null, moveNode]);
      }
    }
  }

  return (
    <div className="w-80 h-[512px] bg-gray-800 text-white p-4 overflow-y-auto rounded-lg shadow-inner">
      <h3 className="text-lg font-semibold mb-2 border-b border-gray-600 pb-2">Move History</h3>
      <div className="font-mono text-sm leading-relaxed whitespace-pre-wrap">
        {movePairs.map(([whiteMove, blackMove], index) => (
          <div key={index} className="flex flex-row items-start py-1">
            <span className="text-gray-400 w-8 flex-shrink-0 pt-1">
              {whiteMove ? `${Math.floor(whiteMove.move.ply / 2) + 1}.` : `${Math.floor(blackMove.move.ply / 2) + 1}.`}
            </span>
            <div className="flex-1 grid grid-cols-2 gap-x-2">
              <div className="w-full">
                <SingleMoveView moveNode={whiteMove} currentNode={currentNode} onNodeClick={onNodeClick} />
              </div>
              <div className="w-full">
                <SingleMoveView moveNode={blackMove} currentNode={currentNode} onNodeClick={onNodeClick} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MoveHistory;