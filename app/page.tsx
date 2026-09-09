// COMPONENT:
// A React component is a reusable piece of UI.

// JSX:
// JSX lets us write HTML-like code inside JavaScript/TypeScript.

// TAILWIND:
// className is used to apply Tailwind CSS classes.

 "use client"; //It tells Next.js:"This file contains code that needs to run in the browser."
  
 import { useState } from "react";

 export default function Home() { 
  const [showJoin, setShowJoin] = useState(false);
  const [board, setBoard] = useState([
  "", "", "",
  "", "", "", 
  "", "", ""
]); // board stores the current value of all 9 Tic-Tac-Toe cells
    // Each "" means that the cell is currently empty
  const [currentPlayer, setCurrentPlayer] = useState("X");

  const handleClick = (index: number) => {
    // Don't allow a player to overwrite an occupied cell
    if (board[index] !== "") {
      return;
    }
  const newBoard = [...board];
  // Put the current player's symbol in the clicked cell
  newBoard[index] = currentPlayer;
  setBoard(newBoard);

//    showJoin: stores the current value
//    setShowJoin: changes that value
//     false: starting value
  setCurrentPlayer(currentPlayer === "X" ? "O" : "X");
}; 
  return (
    <main className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-5xl font-bold">Gamezy</h1>

      <p className="mt-4 text-lg">
        Play. Challenge. Repeat.
      </p>

{/* mt-8: margin-topflex: put children in a flex layout gap-4: put space between the buttons. px: padding horizontally. */}

      <div className="mt-8 flex gap-4"> 
        <button 
          onClick={() => alert("You clicked Create Game!+")}
          className="px-6 py-3 rounded-lg bg-black text-white">
          Create Game
        </button>
 
        <button 
          onClick={() => setShowJoin(true)}
          className="px-6 py-3 rounded-lg border border-black">
          Join Game
        </button>

        {/* This little && is important, basically means: If showJoin is true, show this */}
      
        {showJoin && (
           <p className="mt-6">
             Enter your game code:
          </p>
        )}

      </div>

      <h4 className="mt-9 text-2xl font-bold">Tic-Tac-Toe</h4>

{/* grid → use CSS Grid. grid-cols-3 → create 3 columns. */}

<div className="mt-4 grid grid-cols-3 gap-2">

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
    className="w-20 h-20 border"
  >
    {cell}
  </button>
))}

{/* .map() loops through every item in an array
and creates something for each item.
Here, it creates one button for every board cell.
 */}

</div>

    </main>
  );
}

// Next mission: WIN DETECTION
// We'll learn:

// Arrays
// if conditions
// Win combinations
// Draw detection
// Preventing moves after the game ends