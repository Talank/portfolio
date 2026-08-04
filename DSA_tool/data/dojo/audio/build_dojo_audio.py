#!/usr/bin/env python3
"""Pre-render every line the Grand Line Dojo speaks, with the episode cast.

The Dojo used to put its dialogue on screen as text and advance it with a
button, which asks the one thing this course is built around not asking: that
you sit and read. Spoken, the same scene plays like a cut-scene — you watch the
crew argue their way to the pattern instead of reading them argue.

Casting is not redefined here. data/episodes/audio/generate_audio.py already
decides who sounds like what, and it is imported rather than copied so a change
to Zoro's pitch reaches the episodes and the Dojo together. Two additions, both
narrator roles the episodes have no use for:

    _narrator  Guy, lower and unhurried  — states the problem, reads the trap
    _announcer Guy, faster and louder    — "ROUND ONE… FIGHT!"

Same actor, two jobs. The brief is exposition and has to be followed; the
announcer is a ring announcer and has to land. One tuning cannot do both, and
using two different *voices* would imply two different characters.

Clips are content-addressed: the filename is a hash of the spoken text and the
voice settings, so a line that appears in two scenes is synthesized once, and
re-running after an edit re-renders only what actually changed. The manifest is
what maps a problem to its clips, so the names never need to be readable.

    node extract_dojo_lines.js     # scenes -> dojo-lines.json
    python3 build_dojo_audio.py    # dojo-lines.json -> *.opus + manifest.js
"""
import asyncio
import hashlib
import json
import os
import sys

import edge_tts

HERE = os.path.dirname(os.path.abspath(__file__))
TOOL = os.path.abspath(os.path.join(HERE, *[".."] * 3))      # DSA_tool
REPO = os.path.abspath(os.path.join(TOOL, ".."))
LINES = os.path.join(HERE, "dojo-lines.json")

# The episode build owns the cast; this one borrows it.
sys.path.insert(0, os.path.join(TOOL, "data", "episodes", "audio"))
import generate_audio as EP  # noqa: E402

CONCURRENCY = 4
MAX_RETRIES = 4

VOICES = dict(EP.VOICES)
VOICES["_narrator"] = ("en-US-GuyNeural", "+0%", "-8Hz", "+0%")
VOICES["_announcer"] = ("en-US-GuyNeural", "+8%", "-4Hz", "+12%")


def voice_for(speaker, text=""):
    """Cast a line. Crew keep the episodes' per-line emotion tuning."""
    if speaker in ("_narrator", "_announcer"):
        return VOICES[speaker]
    return EP.voice_for(speaker, text)


def clip_name(spoken, params):
    key = "|".join((spoken,) + tuple(params))
    return hashlib.sha1(key.encode("utf-8")).hexdigest()[:16]


async def synth(sem, spoken, params, name, label, done):
    """One clip, or nothing at all if it is already on disk.

    Checked against the .opus rather than the .mp3 because the mp3 is deleted
    once the opus exists — looking for the mp3 would re-synthesize everything
    on the second run.
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

    # Flatten to one job per DISTINCT clip, remembering everywhere it is used.
    jobs, uses = {}, []
    def add(where, speaker, line, role):
        spoken = EP.to_speakable(line)
        params = voice_for(speaker, line)
        name = clip_name(spoken, params)
        jobs.setdefault(name, (spoken, params, f"{where}/{speaker}"))
        uses.append((where, name, speaker, role))

    for num, p in data["problems"].items():
        for c in p["clips"]:
            add(num, c["speaker"], c["line"], c["role"])
    for key, line in data["announcer"].items():
        add("@" + key, "_announcer", line, "announcer")

    done = {"new": 0, "kept": 0, "total": len(jobs), "failed": []}
    print(f"{len(uses)} lines, {len(jobs)} distinct clips "
          f"({len(uses) - len(jobs)} shared)")

    sem = asyncio.Semaphore(CONCURRENCY)
    results = await asyncio.gather(*[
        synth(sem, spoken, params, name, label, done)
        for name, (spoken, params, label) in jobs.items()])
    durs = {n: d for n, d in results if d}

    if done["failed"]:
        sys.exit(f"\n{len(done['failed'])} clip(s) failed; re-run to retry "
                 f"(finished clips are kept).")

    # mp3 -> opus, and the mp3 fallback shrunk, exactly as everywhere else.
    sys.path.insert(0, os.path.join(REPO, "shared"))
    import shrink_audio
    shrink_audio.process_dir(HERE, opus_bitrate=24)

    manifest = {"problems": {}, "announcer": {}}
    for where, name, speaker, role in uses:
        entry = {"f": name, "s": speaker, "r": role}
        if name in durs:
            entry["d"] = durs[name]
        if where.startswith("@"):
            manifest["announcer"][where[1:]] = entry
        else:
            manifest["problems"].setdefault(where, []).append(entry)

    with open(os.path.join(HERE, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, separators=(",", ":"))
    with open(os.path.join(HERE, "manifest.js"), "w", encoding="utf-8") as f:
        f.write("/* GENERATED by build_dojo_audio.py — do not edit by hand.\n"
                "   Maps each LeetCode number to its pre-rendered, cast-voiced\n"
                "   Dojo clips, plus the fixed announcer bank. */\n"
                "window.DOJO_AUDIO = ")
        json.dump(manifest, f, ensure_ascii=False, separators=(",", ":"))
        f.write(";\n")

    size = sum(os.path.getsize(os.path.join(HERE, n))
               for n in os.listdir(HERE) if n.endswith((".opus", ".mp3")))
    print(f"\n{done['new']} new, {done['kept']} already on disk. "
          f"{size / 1e6:.1f} MB total.")


if __name__ == "__main__":
    asyncio.run(main())
