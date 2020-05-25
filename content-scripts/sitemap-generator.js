"use strict";

(function()
{
  if (window.hasRun) {
    return;
  }
  window.hasRun = true;

  function bodyCleaner(body)
  {
    {
      let elements = body.querySelectorAll("style, br, script, svg, input, :not(a) img, pre, code, video, audio, iframe");
      for (let i = elements.length - 1; i >= 0; i--)
      {
        let element = elements[i];
        element.parentNode.removeChild(element);
      }
    }
    /* Fix up links by making <a> tags linking to other pages absolute and making all other "bad" links plain text. */
    {
      let elements = body.querySelectorAll("a, button"); // Buttons conveniently work with the same logic; this is a lazy hack.
      for (let i = elements.length - 1; i >= 0; i--)
      {
        let element = elements[i];
        if (!element.getAttribute("href")) // Effectively a span without an href. Replace to make parsing easier.
          element.outerHTML = "<span>" + element.innerHTML + "</span>";
        else if (element.getAttribute("href").startsWith('#') ||
            element.getAttribute("href").startsWith('javascript:') ||
            element.innerHTML === "") // These do not contribute to site layout, so treat them like text, not links.
          element.outerHTML = "<span>" + element.innerHTML + "</span>"; // element.parentNode.removeChild(element);
        else
          element.setAttribute("href", element.href); // Make all hrefs absolute.
      }
    }
    {
      let elements = body.querySelectorAll("img");
      for (let i = elements.length - 1; i >= 0; i--)
      {
        let element = elements[i];
        element.outerHTML = element.alt;
      }
    }
    /* Prune all empty elements and remove inline styles. */
    {
      let elements = body.querySelectorAll("*");
      for (let i = elements.length - 1; i >= 0; i--)
      {
        let element = elements[i];
        if (!element.textContent.replace(/\s/g, ''))
          element.parentNode.removeChild(element);
        else
          element.style = "";
      }
    }
    return body;
  }
  
  function bodyExtractor(body)
  {
    let extracted = "";
    let elements = body.querySelectorAll("ul, ol");
    let blacklist = Array();
    for (let i = 0; i < elements.length; i++)
    {
      let element = elements[i];
      if (element.querySelector("a") !== null && !blacklist.includes(element))
      {
        blacklist.push(...Array.from(element.querySelectorAll("*")));
        extracted += element.outerHTML + '\n';
      }
    }
    return extracted;
  }
  
  browser.runtime.onMessage.addListener(function(request, sender, sendResponse)
  {
    //console.log(sender.url);
    switch (request.command)
    {
    case "log_debug":
      console.log(request.text);
      break;
    case "request_sitemap":
      let newBody = bodyCleaner(document.body.cloneNode(true));
      console.log(newBody.innerHTML);
      let sitemap = bodyExtractor(newBody);
      console.log(sitemap);
      sendResponse({updated: true, body: sitemap});
      break;
    }
  });
})();
