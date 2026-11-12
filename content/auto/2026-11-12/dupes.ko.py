#!/usr/bin/env python3
"""dupes.py - 폴더 안의 중복 파일 찾기. 읽기만 해요: 아무것도 지우거나 옮기지 않아요.

사용법:
  python3 dupes.py ~/Pictures
  python3 dupes.py ~/Downloads --min-size 1M --csv dupes.csv

방식: 크기로 묶기 -> 앞 64 KB 해시 -> 그래도 같으면 그때만 파일 전체 해시.
표준 라이브러리만 써요 (Python 3.8 이상).
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
                print(f"  건너뜀 (읽을 수 없음): {p} ({e.strerror})", file=sys.stderr)
        out += [b for b in buckets.values() if len(b) > 1]
    return out

def main():
    ap = argparse.ArgumentParser(description="중복 파일 찾기 (읽기 전용).")
    ap.add_argument("folder")
    ap.add_argument("--min-size", default="1", help="이보다 작은 파일은 무시, 예: 100k, 1M (기본 1바이트)")
    ap.add_argument("--hidden", action="store_true", help=".git 같은 숨김 폴더 안도 살펴보기")
    ap.add_argument("--csv", help="결과를 이 CSV 파일로도 저장")
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
                continue  # 심볼릭 링크, 장치 파일, 너무 작은 파일은 건너뜀
            if (st.st_dev, st.st_ino) in seen:
                continue  # 이미 본 파일의 하드 링크: 진짜 사본이 아님
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
        print(f"\n#{i}  사본 {len(g)}개 x {human(size)}")
        for p in sorted(g, key=lambda p: os.path.getmtime(p)):
            print(f"   {p}")
    print(f"\n중복 {len(groups)}묶음, {human(wasted)} 확보 가능 (각각 하나씩만 남길 때).")

    if a.csv:
        with open(a.csv, "w", newline="", encoding="utf-8") as f:
            w = csv.writer(f)
            w.writerow(["group", "size_bytes", "path"])
            for i, g in enumerate(groups, 1):
                for p in g:
                    w.writerow([i, os.path.getsize(p), p])
        print(f"CSV 저장됨: {a.csv}")

if __name__ == "__main__":
    main()
