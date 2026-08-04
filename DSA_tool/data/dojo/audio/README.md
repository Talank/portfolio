# Dojo voices

Every line a Grand Line Dojo fight speaks, pre-rendered: the crew's dialogue in
the episode cast's voices, the problem brief and the trap in a narrator's, and a
fixed announcer bank for "ROUND ONE… FIGHT".

The Dojo used to put its dialogue on screen and advance it with a button. This
course is for someone who watches closely and will not read, so a wall of text
behind a NEXT button is exactly where they stop playing. Spoken, the same scene
plays like a cut-scene.

## Building

```
node extract_dojo_lines.js     # the scenes  -> dojo-lines.json
python3 build_dojo_audio.py    # dojo-lines.json -> *.opus + manifest.js
node check_dojo_audio.js       # prove the audio still matches the writing
```

`extract_dojo_lines.js` runs in node rather than Python because the scene behind
a fight is *resolved*, not stored — `dojo.html` looks for a Grand Line episode
carrying the problem's LeetCode number and falls back to `data/dojo-scenes.js`
only when there is no arc. A second copy of that rule in Python would be free to
drift, and the failure is silent: audio built for a scene nobody plays.

## Casting

Imported from `data/episodes/audio/generate_audio.py`, not copied, so a change
to Zoro's pitch reaches the episodes and the Dojo together. Two roles are added
here, both narrator jobs the episodes have no use for:

| role | voice | why |
|---|---|---|
| `_narrator` | Guy, `+0%` / `-8Hz` | states the problem, reads the trap — exposition, has to be followed |
| `_announcer` | Guy, `+8%` / `-4Hz` / `+12%` | the ring voice — has to land |

Same actor, two jobs. A sixty-word problem statement cannot be shouted and a
ring announcer cannot be measured, so one tuning cannot do both. Using two
different *voices* would imply two different characters.

## Clip names

Content-addressed: the filename is a hash of the spoken text and the voice
settings. A line that appears in two scenes is one file, and re-running after an
edit re-synthesizes only what actually changed. The manifest is what maps a
problem to its clips, so the names never need to be readable.

## After editing a scene

Re-run all three steps. Clips are paired to lines by **position** — clip 3 is
line 3 — so inserting a line puts every clip after it in the wrong speaker's
voice, and nothing throws. `check_dojo_audio.js` is what catches that; it also
reports orphan clips left behind by writing that has since changed.
