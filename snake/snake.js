const WIDTH = 20;
const HEIGHT = 20;

let snake = [];
let food = {
  x: 0,
  y: 0,
};

let direction = 1; // 1 = right, 2 = down, 3 = left, 4 = up
let score = 0; // Initialize the score to zero

function init() {
  for (let i = 0; i < 3; i++) {
    snake.push({
      x: i,
      y: 0,
    });
  }

  food.x = Math.floor(Math.random() * WIDTH);
  food.y = Math.floor(Math.random() * HEIGHT);
}

function draw() {
  for (let i = 0; i < HEIGHT; i++) {
    for (let j = 0; j < WIDTH; j++) {
      if (i == snake[0].y && j == snake[0].x) {
        console.log("*");
      } else if (i == food.y && j == food.x) {
        console.log("o");
      } else {
        console.log(" ");
      }
    }
    console.log();
  }
}

function move() {
  let nextX = snake[0].x + (direction === 1 ? 1 : 0);
  let nextY = snake[0].y + (direction === 2 ? 1 : 0);

  for (let i = 1; i < snake.length; i++) {
    if (snake[i].x === nextX && snake[i].y === nextY) {
      gameOver();
      return;
    }
  }

  if (nextX < 0 || nextX >= WIDTH || nextY < 0 || nextY >= HEIGHT) {
    gameOver();
    return;
  }

  snake.unshift({
    x: nextX,
    y: nextY,
  });

  if (nextX === food.x && nextY === food.y) {
    // Snake has eaten the food, increment the score and generate new food
    score += 10; // You can adjust the score increment as needed
    food.x = Math.floor(Math.random() * WIDTH);
    food.y = Math.floor(Math.random() * HEIGHT);
  } else {
    // Snake didn't eat the food, remove the tail
    snake.pop();
  }

  // Display the score
  displayScore();
}

function displayScore() {
  console.log("Score: " + score);
}

function gameOver() {
  console.log("Game Over! Your Final Score: " + score);
  process.exit(0);
}

init();

setInterval(draw, 100);
setInterval(move, 100);
