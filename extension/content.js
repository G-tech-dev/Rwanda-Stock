(() => {
  if (globalThis.__rouletteTrackerInstalled) return;
  globalThis.__rouletteTrackerInstalled = true;

  const relevant = /result|roulette|history|recent|outcome|last.?number|winning.?number|spin.?number|number.?history/i;
  const exactNumber = /^(00|0|[1-9]|[12][0-9]|3[0-6])$/;
  let lastLocalSignature = "";
  let scanTimer = null;

  function visible(el) {
    if (!(el instanceof Element)) return false;
    const style = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return style.display !== "none" && style.visibility !== "hidden" &&
      Number(style.opacity || 1) > 0 && rect.width > 0 && rect.height > 0;
  }
  function metadata(el) {
    return [el.id, el.className, el.getAttribute("aria-label"), el.getAttribute("title"),
      el.getAttribute("data-testid"), el.getAttribute("data-test"), el.getAttribute("role")]
      .filter(v => typeof v === "string").join(" ");
  }
  function candidateElements() {
    const all = Array.from(document.querySelectorAll("body *")).filter(visible);
    return all.map(el => {
      const meta = metadata(el);
      const text = (el.innerText || el.textContent || "").trim();
      if (!relevant.test(meta) || !text || text.length > 120) return null;
      const directText = Array.from(el.childNodes).filter(n => n.nodeType === Node.TEXT_NODE)
        .map(n => n.textContent.trim()).filter(Boolean).join(" ").trim();
      const value = exactNumber.test(text) ? text : exactNumber.test(directText) ? directText : null;
      if (!value) return null;
      const childHasCandidate = Array.from(el.children).some(child => {
        const t = (child.innerText || child.textContent || "").trim();
        return exactNumber.test(t);
      });
      if (childHasCandidate) return null;
      let score = 0;
      if (/result|winning.?number|outcome/i.test(meta)) score += 5;
      if (/recent|history|last.?number|roulette/i.test(meta)) score += 3;
      if (text.length <= 2) score += 2;
      return {value:value.toUpperCase(),score,el,meta,text};
    }).filter(Boolean).sort((a,b) => b.score-a.score);
  }
  function findResult() {
    const candidates = candidateElements();
    if (!candidates.length) return null;
    const c = candidates[0];
    let context = c.el;
    for (let i=0;i<4 && context.parentElement;i++) {
      const parent = context.parentElement;
      if (relevant.test(metadata(parent)) && (parent.innerText || "").length < 500) context = parent;
      else break;
    }
    const contextText = (context.innerText || context.textContent || "").trim().slice(0,500);
    const signature = [location.pathname, metadata(context), contextText].join("|");
    return {value:c.value,signature,source:metadata(c.el).slice(0,100)};
  }
  async function saveDetected(manual) {
    const found = findResult();
    if (!found) {
      const message = "No result found in readable result/history elements. If the game is rendered in an external frame or canvas, this scanner cannot read it.";
      await chrome.storage.local.set({rouletteScanStatus:message});
      return {ok:false,message};
    }
    const saved = await chrome.storage.local.get(["rouletteResults","rouletteWheel","rouletteLastScanSignature"]);
    const priorSignature = saved.rouletteLastScanSignature || "";
    if (found.signature === priorSignature) {
      const message = "Latest visible result is " + found.value + ", already recorded; no duplicate added.";
      await chrome.storage.local.set({rouletteScanStatus:message});
      return {ok:true,message,value:found.value,duplicate:true};
    }
    const wheel = saved.rouletteWheel === "american" ? "american" : "european";
    if (found.value === "00" && wheel !== "american") {
      const message = "Detected 00, but the tracker is set to European roulette. Change the wheel type to American to record it.";
      await chrome.storage.local.set({rouletteScanStatus:message});
      return {ok:false,message};
    }
    const results = Array.isArray(saved.rouletteResults) ? saved.rouletteResults.slice() : [];
    results.push(found.value);
    if (results.length > 500) results.splice(0,results.length-500);
    const message = (manual ? "Manual scan" : "Auto-detected") + ": saved result " + found.value + ".";
    await chrome.storage.local.set({
      rouletteResults:results,
      rouletteLastScanSignature:found.signature,
      rouletteScanStatus:message
    });
    lastLocalSignature = found.signature;
    return {ok:true,message,value:found.value};
  }
  chrome.runtime.onMessage.addListener((request,sender,sendResponse) => {
    if (request?.type === "ROULETTE_SCAN_NOW") {
      saveDetected(true).then(sendResponse).catch(() => sendResponse({ok:false,message:"Scan failed. Reload the page and try again."}));
      return true;
    }
  });
  function scheduleScan() {
    chrome.storage.local.get(["rouletteAuto"]).then(saved => {
      if (saved.rouletteAuto !== true) return;
      if (scanTimer) clearTimeout(scanTimer);
      scanTimer = setTimeout(() => {
        saveDetected(false).catch(() => {});
      },700);
    }).catch(() => {});
  }
  const observer = new MutationObserver(scheduleScan);
  observer.observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:["class","aria-label","title","data-testid"]});
  chrome.storage.onChanged.addListener((changes,area) => {
    if (area === "local" && changes.rouletteAuto?.newValue === true) scheduleScan();
  });
  chrome.storage.local.get(["rouletteAuto"]).then(saved => {
    if (saved.rouletteAuto === true) scheduleScan();
  }).catch(() => {});
})();