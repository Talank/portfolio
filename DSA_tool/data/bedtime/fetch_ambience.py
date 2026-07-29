#!/usr/bin/env python3
"""Fetch, screen and loop-prepare real field recordings for the bedtime bed.

soundscape.py can synthesize its layers from filtered noise, which costs nothing
and needs no network. This script replaces that with actual recordings of the
actual things — surf, wind, leaves, streams — because no amount of filtered
noise has the irregularity of a real beach.

What it produces is deliberately tiny: one short, seamless, mono loop per layer
in ambience/, a few hundred KB each. They are build-time inputs only. What the
site serves is audio/chNN-<tier>.opus, and their size is set by the opus
encoder, not by where the bed came from.

The pipeline, per layer:
    search    Freesound, several queries, CC0 and CC-BY only (see LICENSES)
    download  the hq-ogg preview — the token-only API tier does not grant
              originals, and a preview is far more than enough for a bed
              sitting 12 dB below the voice
    screen    reject anything that is speech, music, or full of events
    cut       find the calmest window in the file and crossfade it into a loop
    write     ambience/<layer>.opus, plus SOURCES.md crediting every file used

Screening thresholds were calibrated against known failures: an earlier pass
over Wikimedia Commons ranked a 1939 Sejm speech as the calmest "water" and an
audiobook as the calmest "creek". Both are stationary at one-second resolution,
so a loudness test cannot see them; the syllabic-modulation test puts them at
0.42-0.43 where genuine ambience sits at 0.20-0.32.

Usage:
    python3 fetch_ambience.py            # fetch anything missing
    python3 fetch_ambience.py --force    # refetch everything
    python3 fetch_ambience.py --report   # just print the screen table
"""
import argparse
import json
import os
import re
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

import numpy as np

import imageio_ffmpeg

FF = imageio_ffmpeg.get_ffmpeg_exe()
HERE = os.path.dirname(os.path.abspath(__file__))
AMB = os.path.join(HERE, "ambience")
RAW = os.path.join(AMB, "raw")

SR = 24000              # match build_bedtime.SR
XFADE = 6.0             # loop seam crossfade
KEEP_PER_LAYER = 3      # blend this many recordings per layer

# A different, prime loop length per layer. Each layer loops for two and a half
# hours, so if they shared a period the whole bed would visibly cycle at it;
# with coprime lengths the composite only repeats at their LCM, which is some
# 21 million seconds. Total cost of all five loops is a couple of MB, and they
# are git-ignored build inputs that never reach the site.
LOOP_SECS = {"waves": 113.0, "foam": 83.0, "wind": 101.0,
             "leaves": 71.0, "water": 89.0}

# CC0 needs no attribution and CC-BY needs only a credit, which SOURCES.md
# gives. Deliberately excluded: -SA (viral, would relicense the whole mix),
# -NC (this is a portfolio, commercial use should stay open), -ND (a loop cut
# is a derivative). Sampling+ is ambiguous for redistribution; skipped too.
LICENSES = '"Creative Commons 0" OR "Attribution"'

# Several queries per layer: Freesound ANDs the terms, so one long phrase
# returns almost nothing. Short, varied queries and then screen hard.
QUERIES = {
    "waves": ["ocean waves calm", "sea waves gentle", "surf distant",
              "ocean ambience", "waves shore night"],
    "foam":  ["sea foam", "surf close", "waves beach sand", "water lapping shore"],
    "wind":  ["wind gentle", "wind soft ambience", "wind distant",
              "breeze ambience", "wind night"],
    "leaves": ["leaves rustling", "forest wind trees", "foliage wind",
               "trees rustling ambience"],
    "water": ["small stream", "creek gentle", "brook water", "water dripping cave",
              "river calm"],
}

