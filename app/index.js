// required imports
import * as kpay from './kpay/release/kpay.js';
import * as kpay_common from '../common/kpay/kpay_common.js';

/* Choose which type of "companion => phone communications" you want to use:
 *   - file transfer: is more reliable, uses more memory
 *          ==> import './kpay/release/kpay_filetransfer.js';
 *   - normal messaging: less reliable then file transfer, might cause frustration with the user if messaging fails, but uses less memory
 *          ==> import './kpay/release/kpay_messaging.js';
 * If you do not run into memory issues with your app or clockface, we recommend you use the file transfer communications
 *
 * Check the comments in the "message" event handler at the bottom of this file how to save even more memory by forwarding all KPay communications yourself.
 */
import './kpay/release/kpay_filetransfer.js';
//import './kpay/release/kpay_messaging.js';

// optional imports, remove if not needed to save memory
import './kpay/release/kpay_dialogs.js';			// remove if you handle KPay dialogs yourself\
//import './kpay/release/kpay_dialogs_aod.js';    // remove the kpay_dialogs.js import and use the kpay_dialogs_aod.js import instead when your app supports AOD!

// remove this is you want to choose yourself when the purchase starts, 
// leave it in if you want the purchase to start automatically (either after a long trial or immediately at startup of the app)
// If you want the purchase to start immediately after install, just set the trial time to 0 in the product settings in your kpay account
import './kpay/release/kpay_time_trial.js';		
/**** END KPAY IMPORTS ****/




/*
 * Entry point for the watch app
 */
import * as document from "document";
import * as messaging from "messaging";
import {memory} from "system";

//CONSTANTS
var DOWN = 4;
var UP = 3;
var RIGHT = 2;
var LEFT = 1;
var MIN_SWIPE = 60;

//Variables
var current_direction = LEFT;
var y = 0;
var x=0;
var speed = 2;
var grow_rate = 10;
var snake = document.getElementById("snake");
var snake_head = document.getElementById("snake-head-use");
var apple = document.getElementById("apple");
var score = 0;
var score_text = document.getElementById("score_text");
var backroand_color = document.getElementById("backround");
var game_started = false;
var game_over = false;
var snake_lines = [1];
var snake_length = 50;
var next_line_section = 2;
var snake_body_first = null;
var snake_body_last = null;
var growing = 0;
var head_transform = null;
//snake.x=140;

messaging.peerSocket.addEventListener("message", (evt) => {

  console.log(JSON.stringify(evt));
  if (evt.data.snake_color != null && evt.data.snake_color != undefined)
  {
    console.log("setting snake color");
    //snake_head.getElementById("color_snake").style.fill = evt.data.snake_color;
    let lines = document.getElementsByClassName('snake-line');
    lines.forEach((element) => {
      element.style.fill = evt.data.snake_color;
    });
  }
   if (evt.data.board_color != null && evt.data.board_color != undefined)
  {
    console.log("setting board color");
    backroand_color.style.fill = evt.data.board_color;  
  }
});

function decrementSection(line_section) {
  if (growing > 0) {
    growing--;
    return;
  }
  
  if (line_section.y1 == line_section.y2) {  //horizontal
    if (line_section.x1 < line_section.x2) {  //moving left
      if (line_section.x2 - speed < line_section.x1) {  //0 length, remove
        return true;
      }
      line_section.x2 -= speed;
    }
    else {  //moving right
      if (line_section.x2 + speed > line_section.x1 ) {
        return true;
      }
      line_section.x2 += speed;
    }
  }
  else {     //vertical
    if (line_section.y1 < line_section.y2) { //moving up
      if(line_section.y2 - speed < line_section.y1) { //0 length, remove
        return true;
      }
      line_section.y2 -= speed;
    }
    else {  //moving down
      if(line_section.y2 + speed > line_section.y1) {
        return true;
      }
      line_section.y2 += speed;
    }
  }
}

