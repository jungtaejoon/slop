#!/usr/bin/env python3
"""폴더 안의 CSV 여러 개를 하나로 합칩니다. (표준 라이브러리만)

    python3 merge_csv.py ./월별매출 합친결과.csv

- 열 이름이 파일마다 조금 달라도(순서가 다르거나 일부 열이 없어도) 합쳐요.
  없는 칸은 비워 둬요.
- 엑셀에서 저장한 CSV(UTF-8 BOM, CP949)도 자동으로 읽어요.
- 어느 파일에서 온 줄인지 '원본파일' 열을 맨 앞에 붙여요.
- 결과는 엑셀에서 한글이 깨지지 않도록 UTF-8 BOM으로 저장해요.
"""
import csv
import sys
from pathlib import Path


def read_rows(path: Path):
    for enc in ("utf-8-sig", "cp949"):
        try:
            with path.open(newline="", encoding=enc) as f:
                return list(csv.DictReader(f))
        except UnicodeDecodeError:
            continue
    raise SystemExit(f"인코딩을 알 수 없어요: {path.name}")


def main():
    if len(sys.argv) != 3:
        raise SystemExit("사용법: python3 merge_csv.py <폴더> <결과.csv>")
    folder, out = Path(sys.argv[1]), Path(sys.argv[2])
    files = sorted(p for p in folder.glob("*.csv") if p.resolve() != out.resolve())
    if not files:
        raise SystemExit("CSV 파일이 없어요.")

    columns, all_rows = [], []
    for p in files:
        rows = read_rows(p)
        for row in rows:
            for key in row:
                if key is not None and key not in columns:
                    columns.append(key)
            all_rows.append({"원본파일": p.name, **{k: v for k, v in row.items() if k is not None}})
        print(f"{p.name}: {len(rows)}줄")

    with out.open("w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=["원본파일", *columns], extrasaction="ignore")
        w.writeheader()
        w.writerows(all_rows)
    print(f"\n{len(files)}개 파일, {len(all_rows)}줄 → {out}")


if __name__ == "__main__":
    main()
