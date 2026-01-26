/* data_achieve.js - Hardcore Balance */
const ACHIEVEMENTS = [
    // 1. 레벨 달성 (쉬움 -> 어려움)
    { id: "lv5", type: "level", val: 5, title: "견습 대장장이", desc: "검을 5강까지 강화하세요.", reward: 500 },
    { id: "lv10", type: "level", val: 10, title: "숙련공", desc: "검을 10강까지 강화하세요.", reward: 5000 },
    { id: "lv15", type: "level", val: 15, title: "장인", desc: "마의 구간을 넘어 15강 달성!", reward: 50000 },
    { id: "lv20", type: "level", val: 20, title: "신의 경지", desc: "검을 20강(MAX)까지 강화하세요.", reward: 1000000 }, // 100만 골드

    // 2. 사냥 (노가다)
    { id: "hunt10", type: "hunt", val: 10, title: "초보 사냥꾼", desc: "몬스터 10마리 처치.", reward: 1000 },
    { id: "hunt100", type: "hunt", val: 100, title: "학살자", desc: "몬스터 100마리 처치.", reward: 10000 },
    { id: "hunt1000", type: "hunt", val: 1000, title: "생태계 파괴범", desc: "몬스터 1,000마리 처치.", reward: 100000 },

    // 3. 골드 수집
    { id: "gold10k", type: "gold", val: 10000, title: "저축왕", desc: "10,000 골드 보유.", reward: 0 },
    { id: "gold1m", type: "gold", val: 1000000, title: "백만장자", desc: "1,000,000 골드 보유.", reward: 0 },
    { id: "gold100m", type: "gold", val: 100000000, title: "대부호", desc: "1억 골드 보유. (현질러?)", reward: 0 },

    // 4. 파괴 (멘탈 관리) - NEW
    { id: "fail1", type: "destroy", val: 1, title: "첫 번째 시련", desc: "검을 처음으로 깨먹으세요.", reward: 1000 }, // 위로금
    { id: "fail10", type: "destroy", val: 10, title: "마이너스의 손", desc: "검을 10번 파괴하세요.", reward: 10000 },
    { id: "fail50", type: "destroy", val: 50, title: "파괴신", desc: "검을 50번 파괴하세요. (포기하지 마!)", reward: 50000 }
];
