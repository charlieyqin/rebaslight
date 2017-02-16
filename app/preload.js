var electron = require("electron");
var ipcRenderer = electron.ipcRenderer;

var nextCallID = (function(){
  var i = 0;
  return function(){
    i++;
    return "call-" + i;
  };
}());

var defRPC = function(name){
  var callbacks = {};
  ipcRenderer.on(name + "-error", function(event, callid, err){
    if(callbacks.hasOwnProperty(callid)){
      callbacks[callid](err);
      delete callbacks[callid];
    }
  });
  ipcRenderer.on(name + "-data", function(event, callid, data){
    if(callbacks.hasOwnProperty(callid)){
      callbacks[callid](undefined, data);
      delete callbacks[callid];
    }
  });
  return function(data, callback){
    var callid = nextCallID();
    callbacks[callid] = callback;
    ipcRenderer.send(name, callid, data);
  };
};

var rpcSave = defRPC("rlhome-projects-save");
var rpcRead = defRPC("rlhome-projects-read");

window.REBASLIGHT_BROWSER = {
  quit: function(){
    electron.remote.app.quit();
  },
  showSaveDialog: function(opts, callback){
    var getStrOpt = function(key, dflt){
      if(opts && opts.hasOwnProperty(key) && (typeof opts[key] === "string")){
        return opts[key];
      }
      return dflt;
    };
    electron.remote.dialog.showSaveDialog({
      title: getStrOpt("title", "Save"),
      defaultPath: getStrOpt("defaultPath"),
      filters: [
        {name: "Video", extensions: ["mp4"]}
      ]
    }, function(file_path){
      callback(undefined, file_path);
    });
  },
  projects: {
    write: function(data, callback){
      rpcSave(data, callback);
    },
    load: function(callback){
      rpcRead(null, callback);
    }
  },
  Exporter: function(opts){
    ipcRenderer.on("ffmpeg-stopped", function(event, code){
      opts.onStopped(code);
    });
    ipcRenderer.on("ffmpeg-error", function(event, error){
      opts.onError(error);
    });
    ipcRenderer.on("ffmpeg-status", function(event, line){
      opts.onStatus(line);
    });
    return {
      start: function(arg){
        ipcRenderer.send("ffmpeg-start", arg);
      },
      render: function(base64_str){
        ipcRenderer.send("ffmpeg-render-frame", base64_str);
      },
      stop: function(){
        ipcRenderer.send("ffmpeg-stop");
      }
    };
  },
  Converter: function(opts){
    ipcRenderer.on("ffmpeg-convert-stopped", function(event, code){
      opts.onStopped(code);
    });
    ipcRenderer.on("ffmpeg-convert-error", function(event, error){
      opts.onError(error);
    });
    ipcRenderer.on("ffmpeg-convert-status", function(event, line){
      opts.onStatus(line);
    });
    return {
      start: function(opts){
        ipcRenderer.send("ffmpeg-convert", opts);
      }
    };
  }
};