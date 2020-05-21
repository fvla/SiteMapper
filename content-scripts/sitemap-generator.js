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
      let elements = body.querySelectorAll("script, svg, input, :not(a) img");
      for (let i = elements.length - 1; i >= 0; i--)
      {
        let element = elements[i];
        element.parentNode.removeChild(element);
      };
    }
    return body;
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
      let newBody = bodyCleaner(document.body.cloneNode(true)).innerHTML;
      console.log(newBody);
      sendResponse({updated: true, body: newBody});
      break;
    }
  });
})();
