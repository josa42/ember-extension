import BasicAdapter from "adapters/basic";

var ChromeAdapter = BasicAdapter.extend({

  sendMessage: function(options) {
    options = options || {};
    this.get('_chromePort').postMessage(options);
  },

  _chromePort: function() {
    return chrome.extension.connect();
  }.property(),

  _connect: function() {
    var self = this;
    var chromePort = this.get('_chromePort');
    chromePort.postMessage({ appId: chrome.devtools.inspectedWindow.tabId });

    chromePort.onMessage.addListener(function(message) {
      self._messageReceived(message);
    });
  }.on('init'),

  _handleReload: function() {
    chrome.devtools.network.onNavigated.addListener(function() {
      location.reload(true);
    });
  }.on('init'),

  _injectDebugger: function() {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", chrome.extension.getURL('/ember_debug/ember_debug.js'), false);
    xhr.send();
    var emberDebug = xhr.responseText;

    var inserted = [];
    var insert = function() {
      var frames_src = 
        "(function() {" +
        "  var srcs = [], frames = document.getElementsByTagName('iframe');" +
        "  for (var i = 0; i < frames.length; i++) {srcs.push(frames[i].src);};" +
        "  return srcs;" +
        "})();";
      
      chrome.devtools.inspectedWindow.eval(frames_src, {}, function(result, isException) {
        for (var i = 0; i < result.length; i++) {
          if (inserted[i] !== result[i]) {
            inserted[i] = result[i];
            chrome.devtools.inspectedWindow.eval(emberDebug, {frameURL:result[i]});
            alert(result[i]);
          }
        }
      });
    };
    $(chrome.devtools.inspectedWindow).ready(insert);
    setInterval(insert, 1000);

    chrome.devtools.inspectedWindow.eval(emberDebug);
  }.on('init')
});

export default ChromeAdapter;