# Calibrated against measured failures, not guessed. Known speech (a 1939 Sejm
# recording, an audiobook) sits at mod 0.42-0.43 where genuine ambience sits at
# 0.20-0.32, so 0.36 splits them. The tonal threshold is local prominence, not
# peak-over-median: real surf measures 22-24 dB by the latter simply because it
# has a broad bass hump, which is physics rather than music.
# What each layer is actually allowed to contain. Freesound's text search is
# loose — a query for "wind" happily returns a river and a beach — and the
# acoustic screens only ask "is this speech, music or restless?", never "is this
# the thing I asked for". Without this check the wind layer filled up with
# undertow and surf, which would have made the forest and cliff scenes sound
# like a beach. A recording qualifies only if its name or tags say so.
LAYER_KEYWORDS = {
    "waves":  ("wave", "ocean", "sea", "surf", "beach", "shore", "tide",
               "coast", "swell", "breaker"),
    "foam":   ("foam", "surf", "wave", "fizz", "pebble", "shore", "undertow",
               "swash", "shingle", "sizzle"),
    "wind":   ("wind", "breeze", "gale", "gust", "windy", "draught", "draft"),
    "leaves": ("leaf", "leaves", "foliage", "tree", "forest", "rustl", "wood",
               "branch", "bush", "canopy", "grass"),
    "water":  ("water", "stream", "creek", "brook", "river", "drip", "spring",
               "fountain", "burble", "trickle", "cave", "waterfall"),
}

# Words that disqualify a recording whatever layer it was found for. The
# screening below measures texture, and an animal or a machine can be perfectly
# steady and noise-like — the first pass accepted cicadas, crickets, birdsong
# and a grasshopper meadow into the wind and water layers on exactly those
# grounds. They are wrong for two reasons that no metric sees: a creature is a
# thing the ear identifies and then listens *to*, which is the opposite of a
# bed; and every scene borrowing that layer would carry crickets into a ship's
# hold. Named things are rejected before download, on title and tags.
EXCLUDE = (
    # living things
    "bird", "gull", "crow", "owl", "duck", "goose", "hen", "rooster",
    "cicada", "cricket", "grasshopper", "insect", "bee", "wasp", "fly",
    "frog", "toad", "dog", "cat", "cow", "sheep", "goat", "horse",
    "monkey", "people", "crowd", "child", "kids", "voice", "talk", "speech",
    "song", "sing", "footstep", "breath",
    # made things
    "traffic", "car", "truck", "engine", "motor", "plane", "aircraft",
    "helicopter", "train", "boat motor", "siren", "alarm", "bell", "chime",
    "gong", "drum", "guitar", "piano", "violin", "synth", "pad", "drone",
    "music", "melody", "chord", "ambient music", "loop pack", "construction",
    "machine", "pump", "fan ", "hum", "radio", "tv", "church", "clock",
    "city", "urban", "street", "market", "playground", "park",
    # weather that changes the scene rather than dressing it
    "rain", "thunder", "storm", "hail", "fire", "campfire",
)

MIN_DUR = 40.0          # shorter than this and there is no calm window to find
MAX_MOD = 0.36          # syllabic-band energy above this means speech
MIN_FLAT = 0.020        # below this the spectrum is harmonic -> music
MAX_EVENT = 0.120       # fraction of seconds far above median -> bangs, voices
MAX_SD = 5.0            # dB spread of the per-second loudness contour
MAX_TONAL = 9.0         # dB a narrow spectral peak stands above its neighbours

_last_call = [0.0]


def api(path, **params):
    """One throttled Freesound API call. 429s back off and retry."""
    key = read_key()
    params["token"] = key
    url = f"https://freesound.org/apiv2/{path}?" + urllib.parse.urlencode(params)
    for attempt in range(6):
        wait = 1.2 - (time.time() - _last_call[0])
        if wait > 0:
            time.sleep(wait)
        _last_call[0] = time.time()
        try:
            with urllib.request.urlopen(url, timeout=45) as r:
                return json.loads(r.read().decode())
        except urllib.error.HTTPError as e:
            if e.code in (429, 503):
                time.sleep(5 * (attempt + 1))
                continue
            raise
    raise RuntimeError(f"giving up on {path}")


def read_key():
    """The Freesound token, from .env at the repo root. Never hard-coded."""
    env = os.path.join(HERE, *[".."] * 3, ".env")
    if not os.path.exists(env):
        sys.exit("no .env at repo root; copy .env.example and add your key")
    m = re.search(r"^FREESOUND_API_KEY=(.*)$", open(env).read(), re.M)
    key = m.group(1).strip() if m else ""
    if not key:
        sys.exit("FREESOUND_API_KEY is empty in .env — get one at "
                 "https://freesound.org/apiv2/apply/")
    return key


