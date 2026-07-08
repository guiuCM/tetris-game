import './style.css'
import { BLOCK_SIZE, BOARD_WIDTH, BOARD_HEIGHT } from './consts.js'
import { EVENT_MOVEMENTS } from './consts.js'

// Audio setup
const audio = new Audio('./tetris_music.mp3')
audio.loop = true // Make the music loop
audio.volume = 0.5 // Set volume to 50%

// Function to start music (needed due to browser autoplay policies)
function startMusic() {
  audio.play().catch(error => {
    console.log('Audio play failed:', error)
  })
}

// Function to stop music
function stopMusic() {
  audio.pause()
  audio.currentTime = 0 // Reset to beginning
}



const canvas = document.querySelector('canvas') // get the canvas element
const ctx = canvas.getContext('2d') // get the 2D drawing context

let score = 0
let highScores = getHighScores() // Load high scores from localStorage

// High score functions
function getHighScores() {
  const scores = localStorage.getItem('tetrisHighScores')
  let parsedScores = scores ? JSON.parse(scores) : []
  
  // If we have more than 5 scores, trim to top 5 and save
  if (parsedScores.length > 5) {
    parsedScores.sort((a, b) => b.score - a.score)
    parsedScores = parsedScores.slice(0, 5)
    localStorage.setItem('tetrisHighScores', JSON.stringify(parsedScores))
  }
  
  return parsedScores
}

function saveHighScore(score) {
  highScores.push({
    score: score,
    date: new Date().toISOString(),
    timestamp: Date.now()
  })
  
  // Keep only top 5 scores
  highScores.sort((a, b) => b.score - a.score)
  highScores = highScores.slice(0, 5)
  
  localStorage.setItem('tetrisHighScores', JSON.stringify(highScores))
}

//canviar a 5 highscore?
function isNewHighScore(score) {
  return highScores.length < 5 || score > highScores[highScores.length - 1].score
}

// set the canvas size
canvas.width = BOARD_WIDTH * BLOCK_SIZE
canvas.height = BOARD_HEIGHT * BLOCK_SIZE

ctx.scale(BLOCK_SIZE, BLOCK_SIZE) // scale the context to make drawing easier

const board = createEmptyBoard() //the game board, 0 is empty, 1 is filled

function createEmptyBoard() { //create a 2D array filled with 0
  const board = []
  for (let y = 0; y < BOARD_HEIGHT; y++) {
    const row = []
    for (let x = 0; x < BOARD_WIDTH; x++) {
      row.push(0)
    }
    board.push(row)
  }
  return board
}

const piece = {
   position: {x: 5, y: 5}, // position of the piece on the board
   shape: [
     [1, 0],
     [1, 0]
   ]
}

// Initialize with a random piece
function initGame() {
  const newPiece = randomPiece()
  piece.position = newPiece.position
  piece.shape = newPiece.shape
  
}

//other pieces
const pieces = [
  [
    [1, 1, 1, 1] // I piece
  ],
  [
    [1, 1, 1, 1] // I piece
  ],
  [
    [1, 1], // square piece
    [1, 1]
  ],
  [
    [0, 1, 0], // T piece
    [1, 1, 1]
  ],
  [
    [0, 1, 1], // S piece
    [1, 1, 0]
  ],
  [
    [1, 1, 0], // Z piece
    [0, 1, 1]
  ],
  [
    [1, 0, 0], // L piece
    [1, 1, 1]
  ],
  [
    [0, 0, 1], // J piece
    [1, 1, 1]
  ]
]

function randomPiece(){
  const index = Math.floor(Math.random() * pieces.length)
  const shape = pieces[index]
  return { //return a new piece object
    position: {x: Math.floor((BOARD_WIDTH - shape[0].length) / 2), y: 0}, //center the piece at the top (better than x=0)
    shape: shape
  }
}

//game loop
//drop the piece every second
let dropCounter = 0
let lastTime = 0
let gameRunning = true


