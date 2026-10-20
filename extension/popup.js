const $ = (id) => document.getElementById(id);
const wheel = $("wheel"), resultInput = $("result"), message = $("message");
const scanButton = $("scan"), autoToggle = $("auto"), scanStatus = $("scanStatus");
const logButton = $("logSignal");
let results = [], experiment = [], pendingSignal = null;

function classify(raw) {
  const value = String(raw).trim().toUpperCase();
  if (value === "00") return wheel.value === "american" ? "zero" : null;
  if (!/^\d{1,2}$/.test(value)) return null;
  const n = Number(value);
  if (n < 0 || n > 36) return null;
  return n === 0 ? "zero" : n % 2 === 0 ? "even" : "odd";
}
function valid(raw) {
  const value = String(raw).trim().toUpperCase();
  return value === "00" ? wheel.value === "american" :
    /^\d{1,2}$/.test(value) && Number(value) >= 0 && Number(value) <= 36;
}
function key(raw) { return String(raw).trim().toUpperCase(); }
function percent(count, total) { return total ? (count / total * 100).toFixed(1) + "%" : "0%"; }
function windowData() {
  const sample = results.slice(-100);
  const counts = {even:0, odd:0, zero:0};
  sample.forEach(value => { const side = classify(value); if (side) counts[side]++; });
  return {sample, counts};
}
function recommendationFrom(sample) {
  const counts = {even:0, odd:0, zero:0};
  sample.forEach(value => { const side = classify(value); if (side) counts[side]++; });
  if (!sample.length || counts.even === counts.odd) return {side:null, counts, sample};
  return {side:counts.even > counts.odd ? "even" : "odd", counts, sample};
}
function recommendation() {
  // slice(-100) uses all available history when fewer than 100 results exist.
  return recommendationFrom(results.slice(-100));
}
function historicalBacktest() {
  let correct = 0, evaluated = 0, skippedTies = 0, skippedZero = 0;
  // Walk forward: each result is predicted only from results that came before it.
  for (let i = 1; i < results.length; i++) {
    const prior = results.slice(Math.max(0, i - 100), i);
    const rec = recommendationFrom(prior);
    if (!rec.side) { skippedTies++; continue; }
    const outcome = classify(results[i]);
    if (outcome === "zero") { skippedZero++; continue; }
    if (outcome !== "even" && outcome !== "odd") continue;
    evaluated++;
    if (rec.side === outcome) correct++;
  }
  return {correct, evaluated, skippedTies, skippedZero, pct: evaluated ? (correct / evaluated * 100).toFixed(1) : null};
}
function render() {
  const {sample, counts} = windowData();
  $("evenCount").textContent = counts.even;
  $("oddCount").textContent = counts.odd;
  $("zeroCount").textContent = counts.zero;
  const total = sample.length;
  $("evenPct").textContent = percent(counts.even,total);
  $("oddPct").textContent = percent(counts.odd,total);
  $("zeroPct").textContent = percent(counts.zero,total);
  $("windowCount").textContent = total + " / 100 spins";
  $("history").textContent = results.length ? results.slice(-20).reverse().join(" · ") : "No results recorded yet.";
  const rec = recommendation();
  $("recommendSide").textContent = rec.side ? rec.side.toUpperCase() : "NO SIGNAL";
  $("recommendDetail").textContent = rec.side
    ? "Frequency-based signal · " + total + " results: even " + counts.even + " · odd " + counts.odd + " · zero " + counts.zero + "."
    : total
      ? "NO SIGNAL: even and odd counts are tied in the latest " + total + " results."
      : "Record results to calculate a frequency-based signal.";
  logButton.disabled = !rec.side;
  const completed = experiment.filter(x => x.outcome === "even" || x.outcome === "odd");
  const hits = completed.filter(x => x.prediction === x.outcome).length;
  $("accuracy").textContent = completed.length ? hits + "/" + completed.length + " (" + (hits/completed.length*100).toFixed(1) + "%)" : "No trials yet";
  const backtest = historicalBacktest();
  $("backtestAccuracy").textContent = backtest.pct === null
    ? "Not enough eligible predictions"
    : backtest.correct + "/" + backtest.evaluated + " (" + backtest.pct + "%)";
  $("backtestDetail").textContent = "Walk-forward historical test · ties skipped: " + backtest.skippedTies + " · zero outcomes skipped: " + backtest.skippedZero + ". This is historical, not future performance.";
  $("experimentStatus").textContent = pendingSignal
    ? "Signal logged. Waiting for the next recorded spin."
    : completed.length ? completed.length + " resolved pre-spin trial" + (completed.length === 1 ? "" : "s") + "."
    : "No signal logged yet.";
  if (pendingSignal) logButton.disabled = true;
}
function resolvePending(newResult) {
  if (!pendingSignal) return;
  const outcome = classify(newResult);
  pendingSignal.outcome = outcome;
  pendingSignal.result = key(newResult);
  pendingSignal.resolvedAt = new Date().toISOString();
  experiment.push(pendingSignal);
  experiment = experiment.slice(-500);
  pendingSignal = null;
  chrome.storage.local.set({rouletteExperiment:experiment,roulettePendingSignal:null});
}
async function load(detectActivePage = false) {
  const saved = await chrome.storage.local.get(["rouletteResults","rouletteWheel","rouletteAuto","rouletteScanStatus","rouletteExperiment","roulettePendingSignal"]);
  results = Array.isArray(saved.rouletteResults) ? saved.rouletteResults : [];
  if (saved.rouletteWheel === "american") wheel.value = "american";
  autoToggle.checked = saved.rouletteAuto === true;
  experiment = Array.isArray(saved.rouletteExperiment) ? saved.rouletteExperiment : [];
  pendingSignal = saved.roulettePendingSignal || null;
  scanStatus.textContent = saved.rouletteScanStatus || "Open the Winner Auto Roulette recently-played page to scan.";
  render();
  if (detectActivePage) {
    const tab = await activeTab().catch(() => null);
    if (tab && isWinnerRouletteUrl(tab.url || "")) scanStatus.textContent = "Winner Auto Roulette detected. Scan when results are visible.";
  }
}
async function save() { await chrome.storage.local.set({rouletteResults:results,rouletteWheel:wheel.value}); }
async function activeTab() { const tabs = await chrome.tabs.query({active:true,currentWindow:true}); return tabs[0]; }
function isWinnerRouletteUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);
    return url.protocol === "https:" && url.hostname === "winner.rw" &&
      /recently-played/i.test(url.pathname) && /(auto-?roulette|roulette)/i.test(url.pathname);
  } catch { return false; }
}
scanButton.addEventListener("click", async () => {
  scanButton.disabled = true; scanStatus.textContent = "Scanning…";
  try {
    const tab = await activeTab();
    if (!tab?.id || !isWinnerRouletteUrl(tab.url || "")) {
      scanStatus.textContent = "Open Winner Auto Roulette's recently-played page first."; return;
    }
    const frames = await chrome.webNavigation.getAllFrames({tabId:tab.id});
    const allFrames = frames || [];
    const gameFrames = allFrames.filter(frame => {
      try { const host = new URL(frame.url).hostname; return host === "client.pragmaticplaylive.net" || host === "groovegaming.com" || host.endsWith(".groovegaming.com"); }
      catch { return false; }
    });
    const framesToTry = [...gameFrames, ...allFrames.filter(f => !gameFrames.some(g => g.frameId === f.frameId))];
    let response = null, lastError = null;
    for (const frame of framesToTry) {
      try {
        const result = await chrome.tabs.sendMessage(tab.id,{type:"ROULETTE_SCAN_NOW"},{frameId:frame.frameId});
        if (result?.ok) { response = result; break; }
        if (result) response = result;
      } catch (error) { lastError = error; }
    }
    scanStatus.textContent = response?.message || (lastError ? "Could not contact game frame. Reload the Winner page after updating." : "No readable results found; wait for the result list and scan again.");
    await load();
  } catch { scanStatus.textContent = "Could not scan. Reload the webpage and try again."; }
  finally { scanButton.disabled = false; }
});
autoToggle.addEventListener("change", async () => {
  await chrome.storage.local.set({rouletteAuto:autoToggle.checked});
  scanStatus.textContent = autoToggle.checked ? "Auto-monitoring enabled. Keep the Winner page open." : "Auto-monitoring disabled.";
});
$("add").addEventListener("click", async () => {
  const raw = key(resultInput.value);
  if (!valid(raw)) { message.textContent = wheel.value === "american" ? "Enter 0–36 or 00." : "Enter a number from 0 to 36."; return; }
  const previousLength = results.length;
  results.push(raw); if (results.length > 500) results = results.slice(-500);
  if (pendingSignal && results.length > previousLength) resolvePending(raw);
  resultInput.value = ""; message.textContent = "Saved locally.";
  await save(); await chrome.storage.local.set({rouletteExperiment:experiment,roulettePendingSignal:pendingSignal}); render();
});
resultInput.addEventListener("keydown", event => { if (event.key === "Enter") $("add").click(); });
$("clear").addEventListener("click", async () => {
  if (!results.length) { message.textContent = "History is already empty."; return; }
  if (!confirm("Clear recorded roulette history? Experiment records will remain.")) return;
  results = []; await save(); message.textContent = "History cleared."; render();
});
wheel.addEventListener("change", async () => {
  results = results.filter(valid); await save(); render();
  message.textContent = "Wheel setting updated. Unsupported results were removed.";
});
logButton.addEventListener("click", async () => {
  const rec = recommendation();
  if (!rec.side || pendingSignal) return;
  pendingSignal = {prediction:rec.side, loggedAt:new Date().toISOString(), basedOn:rec.sample.slice(-100), windowSize:rec.sample.length};
  await chrome.storage.local.set({roulettePendingSignal:pendingSignal});
  message.textContent = rec.side.toUpperCase() + " signal logged before the next recorded result.";
  render();
});
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;
  if (changes.rouletteResults) {
    const oldResults = Array.isArray(changes.rouletteResults.oldValue) ? changes.rouletteResults.oldValue : [];
    const newResults = Array.isArray(changes.rouletteResults.newValue) ? changes.rouletteResults.newValue : [];
    results = newResults;
    if (pendingSignal && newResults.length > oldResults.length) {
      const nextResult = newResults[oldResults.length];
      if (nextResult !== undefined) resolvePending(nextResult);
    }
    render();
  }
  if (changes.rouletteScanStatus) scanStatus.textContent = changes.rouletteScanStatus.newValue || "";
  if (changes.rouletteExperiment || changes.roulettePendingSignal) {
    if (changes.rouletteExperiment) experiment = Array.isArray(changes.rouletteExperiment.newValue) ? changes.rouletteExperiment.newValue : [];
    if (changes.roulettePendingSignal) pendingSignal = changes.roulettePendingSignal.newValue || null;
    render();
  }
});
load(true).catch(() => { message.textContent = "Could not load local history."; render(); });