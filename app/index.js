"use strict";
const path = require("path");
const electron = require("electron");
require("./ffmpeg");
require("./rlhome");

const app = electron.app;
const Menu = electron.Menu;
const shell = electron.shell;
const ipcMain = electron.ipcMain;
const BrowserWindow = electron.BrowserWindow;

const is_dev_mode = process.env.NODE_ENV === "development";

let mainWindow;

// Quit when all windows are closed.
app.on("window-all-closed", function() {
  app.quit();
});

if(process.platform === "darwin"){
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    {
      label: app.getName(),
      submenu: [
        {
          label: "Quit",
          accelerator: "Command+Q",
          click: function(){
            app.quit();
          }
        }
      ]
    }
  ]));
}

app.on("ready", function() {
  mainWindow = new BrowserWindow({
    title: "Rebaslight" + (is_dev_mode ? " DEVELOPMENT" : ""),
    webPreferences: {
      nodeIntegration: false,
      preload: path.resolve(__dirname, "preload.js")
    }
  });
  mainWindow.setMenu(null);
  mainWindow.loadURL("file://" + path.resolve(__dirname, "index.html"));
  mainWindow.maximize();

  if(is_dev_mode){
    mainWindow.webContents.openDevTools();
  }

  mainWindow.webContents.on('will-navigate', function(e, url){
    e.preventDefault();
    shell.openExternal(url);
  });

  mainWindow.on("closed", function() {
    mainWindow = null;
  });
});

if(is_dev_mode){
  const fs = require("fs");
  fs.watchFile(path.resolve(__dirname, "./bundle.js"), function(curr, prev){
    if(mainWindow){
      mainWindow.reload();
    }
  });
}
