(() => {
  // Roulette result elements are rendered inside the GrooveGaming game frame.
  // Keep this script inactive in the surrounding Winner page and unrelated frames.
  if (location.hostname !== "gprouter.groovegaming.com") return;
  if (globalThis.__rouletteTrackerInstalled) return;
  globalThis.__rouletteTrackerInstalled = true;

  const selector = '[data-testid="single-result"]';
  const validNumber = /^(00|0|[1-9]|[12][0-9]|3[0-6])$/;
  let scanTimer = null;
  let scanPromise = null;

  function visible(el) {
    const style = getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return style.display !== "none" && style.visibility !== "hidden" &&
      Number(style.opacity || 1) > 0 && rect.width > 0 && rect.height > 0;
  }

  function readVisibleResults() {
    return [...document.querySelectorAll(selector)]
      .filter(visible)
      .map(el => (el.innerText || el.textContent || "").trim().toUpperCase())
      .filter(value => validNumber.test(value));
  }

  async function performScan(manual) {
    const current = readVisibleResults();
    if (!current.length) {
      const message = "Game frame loaded, but no visible single-result numbers were found. Wait for the result history to appear and scan again.";
      await chrome.storage.local.set({rouletteScanStatus:message});
      return {ok:false,message};
    }

    const saved = await chrome.storage.local.get([
      "rouletteResults","rouletteWheel","rouletteVisibleSnapshot"
    ]);
    const wheel = saved.rouletteWheel === "american" ? "american" : "european";
    const usable = current.filter(value => value !== "00" || wheel === "american");
    if (!usable.length) {
      const message = "Visible results do not match the selected wheel type. Check the wheel setting.";
      await chrome.storage.local.set({rouletteScanStatus:message});
      return {ok:false,message};
    }

    const previous = Array.isArray(saved.rouletteVisibleSnapshot)
      ? saved.rouletteVisibleSnapshot : null;
    const results = Array.isArray(saved.rouletteResults)
      ? saved.rouletteResults.slice() : [];

    // The site's list is newest-first. On the first scan, import the visible
    // history oldest-to-newest so the popup's newest-first display stays correct.
    if (!previous) {
      for (const value of usable.slice().reverse()) results.push(value);
      const message = (manual ? "Manual scan" : "Auto-detected") +
        ": imported " + usable.length + " visible results. Newest visible: " + usable[0] + ".";
      await chrome.storage.local.set({
        rouletteResults: results.slice(-500),
        rouletteVisibleSnapshot: usable,
        rouletteScanStatus: message
      });
      return {ok:true,message,count:usable.length};
    }

    // Match the end of the current newest-first list to the beginning of the
    // previous list. Any prefix before that overlap contains new spins.
    let overlap = 0;
    const maxOverlap = Math.min(usable.length, previous.length);
    for (let length = maxOverlap; length > 0; length--) {
      const suffix = usable.slice(usable.length - length);
      if (suffix.every((value, index) => value === previous[index])) {
        overlap = length;
        break;
      }
    }

    if (overlap === 0) {
      const message = "The visible result list changed, but no overlap with the last scan was found. No numbers were added to avoid recording uncertain results. The baseline was refreshed.";
      await chrome.storage.local.set({
        rouletteVisibleSnapshot: usable,
        rouletteScanStatus: message
      });
      return {ok:false,message};
    }

    const newCount = usable.length - overlap;
    if (newCount > 0) {
      // Current list is newest-first; append new results in chronological order.
      for (const value of usable.slice(0,newCount).reverse()) results.push(value);
    }
    const message = newCount
      ? (manual ? "Manual scan" : "Auto-detected") + ": saved " + newCount +
        " new result" + (newCount === 1 ? "" : "s") + ". Newest: " + usable[0] + "."
      : "No new roulette results detected. Latest visible: " + usable[0] + ".";
    await chrome.storage.local.set({
      rouletteResults: results.slice(-500),
      rouletteVisibleSnapshot: usable,
      rouletteScanStatus: message
    });
    return {ok:true,message,count:newCount};
  }

  function saveDetected(manual) {
    if (scanPromise) return scanPromise;
    scanPromise = performScan(manual)
      .catch(async () => {
        const message = "Scan failed inside the game frame. Reload the Winner page and try again.";
        await chrome.storage.local.set({rouletteScanStatus:message});
        return {ok:false,message};
      })
      .finally(() => { scanPromise = null; });
    return scanPromise;
  }

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request?.type === "ROULETTE_SCAN_NOW") {
      saveDetected(true).then(sendResponse);
      return true;
    }
  });

  function scheduleScan() {
    chrome.storage.local.get(["rouletteAuto"]).then(saved => {
      if (saved.rouletteAuto !== true) return;
      if (scanTimer) clearTimeout(scanTimer);
      scanTimer = setTimeout(() => saveDetected(false), 700);
    }).catch(() => {});
  }

  const observer = new MutationObserver(scheduleScan);
  observer.observe(document.documentElement, {
    subtree:true, childList:true, characterData:true, attributes:true,
    attributeFilter:["class","aria-label","title","data-testid"]
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.rouletteAuto?.newValue === true) scheduleScan();
  });
  chrome.storage.local.get(["rouletteAuto"]).then(saved => {
    if (saved.rouletteAuto === true) scheduleScan();
  }).catch(() => {});
})();