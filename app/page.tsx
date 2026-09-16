// COMPONENT:
// A React component is a reusable piece of UI.

// JSX:
// JSX lets us write HTML-like code inside JavaScript/TypeScript.

// TAILWIND:
// className is used to apply Tailwind CSS classes.

 "use client"; //It tells Next.js:"This file contains code that needs to run in the browser."

 import { useEffect ,useState } from "react";
 import { supabase } from "./lib/supabase";
 import {
  Pixelify_Sans,
  Press_Start_2P,
  MedievalSharp,
} from "next/font/google";

const medieval = MedievalSharp({
  subsets: ["latin"],
  weight: "400",
});

const pixelifySans = Pixelify_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const pressStart = Press_Start_2P({
  subsets: ["latin"],
  weight: "400",
});

 export default function Home() {
  const [showJoin, setShowJoin] = useState(false);
//    showJoin: stores the current value
//    setShowJoin: changes that value
//     false: starting value
  const [gameCode, setGameCode] = useState("");
  const [gameStage, setGameStage] = useState<
  "home" | "select" | "game"
  >("home");

  const [selectedMenu, setSelectedMenu] = useState("CONTINUE");
  const [showOptions, setShowOptions] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  const [showExit, setShowExit] = useState(false);

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
   <main
  className={`${pixelifySans.className} relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#020817]`}
>
  <div className="game-bg" />
  <div className="pixel-overlay" />
  <div className="vignette-overlay" />
{/* Atmospheric particles */}
<div className="absolute inset-0 pointer-events-none overflow-hidden">
  <div className="absolute left-[12%] top-[25%] w-1 h-1 rounded-full bg-white/60 animate-[float_8s_ease-in-out_infinite]" />

  <div className="absolute left-[44%] top-[19%] w-1 h-1 rounded-full bg-white/60 animate-[float_6s_ease-in-out_infinite]" />

  <div className="absolute left-[30%] top-[23%] w-1 h-1 rounded-full bg-white/60 animate-[float_8s_ease-in-out_infinite]" />
  
  <div className="absolute left-[88%] top-[34%] w-1 h-1 rounded-full bg-white/60 animate-[float_8s_ease-in-out_infinite]" />
  
  <div className="absolute left-[39%] top-[64%] w-1 h-1 rounded-full bg-white/60 animate-[float_8s_ease-in-out_infinite]" />
  
  <div className="absolute left-[96%] top-[42%] w-1 h-1 rounded-full bg-white/60 animate-[float_8s_ease-in-out_infinite]" />

  <div className="absolute left-[28%] top-[65%] w-1 h-1 rounded-full bg-blue-200/50 animate-[float_11s_ease-in-out_infinite]" />

  <div className="absolute left-[46%] top-[35%] w-1 h-1 rounded-full bg-white/50 animate-[float_9s_ease-in-out_infinite]" />

  <div className="absolute left-[63%] top-[72%] w-1 h-1 rounded-full bg-blue-100/50 animate-[float_12s_ease-in-out_infinite]" />

  <div className="absolute left-[78%] top-[28%] w-1 h-1 rounded-full bg-white/60 animate-[float_10s_ease-in-out_infinite]" />

  <div className="absolute left-[90%] top-[58%] w-1 h-1 rounded-full bg-blue-200/40 animate-[float_13s_ease-in-out_infinite]" />
</div>
{/* Fireflies */}
<div className="absolute inset-0 pointer-events-none overflow-hidden">
  <div className="firefly left-[18%] top-[72%]" />
  <div className="firefly left-[31%] top-[62%]" />
  <div className="firefly left-[48%] top-[78%]" />
  <div className="firefly left-[61%] top-[67%]" />
  <div className="firefly left-[74%] top-[76%]" />
  <div className="firefly left-[87%] top-[63%]" />
</div>
{gameStage === "home" && (
  <div className="relative z-10 flex min-h-screen w-full items-center justify-center">

    {/* Main Gamezy Menu */}
    <div className="flex flex-col items-center text-center">

      {/* GAMEZY LOGO */}
      <h1
  className="text-8xl tracking-wide text-[#E8F4FF] drop-shadow-[0_4px_12px_rgba(0,0,0,0.7)]"
  style={{ fontFamily: '"Aretha Bridge", serif' }}
>
  GAMEZY
</h1>
      <p 
      className="mt-3 text-md tracking-[0.35em] text-[#B9E6FF]/50 uppercase"
      style={{ fontFamily: '"Magisse", serif' }} >
        Play. Challenge. Repeat.
      </p>


      {/* MAIN MENU */}
      <div className="mt-10 flex flex-col items-center">

        {/* CONTINUE */}
        <button
          onMouseEnter={() => setSelectedMenu("CONTINUE")}
          onClick={() => setGameStage("game")}
          className="group flex items-center justify-center gap-3 py-2 cursor-pointer"
        >
          <span
            className={`w-5 text-[#B9E6FF] transition-all duration-200 ${
              selectedMenu === "CONTINUE"
                ? "translate-x-0 opacity-100"
                : "-translate-x-2 opacity-0"
            }`}
          >
            ✦
          </span>

          <span
  className={`text-xl sm:text-3xl tracking-wider transition-all duration-200 ${
    selectedMenu === "CONTINUE"
      ? "translate-x-1 text-white drop-shadow-[0_3px_8px_rgba(0,0,0,0.8)]"
      : "text-[#B9E6FF]/50 drop-shadow-[0_2px_5px_rgba(0,0,0,0.6)]"
  }`}
  style={{ fontFamily: '"Aretha Bridge", serif' }}
>
  CONTINUE
</span>
        </button>


        {/* OPTIONS */}
        <button
          onMouseEnter={() => setSelectedMenu("OPTIONS")}
          onClick={() => setShowOptions(true)}
          className="group flex items-center justify-center gap-3 py-2 cursor-pointer"
        >
          <span
            className={`w-5 text-[#B9E6FF] transition-all duration-200 ${
              selectedMenu === "OPTIONS"
                ? "translate-x-0 opacity-100"
                : "-translate-x-2 opacity-0"
            }`}
          >
            ✦
          </span>

          <span
  className={`text-xl sm:text-3xl tracking-wider transition-all duration-200 ${
    selectedMenu === "OPTIONS"
      ? "translate-x-1 text-white drop-shadow-[0_3px_8px_rgba(0,0,0,0.8)]"
      : "text-[#B9E6FF]/50 drop-shadow-[0_2px_5px_rgba(0,0,0,0.6)]"
  }`}
  style={{ fontFamily: '"Aretha Bridge", serif' }}
>
  OPTIONS
</span>
        </button>


        {/* CREDITS */}
        <button
          onMouseEnter={() => setSelectedMenu("CREDITS")}
          onClick={() => setShowCredits(true)}
          className="group flex items-center justify-center gap-3 py-2 cursor-pointer"
        >
          <span
            className={`w-5 text-[#B9E6FF] transition-all duration-200 ${
              selectedMenu === "CREDITS"
                ? "translate-x-0 opacity-100"
                : "-translate-x-2 opacity-0"
            }`}
          >
            ✦
          </span>

         <span
  className={`text-xl sm:text-2xl tracking-wider transition-all duration-200 ${
    selectedMenu === "CREDITS"
      ? "translate-x-1 text-white drop-shadow-[0_3px_8px_rgba(0,0,0,0.8)]"
      : "text-[#B9E6FF]/50 drop-shadow-[0_2px_5px_rgba(0,0,0,0.6)]"
  }`}
  style={{ fontFamily: '"Aretha Bridge", serif' }}
>
  CREDITS
</span>
        </button>


        {/* EXIT */}
        <button
          onMouseEnter={() => setSelectedMenu("EXIT")}
          onClick={() => setShowExit(true)}
          className="group flex items-center justify-center gap-3 py-2 cursor-pointer"
        >
          <span
            className={`w-5 text-[#B9E6FF] transition-all duration-200 ${
              selectedMenu === "EXIT"
                ? "translate-x-0 opacity-100"
                : "-translate-x-2 opacity-0"
            }`}
          >
            ✦
          </span>

          <span
  className={`text-xl sm:text-2xl tracking-wider transition-all duration-200 ${
    selectedMenu === "EXIT"
      ? "translate-x-1 text-white drop-shadow-[0_3px_8px_rgba(0,0,0,0.8)]"
      : "text-[#B9E6FF]/50 drop-shadow-[0_2px_5px_rgba(0,0,0,0.6)]"
  }`}
  style={{ fontFamily: '"Aretha Bridge", serif' }}
>
  EXIT
</span>
        </button>

      </div>


      {/* SMALL UTILITY BUTTONS */}
      <div className="mt-10 flex gap-3">

        <button
          className="border border-white/15 bg-[#07111F]/30 px-4 py-2 text-[10px] tracking-[0.2em] text-[#B9E6FF]/60 transition-all duration-200 hover:border-[#B9E6FF]/50 hover:text-white cursor-pointer"
        >
          PORTFOLIO
        </button>

        <button
          className="border border-white/15 bg-[#07111F]/30 px-4 py-2 text-[10px] tracking-[0.2em] text-[#B9E6FF]/60 transition-all duration-200 hover:border-[#B9E6FF]/50 hover:text-white cursor-pointer"
        >
          CONTACT
        </button>

      </div>

    </div>
  </div>
)}

{showOptions && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">

    <div className="w-[320px] border border-[#B9E6FF]/30 bg-[#07111F]/90 p-7 text-center shadow-[0_0_40px_rgba(0,0,0,0.4)]">

      <h2
        className={`${medieval.className} text-3xl text-white`}
      >
        Options
      </h2>

      <div className="mt-7 space-y-4 text-sm">

        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <span className="text-[#B9E6FF]/70">
            MUSIC
          </span>

          <span className="text-white">
            ON
          </span>
        </div>

        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <span className="text-[#B9E6FF]/70">
            SOUND
          </span>

          <span className="text-white">
            ON
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[#B9E6FF]/70">
            VERSION
          </span>

          <span className="text-white/60">
            v1.0
          </span>
        </div>

      </div>

      <button
        onClick={() => setShowOptions(false)}
        className="mt-7 border border-[#B9E6FF]/30 px-5 py-2 text-xs tracking-wider text-[#B9E6FF] transition-all hover:border-[#B9E6FF] hover:text-white cursor-pointer"
      >
        BACK
      </button>

    </div>

  </div>
)}
{showCredits && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">

    <div className="w-[340px] border border-[#B9E6FF]/30 bg-[#07111F]/90 p-8 text-center shadow-[0_0_40px_rgba(0,0,0,0.4)]">

      <h2
        className={`${medieval.className} text-3xl text-white`}
      >
        Credits
      </h2>

      <div className="mt-7 space-y-5">

        <div>
          <p className="text-[10px] tracking-[0.25em] text-[#B9E6FF]/40">
            CREATED BY
          </p>

          <p className="mt-1 text-white">
            Kirti Sinha
          </p>
        </div>

        <div>
          <p className="text-[10px] tracking-[0.25em] text-[#B9E6FF]/40">
            GAME
          </p>

          <p className="mt-1 text-white">
            Gamezy
          </p>
        </div>

        <div>
          <p className="text-[10px] tracking-[0.25em] text-[#B9E6FF]/40">
            FIRST ADVENTURE
          </p>

          <p className="mt-1 text-[#B9E6FF]/70">
            Tic-Tac-Toe
          </p>
        </div>

      </div>

      <button
        onClick={() => setShowCredits(false)}
        className="mt-8 border border-[#B9E6FF]/30 px-5 py-2 text-xs tracking-wider text-[#B9E6FF] transition-all hover:border-[#B9E6FF] hover:text-white"
      >
        BACK
      </button>

    </div>

  </div>
)}
{showExit && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">

    <div className="w-[320px] border border-[#B9E6FF]/30 bg-[#07111F]/90 p-8 text-center shadow-[0_0_40px_rgba(0,0,0,0.4)]">

      <h2
        className={`${medieval.className} text-3xl text-white`}
      >
        Leave Gamezy?
      </h2>

      <p className="mt-4 text-sm text-[#B9E6FF]/60">
        Your current game will remain saved.
      </p>

      <div className="mt-7 flex justify-center gap-3">

        <button
          onClick={() => setShowExit(false)}
          className="border border-[#B9E6FF]/30 px-5 py-2 text-xs tracking-wider text-[#B9E6FF] transition-all hover:border-[#B9E6FF] hover:text-white"
        >
          CANCEL
        </button>

        <button
          onClick={() => {
            setShowExit(false);
            setGameStage("home");
          }}
          className="border border-[#B9E6FF]/30 bg-[#B9E6FF]/10 px-5 py-2 text-xs tracking-wider text-white transition-all hover:bg-[#B9E6FF]/20"
        >
          EXIT
        </button>

      </div>

    </div>

  </div>
)}

  {gameStage === "game" && (
  <div className="relative z-10 flex flex-col items-center">
      <h1 className={`${pressStart.className} text-6xl font-black tracking-wider leading-none text-white [text-shadow:6px_6px_0_#1E2A78]`}
      >
  Gamezy
</h1>

      <p className={`${pressStart.className} mt-4 text-lg text-[#B9E6FF]`}
      >
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
    className="px-6 py-3 rounded-lg bg-white/5 border border-[#8FD3FF]/70 text-[#8FD3FF] font-semibold transition-all duration-200 hover:bg-[#8FD3FF]/10 hover:brightness-110 active:scale-95"
  >
    Create Game
  </button>

  <button
  onClick={() => setShowJoin(true)}
  className="px-6 py-3 rounded-lg bg-white/5 border border-[#8FD3FF]/70 text-[#8FD3FF] font-semibold transition-all duration-200 hover:bg-[#8FD3FF]/10 hover:brightness-110 active:scale-95">
  Join Game
</button>
</div>
        {/* This little && is important, basically means: If showJoin is true, show this */}
    
      <h2 className="mt-9 text-3xl font-bold text-white">
  Tic-Tac-Toe
</h2>

   {gameMessage && (
<div className="fixed top-5 right-5 z-50 rounded-xl border border-[#8FD3FF]/60 bg-[#07111F]/90 px-5 py-3 text-[#B9E6FF] shadow-[0_0_20px_rgba(143,211,255,0.15)] backdrop-blur-md animate-[popup_0.2s_ease-out]">
  {gameMessage}
</div>
   )}

     {playerRole && !gamewinner && !isDraw && (
      <p className="mt-3 text-lg font-semibold text-[#B9E6FF]">       {playerRole === currentPlayer
        ? "Your turn 🎮"
        : `Waiting for ${currentPlayer}...`}
      </p>
      
      )}

    {gamewinner && (
    <p className="mt-4 text-xl font-bold text-[#8FD3FF]">
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
  className={`w-20 h-20 rounded-xl border border-[#8FD3FF]/40 text-3xl font-bold transition-all duration-200 hover:scale-105 hover:brightness-125 active:scale-95 disabled:cursor-not-allowed ${
  winningCells.includes(index)
    ? "bg-[#8FD3FF]/90 text-[#07111F] shadow-[0_0_18px_rgba(143,211,255,0.5)]"
    : "bg-[#07111F]/55 text-[#8FD3FF] backdrop-blur-sm"
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
  className={`mt-4 text-xl font-bold text-[#8FD3FF] transition-all duration-900 ${
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
    className="mt-3 text-sm text-[#8FD3FF] border border-[#8FD3FF]/50 rounded-md px-3 py-1 transition-all duration-200 hover:bg-[#8FD3FF]/10 active:scale-95"
  >
    Leave Game 🚪
  </button>
)}

{gameCode && (
  <div className="mt-6 text-center">
    <p className="text-[#B9E6FF]">Your Game Code</p>
    <p className="mt-2 text-3xl font-bold tracking-widest">
      {gameCode}
    </p>
    <p className="mt-2 text-sm text-[#B9E6FF]">
  Share this code with your friend 👥
</p>
  </div>
)}

  {showJoin && (
  <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
    <div className="w-80 rounded-2xl bg-[#07111F] border border-[#1E2A78] p-6 shadow-xl text-center animate-[popup_0.2s_ease-out]">
      
      <h3 className="text-2xl font-bold text-[#B9E6FF]">
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
       className="mt-4 px-5 py-2 rounded-lg bg-[#1E2A78] text-white font-semibold border border-[#4F5FBF] transition-all duration-200 hover:bg-[#28388F] active:scale-95"
      >
        Join
      </button>

      <button
        onClick={() => setShowJoin(false)}
        className="block mx-auto mt-3 text-sm text-[#B9E6FF] transition-colors hover:text-white"
      >
        Cancel
      </button>

    </div>
  </div>
)} 

    </div> 
  )}
   </main>
  );
}
