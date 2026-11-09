# Writes <name>.en.html from each Korean app by swapping its on-screen text.
import sys
L=('<html lang="ko">','<html lang="en">')
P={
'color-mix':[L,('<title>물감 섞기 퍼즐','<title>Paint Mixing Puzzle'),('<h1>물감 섞기 퍼즐</h1>','<h1>Paint Mixing Puzzle</h1>'),
 ('물감 방울을 떨어뜨려 왼쪽 색을 만들어 보세요. 방울은 적게, 색은 비슷하게.','Drop paint to match the color on the left. Fewer drops, closer color.'),
 ('<span>목표</span>','<span>Target</span>'),('>내 물감<','>Your mix<'),('한 방울 빼기','Undo drop'),('>비우기<','>Empty<'),("이걸로 제출","Submit"),
 ("['빨강',","['Red',"),("['노랑',","['Yellow',"),("['파랑',","['Blue',"),("['흰색',","['White',"),("['검정',","['Black',"),
 ("name + ' 한 방울'","'One drop of ' + name.toLowerCase()"),
 ("`내 물감 · ${drops.length}방울`","`Your mix · ${drops.length} drop${drops.length === 1 ? '' : 's'}`"),("'아직 비어 있어요'","'Empty so far'"),
 ("`${Math.min(round, ROUNDS)} / ${ROUNDS} 라운드`","`Round ${Math.min(round, ROUNDS)} / ${ROUNDS}`"),("`총점 ${total}`","`Score ${total}`"),
 ("'거의 똑같아요!'","'Nearly identical!'"),("'아주 비슷해요'","'Very close'"),("'꽤 가까워요'","'Pretty close'"),("'조금 멀어요'","'A bit off'"),
 ("`일치도 ${match}% · ${word}${bonus ? ` · 아낀 방울 보너스 +${bonus}` : ''} (정답은 ${target.recipe}방울짜리였어요)`","`Match ${match}% · ${word}${bonus ? ` · drops saved bonus +${bonus}` : ''} (the answer used ${target.recipe} drops)`"),
 ("` · 최종 ${total}점!`","` · Final score ${total}!`"),("'새 게임'","'New game'")],
'birthday':[L,('<title>생일 문제 시뮬레이터','<title>Birthday Problem Simulator'),
 ('<h1>생일 문제: 몇 명이면 생일 같은 사람이 있을까?</h1>','<h1>The birthday problem: how many people until two share a birthday?</h1>'),
 ('한 반에 23명만 모여도 생일이 같은 두 사람이 있을 확률이 50%를 넘어요. 믿기 어렵다면 직접 뽑아 보세요.','With just 23 people in a room, the chance that two share a birthday is over 50%. Hard to believe? Draw some rooms yourself.'),
 ('<label>사람 수 ','<label>People '),("한 반 뽑아 보기","Draw one room"),("1000반 뽑기","Draw 1000 rooms"),
 ('aria-label="1년 365일, 칸마다 하루"','aria-label="365 days of the year, one cell per day"'),('aria-label="사람 수에 따른 확률 그래프"','aria-label="Probability by number of people"'),
 ('왜 이렇게 높을까요? 23명이면 두 사람씩 짝지을 수 있는 경우가 253쌍이에요. 그중 한 쌍만 겹쳐도 되니까요.','Why so high? 23 people make 253 possible pairs, and any single pair matching is enough.'),
 ("n + '명'","n + ' people'"),
 ("`${n}명 중 생일이 같은 사람이 적어도 한 쌍 있을 확률 (짝지을 수 있는 쌍: ${n * (n - 1) / 2}개)`","`Chance that at least one pair among ${n} people shares a birthday (${n * (n - 1) / 2} possible pairs)`"),
 ("const MONTH = [","const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'], MONTH = ["),
 ("return `${m + 1}월 ${d + 1}일`;","return `${MON[m]} ${d + 1}`;"),
 ("`겹쳤어요! ${dup.map(([c, d]) => `${dayName(d)}에 ${c}명`).join(', ')}`","`A match! ${dup.map(([c, d]) => `${c} people on ${dayName(d)}`).join(', ')}`"),
 ("'이번 반은 모두 생일이 달라요.'","'Everyone in this room has a different birthday.'"),
 ("`1000반 중 ${hit}반에서 생일이 겹쳤어요 (${(hit / 10).toFixed(1)}%). 계산값은 ${pct(prob(n))}예요.`","`${hit} of 1000 rooms had a shared birthday (${(hit / 10).toFixed(1)}%). The math says ${pct(prob(n))}.`")],
'settle-up':[L,('<title>모임 정산 계산기','<title>Group Expense Splitter'),('<h1>모임 정산 계산기</h1>','<h1>Group Expense Splitter</h1>'),
 ('누가 얼마를 냈는지만 적으면, <b>송금 횟수가 가장 적게</b> 누가 누구에게 얼마 보내면 되는지 알려 줘요. 1원 단위는 내림해서 맞춰요.','Enter who paid what, and it tells you who should pay whom, <b>with as few transfers as possible</b>. Shares are rounded down to the cent.'),
 ('<h2>함께한 사람 <span class="muted">(쉼표로 구분)</span></h2>','<h2>People <span class="muted">(comma-separated)</span></h2>'),
 ('value="민지, 준호, 서연, 태우"','value="Maya, Jun, Sofia, Leo"'),('<h2>결제 내역</h2>','<h2>Payments</h2>'),('+ 결제 추가','+ Add payment'),
 ('<h2>이렇게 보내면 끝나요</h2>','<h2>Settle up like this</h2>'),("결과 복사하기","Copy result"),
 ("{ what: '1차 고깃집', who: '민지', amt: 186000 }, { what: '2차 카페', who: '준호', amt: 27400 }, { what: '택시', who: '서연', amt: 15800 }","{ what: 'Dinner', who: 'Maya', amt: 186.4 }, { what: 'Coffee', who: 'Jun', amt: 27.5 }, { what: 'Taxi', who: 'Sofia', amt: 15.8 }"),
 ("const won = (n) => n.toLocaleString('ko-KR') + '원';","const won = (n) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });"),
 ('placeholder="내용"','placeholder="What"'),('inputmode="numeric"','inputmode="decimal"'),('placeholder="금액"','placeholder="Amount"'),('aria-label="삭제"','aria-label="Remove"'),
 ("'<p class=\"muted\">사람 이름을 적어 주세요.</p>'","'<p class=\"muted\">Add some names first.</p>'"),
 # work in cents so rounding stays exact
 ("paid[it.who] += +it.amt || 0;","paid[it.who] += Math.round((+it.amt || 0) * 100);"),
 ("`<p class=\"muted\">총 ${won(total)} · 1인당 ${won(share)}</p>`","`<p class=\"muted\">Total ${won(total / 100)} · ${won(share / 100)} each</p>`"),
 ("`<div class=\"tx\">${esc(a)} <span class=\"arrow\">→</span> ${esc(b)} <b>${won(m)}</b></div>`","`<div class=\"tx\">${esc(a)} <span class=\"arrow\">→</span> ${esc(b)} <b>${won(m / 100)}</b></div>`"),
 ("'<p class=\"muted\">보낼 돈이 없어요. 이미 딱 맞아요!</p>'","'<p class=\"muted\">Nothing to send. You are already even!</p>'"),
 ("`[정산] 총 ${won(total)}, 1인당 ${won(share)}\\n` + tx.map(([a, b, m]) => `${a} → ${b} ${won(m)}`)","`[Settle up] Total ${won(total / 100)}, ${won(share / 100)} each\\n` + tx.map(([a, b, m]) => `${a} → ${b} ${won(m / 100)}`)"),
 ("if (-d.v < 10 || c.v < 10) break;","if (-d.v < 1 || c.v < 1) break;"),
 ("+e.target.value.replace(/[^\\d]/g, '')","+e.target.value.replace(/[^\\d.]/g, '')"),
 ("'복사했어요!'","'Copied!'"),("'복사가 막혀 있어요. 직접 선택해 주세요'","'Copying is blocked here. Select the text instead'")],
'flow-field':[L,('<title>바람의 결','<title>Wind Lines'),('누르면 바람이 바뀌어요 · 누른 채 움직이면 소용돌이가 생겨요','Tap for a new wind · drag to stir up a swirl')],
}
import re
for name, pairs in P.items():
    s=open(name+'.html').read()
    for a,b in pairs:
        if a not in s: sys.exit(f'{name}: missing {a[:60]!r}')
        s=s.replace(a,b)
    left=[l for l in s.split('\n') if re.search('[가-힣]', l) and not l.strip().startswith('//')]
    if left: print(name, 'KOREAN LEFT:', *[l.strip()[:90] for l in left], sep='\n  ')
    open(name+'.en.html','w').write(s)
print('done')