function update(time = 0){
  const deltaTime = time - lastTime
  lastTime = time
  
  if (gameRunning) {
    dropCounter += deltaTime
    
    if(score < 100){
      if(dropCounter > 1000){ //drop every second
        piece.position.y += 1
        dropCounter = 0
      }
    }else if(score >= 100 && score < 500){
      if(dropCounter > 500){ //drop every half second
        piece.position.y += 1
        dropCounter = 0
      }
    }else if(score >= 500 && score < 1000){
      if(dropCounter > 250){ //drop every quarter second
        piece.position.y += 1
        dropCounter = 0
      }
    }else{
      if(dropCounter > 100){ //drop every tenth of a second
        piece.position.y += 1
        dropCounter = 0
      }
    }

      if(checkCollision()){
        piece.position.y -= 1
        solidify()
        removeFullLines()
      }
    }
  
  
  draw()// draw the game state here
  window.requestAnimationFrame(update) // always request the next frame
}

function draw(){
  ctx.fillStyle = 'black'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  board.forEach((row, y) => {
    row.forEach((value, x) => {
      if(value == 1){
        ctx.fillStyle = 'yellow'
        ctx.fillRect(x, y, 1, 1)
      }
    })
  })

  piece.shape.forEach((row, y) => {
    row.forEach((value, x) => {
      if(value == 1){
        ctx.fillStyle = 'red'
        ctx.fillRect(x + piece.position.x, y + piece.position.y, 1, 1)
      }
    })
  })

  // Draw score
  ctx.fillStyle = 'white'
  ctx.font = '1px Arial'
  ctx.fillText(`Score: ${score}`, 0.5, 1) // position the score at (0.5, 1)

}

//rotate a matrix 90 degrees clockwise
function rotate(matrix){
  const rows = matrix.length
  const cols = matrix[0].length
  // create an empty matrix with "cols" rows and "rows" columns
  const result = Array.from({ length: cols }, () => Array(rows).fill(0)) //works for not square matrices too

  for(let y = 0; y < rows; y++){
    for(let x = 0; x < cols; x++){
      // place element (y, x) into rotated position (x, rows - 1 - y)
      result[x][rows - 1 - y] = matrix[y][x]
    }
  }
  return result
}

function checkCollision(){
  return piece.shape.find((row, y) => {
    return row.find((value, x) => {
      if(value != 0){
        const boardX = piece.position.x + x
        const boardY = piece.position.y + y
        return (boardX < 0 || boardX >= BOARD_WIDTH || boardY >= BOARD_HEIGHT || board[boardY][boardX] == 1)
      }
      return false
    })
  }) !== undefined //si troba alguna colision retorna true, undeined fa que no surti per baix
}

function solidify(){
  piece.shape.forEach((row, y) => {
    row.forEach((value, x) => {
      if(value == 1){
        const boardX = piece.position.x + x
        const boardY = piece.position.y + y
        board[boardY][boardX] = 1 //copy piece to board
      }
    })
  })
  
  // Generate a new random piece
  const newPiece = randomPiece()
  piece.position = newPiece.position
  piece.shape = newPiece.shape
  if(checkCollision()){ //if the piece is at the top and collides, game over
    gameOver()
  }
}

function removeFullLines(){
  let linesRemoved = 0

  for(let y = BOARD_HEIGHT - 1; y >= 0; y--){
    if(board[y].every(value => value == 1)){ //check if the line is full
      board.splice(y, 1) //remove the full line
      board.unshift(new Array(BOARD_WIDTH).fill(0)) //add a new empty line at the top
      y++ //check the same line again
      linesRemoved++
    }
  }
  
  if (linesRemoved > 0) {
    // Award points: more lines = more points
    const points = [10, 30, 60, 100] // points for 1, 2, 3, 4 lines
    score += points[linesRemoved - 1]
    updateScoreDisplay()
  }
}

function gameOver() {
  gameRunning = false // Stop the game loop
  stopMusic() // Stop the music
  
  // Save high score if it qualifies
  if (isNewHighScore(score)) {
    saveHighScore(score)
  }
  
  // Use setTimeout to ensure the alert appears after the current frame
  setTimeout(() => {
    let message = `Game Over! Your score: ${score}`
    
    // Add high score information
    if (highScores.length > 0) {
      message += `\n\nHigh Score: ${highScores[0].score}`
      if (isNewHighScore(score)) {
        message += `\n🎉 NEW HIGH SCORE! 🎉`
      }
    }
    
    alert(message + '\nPress OK to restart.')
    
    // Clear the board immediately after alert
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        board[y][x] = 0
      }
    }
    
    // Reset score and initialize new piece
    score = 0
    initGame()
    
    // Show the start section again
    const startSection = document.getElementById('start-game')
    if (startSection) {
      startSection.style.display = 'block'
    }
    
    // Force a redraw to show the cleared board
    draw()
  }, 100)
}

