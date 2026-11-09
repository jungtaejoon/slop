#!/usr/bin/env python3
"""사진 폴더를 촬영(수정) 날짜별 하위 폴더로 정리합니다.

사용법:
    python3 sort_photos.py ~/Pictures/정리할폴더            # 미리보기만 (아무것도 옮기지 않음)
    python3 sort_photos.py ~/Pictures/정리할폴더 --apply    # 실제로 옮기기

- 표준 라이브러리만 씁니다.
- JPEG 안의 EXIF 촬영 날짜(DateTimeOriginal)를 먼저 찾고, 없으면 파일 수정 시각을 씁니다.
- 같은 이름이 이미 있으면 덮어쓰지 않고 "_1", "_2"를 붙입니다.
"""
import argparse
import datetime as dt
import shutil
import struct
from pathlib import Path

EXTS = {".jpg", ".jpeg", ".png", ".heic", ".gif", ".webp", ".mov", ".mp4"}


def exif_date(path: Path):
    """JPEG의 EXIF DateTimeOriginal(0x9003)을 읽는다. 실패하면 None."""
    try:
        with path.open("rb") as f:
            if f.read(2) != b"\xff\xd8":
                return None
            while True:
                marker = f.read(2)
                if len(marker) < 2 or marker[0] != 0xFF:
                    return None
                size = struct.unpack(">H", f.read(2))[0]
                if marker[1] == 0xE1:
                    data = f.read(size - 2)
                    if not data.startswith(b"Exif\x00\x00"):
                        return None
                    tiff = data[6:]
                    endian = "<" if tiff[:2] == b"II" else ">"

                    def ifd_entries(offset):
                        count = struct.unpack(endian + "H", tiff[offset:offset + 2])[0]
                        for i in range(count):
                            e = offset + 2 + i * 12
                            yield struct.unpack(endian + "HHII", tiff[e:e + 12])

                    first = struct.unpack(endian + "I", tiff[4:8])[0]
                    for tag, _type, _count, value in ifd_entries(first):
                        if tag == 0x8769:  # Exif sub-IFD
                            for tag2, _t2, _c2, value2 in ifd_entries(value):
                                if tag2 == 0x9003:
                                    raw = tiff[value2:value2 + 19].decode("ascii", "ignore")
                                    return dt.datetime.strptime(raw, "%Y:%m:%d %H:%M:%S")
                    return None
                f.seek(size - 2, 1)
    except (OSError, ValueError, struct.error):
        return None


def taken_at(path: Path) -> dt.datetime:
    return exif_date(path) or dt.datetime.fromtimestamp(path.stat().st_mtime)


def unique(dest: Path) -> Path:
    if not dest.exists():
        return dest
    for i in range(1, 10_000):
        cand = dest.with_name(f"{dest.stem}_{i}{dest.suffix}")
        if not cand.exists():
            return cand
    raise RuntimeError(f"이름을 만들 수 없어요: {dest}")


def main():
    ap = argparse.ArgumentParser(description="사진을 날짜별 폴더(YYYY/YYYY-MM-DD)로 정리")
    ap.add_argument("folder", type=Path)
    ap.add_argument("--apply", action="store_true", help="미리보기 대신 실제로 옮기기")
    args = ap.parse_args()

    files = [p for p in args.folder.iterdir() if p.is_file() and p.suffix.lower() in EXTS]
    if not files:
        print("정리할 사진이 없어요.")
        return
    for p in sorted(files):
        when = taken_at(p)
        dest = unique(args.folder / f"{when:%Y}" / f"{when:%Y-%m-%d}" / p.name)
        print(f"{'옮김' if args.apply else '예정'}  {p.name}  →  {dest.relative_to(args.folder)}")
        if args.apply:
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.move(str(p), str(dest))
    if not args.apply:
        print(f"\n{len(files)}개 파일. 실제로 옮기려면 --apply 를 붙여 다시 실행하세요.")


if __name__ == "__main__":
    main()
