#!/usr/bin/env python3
"""Pre-render every line Moominvalley speaks.

The course is built for somebody who watches closely and will not read. A game
made of text boxes is a book with a joystick, so the valley is spoken: you walk
up to somebody, they talk, and the questions are asked out loud.

Casting notes:

  narrator  is en-US-GuyNeural at +0% / -8Hz — the same actor and the same
            tuning as the Grand Line Dojo's narrator, deliberately. That voice
            already means "this is the course talking" everywhere else in the
            portfolio, and one narrator across two games is a thing you notice
            without being told.

  everyone else is a Moomin. They are cast for temperament rather than for
  accuracy to any cartoon: Snufkin low and unhurried, Little My fast and high,
  the Groke slowed and dropped almost to the floor and pulled quiet, because
  she is the one part of the valley that is supposed to be uncomfortable.

Clips are content-addressed — the filename is a hash of the spoken text and the
voice settings — so a line that appears in two places is synthesized once, and
re-running after an edit re-renders only what changed. That is what makes the
reaction bank affordable in twelve different voices.

    node extract_lines.js               # world.js  -> adventure-lines.json
    python3 build_adventure_audio.py    #           -> *.opus + manifest.js
    node check_adventure_audio.js       # prove the audio still matches the text
"""
import asyncio
import hashlib
import json
import os
import sys

import edge_tts

HERE = os.path.dirname(os.path.abspath(__file__))
COURSE = os.path.abspath(os.path.join(HERE, *[".."] * 3))       # AI_course
REPO = os.path.abspath(os.path.join(COURSE, ".."))
LINES = os.path.join(HERE, "adventure-lines.json")

# The episode build owns spoken-text normalization for the whole portfolio.
sys.path.insert(0, os.path.join(REPO, "DSA_tool", "data", "episodes", "audio"))
import generate_audio as EP  # noqa: E402

CONCURRENCY = 4
MAX_RETRIES = 4
OPUS_BITRATE = 16          # speech only, and the whole valley has to stay small

VOICES = {
    "narrator":    ("en-US-GuyNeural",         "+0%",  "-8Hz",  "+0%"),
    "moomintroll": ("en-GB-RyanNeural",        "+6%",  "+16Hz", "+0%"),
    "moominmamma": ("en-GB-LibbyNeural",       "-6%",  "-6Hz",  "+0%"),
    "moominpappa": ("en-GB-ThomasNeural",      "-4%",  "-14Hz", "+0%"),
    "snufkin":     ("en-US-ChristopherNeural", "-8%",  "-10Hz", "+0%"),
    "littlemy":    ("en-GB-MaisieNeural",      "+16%", "+14Hz", "+0%"),
    "sniff":       ("en-US-AnaNeural",         "+8%",  "+6Hz",  "+0%"),
    "snorkmaiden": ("en-US-JennyNeural",       "+4%",  "+10Hz", "+0%"),
    "snork":       ("en-US-EricNeural",        "+0%",  "-4Hz",  "+0%"),
    "hemulen":     ("en-IE-ConnorNeural",      "-6%",  "-8Hz",  "+0%"),
    "tooticky":    ("en-GB-SoniaNeural",       "-8%",  "-4Hz",  "+0%"),
    "groke":       ("en-US-AriaNeural",        "-20%", "-24Hz", "-8%"),
    "fillyjonk":   ("en-US-MichelleNeural",    "+10%", "+14Hz", "+0%"),
    "stinky":      ("en-CA-LiamNeural",        "+12%", "+10Hz", "+0%"),
}


def clip_name(spoken, params):
    key = "|".join((spoken,) + tuple(params))
    return hashlib.sha1(key.encode("utf-8")).hexdigest()[:16]


async def synth(sem, spoken, params, name, label, done):
    """One clip, or nothing at all if it is already on disk.

    Checked against the .opus, not the .mp3: the mp3 is deleted once the opus
    exists, so looking for the mp3 would re-synthesize the world every run.
    """
    opus = os.path.join(HERE, name + ".opus")
    mp3 = os.path.join(HERE, name + ".mp3")
    if os.path.exists(opus) or os.path.exists(mp3):
        done["kept"] += 1
        return name, None

    voice, rate, pitch, volume = params
    async with sem:
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                comm = edge_tts.Communicate(spoken, voice, rate=rate,
                                            pitch=pitch, volume=volume)
                audio = bytearray()
                last_end = 0.0
                async for chunk in comm.stream():
                    if chunk["type"] == "audio":
                        audio.extend(chunk["data"])
                    elif chunk["type"] in ("SentenceBoundary", "WordBoundary"):
                        last_end = (chunk["offset"] + chunk.get("duration", 0)) / 1e7
                if not audio:
                    raise RuntimeError("no audio bytes")
                with open(mp3, "wb") as f:
                    f.write(audio)
                done["new"] += 1
                n = done["new"] + done["kept"]
                sys.stdout.write(f"  ✓ {n:5d}/{done['total']}  {label}  "
                                 f"{len(audio) // 1024}KB\n")
                sys.stdout.flush()
                return name, round(last_end, 3)
            except Exception as e:                                  # noqa: BLE001
                if attempt == MAX_RETRIES:
                    done["failed"].append(label)
                    sys.stdout.write(f"  ✗ {label} FAILED: {e}\n")
                    sys.stdout.flush()
                    return name, None
                await asyncio.sleep(1.5 * attempt)