# --------------------------------------------------------------------------
# search + download


def search(layer):
    """Candidate recordings for one layer, best-rated first, deduped by id."""
    seen, out = set(), []
    for q in QUERIES[layer]:
        try:
            d = api("search/text/", query=q,
                    # Capped at 400s: we only ever keep a ~100s window, and the
                    # 15-minute recordings cost minutes each to download.
                    filter=f'license:({LICENSES}) duration:[{MIN_DUR:.0f} TO 400]',
                    fields="id,name,username,license,duration,previews,url,"
                           "avg_rating,num_ratings,tags",
                    sort="rating_desc", page_size=15)
        except Exception as e:
            print(f"    ! search {q!r}: {e}")
            continue
        for r in d.get("results", []):
            if r["id"] in seen:
                continue
            seen.add(r["id"])
            r["query"] = q
            out.append(r)
    # A 5-star average from 2 votes is noise; require a few and rank by rating.
    out.sort(key=lambda r: -(r.get("avg_rating", 0)
                             if r.get("num_ratings", 0) >= 3 else 0))
    return out


def on_topic(rec, layer):
    """Is this the thing the layer needs, and only that thing?

    Returns None if it is usable, else the word that disqualified it.
    """
    words = (rec.get("name", "") + " " + " ".join(rec.get("tags", []))).lower()
    for bad in EXCLUDE:
        if bad in words:
            return bad
    if not any(k in words for k in LAYER_KEYWORDS[layer]):
        return "off-layer"
    return None


def download(rec):
    """Fetch the hq-ogg preview once; cached in ambience/raw/."""
    os.makedirs(RAW, exist_ok=True)
    path = os.path.join(RAW, f"{rec['id']}.ogg")
    if os.path.exists(path) and os.path.getsize(path) > 10000:
        return path
    url = rec["previews"]["preview-hq-ogg"]
    try:
        # Streamed in chunks rather than r.read(): some previews are tens of MB,
        # and buffering the whole body meant the file sat at zero bytes for
        # minutes, which is indistinguishable from a hung download.
        with urllib.request.urlopen(url, timeout=90) as r, open(path, "wb") as f:
            while True:
                chunk = r.read(262144)
                if not chunk:
                    break
                f.write(chunk)
    except Exception as e:
        print(f"    ! download {rec['id']}: {e}")
        if os.path.exists(path):
            os.remove(path)
        return None
    return path


# --------------------------------------------------------------------------
# screening


def pcm(path, sr=SR, limit_s=600):
    p = subprocess.run([FF, "-v", "error", "-t", str(limit_s), "-i", path,
                        "-f", "f32le", "-ac", "1", "-ar", str(sr), "-"],
                       capture_output=True)
    return np.frombuffer(p.stdout, dtype=np.float32).astype(np.float64)


def envelope_db(x, sr=SR):
    """Per-second RMS in dB — the coarse loudness contour."""
    n = len(x) // sr * sr
    f = x[:n].reshape(-1, sr)
    return 20 * np.log10(np.sqrt((f ** 2).mean(1)) + 1e-12)


def _tonal_prominence(power, sr, win, lo_hz=60.0, hi_hz=9000.0, span=41):
    """How far the sharpest narrow peak rises above its immediate neighbours.

    Comparing the loudest bin to the median of the whole band would flag any
    recording with a broad bass hump — which is every ocean recording ever
    made. A hum, a musical note or a machine whine is narrow: it stands above
    the bins right next to it. Comparing each bin to a running median across
    ~`span` neighbours measures exactly that and ignores overall spectral tilt.
    """
    binhz = sr / win
    lo, hi = int(lo_hz / binhz), min(len(power), int(hi_hz / binhz))
    band = 10 * np.log10(power[lo:hi] + 1e-20)
    if band.size < span + 2:
        return 0.0
    # running median over a sliding window, edges held by symmetric padding
    pad = span // 2
    padded = np.pad(band, pad, mode="reflect")
    windows = np.lib.stride_tricks.sliding_window_view(padded, span)
    return float((band - np.median(windows, axis=1)).max())


