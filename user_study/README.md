# Video comparison user study (Stage 2, sweep_time videos)

Push this folder as the root of a GitHub repo and enable GitHub Pages (Settings -> Pages -> Deploy from branch -> main / root).

## Contents
- `index.html`: the study page. Edit `CONFIG` at the top: `COMPLETION_CODE` (from Prolific) and the consent text (IRB).
  `ENDPOINT` is already your Apps Script URL; `SCENES` = the 4 original scenes (12 pairs + 1 attention check).
- `collect.gs`: Google Apps Script that appends one row per answer to a sheet (already deployed if ENDPOINT works).
- `videos/<scene>/`: for all 8 scenes, `A.mp4` (real input time-lapse, 49 frames at 6 fps) and `ours.mp4`, `chronogs.mp4`,
  `4dgs.mp4`, `swift4d.mp4` (sweep_time: camera L45 -> R45 while time runs 0 -> 48, 196 frames at 24 fps). All are 8.17 s,
  672x384, H.264 (crf 18, yuv420p, faststart), no audio. Total ~125 MB; largest file ~6 MB.
- `.nojekyll`: serve files as-is.

## Changes vs the draft page
1. Practice pair = two baselines (lexington_pool, ChronoGS vs 4DGS): a pair we never analyse, in a scene not in SCENES.
2. Reference A re-timed to 6 fps (= 8.17 s, the sweep length), so it stays in sync instead of freezing.
3. Playback starts when all three videos can play, with a 4 s fallback (the draft could hang if the event fired early).
4. Attention check: one extra pair (snow_melt, 4DGS vs Swift4D) at a random position with an on-screen instruction to choose
   Video 2 for every question; its row has kind = "catch" and check_passed = true/false. Exclude participants who fail it.
5. Rows are sent with navigator.sendBeacon (survives closing the tab), falling back to fetch keepalive.
6. The intro states the real number of pairs.

## Prolific
Study URL: `https://<you>.github.io/<repo>/?PROLIFIC_PID={{%PROLIFIC_PID%}}&STUDY_ID={{%STUDY_ID%}}&SESSION_ID={{%SESSION_ID%}}`
Before launch: open the page yourself once, finish it, and check that rows (incl. the catch row) appear in the sheet.

## Analysis
Per question, ours' win rate vs each baseline = share of main rows whose q_<key> is "ours"; drop participants whose catch row
has check_passed = FALSE. Videos for the other 4 scenes are included: add them to SCENES to extend the study (24 pairs).
