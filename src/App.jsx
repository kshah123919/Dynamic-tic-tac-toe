import React, { useState, useEffect } from 'react';
import './App.css';

// --- AI CONFIG ---
// The API Key is now handled securely by the Node.js backend (server.js).

function App() {
  const [board, setBoard] = useState([
    [null, null, null],
    [null, null, null],
    [null, null, null],
  ]);
  const [isXNext, setIsXNext] = useState(true);
  const [winner, setWinner] = useState(null);
  const [isRotating, setIsRotating] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [hoveredCell, setHoveredCell] = useState(null);
  const [futurePosition, setFuturePosition] = useState(null);
  const [nextRotation, setNextRotation] = useState('CW'); // 'CW', 'CCW', '180'
  const [lastRotationMsg, setLastRotationMsg] = useState("");
  const [rotationDegrees, setRotationDegrees] = useState(0);
  const [suggestionsLeft, setSuggestionsLeft] = useState(2);
  const [previewsLeft, setPreviewsLeft] = useState(3);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isNoMercy, setIsNoMercy] = useState(false);
  const [timeLeft, setTimeLeft] = useState(6);
  const [winningLine, setWinningLine] = useState(null);
  const [suddenMoveActive, setSuddenMoveActive] = useState(false);

  // Check for winner after every move/rotation
  useEffect(() => {
    const result = calculateWinner(board);
    if (result) {
      const [winnerPlayer, pattern] = result;
      // Step 1: Immediately highlight squares
      setWinningLine(pattern);
      
      // Step 2: Delay the win message and overlay by 1 second
      const timer = setTimeout(() => {
        setWinner(winnerPlayer);
        const patternStr = pattern.join(',');
        let msg = `Player ${winnerPlayer} wins!`;
        if (patternStr === '0,4,8') msg = `Player ${winnerPlayer} wins diagonally (top-left to bottom-right)`;
        else if (patternStr === '2,4,6') msg = `Player ${winnerPlayer} wins diagonally (top-right to bottom-left)`;
        setLastRotationMsg(msg);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else if (isBoardFull(board)) {
      setWinner('Draw');
      // Removed AI explainResult call as per strict requirements
    }
  }, [board]);

  // Turn Timer for No Mercy Mode
  useEffect(() => {
    let timer;
    if (isNoMercy && !winner && timeLeft > 0 && !isRotating) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (isNoMercy && timeLeft === 0 && !winner) {
      // Time scale: Opponent wins if you run out of time
      setWinner(isXNext ? 'O' : 'X');
      setExplanation("Time's up! No mercy shown.");
    }
    return () => clearInterval(timer);
  }, [isNoMercy, timeLeft, winner, isRotating, isXNext]);

  const pickNextRotation = () => {
    const rotations = ['CW', 'CCW', '180'];
    const picked = rotations[Math.floor(Math.random() * rotations.length)];
    setNextRotation(picked);
  };

  // Initialize first rotation
  useEffect(() => {
    pickNextRotation();
  }, []);

  const handleSquareClick = (r, c) => {
    if (board[r][c] || winner || isRotating) return;

    if (isPreviewMode) {
      if (previewsLeft <= 0) return;

      setHoveredCell({ r, c });
      setAiSuggestion(null); // Clear AI suggestion if user starts previewing
      setPreviewsLeft(prev => prev - 1);

      // Use pre-determined nextRotation for insight
      let fR, fC;
      if (nextRotation === 'CW') {
        fR = c; fC = 2 - r;
      } else if (nextRotation === 'CCW') {
        fR = 2 - c; fC = r;
      } else {
        fR = 2 - r; fC = 2 - c;
      }
      setFuturePosition({ r: fR, c: fC });
      return; // Don't make a move, just preview
    }

    // Normal Move Logic
    const newBoard = board.map(row => [...row]);
    newBoard[r][c] = isXNext ? 'X' : 'O';

    setBoard(newBoard);
    setIsRotating(true);
    
    let deg = 90;
    if (nextRotation === 'CCW') deg = -90;
    if (nextRotation === '180') deg = 180;
    setRotationDegrees(deg);

    setTimeout(() => {
      const rotated = rotateBoardStatic(newBoard, nextRotation);
      setBoard(rotated);
      setIsRotating(false);
      setAiSuggestion(null); 
      setHoveredCell(null);
      setFuturePosition(null);
      setRotationDegrees(0);
      
      const res = calculateWinner(rotated);
      const isSudden = Math.random() < 0.2 && !res;

      if (isSudden) {
        setSuddenMoveActive(true);
        // Extend the rotation lock for 1 second to let the player notice the event
        setIsRotating(true); 
        setTimeout(() => {
          setSuddenMoveActive(false);
          setIsRotating(false);
        }, 1000);
      } else {
        const msg = nextRotation === 'CW' ? '90° CW' : nextRotation === 'CCW' ? '90° CCW' : '180°';
        setLastRotationMsg(`Board rotated ${msg}`);
        setIsXNext(!isXNext);
        setIsRotating(false); // Enable moves immediately for normal turns
      }
      
      setTimeLeft(6);
      pickNextRotation();
    }, 600);
  };

  const handleMouseEnter = (r, c) => {};
  const handleMouseLeave = () => {};

  const getInsightText = () => {
    if (!futurePosition) return null;
    const { r, c } = futurePosition;
    const msg = nextRotation === 'CW' ? '90° CW' : nextRotation === 'CCW' ? '90° CCW' : '180°';
    
    if (r === 1 && c === 1) return `Rotation (${msg}) will move this to the Center!`;
    if ((r + c) % 2 === 0) return `Rotation (${msg}) will land this in a Corner.`;
    return `Rotation (${msg}) will shift this to an Edge position.`;
  };

  const rotateBoardStatic = (currentBoard, type) => {
    const newBoard = [
      [null, null, null],
      [null, null, null],
      [null, null, null],
    ];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (type === 'CW') {
          newBoard[c][2 - r] = currentBoard[r][c];
        } else if (type === 'CCW') {
          newBoard[2 - c][r] = currentBoard[r][c];
        } else {
          newBoard[2 - r][2 - c] = currentBoard[r][c];
        }
      }
    }
    return newBoard;
  };

  const calculateWinner = (grid) => {
    const squares = grid.flat();
    const patterns = [
      [0,1,2], [3,4,5], [6,7,8],
      [0,3,6], [1,4,7], [2,5,8],
      [0,4,8], [2,4,6]
    ];
    for (let i = 0; i < patterns.length; i++) {
      const [a, b, c] = patterns[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return [squares[a], patterns[i]];
      }
    }
    return null;
  };
  const isBoardFull = (grid) => grid.every(row => row.every(cell => cell !== null));

  const resetGame = () => {
    setBoard([[null, null, null], [null, null, null], [null, null, null]]);
    setIsXNext(true);
    setWinner(null);
    setAiSuggestion(null);
    setExplanation(null);
    setHoveredCell(null);
    setFuturePosition(null);
    setLastRotationMsg("");
    setRotationDegrees(0);
    setSuggestionsLeft(isNoMercy ? 1 : 2);
    setPreviewsLeft(3);
    setIsPreviewMode(false);
    setWinningLine(null);
    setTimeLeft(6);
    pickNextRotation();
  };

  const toggleNoMercy = () => {
    const newNoMercy = !isNoMercy;
    setIsNoMercy(newNoMercy);
    setBoard([[null, null, null], [null, null, null], [null, null, null]]);
    setIsXNext(true);
    setWinner(null);
    setWinningLine(null);
    setAiSuggestion(null);
    setExplanation(null);
    setHoveredCell(null);
    setFuturePosition(null);
    setLastRotationMsg("");
    setRotationDegrees(0);
    setSuggestionsLeft(newNoMercy ? 1 : 2);
    setPreviewsLeft(3);
    setIsPreviewMode(false);
    setTimeLeft(6);
    pickNextRotation();
  };

  // --- AI FEATURES ---

  const suggestMove = async () => {
    if (winner || isRotating) return;

    if (isNoMercy) {
      setAiSuggestion("Suggestions are disabled in No Mercy Mode 🔥");
      return;
    }

    if (suggestionsLeft <= 0) {
      setAiSuggestion("No suggestions left. Play strategically!");
      return;
    }

    setIsLoadingAi(true);
    setAiSuggestion(null);
    setHoveredCell(null); 
    setFuturePosition(null);
    
    // Decrement immediately to prevent fast-click exploits
    setSuggestionsLeft(prev => Math.max(0, prev - 1));

    try {
      const response = await fetch("http://localhost:5000/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ board, player: isXNext ? 'X' : 'O' })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setAiSuggestion(data.suggestion);
    } catch (e) {
      setAiSuggestion("AI suggests playing strategically!");
    }
    setIsLoadingAi(false);
  };

  const explainResult = async (res) => {
    try {
      const response = await fetch("http://localhost:5000/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ board, result: res })
      });
      const data = await response.json();
      if (data.explanation) setExplanation(data.explanation);
    } catch (e) {
      setExplanation("A great game of strategy!");
    }
  };

  return (
    <div className="app-wrapper">
      <div className="container">
        <header>
          <h1>Dynamic Tic Tac Toe</h1>
          <p className="subtitle">Think Ahead. The Board Moves.</p>
        </header>

        <div className="status-bar">
          <div className="mode-indicator" onClick={toggleNoMercy}>
            {isNoMercy ? "Mode: NO MERCY 🔥" : "Mode: Normal"}
          </div>
          {winner ? (
            <span className="current-player fade-in">
              {winner === 'Draw' ? "It's a Draw!" : `Player ${winner} Wins!`}
            </span>
          ) : (
            <div className="turn-info">
              <span className={`current-player ${isXNext ? 'x' : 'o'}`}>
                Player {isXNext ? 'X' : 'O'}
              </span>
              {isNoMercy && (
                <span className={`timer ${timeLeft <= 2 ? 'ticking' : ''}`}>
                  {timeLeft}s
                </span>
              )}
            </div>
          )}
        </div>

        <div className="board-container">
          <div
            className={`grid ${suddenMoveActive ? 'sudden-move-flash' : ''}`}
            style={{ transform: isRotating ? `rotate(${rotationDegrees}deg)` : 'rotate(0deg)' }}
          >
            {board.map((row, rIdx) =>
              row.map((cell, cIdx) => {
              const isFuture = futurePosition && futurePosition.r === rIdx && futurePosition.c === cIdx;
              const isHovered = hoveredCell && hoveredCell.r === rIdx && hoveredCell.c === cIdx;
              const isWinningSquare = winningLine && winningLine.some(idx => {
                const r = Math.floor(idx / 3);
                const c = idx % 3;
                return r === rIdx && c === cIdx;
              });
              
              return (
                <div
                  key={`${rIdx}-${cIdx}`}
                  className={`square ${cell ? cell.toLowerCase() : ''} ${isFuture ? 'future-highlight' : ''} ${isHovered ? 'hover-active' : ''} ${isPreviewMode ? 'preview-cursor' : ''} ${isWinningSquare ? 'highlight' : ''}`}
                  onClick={() => handleSquareClick(rIdx, cIdx)}
                  onMouseEnter={() => handleMouseEnter(rIdx, cIdx)}
                  onMouseLeave={handleMouseLeave}
                >
                  {cell}
                </div>
              );
            }))}
          </div>

          {suddenMoveActive && (
            <div className="sudden-move-overlay fade-in">
              <div className="sudden-move-content">
                <h1>⚡ SUDDEN MOVE!</h1>
                <p>Player {isXNext ? 'X' : 'O'} plays again</p>
              </div>
            </div>
          )}

          <div className="controls">
            <div className="control-column">
              <button className="btn-outline" onClick={resetGame}>Reset Game</button>
              <div className="count-badge">System Ready</div>
            </div>

            {!winner && (
              <>
                {!isNoMercy && (
                  <div className="control-column">
                    <button
                      className={`btn-outline ${isPreviewMode ? 'active-mode' : ''}`}
                      onClick={() => {
                        setIsPreviewMode(!isPreviewMode);
                        setHoveredCell(null);
                        setFuturePosition(null);
                      }}
                      disabled={previewsLeft <= 0}
                    >
                      {isPreviewMode ? 'EXIT PREVIEW' : 'PREVIEW MODE'}
                    </button>
                    <div className="count-badge">
                      {previewsLeft > 0 ? `Preview left: ${previewsLeft}` : 'No previews left. Play carefully.'}
                    </div>
                  </div>
                )}

                <div className="control-column">
                  <button
                    className="btn-primary"
                    onClick={suggestMove}
                    disabled={isLoadingAi || suggestionsLeft <= 0 || isNoMercy}
                  >
                    {isLoadingAi ? 'THINKING...' : 'SUGGEST MOVE'}
                  </button>
                  <div className="count-badge">
                    {isNoMercy ? 'Disabled in No Mercy' : (suggestionsLeft > 0 ? `Suggestions left: ${suggestionsLeft}` : 'No suggestions left')}
                  </div>
                </div>
             </>
            )}
          </div>
        </div>

        <div className="message-area">
          {hoveredCell && !winner && (
            <div className="insight-box fade-in">
              <span className="insight-icon">🎯</span>
              <p className="insight-text">{getInsightText()}</p>
              <button className="btn-close" onClick={() => { setHoveredCell(null); setFuturePosition(null); }}>✕</button>
            </div>
          )}

          {aiSuggestion && !hoveredCell && (
            <div className="ai-suggestion fade-in" style={{ marginTop: 0 }}>
              <h3>AI Suggestion</h3>
              <p>{aiSuggestion}</p>
            </div>
          )}

          {explanation && winner && (
            <div className="ai-suggestion fade-in" style={{ borderColor: 'var(--primary)', marginTop: 0 }}>
              <h3>AI Analysis</h3>
              <p>{explanation}</p>
            </div>
          )}
        </div>

        {winner && (
          <div className="winner-overlay">
            <div className="winner-card fade-in">
              <h2 className={winner === 'X' ? 'winner-x' : winner === 'O' ? 'winner-o' : ''}>
                {winner === 'Draw' ? "It's a Draw!" : `${winner} Wins!`}
              </h2>
              <p>{explanation}</p>
              <button className="btn-primary" onClick={resetGame}>New Game</button>
            </div>
          </div>
        )}
      </div>
      <footer className="footer">
        <p>© 2026 Krish Shah. Built for Prompt Wars 2026.</p>
      </footer>
    </div>
  );
}

export default App;