def measure(x, sr=SR):
    """The four numbers that decide whether a recording is usable."""
    if x.size < sr * MIN_DUR:
        return None
    x = x - x.mean()
    peak = np.abs(x).max()
    if peak < 1e-4:
        return None

    # Syllabic modulation: speech puts most envelope energy in 2-8 Hz.
    hop = sr // 100
    n = len(x) // hop * hop
    env = np.sqrt((x[:n].reshape(-1, hop) ** 2).mean(1) + 1e-12)
    env -= env.mean()
    spec = np.abs(np.fft.rfft(env * np.hanning(env.size))) ** 2
    freq = np.fft.rfftfreq(env.size, d=0.01)
    tot = spec[(freq > 0.2) & (freq < 20)].sum() + 1e-20
    mod = float(spec[(freq >= 2) & (freq <= 8)].sum() / tot)

    # Spectral flatness and the strongest sustained peak: music and hum have
    # harmonics that stay put, noise-like ambience does not.
    win = 4096
    m = len(x) // win * win
    frames = x[:m].reshape(-1, win) * np.hanning(win)
    P = np.abs(np.fft.rfft(frames, axis=1)) ** 2 + 1e-12
    flat = float(np.median(np.exp(np.log(P).mean(1)) / P.mean(1)))
    tonal = _tonal_prominence(np.median(P, axis=0), sr, win)

    db = envelope_db(x, sr)
    quiet = db[db > np.median(db) - 40]
    return dict(mod=mod, flat=flat, tonal=tonal,
                event=float((db > np.median(db) + 6).mean()),
                sd=float(quiet.std()), dur=len(x) / sr,
                peak_db=float(20 * np.log10(peak)))


def verdict(m):
    """Whole-file screen: is there a voice or a tune anywhere in this recording?

    Judged over the entire file, because a single spoken sentence three minutes
    in still means the recording has people in it, even if the window we cut is
    clean.
    """
    if m is None:
        return "short"
    if m["mod"] > MAX_MOD:
        return "speech"
    if m["flat"] < MIN_FLAT:
        return "musical"
    return "ok"


def loop_verdict(m):
    """Loop-window screen: is the part we are actually going to use calm?

    Applied to the cut loop rather than the whole file. A recording that opens
    with a wave crashing on rocks and then settles is perfectly usable — we
    only ever play the settled part — so judging it on its whole-file event
    rate would throw away good material.
    """
    if m is None:
        return "short"
    if m["tonal"] > MAX_TONAL:
        return "tonal"
    if m["event"] > MAX_EVENT:
        return "eventy"
    if m["sd"] > MAX_SD:
        return "restless"
    return "ok"


# --------------------------------------------------------------------------
# loop preparation


def calmest_window(x, secs, sr=SR):
    """Start offset of the steadiest `secs` of audio.

    Scored on the spread of the per-second loudness contour, so windows
    containing a bang, a gust that dies, or a passing voice lose to windows
    that just sit there.
    """
    need = int(secs)
    db = envelope_db(x, sr)
    if len(db) <= need:
        return 0
    best, best_score = 0, None
    for s in range(0, len(db) - need, 2):
        w = db[s:s + need]
        score = w.std() + 0.5 * max(0.0, w.max() - np.median(w))
        if best_score is None or score < best_score:
            best, best_score = s, score
    return best * sr


def make_loop(x, secs, xfade=XFADE, sr=SR):
    """Cut the calmest window and crossfade its tail over its head.

    Taking L+X seconds and folding the last X back onto the first X gives a
    loop of exactly L whose seam is a crossfade rather than a splice, so
    looping it forever has no click and no audible landmark.
    """
    secs = min(secs, len(x) / sr - xfade - 1)
    if secs < 10:
        return None
    start = calmest_window(x, secs + xfade, sr)
    seg = x[start:start + int((secs + xfade) * sr)]
    n, nx = int(secs * sr), int(xfade * sr)
    head, tail = seg[:n].copy(), seg[n:n + nx]
    if len(tail) < nx:
        return None
    # equal-power fade so the seam does not dip in level
    t = np.linspace(0, 1, nx, endpoint=False)
    head[:nx] = head[:nx] * np.sqrt(t) + tail * np.sqrt(1 - t)
    return head