async def main():
    with open(LINES, encoding="utf-8") as f:
        data = json.load(f)

    jobs = {}          # clip name -> (spoken text, voice params, label)
    plan = {"intro": {}, "scene": {}, "react": {}}

    def add(speaker, line, label):
        if speaker not in VOICES:
            sys.exit(f"no voice cast for {speaker!r} (line: {line[:40]}…)")
        spoken = EP.to_speakable(line)
        params = VOICES[speaker]
        name = clip_name(spoken, params)
        jobs.setdefault(name, (spoken, params, label))
        return name

    for region, lines in data["intro"].items():
        plan["intro"][region] = [add(l["speaker"], l["line"], f"intro/{region}")
                                 for l in lines]

    for sid, s in data["scene"].items():
        who = s["speaker"]
        plan["scene"][sid] = {
            "s": who,
            "hook": add(who, s["hook"], f"{sid}/hook"),
            "teach": [add(who, t, f"{sid}/teach") for t in s["teach"]],
            "done": add(who, s["done"], f"{sid}/done"),
            "q": [{"q": add(who, q["q"], f"{sid}/q"),
                   "e": add(who, q["e"], f"{sid}/why")} for q in s["q"]],
        }

    for who, bank in data["react"].items():
        plan["react"][who] = {
            "right": [add(who, l, f"react/{who}") for l in bank["right"]],
            "wrong": [add(who, l, f"react/{who}") for l in bank["wrong"]],
        }

    done = {"new": 0, "kept": 0, "total": len(jobs), "failed": []}
    print(f"{len(jobs)} distinct clips to have on disk")

    sem = asyncio.Semaphore(CONCURRENCY)
    results = await asyncio.gather(*[
        synth(sem, spoken, params, name, label, done)
        for name, (spoken, params, label) in jobs.items()])
    durs = {n: d for n, d in results if d}

    if done["failed"]:
        sys.exit(f"\n{len(done['failed'])} clip(s) failed; re-run to retry "
                 f"(finished clips are kept).")

    sys.path.insert(0, os.path.join(REPO, "shared"))
    import shrink_audio
    shrink_audio.process_dir(HERE, opus_bitrate=OPUS_BITRATE)

    # Durations are only known for clips synthesized in THIS run, so an
    # incremental build has to keep the ones it learned earlier.
    old = {}
    mpath = os.path.join(HERE, "manifest.json")
    if os.path.exists(mpath):
        with open(mpath, encoding="utf-8") as f:
            old = json.load(f).get("d", {})
    old.update({k: v for k, v in durs.items()})

    used = set()

    def mark(name):
        used.add(name)
        return name

    for region in plan["intro"]:
        [mark(n) for n in plan["intro"][region]]
    for sid in plan["scene"]:
        s = plan["scene"][sid]
        mark(s["hook"]); mark(s["done"])
        [mark(n) for n in s["teach"]]
        for q in s["q"]:
            mark(q["q"]); mark(q["e"])
    for who in plan["react"]:
        [mark(n) for n in plan["react"][who]["right"]]
        [mark(n) for n in plan["react"][who]["wrong"]]

    manifest = dict(plan)
    manifest["d"] = {k: v for k, v in old.items() if k in used}

    with open(mpath, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, separators=(",", ":"))
    with open(os.path.join(HERE, "manifest.js"), "w", encoding="utf-8") as f:
        f.write("/* GENERATED by build_adventure_audio.py — do not edit by hand.\n"
                "   Maps every spoken moment in Moominvalley to its clip. */\n"
                "window.MOOMIN_AUDIO = ")
        json.dump(manifest, f, ensure_ascii=False, separators=(",", ":"))
        f.write(";\n")

    files = [n for n in os.listdir(HERE) if n.endswith((".opus", ".mp3"))]
    size = sum(os.path.getsize(os.path.join(HERE, n)) for n in files)
    orphan = [n for n in files if os.path.splitext(n)[0] not in used]
    print(f"\n{done['new']} new, {done['kept']} already on disk. "
          f"{len(files)} files, {size / 1e6:.1f} MB.")
    if orphan:
        print(f"{len(orphan)} clip(s) no longer spoken by anything — safe to "
              f"delete: {orphan[0]} …")


if __name__ == "__main__":
    asyncio.run(main())
