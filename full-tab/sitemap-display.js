"use strict";

(function()
{
  function sendDebug(tabId, debugMessage)
  {
    browser.tabs.sendMessage(tabId, {command: "log_debug", text: debugMessage});
  }

  function sendSitemapRequest(tabId)
  {
    return browser.tabs.sendMessage(tabId, {command: "request_sitemap"});
  }

  function updateSitemap(response)
  {
    if (response.updated)
      document.getElementById("sitemap-content").innerHTML = response.body;
    /* Prune all empty elements. */
    {
      let elements = document.getElementById("sitemap-content").querySelectorAll("*");
      for (let i = elements.length - 1; i >= 0; i--)
      {
        let element = elements[i];
        if (!element.textContent.replace(/\s/g, ''))
          element.parentNode.removeChild(element);
      }
    }
    for (let element of document.querySelectorAll("#sitemap-content > *"))
      element.classList.add("grid-item");
  }

  async function main()
  {
    let tabId = -1;
    let tab = await browser.tabs.query({active: true, currentWindow: true}).then(tabs => tabs[0]);
    let params = tab.url.split('?')[1].split('&');
    for (let kv of params)
    {
      let [key, value] = kv.split('=');
      if (key === "tab")
        tabId = parseInt(value);
    }
    if (tabId > -1)
      await sendSitemapRequest(tabId).then(updateSitemap);
    new Masonry("#sitemap-content",
    {
      itemSelector: ".grid-item",
      columnWidth: 5
    });
  }
  main();
})();
