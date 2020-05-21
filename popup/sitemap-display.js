"use strict";

function sendDebug(tab, debugMessage)
{
  browser.tabs.sendMessage(tab.id, {command: "log_debug", text: debugMessage});
}

async function sendSitemapRequest(tab)
{
  return browser.tabs.sendMessage(tab.id, {command: "request_sitemap"});
}

function updateSitemap(response)
{
  if (response.updated)
  {
    document.getElementById("popup-content").innerHTML = response.body;
  }
}

/**
 * Listen for clicks on the buttons, and send the appropriate message to
 * the content script in the page.
 */
async function listenForClicks() {
  let tab = await browser.tabs.query({active: true, currentWindow: true}).then(tabs => tabs[0]);
  console.log(tab);
  //sendDebug(tab, "Hello, tab!");
  sendSitemapRequest(tab).then(updateSitemap).catch(reportExecuteScriptError);
  document.addEventListener("click", (e) =>
  {
    if (e.target.id === "refresh-button")
    {
      browser.tabs.query({active: true, currentWindow: true})
        .then(tabs => tabs[0]).then(sendSitemapRequest).then(updateSitemap)
        .catch(reportExecuteScriptError);
    }
    /**
     * Given the name of a beast, get the URL to the corresponding image.
     */
    /* function beastNameToURL(beastName) {
      switch (beastName) {
        case "Frog":
          return browser.extension.getURL("beasts/frog.jpg");
        case "Snake":
          return browser.extension.getURL("beasts/snake.jpg");
        case "Turtle":
          return browser.extension.getURL("beasts/turtle.jpg");
      }
    } */

    /**
     * Insert the page-hiding CSS into the active tab,
     * then get the beast URL and
     * send a "beastify" message to the content script in the active tab.
     */
    /* function beastify(tabs) {
      browser.tabs.insertCSS({code: hidePage}).then(() => {
        let url = beastNameToURL(e.target.textContent);
        browser.tabs.sendMessage(tabs[0].id, {
          command: "beastify",
          beastURL: url
        });
      });
    } */

    /**
     * Remove the page-hiding CSS from the active tab,
     * send a "reset" message to the content script in the active tab.
     */
    /* function reset(tabs) {
      browser.tabs.removeCSS({code: hidePage}).then(() => {
        browser.tabs.sendMessage(tabs[0].id, {
          command: "reset",
        });
      });
    } */

    /**
     * Just log the error to the console.
     */
    /* function reportError(error) {
      console.error(`Could not beastify: ${error}`);
    } */

    /**
     * Get the active tab,
     * then call "beastify()" or "reset()" as appropriate.
     */
    /* if (e.target.classList.contains("beast")) {
      browser.tabs.query({active: true, currentWindow: true})
        .then(beastify)
        .catch(reportError);
    }
    else if (e.target.classList.contains("reset")) {
      browser.tabs.query({active: true, currentWindow: true})
        .then(reset)
        .catch(reportError);
    } */
  });
}

/**
 * There was an error executing the script.
 * Display the popup's error message, and hide the normal UI.
 */
function reportExecuteScriptError(error)
{
  document.querySelector("#popup-content").classList.add("hidden");
  document.querySelector("#error-content").classList.remove("hidden");
  var errorP = document.createElement("p");
  errorP.innerHTML = error.message;
  document.querySelector("#error-content").appendChild(errorP);
  console.error(`Failed to execute SiteMapper content script: ${error.message}`);
}

/**
 * When the popup loads, inject a content script into the active tab,
 * and add a click handler.
 * If we couldn't inject the script, handle the error.
 */
browser.tabs.executeScript({file: "/content-scripts/sitemap-generator.js"})
.then(listenForClicks)
.catch(reportExecuteScriptError);