def normalize(x, target_db):
    """Scale to a given RMS in dBFS, without ever clipping."""
    rms = np.sqrt((x ** 2).mean()) + 1e-12
    x = x * (10 ** (target_db / 20.0) / rms)
    peak = np.abs(x).max()
    if peak > 0.98:                       # never clip; the bed is quiet anyway
        x = x * (0.98 / peak)
    return x


_synth_db = {}


def synth_rms_db(layer):
    """Loudness of the synthesized layer this recording is replacing.

    soundscape.py's LAYER_CEILING and all twelve SCENE_GAINS rows were tuned
    against the filtered-noise layers, and that balance is already verified in
    the finished mix. Landing each real recording on the same RMS as the noise
    it replaces keeps every one of those numbers correct, instead of forcing a
    re-balance by ear on audio nobody has re-listened to yet.
    """
    if layer in _synth_db:
        return _synth_db[layer]
    import soundscape
    src = soundscape._sources(SR)[layer]
    p = subprocess.run([FF, "-v", "error", "-f", "lavfi", "-t", "45",
                        "-i", src, "-f", "f32le", "-ac", "1", "-ar", str(SR),
                        "-"], capture_output=True)
    y = np.frombuffer(p.stdout, dtype=np.float32).astype(np.float64)
    if y.size == 0:
        _synth_db[layer] = -23.0          # fallback if the lavfi source changes
    else:
        _synth_db[layer] = float(20 * np.log10(np.sqrt((y ** 2).mean()) + 1e-12))
    return _synth_db[layer]


def write_opus(x, path):
    """Encode a float array to a small mono opus loop."""
    raw = (np.clip(x, -1, 1) * 32767).astype("<i2").tobytes()
    p = subprocess.run(
        [FF, "-y", "-v", "error", "-f", "s16le", "-ar", str(SR), "-ac", "1",
         "-i", "-", "-c:a", "libopus", "-b:a", "48k", "-ac", "1",
         "-application", "audio", path],
        input=raw, capture_output=True)
    if p.returncode:
        raise RuntimeError(p.stderr.decode()[:400])


def blend(clips):
    """Sum several screened recordings into one layer.

    One recording looping for two and a half hours is recognisable however
    good the seam is. Three summed at different lengths and offsets are not:
    the composite only repeats at the least common multiple, which is hours.
    """
    if len(clips) == 1:
        return clips[0]
    n = max(len(c) for c in clips)
    out = np.zeros(n)
    for i, c in enumerate(clips):
        r = np.resize(c, n)                    # tile to the longest
        r = np.roll(r, (i * 7919) % n)         # decorrelate the start points
        out += r / len(clips)
    return out


# --------------------------------------------------------------------------


def build_layer(layer, force=False):
    out = os.path.join(AMB, f"{layer}.opus")
    if os.path.exists(out) and not force:
        print(f"  {layer}: already built")
        return None
    print(f"  {layer}: searching…")
    cands = search(layer)
    print(f"    {len(cands)} candidates")
    kept, used = [], []
    for rec in cands:
        if len(kept) >= KEEP_PER_LAYER:
            break
        why = on_topic(rec, layer)
        if why:
            # checked before downloading: no point spending 8 MB to find out
            print(f"    reject {why[:12]:12s}{'':22s}"
                  f"{rec['id']:>8} {rec['name'][:38]}")
            continue
        p = download(rec)
        if not p:
            continue
        try:
            x = pcm(p)
            m = measure(x)
        except Exception as e:
            print(f"    ! measure {rec['id']}: {e}")
            continue
        v = verdict(m)
        tag = f"{rec['id']:>8} {rec['name'][:38]:38s}"
        if v != "ok":
            print(f"    reject {v:8s} mod={m['mod']:.2f} flat={m['flat']:.3f}"
                  f"           {tag}")
            continue
        loop = make_loop(x, LOOP_SECS[layer])
        if loop is None:
            print(f"    reject short                                {tag}")
            continue
        lm = measure(loop)
        lv = loop_verdict(lm)
        if lv != "ok":
            # lm is None when the cut window came out too short or silent, in
            # which case there are no numbers to print alongside the verdict.
            nums = ("" if lm is None else
                    f"tonal={lm['tonal']:4.1f} ev={lm['event']:.3f} "
                    f"sd={lm['sd']:4.1f}")
            print(f"    reject {lv:8s} {nums:34s}{tag}")
            continue
        print(f"    keep     mod={m['mod']:.2f} flat={m['flat']:.3f} "
              f"tonal={lm['tonal']:4.1f} ev={lm['event']:.3f} sd={lm['sd']:4.1f}"
              f"  {tag}")
        # even levels going into the blend, so no one recording dominates
        kept.append(normalize(loop, -23.0))
        used.append(dict(id=rec["id"], name=rec["name"], user=rec["username"],
                         license=rec["license"], url=rec["url"], layer=layer,
                         **{k: round(v2, 4) for k, v2 in lm.items()}))
    if not kept:
        print(f"    !! nothing usable for {layer}")
        return None
    os.makedirs(AMB, exist_ok=True)
    target = synth_rms_db(layer)
    write_opus(normalize(blend(kept), target), out)
    print(f"    -> {os.path.basename(out)} "
          f"{os.path.getsize(out) / 1024:.0f} KB from {len(kept)} recordings "
          f"@ {target:.1f} dBFS (matched to the synth layer)")
    return used


