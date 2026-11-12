# Video user study (test set, 2026-11-12)

`videos/<scene>/` holds, per scene:
- `A.mp4`: the real input timelapse (fixed camera), 49 frames at 6 fps (8.2 s)
- `ours.mp4`, `chronogs.mp4`, `4dgs.mp4`, `swift4d.mp4`: Stage-2 "sweep time" renders: the camera moves L45 -> R45 while time
  runs 0 -> 48; 196 frames at 24 fps (8.2 s), 672x384

All videos: H.264, yuv420p, CRF 18, faststart, no audio. Same resolution, duration and encoding for every method.
Scenes: house_build, framing_house, huntington_apartments, metricon_home (the 4 scenes with all Stage-2 baselines).
Sources: ours = final recipe (dev_realcolt2f, 21k); ChronoGS (21k), 4DGS (iteration 18000), Swift4D (iteration 16000) as in the
Stage-2 eval table (eval/stage2_v3/tables/table_final4_20261111.md).
