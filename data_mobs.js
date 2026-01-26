/* data_mobs.js */

/* 1. 몬스터 목록 */
const MOBS = [
    { n:"슬라임", hp:200, dmg:5, g:30, img:"mob0.png", spd:2000, type:"range", bullet:"bullet_slime.png", css:"fb-green" },
    { n:"고블린", hp:800, dmg:15, g:100, img:"mob1.png", spd:1500, type:"range", bullet:"bullet_dart.png", css:"fb-gray" },
    { n:"오크", hp:2500, dmg:40, g:300, img:"mob2.png", spd:2500, type:"range", bullet:"bullet_axe.png", css:"fb-axe" },
    { n:"해골", hp:6000, dmg:80, g:800, img:"mob3.png", spd:1800, type:"melee", bullet:"", css:"" },
    { n:"골렘", hp:15000, dmg:150, g:2000, img:"mob4.png", spd:3000, type:"melee", bullet:"", css:"" },
    { n:"드래곤", hp:50000, dmg:500, g:10000, img:"mob5.png", spd:2000, type:"range", bullet:"bullet_fire.png", css:"fb-green" },
    { n:"마왕", hp:200000, dmg:2000, g:50000, img:"mob6.png", spd:1000, type:"range", bullet:"bullet_dark.png", css:"fb-green" }
];

/* 2. 강화 확률 (g:대성공, s:성공, f:파괴, d:하락) */
const PROBS = [
    {g:5, s:95, f:0, d:0},   // 0
    {g:5, s:95, f:0, d:0},   // 1
    {g:5, s:90, f:0, d:5},   // 2
    {g:5, s:85, f:0, d:10},  // 3
    {g:5, s:80, f:0, d:15},  // 4
    {g:5, s:75, f:0, d:20},  // 5
    {g:3, s:60, f:5, d:10},  // 6
    {g:3, s:55, f:10, d:10}, // 7
    {g:3, s:50, f:15, d:10}, // 8
    {g:2, s:45, f:20, d:10}, // 9
    {g:2, s:40, f:25, d:10}, // 10
    {g:2, s:35, f:30, d:10}, // 11
    {g:1, s:30, f:35, d:10}, // 12
    {g:1, s:25, f:40, d:10}, // 13
    {g:1, s:20, f:45, d:10}, // 14
    {g:1, s:15, f:50, d:10}, // 15
    {g:0, s:10, f:55, d:10}, // 16
    {g:0, s:8, f:60, d:10},  // 17
    {g:0, s:5, f:65, d:10},  // 18
    {g:0, s:3, f:70, d:10}   // 19
];
