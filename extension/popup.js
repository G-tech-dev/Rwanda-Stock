const $ = (id) => document.getElementById(id);
const wheel = $("wheel");
const resultInput = $("result");
const addButton = $("add");
const clearButton = $("clear");
const message = $("message");
const scanButton = $("scan");
const autoToggle = $("auto");
const scanStatus = $("scanStatus");
let results = [];
let lastScanStatus = "";

function classify(raw) {
  const value = String(raw).trim().toUpperCase();
  if (value === "00") return wheel.value === "american" ? "zero" : null;
  if (!/^\d{1,2}$/.test(value)) return null;
  const number = Number(value);
  if (number < 0 || number > 36) return null;
  if (number === 0) return "zero";
  return number % 2 === 0 ? "even" : "odd";
}
function valid(raw) {
  const value = String(raw).trim().toUpperCase();
  if (value === "00") return wheel.value === "american";
  return /^\d{1,2}$/.test(value) && Number(value) >= 0 && Number(value) <= 36;
}
function key(raw) { return String(raw).trim().toUpperCase(); }
function percent(count, total) { return total ? (count / total * 100).toFixed(1) + "%" : "0%"; }

function render() {
  const counts = {even:0, odd:0, zero:0};
  results.forEach((r) => { const c = classify(r); if (c) counts[c]++; });
  const total = results.length;
  $("evenCount").textContent = counts.even;
  $("oddCount").textContent = counts.odd;
  $("zeroCount").textContent = counts.zero;
  $("evenPct").textContent = percent(counts.even,total);
  $("oddPct").textContent = percent(counts.odd,total);
  $("zeroPct").textContent = percent(counts.zero,total);
  $("history").textContent = total ? results.slice(-20).reverse().join(" · ") : "No results recorded yet.";
  $("baseline").textContent = wheel.value === "european"
    ? "European wheel baseline: 18/37 (48.65%) even, 18/37 (48.65%) odd, and 1/37 (2.70%) zero."
    : "American wheel baseline: 18/38 (47.37%) even, 18/38 (47.37%) odd, and 2/38 (5.26%) zero pockets (0 and 00).";
  $("streak").textContent = streakText();

  const sample = results.slice(-20);
  const sampleCounts = {even:0, odd:0, zero:0};
  sample.forEach((r) => {
    const outcome = classify(r);
    if (outcome) sampleCounts[outcome]++;
  });
  const estimate = $("estimate");
  const estimateDetail = $("estimateDetail");
  if (estimate && estimateDetail) {
    if (sample.length < 5) {
      estimate.textContent = "Not enough results yet (record at least 5).";
      estimateDetail.textContent = "This is a summary of recent outcomes, not a reliable prediction of the next spin.";
    } else {
      const parityTotal = sampleCounts.even + sampleCounts.odd;
      let trend = "No clear even/odd lean in the last " + sample.length + " results.";
      if (parityTotal && sampleCounts.even / parityTotal >= 0.60) {
        trend = "Recent sample has more even results (" + sampleCounts.even + "/" + parityTotal + ").";
      } else if (parityTotal && sampleCounts.odd / parityTotal >= 0.60) {
        trend = "Recent sample has more odd results (" + sampleCounts.odd + "/" + parityTotal + ").";
      }
      estimate.textContent = trend;
      const evenRate = parityTotal ? (sampleCounts.even / parityTotal * 100).toFixed(1) : "0.0";
      const oddRate = parityTotal ? (sampleCounts.odd / parityTotal * 100).toFixed(1) : "0.0";
      estimateDetail.textContent = "Last " + sample.length + " recorded: even " + evenRate +
        "%, odd " + oddRate + "%; zero " + sampleCounts.zero + ". European-wheel baseline: 48.65% even, 48.65% odd, 2.70% zero. Spins are independent; this trend does not improve the odds.";
    }
  }
}
function streakText() {
  if (!results.length) return "Current streak: none yet.";
  const last = classify(results[results.length - 1]);
  let count = 0;
  for (let i=results.length-1;i>=0;i--) {
    if (classify(results[i]) !== last) break;
    count++;
  }
  return "Latest recorded streak: " + count + " " + (last || "unknown") + (count === 1 ? " result" : " results") + ". Descriptive only.";
}
async function load() {
  const saved = await chrome.storage.local.get(["rouletteResults","rouletteWheel","rouletteAuto","rouletteLastScanSignature","rouletteScanStatus"]);
  results = Array.isArray(saved.rouletteResults) ? saved.rouletteResults : [];
  if (saved.rouletteWheel === "american") wheel.value = "american";
  autoToggle.checked = saved.rouletteAuto === true;
  scanStatus.textContent = saved.rouletteScanStatus || "Ready. Open the Winner Auto Roulette page to scan.";
  render();
}
async function save() {
  await chrome.storage.local.set({rouletteResults:results,rouletteWheel:wheel.value});
}
async function activeTab() {
  const tabs = await chrome.tabs.query({active:true,currentWindow:true});
  return tabs[0];
}
function isWinnerRouletteUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);
    return url.protocol === "https:" &&
      url.hostname === "winner.rw" &&
      /recently-played/i.test(url.pathname) &&
      /(auto-?roulette|roulette)/i.test(url.pathname);
  } catch {
    return false;
  }
}
scanButton.addEventListener("click", async () => {
  scanButton.disabled = true;
  scanStatus.textContent = "Scanning the active tab…";
  try {
    const tab = await activeTab();
    if (!tab?.id || !isWinnerRouletteUrl(tab.url || "")) {
      scanStatus.textContent = "This tab is not recognized as Winner Auto Roulette. Open the recently-played Auto Roulette page, then click Scan page now. Current tab: " + (tab?.url || "URL unavailable");
      return;
    }
    const frames = await chrome.webNavigation.getAllFrames({tabId:tab.id});
    const allFrames = frames || [];
    const gameFrames = allFrames.filter(frame => {
      try {
        const host = new URL(frame.url).hostname;
        return host === "groovegaming.com" || host.endsWith(".groovegaming.com");
      } catch {
        return false;
      }
    });
    // Try the detected game frames first. If the provider changes its frame
    // hostname, probe the remaining frames too; only the injected game script
    // will respond to the scan message.
    const framesToTry = [...gameFrames, ...allFrames.filter(frame =>
      !gameFrames.some(gameFrame => gameFrame.frameId === frame.frameId)
    )];
    if (!framesToTry.length) {
      scanStatus.textContent = "Winner page detected, but it has no frames yet. Wait for the game to load, then scan again.";
      return;
    }
    let response = null;
    let lastError = null;
    for (const frame of framesToTry) {
      try {
        const result = await chrome.tabs.sendMessage(
          tab.id,
          {type:"ROULETTE_SCAN_NOW"},
          {frameId:frame.frameId}
        );
        if (result?.ok) {
          response = result;
          break;
        }
        if (result) response = result;
      } catch (error) {
        lastError = error;
      }
    }
    scanStatus.textContent = response?.message ||
      (lastError
        ? "Could not contact the game frame. Reload the Winner page after updating the extension."
        : "No readable roulette results were found inside the game frame.");
    await load();
  } catch (error) {
    scanStatus.textContent = "Could not scan this page. Reload the webpage after updating the extension, then try again.";
  } finally {
    scanButton.disabled = false;
  }
});
autoToggle.addEventListener("change", async () => {
  await chrome.storage.local.set({rouletteAuto:autoToggle.checked});
  scanStatus.textContent = autoToggle.checked
    ? "Automatic monitoring enabled for the supported Winner page. Keep that page open."
    : "Automatic monitoring disabled.";
});
addButton.addEventListener("click", async () => {
  const raw = key(resultInput.value);
  if (!valid(raw)) {
    message.textContent = wheel.value === "american" ? "Enter 0–36 or 00." : "Enter a number from 0 to 36.";
    return;
  }
  results.push(raw);
  if (results.length > 500) results = results.slice(-500);
  resultInput.value = "";
  message.textContent = "Result recorded locally.";
  await save();
  render();
});
resultInput.addEventListener("keydown", (event) => { if (event.key === "Enter") addButton.click(); });
clearButton.addEventListener("click", async () => {
  if (!results.length) { message.textContent = "History is already empty."; return; }
  results = [];
  await save();
  message.textContent = "Local history cleared.";
  render();
});
wheel.addEventListener("change", async () => {
  results = results.filter(valid);
  await save();
  render();
  message.textContent = "Wheel type updated. Results outside this wheel's format were removed.";
});
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;
  if (changes.rouletteResults) {
    results = Array.isArray(changes.rouletteResults.newValue) ? changes.rouletteResults.newValue : [];
    render();
  }
  if (changes.rouletteScanStatus) scanStatus.textContent = changes.rouletteScanStatus.newValue || "";
});
load().catch(() => { message.textContent = "Could not load local history."; render(); });