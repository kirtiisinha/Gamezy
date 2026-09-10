// COMPONENT:
// A React component is a reusable piece of UI.

// JSX:
// JSX lets us write HTML-like code inside JavaScript/TypeScript.

// TAILWIND:
// className is used to apply Tailwind CSS classes.

 "use client"; //It tells Next.js:"This file contains code that needs to run in the browser."
  
 import { useState } from "react";
 import { Manrope } from "next/font/google";

 const manrope = Manrope({
  subsets: ["latin"],
});

 export default function Home() { 
  const [showJoin, setShowJoin] = useState(false);
//    showJoin: stores the current value
//    setShowJoin: changes that value
//     false: starting value
  const [board, setBoard] = useState([
  "", "", "",
  "", "", "", 
  "", "", ""
]); // board stores the current value of all 9 Tic-Tac-Toe cells
    // Each "" means that the cell is currently empty
  const [currentPlayer, setCurrentPlayer] = useState("X");
  
  const winningCombinations = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
]; 
  const checkWinner = (board: string[]) => {
  for (const combination of winningCombinations) {
    const [a, b, c] = combination;

    if (
      board[a] !== "" &&
      board[a] === board[b] &&
      board[a] === board[c]
    ) {
      return {
        winner: board[a],
        combination: combination,
      }
    }
  }

  return null;
};
  const [gamewinner, setGameWinner] = useState<string | null>(null);
  const [isDraw, setIsDraw] = useState(false);
  const [winningCells, setWinningCells] = useState<number[]>([]);
  const restartGame = () => {
  setBoard([
    "", "", "",
    "", "", "",
    "", "", ""
  ]);

  setCurrentPlayer("X");
  setGameWinner(null);
  setIsDraw(false);
};
  const handleClick = (index: number) => {
    //Don't allow the loser to input symbol *omgg lol
    if (gamewinner) {
      return;
    }
    // Don't allow a player to overwrite an occupied cell
    if (board[index] !== "") {
      return;
    }
  const newBoard = [...board];
  // Put the current player's symbol in the clicked cell
  newBoard[index] = currentPlayer;
  setBoard(newBoard);
  
  const result = checkWinner(newBoard);

if (result) {
  setGameWinner(result.winner);
  setWinningCells(result.combination);
  return;
}

if (!newBoard.includes("")) {
  setIsDraw(true);
  return;
}

  setCurrentPlayer(currentPlayer === "X" ? "O" : "X");
}; 
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#620607]">
      <h1 className={`${manrope.className} text-6xl font-extrabold tracking-tight leading-none`}>Gamezy</h1>

      <p className="mt-4 text-lg text-[#E19184]">
        Play. Challenge. Repeat.
      </p>

{/* mt-8: margin-topflex: put children in a flex layout gap-4: put space between the buttons. px: padding horizontally. */}

      <div className="mt-8 flex gap-4"> 
        <button 
          onClick={() => alert("You clicked Create Game!+")}
          className="px-6 py-3 rounded-lg bg-[#E19184] text-[#620607] font-semibold shadow-md">
          Create Game
        </button>
 
        <button 
          onClick={() => setShowJoin(true)}
          className="px-6 py-3 rounded-lg bg-transparent border border-[#E19184] text-[#E19184] font-semibold">
          Join Game
        </button>

        {/* This little && is important, basically means: If showJoin is true, show this */}
      
        {showJoin && (
           <p className="mt-6">
             Enter your game code:
          </p>
        )}

      </div>

      <h2 className="mt-9 text-3xl font-bold text-[#E19184]">Tic-Tac-Toe</h2>

    {gamewinner && (
     <p className="mt-4 text-xl font-bold  text-[#E19184]">
       {gamewinner} wins! 🏆
     </p>
    )}

{/* grid: use CSS Grid. grid-cols-3: create 3 columns. */}

<div className="mt-6 grid grid-cols-3 gap-3">

  {/* <button 
    onClick={() => {
      const newBoard = [...board];
      newBoard[0] = "X";
      setBoard(newBoard);
    }}
    className="w-20 h-20 border"> {board[0]}
  </button> another way to add buttons. */} 

{board.map((cell, index) => (
  <button
    key={index}
    onClick={() => handleClick(index)}
    className={`w-20 h-20 rounded-xl border border-[#E19184] text-3xl font-bold transition-all duration-200 ${
     winningCells.includes(index)
       ? "bg-[#E19184] text-[#620607]"
       : "bg-[#7A0B0C] text-[#E19184]"
    }`}
  >
    {cell}
  </button>
))}

{/* .map() loops through every item in an array
and creates something for each item.
Here, it creates one button for every board cell.
 */}

</div>
{/* Next mission: WIN DETECTION
We'll learn:
Arrays
if conditions
Win combinations
Draw detection
Preventing moves after the game end */}
{isDraw && (
  <p 
   className={`mt-4 text-xl font-bold transition-all duration-900 ${
    isDraw
      ? "opacity-100 translate-y-0"
      : "opacity-0 -translate-y-2"
  }`}
  >
    It's a draw! 🤝
  </p>
)}
{(gamewinner || isDraw) && (
  <button 
    onClick={restartGame}
    // onClick={() => alert("New Game Started!")}
    className= "text-lg mt-3 text-white border border-white rounded-md px-2">Restart ↺
  </button>
)}


    </main>
  );
}