function checkHit(line) {
  let x_min = Math.min(line.x1, line.x2);
  let x_max = Math.max(line.x1, line.x2);
  let y_min = Math.min(line.y1, line.y2);
  let y_max = Math.max(line.y1, line.y2);
  
  if (x_min === x_max) {  //vertical
    if (x_mid >= x_min - 7 &&
      x_mid <= x_max + 7 &&
      y_mid >= y_min &&
      y_mid <= y_max){
        console.log(`hit line x:${x_mid} y:${y_mid} x1:${line.x1} x2:${line.x2} y1:${line.y1} y2:${line.y2}`);
        return true;
      }
      return false;
  }
  else {
     if (x_mid >= x_min &&
      x_mid <= x_max &&
      y_mid >= y_min - 7 &&
      y_mid <= y_max + 7){
        console.log(`hit line x:${x_mid} y:${y_mid} x1:${line.x1} x2:${line.x2} y1:${line.y1} y2:${line.y2}`);
        return true; 
      }
      return false;
  }
}

let handleRestart = function() {
  document.getElementById("demotext").text = "Snake!";
  document.getElementById("start-text").style.display = "inline";
  game_over = false;
  score = 0;
  score_text.text = `score: ${score}`;
  snake.x = 150;
  snake.y = 150;
  let elements = document.getElementsByClassName("snake-body");
  elements.forEach((element) => {
    element.style.display = "none";
  });
  var first_segment = document.getElementById("snake-body-1");
  first_segment.style.display = "inline"
  first_segment.x1 = 156;
  first_segment.y2 = 156;
  first_segment.y1 = 156;
  first_segment.x2 = 180;
  
  snake_lines = [1];
  if (current_direction !== LEFT){
    if (current_direction == DOWN) {
      head_transform.from = 270;
      head_transform.to = 360
    }
    else {
      head_transform.from = 90
      head_transform.to = 0;
    }

    snake_head.animate("enable");
    current_direction = LEFT;
  }
  
  
  
}

function handleGameOver() {
  game_over = true;
  game_started = false;
  document.getElementById("demotext").text = "GAME OVER";
  document.getElementById("demotext").style.display = "inline";
  setTimeout(handleRestart, 3000);
}

let x_mid = 0;
let y_mid = 0;

let callback = function (timestamp) {
  //console.log(`cords ${snake.x}, ${snake.y}   ${apple.x}, ${apple.y}  ${apple.height}  ${apple.width}`);
  if(game_started === false)
  {
    requestAnimationFrame(callback);
    return;
  }
  
  if (current_direction == LEFT) {
     x_mid = snake.x - 3;
     y_mid = snake.y + 3;
  }
  else if (current_direction == RIGHT)
  {
    x_mid = snake.x + snake.width;
    y_mid = snake.y + (snake.height / 2);
  }
  else if (current_direction == UP) {
    x_mid = snake.x + (snake.width / 2);
    y_mid = snake.y - 3;
  }
  else if (current_direction == DOWN) {
    x_mid = snake.x + (snake.width / 2);
    y_mid = snake.y + snake.height;
  }
  
  //document.getElementById("test-mid").x = x_mid;
  //document.getElementById("test-mid").y = y_mid;
  
  if (x_mid >= apple.x &&
      x_mid <= (apple.x + apple.width) &&
      y_mid >= apple.y &&
      y_mid <= apple.y + apple.height)
  {
    //onsole.log("eaten");
    
    score += 1;
    score_text.text = `score: ${score}`;
    
    
    let x = 0;
    let y = 0;
    while (x < 25 || x > 309)
    {
        x = Math.random() * 336;
    }
    while (y < 25 || y > 309)
    {
        y = Math.random() * 336;
    }
    apple.x = x;
    apple.y = y;
    growing = grow_rate;
    //if (score == 15)
    //  {
    //    return;
    //  }
  }
 
  if (current_direction == LEFT)
  {
    snake.x-=speed;
    snake_body_first.x1 -= speed;
  }
  else if(current_direction == RIGHT)
  {
    snake.x+=speed;
    snake_body_first.x1 += speed;
  }
  else if(current_direction == UP)
  {
    snake.y-=speed;
    snake_body_first.y1 -= speed;
  }
  else if(current_direction == DOWN)
  {
    snake.y+=speed;
    snake_body_first.y1 += speed;
  }
  
  if(decrementSection(snake_body_last))
  {
    snake_body_last.style.display = "none";
    snake_lines.splice(snake_lines.length - 1, 1);
    //console.log(snake_lines);
    snake_body_last = document.getElementById(`snake-body-${snake_lines[snake_lines.length - 1]}`);
  }
  
  requestAnimationFrame(callback);
  
   if (x_mid <= 0 || x_mid >= 336 || y_mid <= 0 || y_mid >= 336){
    handleGameOver();
  }
  
  for(var i = 2; i < snake_lines.length; i++){
    if (checkHit(document.getElementById(`snake-body-${snake_lines[i]}`)) == true){
      handleGameOver();
    } 
  }
  
}

