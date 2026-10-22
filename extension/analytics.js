(() => {
  const $ = id => document.getElementById(id);
  if (!$("history")) return;
  const section = document.createElement("section");
  section.className = "analytics";
  section.innerHTML = '<h2>Pattern Lab · European roulette</h2><p class="note">Experimental only. No pattern is known to predict independent spins.</p><label for="labStrategy">Test signal</label><select id="labStrategy"><option value="frequency">Frequency · last 100</option><option value="invert">Invert after run of 2+</option><option value="alternate">Continue alternating pattern</option></select><div id="labSignal" class="lab-signal">NO SIGNAL</div><p id="labSignalDetail" class="note"></p><h2>Window comparison</h2><div id="labWindows" class="windows"></div><h2>Walk-forward strategy comparison</h2><div id="labCompare" class="comparisons"></div><h2>Even-money payout baseline</h2><p class="note">European wheel: 18 winning numbers, 18 losing numbers plus zero. Expected return is −2.70% of stake per even-money bet before any promotions or special rules.</p>';
  const stats = document.querySelector(".stats");
  (stats?.parentNode || document.querySelector("main")).insertBefore(section, stats?.nextSibling || null);
  const style = document.createElement("style");
  style.textContent = '.analytics{padding:8px 9px;margin:7px 0;border:1px solid #273750;border-radius:9px;background:#101a2b}.analytics h2{font-size:11px;margin:8px 0 6px}.analytics h2:first-child{margin-top:0}.analytics label{display:block;font-size:10px;color:#b9d8cc;margin-bottom:3px}.analytics select{width:100%;padding:7px;background:#111d30;color:#e8eefb;border:1px solid #33445e;border-radius:7px;font:inherit}.lab-signal{font-size:20px;font-weight:800;color:#a7f3d0;margin:7px 0 2px}.windows{display:grid;grid-template-columns:repeat(2,1fr);gap:5px}.window-card{display:grid;gap:2px;background:#121d30;border:1px solid #273750;border-radius:7px;padding:6px}.window-card strong,.window-card b{font-size:10px}.window-card span,.window-card small{font-size:9px;color:#9fb0c9}.window-card b{color:#a7f3d0}.comparisons{display:grid;gap:5px}.compare-row{display:grid;grid-template-columns:1fr auto;gap:2px 5px;padding:6px;background:#121d30;border-radius:7px}.compare-row span,.compare-row strong{font-size:9px}.compare-row strong{text-align:right}.compare-row small{grid-column:1/-1;font-size:9px;color:#9fb0c9}.analytics .note{font-size:9px;line-height:1.45;color:#9fb0c9;margin:5px 0}';
  document.head.appendChild(style);
  const classify = raw => {
    const s = String(raw).trim().toUpperCase();
    if (s === "00") return "zero";
    if (!/^\d{1,2}$/.test(s)) return null;
    const n = Number(s);
    return n < 0 || n > 36 ? null : n === 0 ? "zero" : n % 2 === 0 ? "even" : "odd";
  };
  function predict(strategy, history) {
    const sample = history.slice(-100), sides = sample.map(classify).filter(x => x === "even" || x === "odd");
    if (strategy === "frequency") {
      const e = sides.filter(x => x === "even").length, o = sides.length - e;
      return e === o ? null : e > o ? "even" : "odd";
    }
    if (sides.length < 2) return null;
    const last = sides[sides.length - 1];
    if (strategy === "invert") {
      let run = 1;
      for (let i = sides.length - 2; i >= 0 && sides[i] === last; i--) run++;
      return run >= 2 ? (last === "even" ? "odd" : "even") : null;
    }
    const previous = sides[sides.length - 2];
    return previous !== last ? (last === "even" ? "odd" : "even") : null;
  }
  function backtest(strategy, history) {
    let correct = 0, total = 0, skipped = 0, zeros = 0;
    for (let i = 1; i < history.length; i++) {
      const signal = predict(strategy, history.slice(Math.max(0, i - 100), i));
      if (!signal) { skipped++; continue; }
      const outcome = classify(history[i]);
      if (outcome === "zero") { zeros++; continue; }
      if (outcome !== "even" && outcome !== "odd") continue;
      total++; if (signal === outcome) correct++;
    }
    return {correct,total,skipped,zeros,pct:total ? 100 * correct / total : null};
  }
  function render(history) {
    const strategy = $("labStrategy").value;
    const signal = predict(strategy, history);
    $("labSignal").textContent = signal ? signal.toUpperCase() : "NO SIGNAL";
    $("labSignalDetail").textContent = signal
      ? "Rule: " + ({frequency:"highest even/odd frequency in last 100",invert:"opposite side after a same-side run of at least 2",alternate:"continue an observed even/odd alternation"}[strategy]) + ". Not a probability estimate."
      : "The selected rule did not produce a signal from the current history.";
    const windows = $("labWindows"); windows.replaceChildren();
    [10,20,36,100].forEach(size => {
      const sample = history.slice(-size), e = sample.filter(x => classify(x) === "even").length;
      const o = sample.filter(x => classify(x) === "odd").length;
      const z = sample.filter(x => classify(x) === "zero").length;
      const el = document.createElement("div"); el.className = "window-card";
      el.innerHTML = '<strong>Last ' + size + '</strong><span>' + sample.length + ' spins</span><small>E ' + e + ' · O ' + o + ' · 0 ' + z + '</small><b>' + (e === o ? 'NO SIGNAL' : e > o ? 'EVEN' : 'ODD') + '</b>';
      windows.appendChild(el);
    });
    const compare = $("labCompare"); compare.replaceChildren();
    [["frequency","Frequency"],["invert","Invert run"],["alternate","Alternating pattern"]].forEach(([id,label]) => {
      const b = backtest(id,history), el = document.createElement("div"); el.className = "compare-row";
      const rate = b.pct === null ? "Not enough signals" : b.correct + "/" + b.total + " · " + b.pct.toFixed(1) + "%";
      el.innerHTML = '<span>' + label + '</span><strong>' + rate + '</strong><small>Walk-forward only · no signal ' + b.skipped + ' · zero outcomes ' + b.zeros + '</small>';
      compare.appendChild(el);
    });
  }
  $("labStrategy").addEventListener("change", () => chrome.storage.local.get(["rouletteResults"]).then(s => render(Array.isArray(s.rouletteResults) ? s.rouletteResults : [])));
  chrome.storage.local.get(["rouletteResults"]).then(s => render(Array.isArray(s.rouletteResults) ? s.rouletteResults : []));
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.rouletteResults) render(Array.isArray(changes.rouletteResults.newValue) ? changes.rouletteResults.newValue : []);
  });
})();