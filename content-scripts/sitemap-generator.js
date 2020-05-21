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
      let elements = body.querySelectorAll("style, br, script, svg, input, :not(a) img, pre, code");
      for (let i = elements.length - 1; i >= 0; i--)
      {
        let element = elements[i];
        element.parentNode.removeChild(element);
      }
    }
    {
      let elements = body.querySelectorAll("a");
      for (let i = elements.length - 1; i >= 0; i--)
      {
        let element = elements[i];
        if (!element.getAttribute("href")) // Effectively a span without an href. Replace to make parsing easier.
          element.outerHTML = "<span>" + element.innerHTML + "</span>";
        else if (element.getAttribute("href").startsWith('#') ||
            element.getAttribute("href").startsWith('javascript:')) // These do not contribute to site layout.
          element.parentNode.removeChild(element);
        else
          element.setAttribute("href", element.href); // Make all hrefs absolute.
      }
    }
    {
      let elements = body.querySelectorAll("*");
      for (let i = elements.length - 1; i >= 0; i--)
      {
        let element = elements[i];
        element.style = "";
      }
    }
    return body;
  }
  
  function bodyExtractor(body)
  {
    let extracted = "";
    let elements = body.querySelectorAll("ul, ol");
    for (let i = 0; i < elements.length; i++)
    {
      let element = elements[i];
      if (element.querySelector("a") !== null)
      {
        //console.log(element);
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
