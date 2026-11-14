// Google Apps Script: receives one JSON row per trial and appends it to the "responses" sheet.
// Setup: Google Sheet -> Extensions -> Apps Script -> paste this -> Deploy -> New deployment -> Web app ->
// Execute as: Me, Who has access: Anyone -> copy the web app URL into CONFIG.ENDPOINT in index.html.
// After editing: Deploy -> Manage deployments -> Edit -> Version: New version -> Deploy (keeps the same URL).
//
// Robust to changes in the page: the header is read from the sheet, and any key the page sends that has no column yet
// gets a new column at the end, so no answer is ever dropped. The full row is also kept as JSON in "raw".

const BASE = ["received_at", "pid", "session", "trial_index", "trial_id", "scene", "kind", "left_method", "right_method"];

// 2026-11-14: the page now saves rows with GET ?action=save&row=<json> (see doGet) and waits for {"ok": true}; POST is kept
// for old copies of the page. Both write through saveRow_.
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    saveRow_(e.postData.contents);
    return ContentService.createTextOutput("ok");
  } finally {
    lock.releaseLock();
  }
}

function saveRow_(raw) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("responses") || ss.insertSheet("responses");
    const row = JSON.parse(raw);
    row.received_at = new Date().toISOString();
    row.raw = raw;

    let header = sheet.getLastRow() === 0 ? [] : sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
    const keys = BASE.concat(Object.keys(row).filter(k => BASE.indexOf(k) < 0 && k !== "raw"), ["raw"]);
    const missing = keys.filter(k => header.indexOf(k) < 0);
    if (missing.length) {
      header = header.concat(missing);
      sheet.getRange(1, 1, 1, header.length).setValues([header]);
    }
    sheet.appendRow(header.map(c => (row[c] === undefined ? "" : row[c])));
}

// Balanced scene assignment (2026-11-13). The page calls GET ?action=assign&pid=P&n=5&scenes=a,b,...
// and gets {"scenes": [...]}: the n scenes with the lowest load (random tie-break), logged in the "assignments" sheet.
// Load of a scene = participants who already answered a main pair in it + participants assigned it in the last
// PENDING_MIN minutes who have not answered it yet and not finished. So people starting at the same time are spread out,
// and dropouts free their scenes after PENDING_MIN. A pid that was already assigned gets the same scenes back (reload).
const PENDING_MIN = 45;

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.action === "save") {   // one answer row; the page retries until it gets ok: true
    const lk = LockService.getScriptLock();
    lk.waitLock(20000);
    try { saveRow_(String(p.row || "")); return json_({ ok: true }); }
    catch (err) { return json_({ ok: false, error: String(err) }); }
    finally { lk.releaseLock(); }
  }
  if (p.action !== "assign") return json_({ ok: true });
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const scenes = String(p.scenes || "").split(",").filter(String);
    const n = Math.min(parseInt(p.n, 10) || 5, scenes.length);
    const pid = String(p.pid || "");

    const asg = ss.getSheetByName("assignments") || ss.insertSheet("assignments");
    if (asg.getLastRow() === 0) asg.appendRow(["assigned_at", "pid", "scenes"]);
    const aRows = asg.getLastRow() > 1 ? asg.getRange(2, 1, asg.getLastRow() - 1, 3).getValues() : [];
    for (const [, apid, asc] of aRows) {
      if (pid && String(apid) === pid) return json_({ scenes: String(asc).split(","), reused: true });
    }

    const answered = {}, finished = {};   // scene -> {pid: true} with a main row; pid -> has a "complete" row
    const resp = ss.getSheetByName("responses");
    if (resp && resp.getLastRow() > 1) {
      const vals = resp.getDataRange().getValues(), h = vals[0].map(String);
      const iP = h.indexOf("pid"), iS = h.indexOf("scene"), iK = h.indexOf("kind");
      for (let r = 1; r < vals.length; r++) {
        const rp = String(vals[r][iP]), k = String(vals[r][iK]), s = String(vals[r][iS]);
        if (k === "complete") finished[rp] = true;
        if (k === "main") (answered[s] = answered[s] || {})[rp] = true;
      }
    }
    const load = {};
    scenes.forEach(s => { load[s] = Object.keys(answered[s] || {}).length; });
    const cutoff = Date.now() - PENDING_MIN * 60000;
    for (const [at, apid, asc] of aRows) {
      const ap = String(apid);
      if (finished[ap] || new Date(at).getTime() < cutoff) continue;
      String(asc).split(",").forEach(s => { if (s in load && !(answered[s] || {})[ap]) load[s]++; });
    }

    const pick = scenes.map(s => [s, load[s], Math.random()])
      .sort((a, b) => a[1] - b[1] || a[2] - b[2]).slice(0, n).map(x => x[0]);
    asg.appendRow([new Date().toISOString(), pid, pick.join(",")]);
    return json_({ scenes: pick, load: load });
  } finally {
    lock.releaseLock();
  }
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
