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
  {
    const sitemapParts = ["header", "sidebar", "breadcrumbs", "body", "footer"];
    let sitemap = response.body;
    for (let part of sitemapParts)
    {
      if (!sitemap[part])
        continue;
      let sectionHeading = document.createElement("h1");
      sectionHeading.innerHTML = part.replace(/^\w/, (c) => c.toUpperCase());
      document.getElementById("sitemap-content").appendChild(sectionHeading);
      let sectionBody = document.createElement("div");
      sectionBody.id = part + "-content";
      sectionBody.innerHTML = sitemap[part];
      document.getElementById("sitemap-content").appendChild(sectionBody);
    }
  }
  /* Prune all empty elements. */
  {
    let elements = document.getElementById("sitemap-content").querySelectorAll("*");
    for (let i = elements.length - 1; i >= 0; i--)
    {
      let element = elements[i];
      if (element.tagName !== "BR" && !element.textContent.replace(/\s/g, ''))
        element.parentNode.removeChild(element);
    }
  }
  for (let element of document.getElementById("header-content").children)
  {
    let listElements = element.querySelectorAll("ul, ol");
    for (let listElement of listElements)
    {
      let listElementParent = listElement.parentElement;
      let containedByList = false;
      while (listElementParent)
      {
        if (listElementParent.tagName.search(/[OU]L/) > -1)
        {
          containedByList = true;
          break;
        }
        listElementParent = listElementParent.parentElement;
      }
      if (containedByList)
        continue;
      if (listElement.parentElement.id !== "header-content" &&
          listElement.parentElement.parentElement.id !== "header-content")
        listElement = listElement.parentElement;
      listElement.classList.add("header-content-list");
    }
  }
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
  document.addEventListener("click", async (e) =>
  {
    if (e.target.id === "refresh-button")
    {
      await browser.tabs.query({active: true, currentWindow: true})
        .then(tabs => tabs[0]).then(sendSitemapRequest).then(updateSitemap)
        .catch(reportExecuteScriptError);
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