function restartGame() {
  // Reset game variables
  dropCounter = 0
  lastTime = 0
  
  // Initialize with a new random piece (board already cleared in gameOver)
  initGame()
  
  // Restart the game and music
  gameRunning = true
  startMusic()
}

document.addEventListener('keydown', event => {
  if (!gameRunning) {
    return // Don't process keys if game is not running
  }

  //no es la millor forma de comprobar colisions pero es la mes facil
  if(event.key === EVENT_MOVEMENTS.LEFT){
    piece.position.x -= 1
    if (checkCollision()){
      piece.position.x += 1
    }

  } else if(event.key === EVENT_MOVEMENTS.RIGHT){
    piece.position.x += 1
    if (checkCollision()) {
      piece.position.x -= 1
    }
  } else if(event.key === EVENT_MOVEMENTS.UP){
    const rotatedShape = rotate(piece.shape)
    const originalShape = piece.shape
    const originalPosition = piece.position.x
    
    piece.shape = rotatedShape
    
    // Try different positions to see if rotation fits
    let offset = 1
    while (checkCollision()) {
      piece.position.x += offset
      offset = -(offset + (offset > 0 ? 1 : -1))
      
      // If we've tried too many positions, cancel the rotation
      if (Math.abs(offset) > Math.max(rotatedShape.length, rotatedShape[0].length)) {
        piece.shape = originalShape // restore original shape
        piece.position.x = originalPosition
        break
      }
    }

  } else if(event.key === EVENT_MOVEMENTS.DOWN){
    piece.position.y += 1
    if (checkCollision()) {
      piece.position.y -= 1
      solidify()
      removeFullLines()
    }
  }
})

initGame() // Initialize the game with a random piece

// Get references to UI elements
const startSection = document.getElementById('start-game')
const startButton = document.getElementById('start-button')
const scoresButton = document.getElementById('scores-button')
const highScoresSection = document.getElementById('high-scores')
const backButton = document.getElementById('back-button')
const currentScoreDisplay = document.getElementById('current-score')

// High scores UI functions
function showHighScores() {
  const scoresList = document.getElementById('scores-list')
  scoresList.innerHTML = ''
  
  if (highScores.length === 0) {
    scoresList.innerHTML = '<p>No scores yet!</p>'
  } else {
    highScores.forEach((scoreData, index) => {
      const scoreElement = document.createElement('div')
      scoreElement.className = 'score-entry'
      const date = new Date(scoreData.date).toLocaleDateString()
      scoreElement.innerHTML = `
        <span class="rank">#${index + 1}</span>
        <span class="score">${scoreData.score}</span>
        <span class="date">${date}</span>
      `
      scoresList.appendChild(scoreElement)
    })
  }
  
  startSection.style.display = 'none'
  highScoresSection.style.display = 'block'
}

function hideHighScores() {
  highScoresSection.style.display = 'none'
  startSection.style.display = 'block'
}

function updateScoreDisplay() {
  if (currentScoreDisplay) {
    currentScoreDisplay.textContent = `Score: ${score}`
  }
}

// Add event listeners for UI buttons
if (scoresButton) {
  scoresButton.addEventListener('click', showHighScores)
}

if (backButton) {
  backButton.addEventListener('click', hideHighScores)
}

// Add click event for the start button to begin music and game
if (startButton) {
  startButton.addEventListener('click', () => {
    // If game was over, restart it
    if (!gameRunning) {
      restartGame()
    }
    
    startMusic() // Start the music
    startSection.style.display = 'none' // Hide the start section
    gameRunning = true
    updateScoreDisplay() // Show initial score
    
    // Only start update loop if it's not already running
    if (!window.gameLoopStarted) {
      window.gameLoopStarted = true
      update() // start the game loop
    }
  })
}
