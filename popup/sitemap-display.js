"use strict";

document.querySelector("#toolbar").classList.remove("hidden");

function sendDebug(tab, debugMessage)
{
  browser.tabs.sendMessage(tab.id, {command: "log_debug", text: debugMessage});
}

function sendSitemapRequest(tab)
{
  return browser.tabs.sendMessage(tab.id, {command: "request_sitemap"});
}

function updateSitemap(response)
{
  if (response.updated)
    document.getElementById("sitemap-content").innerHTML = response.body;
  for (let element of document.querySelectorAll("#sitemap-content > *"))
    element.classList.add("grid-item");
}

function openTab(tab)
{
  browser.tabs.create({url: `/full-tab/sitemap-display.html?tab=${tab.id}`});
}

/**
 * Listen for clicks on the buttons, and send the appropriate message to
 * the content script in the page.
 */
async function listenForClicks() {
  let tab = await browser.tabs.query({active: true, currentWindow: true}).then(tabs => tabs[0]);
  console.log(tab);
  //sendDebug(tab, "Hello, tab!");
  await sendSitemapRequest(tab).then(updateSitemap).catch(reportExecuteScriptError);
  new Masonry("#sitemap-content",
  {
    itemSelector: ".grid-item",
    columnWidth: 5
  });
  document.addEventListener("click", async (e) =>
  {
    if (e.target.id === "refresh-button")
    {
      await browser.tabs.query({active: true, currentWindow: true})
        .then(tabs => tabs[0]).then(sendSitemapRequest).then(updateSitemap)
        .catch(reportExecuteScriptError);
      new Masonry("#sitemap-content",
      {
        itemSelector: ".grid-item",
        columnWidth: 5
      });
    }
    else if (e.target.id === "open-button")
    {
      browser.tabs.query({active: true, currentWindow: true})
        .then(tabs => tabs[0]).then(openTab)
        .catch(reportExecuteScriptError);
    }
  });
}

/**
 * There was an error executing the script.
 * Display the popup's error message, and hide the normal UI.
 */
function reportExecuteScriptError(error)
{
  document.querySelector("#toolbar").classList.add("hidden");
  document.querySelector("#sitemap-content").classList.add("hidden");
  document.querySelector("#error-content").classList.remove("hidden");
  let errorP = document.createElement("p");
  errorP.innerHTML = `Error: ${error.message}`;
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
