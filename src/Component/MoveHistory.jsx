import React from 'react';

const RenderMoveAndContinuation = ({ moveNode, isVariationBranch, currentNode, onNodeClick }) => {
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
      {(isWhiteMove || isVariationBranch) && (
        <span className="text-gray-400">
          {moveNumber}
          {isWhiteMove ? '. ' : '... '}
        </span>
      )}

      <span className={moveStyle} onClick={() => onNodeClick(moveNode)}>
        {move.san}
      </span>
      &nbsp;

      {variations.map((varNode, index) => (
        <span key={`${varNode.san}-${index}`} className="text-gray-400">
          (
          <RenderMoveAndContinuation
            moveNode={varNode}
            isVariationBranch={true}
            currentNode={currentNode}
            onNodeClick={onNodeClick}
          />
          ) &nbsp;
        </span>
      ))}

      {mainContinuation && (
        <RenderMoveAndContinuation
          moveNode={mainContinuation}
          isVariationBranch={false} 
          currentNode={currentNode}
          onNodeClick={onNodeClick}
        />
      )}
    </>
  );
};


const MoveHistory = ({ historyRoot, currentNode, onNodeClick }) => {
  return (
    <div className="w-72 h-[512px] bg-gray-800 text-white p-4 overflow-y-auto rounded-lg shadow-inner">
      <h3 className="text-lg font-semibold mb-2 border-b border-gray-600 pb-2">Move History</h3>
      <div className="font-mono text-sm leading-relaxed whitespace-pre-wrap">
        {historyRoot.children.length > 0 && (
          <RenderMoveAndContinuation
            moveNode={historyRoot.children[0]}
            isVariationBranch={false}
            currentNode={currentNode}
            onNodeClick={onNodeClick}
          />
        )}
      </div>
    </div>
  );
};

export default MoveHistory;