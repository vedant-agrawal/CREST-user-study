// Google Apps Script: receives one JSON row per trial and appends it to a sheet.
// Setup: create a Google Sheet -> Extensions -> Apps Script -> paste this ->
// Deploy -> New deployment -> Web app -> Execute as: Me, Who has access: Anyone ->
// copy the web app URL into CONFIG.ENDPOINT in index.html.

const COLUMNS = [
  "received_at", "pid", "session", "trial_index", "trial_id", "scene", "kind",
  "left_method", "right_method",
  "q_artifacts", "q_stability", "q_geometry", "q_faithful",
  "check_passed", "rt_ms", "plays", "user_agent",
];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("responses") || ss.insertSheet("responses");
    if (sheet.getLastRow() === 0) sheet.appendRow(COLUMNS);
    const row = JSON.parse(e.postData.contents);
    row.received_at = new Date().toISOString();
    sheet.appendRow(COLUMNS.map(c => (row[c] === undefined ? "" : row[c])));
    return ContentService.createTextOutput("ok");
  } finally {
    lock.releaseLock();
  }
}
