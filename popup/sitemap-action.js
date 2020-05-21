"use strict";

browser.browserAction.onClicked.addListener(function(tab)
{
  console.log("B");
  browser.tabs.sendMessage(tab.id, {command: "log_debug", text: "Hello world!"});
});
