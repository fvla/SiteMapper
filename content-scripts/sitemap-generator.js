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
      let elements = body.querySelectorAll("style, script, svg, input, :not(a) img, video, audio, iframe");
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
        element.outerHTML = "<h2>" + element.alt + "</h2>";
      }
    }
    /* Set all details tags as open by default. */
    {
      let elements = body.querySelectorAll("details");
      for (let i = elements.length - 1; i >= 0; i--)
      {
        let element = elements[i];
        element.setAttributeNode(document.createAttribute("open"));
      }
    }
    /* Prune all empty elements (except <br>) and remove inline styles. */
    {
      let elements = body.querySelectorAll("*");
      for (let i = elements.length - 1; i >= 0; i--)
      {
        let element = elements[i];
        if (element.tagName !== "BR" && !element.textContent.replace(/\s/g, ''))
          element.parentNode.removeChild(element);
        else
          element.removeAttribute("style");
      }
    }
    return body;
  }

  /* Utility function that tells whether this element contains only a link. */
  function isLinkContainer(element)
  {
    if (element.tagName === "A")
      return true;
    if (!element.querySelector("a"))
      return false;
    while (element.tagName !== "A")
    {
      if (element.children.length !== 1)
        return false;
      // let elementContent = '';
      for (let node of element.childNodes)
        if (node.nodeType == Node.TEXT_NODE)
          if (node.textContent.replace(/\s/g, '') !== '')
            return false;
      element = element.children[0];
    }
    return true;
  }

  /* Depth = 0 if null, depth = 1 if it has no parents */
  function getElementDepth(element)
  {
    let depth = 0;
    while (element)
    {
      depth++;
      element = element.parentElement;
    }
    return depth;
  }

  function classifyElement(element)
  {
    while (element && element.tagName !== "BODY")
    {
      if ((element.id + element.className).search(/side(nav|bar)/i) > -1)
        return "sidebar";
      if ((element.id + element.className).search(/breadcrumb/i) > -1)
        return "breadcrumbs";
      if (getElementDepth(element) <= 3 && // To decrease chances of false positive, limit depth.
          ((element.id + element.className).search(/footer/i) > -1 || element.tagName === "FOOTER"))
        return "footer";
      if (!((element.id + element.className).search(/footer/i) > -1 || element.tagName === "FOOTER") &&
          (element.id + element.className).search(/(header|banner|nav)/i) > -1)
        return "header";
      element = element.parentElement;
    }
    return "body";
  }

  function bodyExtractor(body)
  {
    let extracted = {header: "", sidebar: "", breadcrumbs: "", body: "", footer: ""};
    let extractedInner = [];
    let elements = body.querySelectorAll("*");
    let blacklist = Array();
    for (let i = 0; i < elements.length; i++)
    {
      let element = elements[i];
      if (blacklist.includes(element))
        continue;
      if (extractedInner.includes(element.parentElement.textContent))
      {
        blacklist.push(...Array.from(element.querySelectorAll("*")));
        continue;
      }
      if ((element.id + element.className).search(/language/i) > -1)
      {
        blacklist.push(...Array.from(element.querySelectorAll("*")));
        element.parentElement.removeChild(element);
      }
      else if (element.tagName.search(/[OU]L/) > -1) // ul, ol
      {
        if (element.querySelector("a") !== null)
        {
          if (getElementDepth(element) > 2)
            element = element.parentElement;
          blacklist.push(...Array.from(element.querySelectorAll("*")));
          extracted[classifyElement(element)] += element.outerHTML + '\n';
          extractedInner.push(element.textContent);
          element.parentElement.removeChild(element);
        }
      }
      else if (element.tagName !== "LI" && isLinkContainer(element) && element.parentElement.tagName !== "LI")
      {
        if (getElementDepth(element) > 2)
          element = element.parentElement;
        blacklist.push(...Array.from(element.querySelectorAll("*")));
        extracted[classifyElement(element)] += element.outerHTML + '\n';
        extractedInner.push(element.textContent);
        element.parentElement.removeChild(element);
      }
    }
    for (let key in extracted)
      extracted[key] = extracted[key].replace(/\s+/g, " ").trim();
    return extracted;
  }

  browser.runtime.onMessage.addListener(function(request, sender, sendResponse)
  {
    switch (request.command)
    {
    case "log_debug":
      console.log(request.text);
      break;
    case "request_sitemap":
      let newBody = bodyCleaner(document.body.cloneNode(true));
      let sitemap = bodyExtractor(newBody);
      sendResponse({updated: true, body: sitemap});
      break;
    }
  });
})();
