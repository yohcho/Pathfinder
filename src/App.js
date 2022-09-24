import './App.css';
import { useState } from 'react';

import startFlag from "./assets/start.png"
import endFlag from "./assets/end.png"
import wall from "./assets/wall.png"

function App() {
  const [maze,setMaze] = useState(Array.from({length: 22},()=> Array.from({length: 56}, () => "none")))
  const [algorithm,setAlgorithm] = useState("dfs")
  const [selection,setSelection] = useState("null")
  const [valid,setValid] = useState(true)

  const [startPos,setStartPos] = useState([])
  const [endPos,setEndPos] = useState([])
  const [walls, setWalls] = useState([])

  const [holdMouse,setHoldMouse] = useState(false)

  const finalPath = []
  const topBar=()=>{
    return(
      <div className='maze-topbar'>
        <h1>PathFinder</h1>
        <div className='maze-topbar-options'>
          <label><input type="checkbox" checked={algorithm==="dfs"} onChange={()=>setAlgorithm("dfs")}/>DFS</label>
          <label><input type="checkbox" checked={algorithm==="bfs"} onChange={()=>setAlgorithm("bfs")}/>BFS</label>
        </div>
        <div className='maze-topbar-options'>
          <p onClick={()=>setSelection("🚩")}>🚩 - Set Start Point</p>
          <p onClick={()=>setSelection("🏁")}>🏁 - Set End Point</p>
          <p onClick={()=>setSelection("🧱")}>🧱 - Set As Wall</p>
          <p onClick={()=>setSelection("null")}>❌ - Unselect All</p>
        </div>
        <button onClick={beginPathFind}>Find Path</button>
      </div>
    )
  }

  const beginPathFind=async()=>{
    setMaze(Array.from({length: 22},()=> Array.from({length: 56}, () => "none")))
    const paths = Array.from({length: 22},()=> Array.from({length: 56}, () => " "))
    paths[startPos[0]][startPos[1]] = true
    const searchList = [startPos]
    const allSearch = []
    let current = []
    const searchInterval = setInterval(()=>{
      current = algorithm==="bfs" ? searchList.shift() : searchList.pop()
      console.log(current)
      changeColor(current,"searchedPath")
      allSearch.push(current)
      if(addNeighbors(searchList,paths,current) || searchList.length===0){
        clearInterval(searchInterval)
        finishUp(current,paths)
      }
    },1)    
  }

  const finishUp=(current,paths)=>{
    console.log(current)
    if(!(current[0]===endPos[0] && current[1]===endPos[1])){
      setValid(false)
      return
    }
    while(!(current[0]===startPos[0] && current[1]===startPos[1])){
      finalPath.unshift([...current])
      const direction = paths[current[0]][current[1]]
      if(direction==='n')
        current[0]++
      else if(direction==='e')
        current[1]--
      else if(direction==='s')
        current[0]--
      else if(direction==='w')
        current[1]++
    }
    finalPath.unshift(startPos)
    let index = 0;
    const interval = setInterval(()=>{
      if(index===finalPath.length-1)
        clearInterval(interval)
      const tile = finalPath[index]
      changeColor(tile,"finalPath")
      index++
    },25)
  }

  const changeColor=(tile,value)=>{
    if(!tile)
      return
    setMaze(prevMaze=>{
      const newMaze = []
      for(const row of prevMaze)
        newMaze.push(row)
      newMaze[tile[0]][tile[1]] = value
      return newMaze
    })
  }

  const addNeighbors=(searchList,paths,current)=>{
    if(current[0]===endPos[0] && current[1]===endPos[1]) return true
    const nodesToCheck = [[current[0]-1,current[1]],[current[0],current[1]+1],[current[0]+1,current[1]],[current[0],current[1]-1]]
    const directions = ["n","e","s","w"]
    for(let i =0;i<4;i++){
      if(checkValid(nodesToCheck[i],paths,i)){
        searchList.push(nodesToCheck[i])
        changeColor(nodesToCheck[i],"nextSearchPath")
        paths[nodesToCheck[i][0]][nodesToCheck[i][1]] = directions[i]
      }
    }
    return false
  }

  const checkValid=(check,paths,i)=>{
    if(i===0 && check[0]<0) return false
    if(i===1 && check[1]>=maze[0].length) return false
    if(i===2 && check[0]>=maze.length) return false
    if(i===3 && check[1]<0) return false
    if(paths[check[0]][check[1]]!==" ") return false
    if(walls.includes(`${check[0]}-${check[1]}`)) return false
    return true
  }

  const handleTileClicked=(row,col,changeTo)=>{
    if(changeTo==="null")
      return
    else if(changeTo==="🏁"){
      setEndPos([row,col])
      setSelection("null")
      return
    }
    else if(changeTo==="🚩"){
      setStartPos([row,col])
      setSelection("null")
      return
    }
    else if(changeTo==="🧱"){
      const text = `${row}-${col}`
      setWalls(prevWalls=>{
        const newWalls=[...prevWalls]
        if(newWalls.includes(text))
          return newWalls.filter(walls=>walls!==text)
        newWalls.push(text)
        return newWalls
      })
      return
    }
  }


  const createDisplay=()=>{
    const display = []
    for(let i = 0;i<maze.length;i++){
      const row=[]
      for(let j = 0;j<maze[0].length;j++){
        let content = ""
        if(startPos[0]===i && startPos[1]===j)
          content = startFlag
        if(endPos[0]===i && endPos[1]===j)
          content = endFlag
        if(walls.includes(`${i}-${j}`))
          content = wall
        let bg = "transparent"
        if(maze[i][j]==="finalPath")
          bg="red"
        if(maze[i][j]==="searchedPath")
          bg="green"
        if(maze[i][j]==="nextSearchPath")
          bg="cyan"
        const styling = {
          backgroundColor:bg,
          backgroundImage: `url(${content})`
        }
        row.push(
          <div 
            style={styling} 
            className='maze-row-tile' 
            onMouseEnter={()=>{holdMouse && handleTileClicked(i,j,selection)}} 
            onClick={()=>handleTileClicked(i,j,selection)}>
          </div>
        )
      }
      display.push(<div className='maze-row'>{row}</div>)
    }
    return display
  }

  const cursorStyle={
    cursor:`url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20'><rect rx='20' width='100%' height='100%' fill='transparent'/><text x='50%' y='50%' font-family='sans-serif' font-weight='bold' font-size='22' dominant-baseline='middle' text-anchor='middle' fill='white'>${selection}</text></svg>") 16 0, auto`
  }

  const createPopUp=()=>{
    if(valid)
      return
    return (
      <div className='maze-popup'>
        There is no possible route!
        <button className='maze-popup-close' onClick={()=>{setValid(true)}}>X</button>
      </div>
    )
  }

  return (
    <div 
      onMouseDown={()=>{setHoldMouse(true)}}
      onMouseUp={()=>{setHoldMouse(false)}}
      style={selection!=="null" ? cursorStyle : {}} 
      className='maze'>
      {topBar()}
      {createDisplay()}
      {createPopUp()}
    </div>
  );
}

export default App;
