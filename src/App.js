import './App.css';
import { useState } from 'react';

import startFlag from "./assets/start.png"
import endFlag from "./assets/end.png"
import wall from "./assets/wall.png"

function App() {
  const numRows = 22
  const numCols = 56
  const [maze,setMaze] = useState(Array.from({length: numRows},()=> Array.from({length: numCols}, () => "none")))
  const [algorithm,setAlgorithm] = useState("bfs")
  const [selection,setSelection] = useState("null")
  const [data,setData] = useState({
    tilesDiscovered: 0,
    success: false,
    completed: false
  })
  const [needsReset,setNeedsReset] = useState(false)

  const [startPos,setStartPos] = useState([])
  const [endPos,setEndPos] = useState([])
  const [walls, setWalls] = useState([])

  const [holdMouse,setHoldMouse] = useState(false)
  const [ongoing,setOnGoing] = useState(false)

  const topBar=()=>{
    return(
      <div className='maze-topbar'>
        <h1>PathFinder</h1>
        <div className='maze-topbar-section'>
          <div className='maze-topbar-options'>
            <label><input type="checkbox" checked={algorithm==="bfs"} onChange={()=>setAlgorithm("bfs")}/>Breadth First Search (BFS)</label>
            <label><input type="checkbox" checked={algorithm==="dfs"} onChange={()=>setAlgorithm("dfs")}/>Depth First Search (DFS)</label>
            <label><input type="checkbox" checked={algorithm==="astar"} onChange={()=>setAlgorithm("astar")}/>{"A* (considering movement cost)"}</label>
            <label><input type="checkbox" checked={algorithm==="astar2"} onChange={()=>setAlgorithm("astar2")}/>{"A* (w/o considering movement cost)"}</label>
          </div>
          <div className='maze-topbar-options'>
            <button onClick={()=>setSelection("🚩")}>🚩 - Set Start</button>
            <button onClick={()=>setSelection("🏁")}>🏁 - Set End</button>
            <button onClick={()=>setSelection("🧱")}>🧱 - Set Wall</button>
            <button onClick={()=>setSelection("null")}>❌ - Unselect</button>
          </div>
          <div className='maze-topbar-buttons'>
            <button onClick={beginPathFind}>Find Path</button>
            <button onClick={resetMap}>Reset Map</button>
          </div> 
        </div>               
      </div>
    )
  }

  const resetMap=()=>{
    setStartPos([])
    setEndPos([])
    setWalls([])
    setMaze(Array.from({length: numRows},()=> Array.from({length: numCols}, () => "none")))
    setSelection("null")
  }

  const traceBack=(current,paths,searchedCount,isAStar)=>{
    const metaData = {
      tilesDiscovered:searchedCount,
      success: true,
      completed: true
    }
    console.log(metaData)
    const finalPath = []
    if(!(current[0]===endPos[0] && current[1]===endPos[1])){
      metaData.success=false
      setData(metaData)
      setOnGoing(false)
      return
    }
    while(!(current[0]===startPos[0] && current[1]===startPos[1])){
      finalPath.unshift([...current])
      const direction = isAStar ? paths[current[0]][current[1]].cameFrom : paths[current[0]][current[1]]
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
      if(index===finalPath.length-1){
        clearInterval(interval)
        setOnGoing(false)
        setData(metaData)
      }
      const tile = finalPath[index]
      changeColor(tile,"finalPath")
      index++
    },25)
  }

  const beginPathFind=async()=>{
    if(ongoing)
      return
    setOnGoing(true)
    setSelection("null")
    setData({
      tilesDiscovered: 0,
      success: false,
      completed: false
    })
    setMaze(Array.from({length: numRows},()=> Array.from({length: numCols}, () => "none")))
    setNeedsReset(true)
    if(algorithm==="bfs" || algorithm==="dfs")
      firstSearches()
    else if(algorithm==="astar" || algorithm==="astar2")
      astar()
  }

  const firstSearches=()=>{
    const paths = Array.from({length: numRows},()=> Array.from({length: numCols}, () => " "))
    paths[startPos[0]][startPos[1]] = true
    const searchList = [startPos]
    let current = []
    let searchedCount = 0
    const searchInterval = setInterval(()=>{
      current = algorithm==="bfs" ? searchList.shift() : searchList.pop()
      searchedCount++
      changeColor(current,"searchedPath")
      if(addNeighborsFirstSearch(searchList,paths,current) || searchList.length===0){
        clearInterval(searchInterval)
        traceBack(current,paths,searchedCount)
      }
    },1)
  }

  const addNeighborsFirstSearch=(searchList,paths,current)=>{
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

  const astar=()=>{
    const tile = {
      f:0,
      g:0,
      cameFrom:" "
    }
    const searchList = [startPos]
    const maze = Array.from({length: numRows},()=> Array.from({length: numCols}, () => {return {...tile}}))
    let current;
    let searchedCount = 0
    const searchInterval = setInterval(()=>{
      current = searchList.shift()
      searchedCount++
      changeColor(current,"searchedPath")
      if(addNeighborsAStarSearch(searchList,maze,current) || searchList.length===0){
        clearInterval(searchInterval)
        traceBack(current,maze,searchedCount,true)
      }
    },1)
  }

  const addNeighborsAStarSearch = (searchList,maze,current)=>{
    if(current[0]===endPos[0] && current[1]===endPos[1]) return true
    const currentTile = maze[current[0]][current[1]]
    const nodesToCheck = [[current[0]-1,current[1]],[current[0],current[1]+1],[current[0]+1,current[1]],[current[0],current[1]-1]]
    const directions = ["n","e","s","w"]
    for(let i =0;i<4;i++){
      if(checkValid(nodesToCheck[i],maze,i,true)){
        searchList.push(nodesToCheck[i])
        changeColor(nodesToCheck[i],"nextSearchPath")
        maze[nodesToCheck[i][0]][nodesToCheck[i][1]].cameFrom = directions[i]
        maze[nodesToCheck[i][0]][nodesToCheck[i][1]].g=currentTile.g+1
        maze[nodesToCheck[i][0]][nodesToCheck[i][1]].f= algorithm==="astar" ? currentTile.g+1+getEuclideanDistance(nodesToCheck[i]) : getEuclideanDistance(nodesToCheck[i])
      }
    }
    sortSearchList(searchList,maze)
    return false
  }

  const getEuclideanDistance=(add)=>{
    return Math.sqrt(Math.pow(endPos[0]-add[0],2)+Math.pow(endPos[1]-add[1],2))
  }

  const sortSearchList=(arr,maze)=>{
    for(var i = 0; i < arr.length; i++){
      for(var j = 0; j < ( arr.length - i -1 ); j++){         
        const curr = arr[j]
        const next = arr[j+1]
        if(maze[curr[0]][curr[1]].f > maze[next[0]][next[1]].f){
          var temp = arr[j]
          arr[j] = arr[j + 1]
          arr[j+1] = temp
        }
      }
    }
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

  const checkValid=(check,maze,i,isAStar)=>{
    if(i===0 && check[0]<0) return false
    if(i===1 && check[1]>=maze[0].length) return false
    if(i===2 && check[0]>=maze.length) return false
    if(i===3 && check[1]<0) return false
    if(!isAStar && maze[check[0]][check[1]]!==" ") return false
    if(isAStar && maze[check[0]][check[1]].cameFrom!==" ") return false    
    if(walls.includes(`${check[0]}-${check[1]}`)) return false
    return true
  }

  const handleTileClicked=(row,col,changeTo)=>{
    if(needsReset){
      setMaze(Array.from({length: numRows},()=> Array.from({length: numCols}, () => "none")))
      setNeedsReset(false)
    }
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
          bg="chocolate"
        if(maze[i][j]==="searchedPath")
          bg="aqua"
        if(maze[i][j]==="nextSearchPath")
          bg="aquamarine"
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
    if(!data.completed)
      return
    return (
      <div className='maze-popup'>
        {`${data.success ? `Success! ${data.tilesDiscovered} tiles discovered.` : `No possible route found after searching ${data.tilesDiscovered} tiles.`}`}
        <button 
          className='maze-popup-close' 
          onClick={()=>{
            setData(prevData=>{
              const newData ={...prevData}
              newData.completed=false
              return newData
            })
          }}>X</button>
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