def write_sources(used):
    """Credit every recording. CC0 does not require it; CC-BY does."""
    lines = ["# Ambience sources", "",
             "The bedtime soundscape is built from these field recordings,",
             "fetched by `fetch_ambience.py` from freesound.org. Only CC0 and",
             "CC-BY licences are used — no ShareAlike, NonCommercial or",
             "NoDerivatives — so the finished mix carries no viral terms.", "",
             "Loops live in `ambience/` and are git-ignored: they are build",
             "inputs, not site assets. Re-fetch them with `fetch_ambience.py`.",
             "This file is tracked so the credit ships with the repo.", ""]
    for layer in QUERIES:
        rows = [u for u in used if u["layer"] == layer]
        if not rows:
            continue
        lines += [f"## {layer}", ""]
        for u in rows:
            lines.append(f"- [{u['name']}]({u['url']}) by **{u['user']}** "
                         f"— {u['license'].split('/')[-2] if '/' in u['license'] else u['license']}")
        lines.append("")
    # Tracked, and deliberately not inside the git-ignored ambience/ dir: a
    # CC-BY credit that ships only on my laptop is not a credit.
    path = os.path.join(HERE, "AMBIENCE-SOURCES.md")
    open(path, "w").write("\n".join(lines))
    print(f"\nwrote {path}")


def report():
    """Re-screen everything already in raw/, without fetching."""
    if not os.path.isdir(RAW):
        sys.exit("nothing downloaded yet")
    print(f"{'verdict':8s} {'mod':>5s} {'flat':>6s} {'tonal':>6s} {'ev':>6s} "
          f"{'dur':>6s}  file")
    for name in sorted(os.listdir(RAW)):
        try:
            m = measure(pcm(os.path.join(RAW, name)))
        except Exception:
            continue
        if m is None:
            continue
        print(f"{verdict(m):8s} {m['mod']:5.2f} {m['flat']:6.3f} "
              f"{m['tonal']:6.1f} {m['event']:6.3f} {m['dur']:6.0f}  {name}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--force", action="store_true", help="refetch every layer")
    ap.add_argument("--report", action="store_true", help="re-screen raw/ only")
    ap.add_argument("--layers", help="comma-separated subset")
    a = ap.parse_args()
    if a.report:
        return report()
    layers = a.layers.split(",") if a.layers else list(QUERIES)
    used, manifest = [], os.path.join(AMB, "sources.json")
    if os.path.exists(manifest):
        used = json.load(open(manifest))
    for layer in layers:
        got = build_layer(layer, force=a.force)
        if got:
            used = [u for u in used if u["layer"] != layer] + got
    os.makedirs(AMB, exist_ok=True)
    json.dump(used, open(manifest, "w"), indent=1)
    write_sources(used)
    have = [l for l in QUERIES if os.path.exists(os.path.join(AMB, f"{l}.opus"))]
    total = sum(os.path.getsize(os.path.join(AMB, f"{l}.opus")) for l in have)
    print(f"{len(have)}/{len(QUERIES)} layers ready, {total / 1024:.0f} KB total")


if __name__ == "__main__":
    main()
