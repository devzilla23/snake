/*
 * Entry point for the companion app
 */
import { me } from "companion"
import { settingsStorage } from "settings";
import * as messaging from "messaging";

/**** BEGIN KPAY IMPORTS - REQUIRED ****/
/*
 * If you want (a lot of) logging from the KPay library,
 * replace "release" with "debug" in the import path below
 */
import * as kpay from './kpay/release/kpay_companion.js';
import * as kpay_common from '../common/kpay/kpay_common.js';
/**** END KPAY IMPORTS ****/


// Get the value of the setting

/**** KPAY INIT - REQUIRED ***/
kpay.initialize();


messaging.peerSocket.addEventListener("open", (evt) => {
  let snake_color = settingsStorage.getItem("snake_color");

  let board_color = settingsStorage.getItem("board_color");
  let settings = {};

  if (snake_color != null && snake_color != undefined)
  {
    settings.snake_color = JSON.parse(snake_color);    
  }
  if (board_color != null && board_color != undefined)
  {
    settings.board_color = JSON.parse(board_color);    
  }

  messaging.peerSocket.send(settings);
});

messaging.peerSocket.addEventListener("message", (evt) => {
  let msg = evt.data;
  if (kpay_common.isKPayMessage(msg))
    return;   //this message is handled by the KPay lib
  
  //handle your own messages from watch to companion below this line!
  console.log("Communication onMessage called: " + JSON.stringify(msg));
});

settingsStorage.addEventListener("change", (evt) => {
  // Which setting changed
  console.log(`key: ${evt.key}`)
  let settings = {};
  if (evt.key == "snake_color")
  {
      console.log(`setting color ${evt.newValue}`);
      settings.snake_color = JSON.parse(evt.newValue);
  }
  
  else if (evt.key == "board_color")
  {
      console.log(`setting color ${evt.newValue}`);
      settings.board_color = JSON.parse(evt.newValue);
  }
  
  
  console.log(JSON.stringify(settings));
  if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
    messaging.peerSocket.send(settings);
  } else {
    console.log("No peerSocket connection");
  }
  
});

console.log("Companion code started");
