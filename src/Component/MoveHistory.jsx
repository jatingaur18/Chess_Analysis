
const RecursiveVariationView = ({ moveNode, currentNode, onNodeClick }) => {
  const move = moveNode.move;
  const isWhiteMove = move.color === 'w';
  const moveNumber = Math.floor(move.ply / 2) + 1;

  const mainContinuation = moveNode.children.length > 0 ? moveNode.children[0] : null;
  const variations = moveNode.children.slice(1);

  const moveStyle = `cursor-pointer hover:bg-[#333333] px-2 py-1 rounded transition-colors ${
    currentNode === moveNode ? 'bg-[#444444] text-[#E0E0E0]' : 'text-[#B0B0B0] hover:text-[#E0E0E0]'
  }`;

  return (
    <>
      <span className="text-[#666666] text-sm">
        {moveNumber}{isWhiteMove ? '. ' : '... '}
      </span>
      <span className={moveStyle} onClick={() => onNodeClick(moveNode)}>
        {moveNode.san}
      </span>
      &nbsp;

      {variations.length > 0 && (
        variations.map((varNode, index) => (
          <div key={index} className="block pl-6 py-1">
            <span className="text-[#666666] mr-2">(</span>
            <RecursiveVariationView moveNode={varNode} currentNode={currentNode} onNodeClick={onNodeClick} />
            <span className="text-[#666666] ml-2">)</span>
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

  const moveStyle = `cursor-pointer hover:bg-[#333333] px-2 py-1 rounded transition-colors ${
    currentNode === moveNode ? 'bg-[#444444] text-[#E0E0E0]' : 'text-[#B0B0B0] hover:text-[#E0E0E0]'
  }`;
  const variations = moveNode.children.slice(1);

  return (
    <div className="flex flex-col">
      <span className={moveStyle} onClick={() => onNodeClick(moveNode)}>
        {moveNode.san}
      </span>

      {variations.length > 0 && (
        <div className="text-[#666666] mt-2 text-sm">
          {variations.map((varNode, index) => (
            <div key={index} className="block py-1">
              <span className="mr-1">(</span>
              <RecursiveVariationView moveNode={varNode} currentNode={currentNode} onNodeClick={onNodeClick} />
              <span className="ml-1">)</span>
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
    <div className="w-full max-w-sm lg:w-80">
      <div className="bg-[#1e1e1e] border border-[#444444] rounded-lg shadow-lg overflow-hidden">
        <div className="p-4 border-b border-[#444444]">
          <h3 className="text-sm font-medium text-[#E0E0E0] uppercase tracking-wide">
            Move History
          </h3>
        </div>
        
        <div className="h-96 lg:h-[500px] overflow-y-auto">
          {movePairs.length === 0 ? (
            <div className="p-6 text-center text-[#666666] text-sm">
              No moves yet
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {movePairs.map(([whiteMove, blackMove], index) => (
                <div key={index} className="group">
                  <div className="flex items-start gap-3 py-2 hover:bg-[#2a2a2a] -mx-2 px-2 rounded transition-colors">
                    <div className="text-[#666666] text-sm font-mono w-8 flex-shrink-0 pt-1">
                      {whiteMove ? `${Math.floor(whiteMove.move.ply / 2) + 1}.` : `${Math.floor(blackMove.move.ply / 2) + 1}.`}
                    </div>
                    
                    <div className="flex-1 grid grid-cols-2 gap-3 min-w-0">
                      <div className="min-w-0">
                        {whiteMove ? (
                          <SingleMoveView 
                            moveNode={whiteMove} 
                            currentNode={currentNode} 
                            onNodeClick={onNodeClick} 
                          />
                        ) : (
                          <div className="h-8"></div>
                        )}
                      </div>
                      
                      <div className="min-w-0">
                        {blackMove ? (
                          <SingleMoveView 
                            moveNode={blackMove} 
                            currentNode={currentNode} 
                            onNodeClick={onNodeClick} 
                          />
                        ) : (
                          <div className="h-8"></div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MoveHistory;