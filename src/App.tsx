import "./App.css";
import {useState, useEffect} from "react";

function App() {
  const [gameBoard, setGameBoard] = useState<number[][]>(()=>{
    let savedBoard = localStorage.getItem("gameBoard");
    if(savedBoard != null) return JSON.parse(savedBoard);
    else {
      let newBoard = [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];
      let newPos = Math.floor(Math.random()*16);
      newBoard[Math.floor(newPos/4)][newPos%4] = 2;
      return newBoard;
    }
  });
  const [score, setScore] = useState<number>(()=>{
    let savedScore = localStorage.getItem("score");
    if(savedScore != null) return JSON.parse(savedScore);
    else {
      return 0;
    }
  });
  const [bestScore, setBestScore] = useState<number>(()=>{
    let savedScore = localStorage.getItem("bestScore");
    if(savedScore != null) return JSON.parse(savedScore);
    else {
      return 0;
    }
  });

  function Restart(){
    setGameBoard(NewBlock([[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]]));
    setScore(0);
  }

  function GameOver(successful:boolean){
    if(successful){
      alert("성공!");
    }else{
      alert("실패");
    }
    Restart();
  }

  function AddScore(newTile:number){
    setScore(score => score+newTile);
    if(newTile == 128){
      return true;
    }
    return false;
  }
  function CheckOver(board: number[][]){
    let directions = [[0,1],[0,-1],[1,0],[-1,0]]
    for(let i = 0; i < 4; i++){
      for(let j = 0; j < 4; j++){
        let thisV = board[i][j];
        if(thisV == 0) return false;
        for(let k = 0; k < 4; k++){
          let dx = i+directions[k][0];
          let dy = j+directions[k][1];
          if(dx < 0 || dx >= 4 || dy < 0 || dy >= 4) continue;
          if(thisV == board[dx][dy]) {
            return false;
          }
        }
      }
    }
    return true;
  }
  function NewBlock(board: number[][]){
    let blanks = [];
    let newGameBoard = board.map(row => [...row]);

    for(let i = 0; i < 4; i++){
      for(let j = 0; j < 4; j++){
        if(board[i][j] != 0) continue;
        blanks.push(i*4+j);
      }
    }
    if(blanks.length <= 0){
      //if(CheckOver(board)) GameOver(false);
    }
    else{
      let newPos = blanks[Math.floor(Math.random()*blanks.length)];
      newGameBoard[Math.floor(newPos/4)][newPos%4] = 2;
    }      
    return newGameBoard;
  }

  function MoveBoard(x: number, y:number){
    let newGameBoard = gameBoard.map(row=>[...row]);
    let changed = false;
    let successful = false;
    let d = x;
    if(x ==0) d = y;
    if (CheckOver(newGameBoard)){
      GameOver(false);
    }
    else{
      for(let ii = 0; ii < 4; ii++){
        let this_line = [];
        for(let jj = 0; jj < 4; jj++){
          let i = ii; let j = jj;
          if(x==0){
            i = jj; j = ii;
          }
          let this_value = gameBoard[i][j];
          if(this_value!=0) this_line.push(this_value);
        }
        for(let k = 0; k < this_line.length; k++){
          let kk = k;
          if(d>0) kk = this_line.length-1-k;
          if(this_line[kk]==this_line[kk-d]){
            this_line[kk] *=2;
            this_line[kk-d] = 0;
            successful = AddScore(this_line[kk])?true:successful;
          }
        }
        this_line = this_line.filter(v => v>0);
        let original_length = this_line.length;
        let new_line = [];
        if(d>0){
          for(let t=0; t <4-original_length; t++) 
            new_line.push(0);
          for(let t=0; t <original_length; t++)
            new_line.push(this_line[t]);
        }
        else {
          new_line=this_line;
          for(let t=0; t <4-original_length; t++) 
            new_line.push(0);
        }
        for(let t = 0; t < 4; t++){
          let i = ii; let j = t;
          if(x==0){
            i = t; j = ii;
          }
          if(newGameBoard[i][j] == new_line[t]) continue;
          changed = true;
          newGameBoard[i][j] = new_line[t];
        }
      }
    }
    if(changed){
      newGameBoard = NewBlock(newGameBoard);
      setGameBoard(newGameBoard);
      if(successful){
        GameOver(true);
      }
    }
  }
  
  useEffect(()=>{
    function onKeyboardInput(event: KeyboardEvent){
      switch(event.key){
        case "ArrowUp":
          MoveBoard(0,-1);
          break;
        case "ArrowDown":
          MoveBoard(0,1);
          break;
        case "ArrowRight":
          MoveBoard(1,0);
          break;
        case "ArrowLeft":
          MoveBoard(-1,0);
          break;
        case "D":
          localStorage.clear();
          Restart();
          break;
      }
    }
    window.addEventListener("keydown", onKeyboardInput);
    return (()=>window.removeEventListener("keydown", onKeyboardInput));
  },[gameBoard]);

  useEffect(()=>{
    localStorage.setItem("gameBoard", JSON.stringify(gameBoard));
    localStorage.setItem("score", JSON.stringify(score));
  }, [gameBoard, score])

  useEffect(()=>{
    if(score > bestScore){   
      setBestScore(score); 
      localStorage.setItem("score", JSON.stringify(score));
    }
  }, [score])

  return (
    <main>
      <h1>2048 Game</h1>
      <div id="ScoreText">Score: {score}</div>
      <div id="BestScoreText">Best Score: {bestScore}</div>
      <div id="GameBoard">
        {
          gameBoard.map(row => {
            return (
              <div className="rowOnBoard">
              {
                row.map(element =>{
                  return Block(element)
                })
              }
              </div>
            )
          })
        }
      </div>
    </main>
  );
}

function Block(n:number){
  return (
    <div className={`gameBlock block_${n}`}>
      <div className={`gameBlockText blockText_${n}`}>
        {(n>0)?n:""}
      </div>
    </div>
  )
}

export default App;
