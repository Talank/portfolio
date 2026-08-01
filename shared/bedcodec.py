#!/usr/bin/env python3
"""Compact encoding for the pause windows that drive the ambience swell.

The browser rebuilds the bed at play time (see shared/bed-engine.js), so it
needs to know where in each segment nobody is speaking. Shipping those windows
as JSON floats costs about 25 bytes per gap — roughly 130 KB across the voyage,
in a manifest that is otherwise 3 KB and blocks the page.

So they go over as varint deltas in 20 ms ticks, base64url'd: each gap becomes
its start offset from the previous gap's end, then its own length. Both are
small numbers in practice — a sentence pause is 0.9 s, or 45 ticks, one byte —
so the whole thing lands near 2 bytes per gap.

Exactness matters more than it looks. The swell is a deterministic function of
these windows on both sides of the wire: the renderer used them to duck the bed
it baked into the old files, and the player now uses them to duck a bed it
builds live. 20 ms is far below the ramp times involved, so the quantisation is
inaudible, but a *drifting* offset would slide the bed off the speech.

The JS twin of decode() is `decodeGaps` in shared/bed-engine.js. The two are
tested against each other by tests/test_bedcodec.py.
"""

TICK = 0.02  # seconds per tick; 20 ms, well under the ~350 ms swell ramp

_ALPHABET = ("ABCDEFGHIJKLMNOPQRSTUVWXYZ"
             "abcdefghijklmnopqrstuvwxyz"
             "0123456789-_")
_INDEX = {c: i for i, c in enumerate(_ALPHABET)}


def _varints(values):
    """LEB128, 7 bits per byte, high bit set while more bytes follow."""
    out = bytearray()
    for v in values:
        v = int(v)
        if v < 0:
            raise ValueError(f"varint values must be non-negative, got {v}")
        while True:
            b = v & 0x7F
            v >>= 7
            if v:
                out.append(b | 0x80)
            else:
                out.append(b)
                break
    return bytes(out)


def _b64(data):
    """base64url without padding — the result goes inside a JS string literal."""
    out = []
    for i in range(0, len(data), 3):
        chunk = data[i:i + 3]
        n = len(chunk)
        word = chunk[0] << 16 | (chunk[1] << 8 if n > 1 else 0) | (chunk[2] if n > 2 else 0)
        out.append(_ALPHABET[(word >> 18) & 63])
        out.append(_ALPHABET[(word >> 12) & 63])
        if n > 1:
            out.append(_ALPHABET[(word >> 6) & 63])
        if n > 2:
            out.append(_ALPHABET[word & 63])
    return "".join(out)


def _unb64(text):
    out = bytearray()
    for i in range(0, len(text), 4):
        chunk = text[i:i + 4]
        n = len(chunk)
        if n < 2:
            break
        word = 0
        for j in range(4):
            word = (word << 6) | (_INDEX[chunk[j]] if j < n else 0)
        out.append((word >> 16) & 0xFF)
        if n > 2:
            out.append((word >> 8) & 0xFF)
        if n > 3:
            out.append(word & 0xFF)
    return bytes(out)


def encode(gaps):
    """Encode [(start, end), ...] in seconds to a base64url string.

    Gaps must be sorted and non-overlapping, which is how segment_narration()
    produces them: it walks the segment forward appending each silence as it
    lays it down.
    """
    vals = []
    cursor = 0
    for start, end in gaps:
        s = int(round(start / TICK))
        e = int(round(end / TICK))
        if s < cursor:
            # Clamp rather than raise: a rounding tie at a boundary can put a
            # gap one tick behind the previous end, and losing 20 ms of swell
            # is not worth failing a six-hour render over.
            s = cursor
        if e < s:
            e = s
        vals.append(s - cursor)
        vals.append(e - s)
        cursor = e
    return _b64(_varints(vals))


def decode(text):
    """Inverse of encode(). Present so the tests can round-trip without JS."""
    data = _unb64(text)
    vals, acc, shift = [], 0, 0
    for byte in data:
        acc |= (byte & 0x7F) << shift
        if byte & 0x80:
            shift += 7
        else:
            vals.append(acc)
            acc, shift = 0, 0
    gaps, cursor = [], 0
    for i in range(0, len(vals) - 1, 2):
        start = cursor + vals[i]
        end = start + vals[i + 1]
        gaps.append((round(start * TICK, 3), round(end * TICK, 3)))
        cursor = end
    return gaps
