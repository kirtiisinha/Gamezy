// COMPONENT:
// A React component is a reusable piece of UI.

// JSX:
// JSX lets us write HTML-like code inside JavaScript/TypeScript.

// TAILWIND:
// className is used to apply Tailwind CSS classes.

 "use client"; //It tells Next.js:"This file contains code that needs to run in the browser."
  
 import { useEffect ,useState } from "react";
 import { supabase } from "./lib/supabase";
 import { Manrope } from "next/font/google";

 const manrope = Manrope({
  subsets: ["latin"],
});

 export default function Home() {
  const [showJoin, setShowJoin] = useState(false);
//    showJoin: stores the current value
//    setShowJoin: changes that value
//     false: starting value
  const [gameCode, setGameCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [gameMessage, setGameMessage] = useState("");
  const [isClosingMessage, setIsClosingMessage] = useState(false);
  const showGameMessage = (message: string) => {
  setIsClosingMessage(false);
  setGameMessage(message);

  setTimeout(() => {
    setIsClosingMessage(true);

    setTimeout(() => {
      setGameMessage("");
    }, 300);
  }, 2700);
};
  const [playerId] = useState(() => crypto.randomUUID());
  const [board, setBoard] = useState([
  "", "", "",
  "", "", "", 
  "", "", ""
]); // board stores the current value of all 9 Tic-Tac-Toe cells
    // Each "" means that the cell is currently empty
  const [currentPlayer, setCurrentPlayer] = useState("X");
  const [playerRole, setPlayerRole] = useState<"X" | "O" | null>(null);

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
  setWinningCells([]);

};
const leaveGame = async () => {
  if (gameCode && playerRole) {
    const updateData =
      playerRole === "X"
        ? {
            player_x: null,
            player_x_left: true,
          }
        : {
            player_o: null,
            player_o_left: true,
          };

    const { error } = await supabase
      .from("games")
      .update(updateData)
      .eq("code", gameCode);

    if (error) {
      console.error("Leave game failed:", error);
      return;
    }
  }

  setGameCode("");
  setPlayerRole(null);

  setBoard([
    "", "", "",
    "", "", "",
    "", "", ""
  ]);

  setCurrentPlayer("X");
  setGameWinner(null);
  setIsDraw(false);
  setWinningCells([]);

  localStorage.removeItem("gameCode");
  localStorage.removeItem("playerRole");
};

  const handleClick = async (index: number) => {
    if (!playerRole || playerRole !== currentPlayer) {
  return;
}
    //Don't allow the loser to input symbol *omgg lol
    if (gamewinner || isDraw) {
      return;
    }
    // Don't allow a player to overwrite an occupied cell
    if (board[index] !== "") {
      return;
    }
  const newBoard = [...board];
  // Put the current player's symbol in the clicked cell
  newBoard[index] = currentPlayer;
  
  const result = checkWinner(newBoard);
  let newWinner = null;
  let newStatus = "ACTIVE";

  if (result) {
  newWinner = result.winner;
  newStatus = result.winner === "X" ? "X_WON" : "O_WON";
  setGameWinner(result.winner);
  setWinningCells(result.combination);
} else if (!newBoard.includes("")) {
  newStatus = "DRAW";
  setIsDraw(true);
}

const nextPlayer = currentPlayer === "X" ? "O" : "X";
setBoard(newBoard);

if (!result && newBoard.includes("")) {
    setCurrentPlayer(nextPlayer);
  }
  const { error } = await supabase
  .from("games")
  .update({
    board: newBoard,
    current_player: nextPlayer,
    status: newStatus,
    winner: newWinner,
    })
    .eq("code", gameCode);

  if (error) {
    console.error("Move update failed:", error);
  }
};
useEffect(() => {
  const savedGameCode = localStorage.getItem("gameCode");
  const savedPlayerRole = localStorage.getItem("playerRole");

  if (savedGameCode) {
    setGameCode(savedGameCode);
  }

  if (savedPlayerRole === "X" || savedPlayerRole === "O") {
    setPlayerRole(savedPlayerRole);
  }
}, []);
 
useEffect(() => {
  console.log("Starting Realtime for game:", gameCode);

  if (!gameCode) {
    return;
  }

  const loadGame = async () => {
    const { data, error } = await supabase
      .from("games")
      .select("board, current_player, status, winner, player_o_left")
      .eq("code", gameCode)
      .single();

    if (error) {
      console.error("Could not load game:", error);
      return;
    }

    setBoard(data.board);
    setCurrentPlayer(data.current_player);

    if (data.winner) {
      setGameWinner(data.winner);
    }

    if (data.status === "DRAW") {
      setIsDraw(true);
    }
  };

  loadGame();

  const channel = supabase
    .channel(`game-${gameCode}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "games",
        filter: `code=eq.${gameCode}`,
      },
      (payload) => {
        console.log("Game updated:", payload.new);

        setBoard(payload.new.board);
        setCurrentPlayer(payload.new.current_player);

        if (payload.new.winner) {
          setGameWinner(payload.new.winner);
        }

        if (payload.new.status === "DRAW") {
          setIsDraw(true);
        }
      
      if (payload.new.player_o_left) {
       setGameCode("");
      setPlayerRole(null);
      setGameWinner(null);
      setIsDraw(false);
      setWinningCells([]);

      showGameMessage("Your opponent left the game 👋");
  }
     if (payload.new.player_x_left) {
      setGameCode("");
      setPlayerRole(null);
      setGameWinner(null);
      setIsDraw(false);
      setWinningCells([]);

     showGameMessage("Your opponent left the game 👋");
   }
}
    )
    .subscribe((status) => {
      console.log("Realtime status:", status);
    });

  return () => {
    supabase.removeChannel(channel);
  };
}, [gameCode]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#620607]">
      <h1 className={`${manrope.className} text-6xl font-extrabold tracking-tight leading-none`}>Gamezy</h1>

      <p className="mt-4 text-lg text-[#E19184]">
        Play. Challenge. Repeat.
      </p>

{/* mt-8: margin-topflex: put children in a flex layout gap-4: put space between the buttons. px: padding horizontally. */}
<div className="mt-8 flex gap-4"> 
  <button 
    onClick={async () => {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();

  const { error } = await supabase
    .from("games")
    .insert({
  code: code,
  player_x: playerId,
})
//   Click
//  ↓
// Generate code
//  ↓
// INSERT into Supabase 🗄️
//  ↓
// If successful → show code

 if (error) {
  console.error(error);
  alert("Could not create game ❌");
  return;
}

setPlayerRole("X");
setGameCode(code);
localStorage.setItem("gameCode", code);
localStorage.setItem("playerRole", "X");

}}
    className="px-6 py-3 rounded-lg bg-[#E19184] text-[#620607] font-semibold shadow-md"
  >
    Create Game
  </button>

  <button 
    onClick={() => setShowJoin(true)}
    className="px-6 py-3 rounded-lg bg-transparent border border-[#E19184] text-[#E19184] font-semibold"
  >
    Join Game
  </button>
</div>
        {/* This little && is important, basically means: If showJoin is true, show this */}
    
      <h2 className="mt-9 text-3xl font-bold text-[#E19184]">
        Tic-Tac-Toe</h2>

   {gameMessage && (
     <div className="fixed top-5 right-5 z-50 rounded-xl border border-[#E19184] bg-[#7A0B0C] px-5 py-3 text-[#E19184] shadow-xl animate-[popup_0.2s_ease-out]">
       {gameMessage}
     </div>
   )}

     {playerRole && !gamewinner && !isDraw && (
      <p className="mt-3 text-lg font-semibold text-[#E19184]">
       {playerRole === currentPlayer
        ? "Your turn 🎮"
        : `Waiting for ${currentPlayer}...`}
      </p>
      
      )}

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
  disabled={
    !playerRole ||
    playerRole !== currentPlayer ||
    gamewinner !== null ||
    isDraw ||
    cell !== ""
  }
  className={`w-20 h-20 rounded-xl border border-[#E19184] text-3xl font-bold transition-all duration-200 hover:scale-105 hover:brightness-110 active:scale-95 disabled:cursor-not-allowed ${
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
{gameCode && (
  <button
    onClick={leaveGame}
    className="mt-3 text-sm text-[#E19184] border border-[#E19184] rounded-md px-3 py-1"
  >
    Leave Game 🚪
  </button>
)}

{gameCode && (
  <div className="mt-6 text-center">
    <p className="text-[#E19184]">Your Game Code</p>
    <p className="mt-2 text-3xl font-bold tracking-widest">
      {gameCode}
    </p>
    <p className="mt-2 text-sm text-[#E19184]">
     Share this code with your friend 👥
    </p>
  </div>
)}

  {showJoin && (
  <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
    <div className="w-80 rounded-2xl bg-[#620607] border border-[#E19184] p-6 shadow-xl text-center animate-[popup_0.2s_ease-out]">
      
      <h3 className="text-2xl font-bold text-[#E19184]">
        Join Game
      </h3>

      <p className="mt-3">
        Enter your game code:
      </p>

      <input
        type="text"
        value={joinCode}
        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
        placeholder="ABC123"
        maxLength={6}
        className="mt-4 w-full rounded-lg px-4 py-2 text-black text-center tracking-widest"
      />

      <button
        onClick={async () => {
  const { data, error } = await supabase
    .from("games")
    .select("id, code, player_o")
    .eq("code", joinCode)
    .single();

  if (error || !data) {
    alert("Invalid game code ❌");
    return;
  }

  if (data.player_o) {
    alert("This game already has two players ❌");
    setShowJoin(false);
    return;
  }

  const { error: updateError } = await supabase
    .from("games")
    .update({
      player_o: playerId,
      status: "ACTIVE",
    })
    .eq("id", data.id);

  if (updateError) {
  console.error(updateError);
  alert("Could not join game ❌");
  return;
}

setPlayerRole("O");
setGameCode(data.code);

localStorage.setItem("gameCode", data.code);
localStorage.setItem("playerRole", "O");
setShowJoin(false);


}}
        className="mt-4 px-5 py-2 rounded-lg bg-[#E19184] text-[#620607] font-semibold"
      >
        Join
      </button>

      <button
        onClick={() => setShowJoin(false)}
        className="block mx-auto mt-3 text-sm text-[#E19184]"
      >
        Cancel
      </button>

    </div>
  </div>
)} 

    </main>
  );
}
