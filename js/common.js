/* [js/common.js] 공통 데이터 및 전역 변수 */

// 1. 필수 유틸
function setText(id, text) {
    const el = document.getElementById(id);
    if(el) el.innerText = text;
}

// 2. 밸런스 데이터
const EnhanceProbs = [
    {s:100, d:0}, {s:95, d:5}, {s:90, d:10}, {s:85, d:15}, {s:80, d:20},
    {s:75, d:25}, {s:70, d:30}, {s:60, d:30}, {s:55, d:30}, {s:50, d:35},
    {s:45, d:35}, {s:40, d:35}, {s:35, d:40}, {s:30, d:40}, {s:25, d:40},
    {s:20, d:40}, {s:15, d:45}, {s:10, d:45}, {s:5,  d:45}, {s:3,  d:47},
    {s:0,  d:0}
];

// 3. 유저 데이터 (U)
let U = { 
    name: "Guest", gold: 1000, 
    sword: { lvl: 0, shiny: false }, 
    armor: { lvl: 0, shiny: false },
    hp: 100, maxHp: 100, atk: 10, 
    inv: [null, null], book: [],
    stats: { kill: 0, destroy: 0 }, achieved: [],
    items: { potion: 0, whetstone: 0, charm: 0, scrap: 0 }, // scrap: 검의 파편
    npcCharmCount: 0, npcPunished: false
};

// 4. 게임 상태 전역 변수
let buyTarget = { key: '', price: 0, name: '' };
let currentEquipType = 'sword'; 
let currentMode = 'enhance';
let currentBookTab = 'sword';
let npcClickCount = 0; 
let isSetEffectOn = false;
