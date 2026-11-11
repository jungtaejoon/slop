// ---------- text for the twelve curator-only skills (names, descriptions, evolutions, skill trees) ----------
Object.assign(TXT.ko.w, {
  knife: ['커터칼', '가까운 슬롭 쪽으로 짧은 칼날을 부채꼴로 뿌린다.'], ink: ['먹물 자국', '움직이는 동안 지나간 자리에 먹물 웅덩이를 남긴다.'],
  aura: ['빨간 펜 원', '몸 주위를 태우는 원. 체력이 낮을수록 더 뜨겁다.'], tape: ['테이프', '테이프가 날아갔다가 돌아오며 오가는 길을 친다.'],
  strike: ['취소선', '화면에서 가장 질긴 슬롭을 겨냥했다가 줄을 긋는다.'], stapler: ['스테이플러', '가까운 슬롭에게 심을 빠르게 박는다.'],
  mine: ['쉼표 지뢰', '발밑에 쉼표를 떨어뜨린다. 슬롭이 밟으면 터진다.'], postit: ['포스트잇', '붙여 둔 메모가 잠시 동안 알아서 쏜다.'],
  sun: ['돋보기 햇빛', '가까운 슬롭에게 햇빛을 모은다. 오래 비추면 불이 붙는다.'], abacus: ['주판알', '알이 사방으로 튀어 나가 벽에 맞고 튕긴다.'],
  tea: ['찻주전자', '슬롭 무리에 차를 던진다. 뜨거운 웅덩이가 남는다.'], bell: ['종', '종을 울려 주위 슬롭을 치고 밀어내고 멈춘다.'],
});
Object.assign(TXT.en.w, {
  knife: ['Cutter Knife', 'Throws a short fan of blades at the nearest slop.'], ink: ['Ink Trail', 'Leaves puddles of ink behind you while you move.'],
  aura: ['Red-Pen Circle', 'A circle that burns around you, hotter the lower your health.'], tape: ['Tape', 'A roll of tape flies out and back, hitting both ways.'],
  strike: ['Strikethrough', 'Marks the toughest slop on screen, then strikes it out.'], stapler: ['Stapler', 'Rapid staples at the nearest slop.'],
  mine: ['Comma Mine', 'Drops a comma at your feet. It goes off when slop steps near.'], postit: ['Sticky Note', 'A note you stick down shoots on its own for a while.'],
  sun: ['Sunlight Loupe', 'Focuses sunlight on the nearest slop. Hold it long enough and it ignites.'], abacus: ['Abacus Beads', 'Beads fly in every direction and bounce off walls.'],
  tea: ['Teapot', 'Throws tea into the crowd and leaves a scalding puddle.'], bell: ['Bell', 'Rings to hit, push back and stun everything around you.'],
});
Object.assign(TXT.ko.evo, {
  knife: ['칼날 폭풍', '사방으로 칼날을 뿌리고, 칼날이 관통한다.'], ink: ['먹물 바다', '멈춰 있어도 넓은 웅덩이가 생긴다.'],
  aura: ['핏빛 교정', '원이 넓어지고, 여럿을 태우면 체력이 돌아온다.'], tape: ['끝없는 테이프', '굵은 테이프 여러 개가 사방으로 오간다.'],
  strike: ['전면 삭제', '질긴 슬롭 다섯을 한꺼번에 지운다.'], stapler: ['제본기', '세 갈래로 박히고 관통한다.'],
  mine: ['마침표 폭격', '터질 때 작은 지뢰 넷을 흩뿌린다.'], postit: ['메모 벽', '메모가 세 갈래로 쏜다.'],
  sun: ['한낮', '햇빛이 세 갈래로 나뉜다.'], abacus: ['계산 끝', '알 열두 개가 멈추지 않고 튕긴다.'],
  tea: ['찻잎 폭풍', '웅덩이가 넓고 오래가며 슬롭을 느리게 한다.'], bell: ['새벽 종', '두 번 울리고 더 멀리, 더 오래 멈춘다.'],
});
Object.assign(TXT.en.evo, {
  knife: ['Blade Storm', 'Blades in every direction, and they pierce.'], ink: ['Sea of Ink', 'Wide puddles even when you stand still.'],
  aura: ['Crimson Mark', 'A wider circle that heals you when it burns a crowd.'], tape: ['Endless Tape', 'Thick rolls of tape fly out in every direction.'],
  strike: ['Redact All', 'Strikes out the five toughest at once.'], stapler: ['Binding Machine', 'Three-way staples that pierce.'],
  mine: ['Full Stop', 'Each blast scatters four little mines.'], postit: ['Memo Wall', 'Notes fire three ways.'],
  sun: ['High Noon', 'The sunlight splits three ways.'], abacus: ['Final Tally', 'Twelve beads that never stop bouncing.'],
  tea: ['Tea Storm', 'Wider, longer puddles that slow slop down.'], bell: ['Dawn Bell', 'Rings twice, farther, with a longer stun.'],
});
Object.assign(TXT.ko.tree, {
  knife: [['칼날 수', ['칼날 +2개', '관통 +1', '폭발: 칼날이 맞은 자리에서 터진다']], ['날카로움', ['피해 +25%', '재사용 대기 -15%', '출혈: 맞은 슬롭이 2초 동안 피해를 입는다']]],
  ink: [['번짐', ['웅덩이 +25%', '오래 남음 +50%', '끈적임: 웅덩이 위의 슬롭이 느려진다']], ['진한 먹', ['피해 +30%', '더 자주 떨어뜨림', '터짐: 웅덩이가 마를 때 터진다']]],
  aura: [['넓은 원', ['범위 +20%', '범위 +20%', '끌어당김: 원 안으로 슬롭을 당긴다']], ['뜨거운 원', ['피해 +30%', '더 자주 태운다', '흡혈: 여럿을 태우면 체력 회복']]],
  tape: [['여러 롤', ['테이프 +1개', '더 멀리, 더 크게', '두 번: 한 번 더 던진다']], ['질긴 테이프', ['피해 +30%', '속도 +30%', '감기: 맞은 슬롭이 잠깐 멈춘다']]],
  strike: [['여러 줄', ['표적 +1', '폭발 범위 +50%', '연쇄: 표적을 지우면 다음 표적으로 두 번 넘어간다']], ['굵은 줄', ['피해 +30%', '재사용 대기 -15%', '처형: 체력 25% 이하면 바로 지운다']]],
  stapler: [['연사', ['심 +1개', '관통 +1', '두 번: 한 번 더 쏜다']], ['깊은 심', ['피해 +25%', '재사용 대기 -15%', '고정: 맞은 슬롭이 느려진다']]],
  mine: [['지뢰밭', ['지뢰 최대 +2', '폭발 범위 +30%', '두 개씩: 한 번에 두 개를 놓는다']], ['큰 쉼표', ['피해 +30%', '재사용 대기 -20%', '기절: 터진 자리의 슬롭이 멈춘다']]],
  postit: [['메모 더미', ['메모 +1장', '오래 붙어 있음 +50%', '두 발: 메모가 두 발씩 쏜다']], ['강한 접착', ['피해 +30%', '더 빨리 쏜다', '끈끈이: 맞은 슬롭이 느려진다']]],
  sun: [['여러 줄기', ['햇빛 +1줄기', '사거리 +30%', '큰 불: 불이 붙으면 크게 터진다']], ['뜨거운 빛', ['피해 +30%', '더 자주 태운다', '아지랑이: 비춘 슬롭이 느려진다']]],
  abacus: [['알 더하기', ['알 +2개', '튕김 +2번', '두 번: 한 번 더 굴린다']], ['무거운 알', ['피해 +30%', '속도 +30%', '쾅: 맞을 때마다 작은 폭발']]],
  tea: [['넓은 웅덩이', ['범위 +25%', '오래 남음 +50%', '찻잎: 웅덩이가 슬롭을 느리게 한다']], ['진한 차', ['피해 +30%', '재사용 대기 -15%', '두 번: 한 번 더 던진다']]],
  bell: [['멀리 울림', ['범위 +20%', '기절 +0.4초', '두 번: 한 번 더 울린다']], ['무거운 종', ['피해 +30%', '재사용 대기 -20%', '봉인: 울린 슬롭이 피해를 30% 더 받는다']]],
});
Object.assign(TXT.en.tree, {
  knife: [['More blades', ['+2 blades', 'Pierce +1', 'Burst: blades explode where they hit']], ['Keen edge', ['Damage +25%', 'Cooldown -15%', 'Bleed: hit slop keeps taking damage for 2s']]],
  ink: [['Spread', ['Puddles +25%', 'Last 50% longer', 'Sticky: slop in the ink slows down']], ['Dark ink', ['Damage +30%', 'Drops more often', 'Pop: puddles burst as they dry']]],
  aura: [['Wide circle', ['Area +20%', 'Area +20%', 'Pull: drags slop into the circle']], ['Hot circle', ['Damage +30%', 'Burns more often', 'Leech: burning a crowd heals you']]],
  tape: [['More rolls', ['+1 roll', 'Farther and bigger', 'Twice: throws again']], ['Tough tape', ['Damage +30%', 'Speed +30%', 'Wrap: hit slop is stopped briefly']]],
  strike: [['More lines', ['+1 target', 'Blast area +50%', 'Chain: a cleared target jumps to the next one, twice']], ['Bold line', ['Damage +30%', 'Cooldown -15%', 'Execute: below 25% health it is gone']]],
  stapler: [['Rapid fire', ['+1 staple', 'Pierce +1', 'Twice: fires again']], ['Deep staples', ['Damage +25%', 'Cooldown -15%', 'Pinned: hit slop slows down']]],
  mine: [['Minefield', ['+2 max mines', 'Blast area +30%', 'Pairs: drops two at once']], ['Big comma', ['Damage +30%', 'Cooldown -20%', 'Stun: slop in the blast stops']]],
  postit: [['Note pile', ['+1 note', 'Stays 50% longer', 'Double tap: notes fire two at a time']], ['Strong glue', ['Damage +30%', 'Fires faster', 'Sticky: hit slop slows down']]],
  sun: [['More rays', ['+1 ray', 'Reach +30%', 'Blaze: ignitions explode bigger']], ['Hot light', ['Damage +30%', 'Burns more often', 'Haze: lit slop slows down']]],
  abacus: [['Add beads', ['+2 beads', '+2 bounces', 'Twice: rolls again']], ['Heavy beads', ['Damage +30%', 'Speed +30%', 'Bang: a small blast on every hit']]],
  tea: [['Wide puddle', ['Area +25%', 'Lasts 50% longer', 'Leaves: puddles slow slop down']], ['Strong tea', ['Damage +30%', 'Cooldown -15%', 'Twice: throws again']]],
  bell: [['Far ring', ['Area +20%', 'Stun +0.4s', 'Twice: rings again']], ['Heavy bell', ['Damage +30%', 'Cooldown -20%', 'Seal: rung slop takes 30% more damage']]],
});
