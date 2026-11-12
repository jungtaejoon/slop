#!/usr/bin/env python3
"""dupes.py - find duplicate files under a folder. Read-only: it never deletes or moves anything.

Usage:
  python3 dupes.py ~/Pictures
  python3 dupes.py ~/Downloads --min-size 1M --csv dupes.csv

How: group by size -> hash the first 64 KB -> hash the whole file only when still tied.
Standard library only (Python 3.8+).
"""
import argparse, csv, hashlib, os, stat, sys
from collections import defaultdict

def parse_size(s):
    units = {"k": 1 << 10, "m": 1 << 20, "g": 1 << 30}
    s = s.strip().lower().rstrip("b")
    if s and s[-1] in units:
        return int(float(s[:-1]) * units[s[-1]])
    return int(s or 0)

def human(n):
    for u in ("B", "KB", "MB", "GB"):
        if n < 1024:
            return f"{n:.0f} {u}" if u == "B" else f"{n:.1f} {u}"
        n /= 1024
    return f"{n:.1f} TB"

def digest(path, limit=None, chunk=1 << 20):
    h, left = hashlib.blake2b(digest_size=20), limit
    with open(path, "rb") as f:
        while left is None or left > 0:
            b = f.read(chunk if left is None else min(chunk, left))
            if not b:
                break
            h.update(b)
            if left is not None:
                left -= len(b)
    return h.hexdigest()

def regroup(groups, key):
    out = []
    for paths in groups:
        buckets = defaultdict(list)
        for p in paths:
            try:
                buckets[key(p)].append(p)
            except OSError as e:
                print(f"  skipped (unreadable): {p} ({e.strerror})", file=sys.stderr)
        out += [b for b in buckets.values() if len(b) > 1]
    return out

def main():
    ap = argparse.ArgumentParser(description="Find duplicate files (read-only).")
    ap.add_argument("folder")
    ap.add_argument("--min-size", default="1", help="ignore smaller files, e.g. 100k, 1M (default 1 byte)")
    ap.add_argument("--hidden", action="store_true", help="also look inside hidden folders like .git")
    ap.add_argument("--csv", help="also write the result to this CSV file")
    a = ap.parse_args()
    min_size = parse_size(a.min_size)

    by_size, seen = defaultdict(list), set()
    for root, dirs, files in os.walk(a.folder):
        if not a.hidden:
            dirs[:] = [d for d in dirs if not d.startswith(".")]
        for name in files:
            p = os.path.join(root, name)
            try:
                st = os.lstat(p)
            except OSError:
                continue
            if not stat.S_ISREG(st.st_mode) or st.st_size < min_size:
                continue  # skips symlinks, devices, tiny files
            if (st.st_dev, st.st_ino) in seen:
                continue  # hard link to a file we already have: not a real copy
            seen.add((st.st_dev, st.st_ino))
            by_size[st.st_size].append(p)

    groups = [g for g in by_size.values() if len(g) > 1]
    groups = regroup(groups, lambda p: digest(p, 64 << 10))
    groups = regroup(groups, digest)
    groups.sort(key=lambda g: os.path.getsize(g[0]) * (len(g) - 1), reverse=True)

    wasted = 0
    for i, g in enumerate(groups, 1):
        size = os.path.getsize(g[0])
        wasted += size * (len(g) - 1)
        print(f"\n#{i}  {len(g)} copies x {human(size)}")
        for p in sorted(g, key=lambda p: os.path.getmtime(p)):
            print(f"   {p}")
    print(f"\n{len(groups)} groups of duplicates, {human(wasted)} could be freed (keeping one of each).")

    if a.csv:
        with open(a.csv, "w", newline="", encoding="utf-8") as f:
            w = csv.writer(f)
            w.writerow(["group", "size_bytes", "path"])
            for i, g in enumerate(groups, 1):
                for p in g:
                    w.writerow([i, os.path.getsize(p), p])
        print(f"CSV saved: {a.csv}")

if __name__ == "__main__":
    main()