requestAnimationFrame(callback);


let mouse_handle = document.getElementById("mouse-handle");

mouse_handle.onmousedown = function(evt)
{
  if (game_over === true) {
    return;
  }
  if (game_started === false)
  {
    game_started = true;
    document.getElementById("demotext").style.display = "none";
    document.getElementById("start-text").style.display = "none";
    
    snake_body_first = document.getElementById(`snake-body-${snake_lines[0]}`);
    snake_body_last = document.getElementById(`snake-body-${snake_lines[snake_lines.length - 1]}`);
    head_transform = snake_head.getElementById("g-transform");
  }
 
  y = evt.screenY;
  x = evt.screenX;
};

function addLineSection(direction)
{
    let x = snake.x + 6;
    let y = snake.y + 6;
    
    if (current_direction == RIGHT) {
      y++;
    }
    else if (current_direction == UP) {
      x++;
    }
  

    let new_section = document.getElementById(`snake-body-${next_line_section}`);
    new_section.style.display = "inline";
    new_section.x1 = x;
    new_section.x2 = x;
    new_section.y1 = y;
    new_section.y2 = y;
    snake_lines.splice(0, 0, next_line_section);
    next_line_section++;
    if (next_line_section > snake_length) {
      next_line_section = 1
    }
  
    snake_body_first = new_section;
    //snake_body_last = document.getElementById(`snake-body-${snake_lines[snake_lines.length - 1]}`);
}

mouse_handle.onmouseup = function (evt)
{
  if(game_started == false) { return; }
  
  let yMove = evt.screenY-y;
  let xMove = evt.screenX-x;
  //console.log(`move ${xMove} ${x} ${yMove} ${y}`);
  if (yMove< -MIN_SWIPE && current_direction != DOWN)   //swipe up
  { 
      //console.log("moving up");
      if (current_direction == LEFT)
      {
         head_transform.from = 0;    
      }
      else{
         head_transform.from = 180;
      }
      head_transform.to = 90;
      snake_head.animate("enable");
      
      current_direction = UP;
      addLineSection(current_direction);
  }
  else if (yMove> MIN_SWIPE && current_direction != UP) //swipe down
  {
     //console.log("moving down");
      if (current_direction == LEFT) 
      {
        head_transform.from = 360;
      }
      else 
      {
        head_transform.from = 180;  
      }
      
      head_transform.to = 270;
      snake_head.animate("enable");
    
      current_direction = DOWN;
      addLineSection(current_direction);
  }
 else if (xMove< -MIN_SWIPE && current_direction != RIGHT) //swipe left 
  {
      //console.log("moving left");
      if (current_direction == DOWN) 
      {
        head_transform.from = 270;
        head_transform.to = 360
      }
      else 
      {
        head_transform.from = 90
        head_transform.to = 0;
      }
      
      snake_head.animate("enable");
   
      current_direction = LEFT;
      addLineSection(current_direction);
  }
  else if (xMove> MIN_SWIPE && current_direction != LEFT) //swipe right
  {
    //console.log("moving right");
      if (current_direction == UP)
      {
        head_transform.from = 90;
      }
      else 
      {
        head_transform.from = 270;
      }
      head_transform.to = 180;
      
      snake_head.animate("enable");
    
      current_direction = RIGHT;
      addLineSection(current_direction);
  }

};

/**** KPAY INIT - REQUIRED ***/
kpay.initialize();


