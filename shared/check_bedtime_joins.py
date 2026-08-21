#!/usr/bin/env python3
"""Does the crossfade window ever land on speech?

Every segment is supposed to end with OVERLAP seconds of nothing (the bed left
the files, so 'nothing' now means digital silence) and start with the same, so
that the player's equal-power crossfade from segment n into segment n+1 happens
between words. If either side of that window carries a word, two voices are
audible at once -- or the first word of a chapter fades in from zero.

Decodes only the two 1.5 s windows per file, never the whole file.
"""
import json, subprocess, sys, os, re, glob
import numpy as np
import imageio_ffmpeg
FF = imageio_ffmpeg.get_ffmpeg_exe()
SR = 24000
SPEECH_DB = -45.0   # a 100 ms window above this is not room tone

def slice_pcm(path, *pre):
    cmd = [FF, '-v', 'error', *pre, '-i', path, '-f', 'f32le',
           '-ac', '1', '-ar', str(SR), '-']
    out = subprocess.run(cmd, capture_output=True).stdout
    return np.frombuffer(out, dtype='<f4')

_DUR = re.compile(rb'time=(\d+):(\d\d):(\d\d\.\d+)')
def duration(path):
    r = subprocess.run([FF, '-v', 'info', '-i', path, '-f', 'null', '-'],
                       capture_output=True)
    hits = _DUR.findall(r.stderr)
    if not hits: return None
    h, m, s = hits[-1]
    return int(h) * 3600 + int(m) * 60 + float(s)

def stats(a):
    if len(a) == 0: return -120.0, -120.0
    n = int(SR * 0.1)
    k = max(1, len(a) // n)
    b = a[:k*n].reshape(k, n).astype(np.float64)
    r = 20 * np.log10(np.maximum(np.sqrt((b ** 2).mean(axis=1)), 1e-9))
    return float(r.max()), 20 * float(np.log10(max(np.abs(a).max(), 1e-9)))

def probe(f, ov):
    d = duration(f)
    tail = slice_pcm(f, '-sseof', str(-ov))
    head = slice_pcm(f, '-t', str(ov))
    trms, tpk = stats(tail)
    hrms, hpk = stats(head)
    return d, trms, tpk, hrms, hpk

def main(manifests):
    bad = 0
    for man_path in manifests:
        man = json.load(open(man_path))
        root = os.path.join(os.path.dirname(man_path), '..', '..')
        base = os.path.normpath(os.path.join(root, man['dir']))
        ov = man.get('overlap', 1.5)
        print('\n=== %s (overlap %.2fs) ===' % (man_path, ov))
        seen, rows = {}, []
        for mode, mi in man['modes'].items():
            for tier, ti in mi['tiers'].items():
                pl = ti['playlist']
                for i, p in enumerate(pl):
                    f = os.path.join(base, mi['dir'], p['f'])
                    if f not in seen:
                        seen[f] = probe(f, ov)
                    d, trms, tpk, hrms, hpk = seen[f]
                    issues = []
                    if d is not None and abs(d - p['d']) > 0.25:
                        issues.append('manifest d=%.2f actual=%.2f (%+.2f)'
                                      % (p['d'], d, d - p['d']))
                    if i + 1 < len(pl) and trms > SPEECH_DB:
                        issues.append('TAIL speech rms %.1f peak %.1f' % (trms, tpk))
                    if i > 0 and hrms > SPEECH_DB:
                        issues.append('HEAD speech rms %.1f peak %.1f' % (hrms, hpk))
                    if issues:
                        bad += 1
                        rows.append('  %-8s %-7s %-22s %s'
                                    % (mode, tier, p['f'], '; '.join(issues)))
        for r in rows[:12]: print(r)
        if len(rows) > 12: print('  ... %d more' % (len(rows) - 12))
        print('  %d distinct files, %d flagged rows' % (len(seen), len(rows)))
    print('\n%d problem join(s)' % bad)
    return bad

if __name__ == '__main__':
    args = sys.argv[1:]
    if not args:
        # Discover rather than hardcode: the hardcoded course list in the other
        # checkers went stale twice, once per new edition.
        args = sorted(glob.glob(os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            '*', 'data', 'bedtime', 'manifest*.json')))
    sys.exit(1 if main(args) else 0)
