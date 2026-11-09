// 한글 초성 검색: "ㄱㅊ" 로 "김치찌개"를, "ㅅㄹㄹ" 로 "슬롭랩"을 찾는 함수
// 의존성 없음. 초성·완성형·영문이 섞인 검색어도 처리해요.
const CHO = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
const isCho = (ch) => CHO.includes(ch);

// 글자 하나를 초성으로 (한글 음절이 아니면 그대로)
function toCho(ch) {
  const code = ch.charCodeAt(0) - 0xac00;
  return code >= 0 && code <= 11171 ? CHO[Math.floor(code / 588)] : ch;
}

// 검색어 글자가 대상 글자와 맞는지: 초성이면 초성끼리, 아니면 그대로 비교
const charMatch = (q, t) => (isCho(q) ? toCho(t) === q : q.toLowerCase() === t.toLowerCase());

/** text 안에 query가 (초성 섞어서) 연속으로 들어 있으면 시작 위치, 없으면 -1 */
export function chosungIndexOf(text, query) {
  const q = [...query.replace(/\s+/g, '')], t = [...text];
  outer: for (let i = 0; i + q.length <= t.length; i++) {
    for (let j = 0; j < q.length; j++) if (!charMatch(q[j], t[i + j])) continue outer;
    return i;
  }
  return -1;
}

/** 목록에서 찾고, 앞쪽에서 맞을수록 위로 */
export function chosungSearch(list, query, get = (x) => x) {
  if (!query.trim()) return list;
  return list
    .map((item) => ({ item, at: chosungIndexOf(get(item), query) }))
    .filter((r) => r.at >= 0)
    .sort((a, b) => a.at - b.at)
    .map((r) => r.item);
}

// 예시
// chosungSearch(['김치찌개', '된장찌개', '김밥', '치킨'], 'ㄱㅊ')   → ['김치찌개']
// chosungSearch(['김치찌개', '된장찌개', '김밥', '치킨'], 'ㅉㄱ')   → ['김치찌개', '된장찌개']
// chosungSearch(['슬롭랩', 'Slop Lab'], 'ㅅ롭')                    → ['슬롭랩']
