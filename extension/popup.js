const $ = (id) => document.getElementById(id);
const wheel = $("wheel");
const resultInput = $("result");
const addButton = $("add");
const clearButton = $("clear");
const message = $("message");
let results = [];

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
function category(raw) { return classify(raw); }
function percent(count, total) { return total ? (count / total * 100).toFixed(1) + "%" : "0%"; }

function render() {
  const counts = {even:0, odd:0, zero:0};
  results.forEach((r) => { const c = category(r); if (c) counts[c]++; });
  const total = results.length;
  $("evenCount").textContent = counts.even;
  $("oddCount").textContent = counts.odd;
  $("zeroCount").textContent = counts.zero;
  $("evenPct").textContent = percent(counts.even,total);
  $("oddPct").textContent = percent(counts.odd,total);
  $("zeroPct").textContent = percent(counts.zero,total);
  $("history").textContent = total ? results.slice(-20).reverse().join(" · ") : "No results recorded yet.";
  const pockets = wheel.value === "european" ? 37 : 38;
  $("baseline").textContent = wheel.value === "european"
    ? "European wheel baseline: 18/37 (48.65%) even, 18/37 (48.65%) odd, and 1/37 (2.70%) zero."
    : "American wheel baseline: 18/38 (47.37%) even, 18/38 (47.37%) odd, and 2/38 (5.26%) zero pockets (0 and 00).";
  $("streak").textContent = streakText();
}
function streakText() {
  if (!results.length) return "Current streak: none yet.";
  const last = category(results[results.length - 1]);
  let count = 0;
  for (let i=results.length-1;i>=0;i--) {
    if (category(results[i]) !== last) break;
    count++;
  }
  const name = last === "zero" ? "zero" : last;
  return "Latest recorded streak: " + count + " " + name + (count === 1 ? " result" : " results") + ". This is descriptive only, not a signal.";
}
async function load() {
  if (globalThis.chrome?.storage?.local) {
    const saved = await chrome.storage.local.get(["rouletteResults","rouletteWheel"]);
    results = Array.isArray(saved.rouletteResults) ? saved.rouletteResults : [];
    if (saved.rouletteWheel === "american") wheel.value = "american";
  }
  render();
}
async function save() {
  if (globalThis.chrome?.storage?.local) {
    await chrome.storage.local.set({rouletteResults:results,rouletteWheel:wheel.value});
  }
}
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
load().catch(() => { message.textContent = "Could not load local history."; render(); });