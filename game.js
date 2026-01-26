/* [V17.7 Game Logic - Set Effect & Scrap System] */

// [필수 유틸] 텍스트 설정
function setText(id, text) {
    const el = document.getElementById(id);
    if(el) el.innerText = text;
}

// [밸런스] 0~6강 안전, 19강 파괴 50% 제한
const EnhanceProbs = [
    {s:100, d:0}, {s:95, d:5}, {s:90, d:10}, {s:85, d:15}, {s:80, d:20},
    {s:75, d:25}, {s:70, d:30}, {s:60, d:30}, {s:55, d:30}, {s:50, d:35},
    {s:45, d:35}, {s:40, d:35}, {s:35, d:40}, {s:30, d:40}, {s:25, d:40},
    {s:20, d:40}, {s:15, d:45}, {s:10, d:45}, {s:5,  d:45}, {s:3,  d:47},
    {s:0,  d:0}
];

let U = { 
    name: "Guest", gold: 1000, 
    sword: { lvl: 0, shiny: false }, 
    armor: { lvl: 0, shiny: false },
    hp: 100, maxHp: 100, atk: 10, 
    inv: [null, null], book: [],
    stats: { kill: 0, destroy: 0 }, achieved: [],
    items: { potion: 0, whetstone: 0, charm: 0, scrap: 0 }, // [추가] scrap: 고철
    npcCharmCount: 0, npcPunished: false
};

let buyTarget = { key: '', price: 0, name: '' };
let currentEquipType = 'sword'; 
let currentMode = 'enhance';
let currentBookTab = 'sword';
let npcClickCount = 0; 
let isSetEffectOn = false; // 세트 효과 발동 여부

const Game = {
    prepare: function() {
        if(typeof SWORDS === 'undefined' || typeof MOBS === 'undefined') 
            return alert("데이터 파일(data_swords.js, data_mobs.js) 로드 실패.");
        
        if(typeof ARMORS === 'undefined') {
            window.ARMORS = Array(21).fill({ n: "임시 갑옷", hp: 100, desc: "데이터 없음", s_desc: "" });
        }
        if(typeof ACHIEVEMENTS === 'undefined') window.ACHIEVEMENTS = [];

        const input = document.getElementById('name-input');
        if(!input) return;
        const val = input.value.trim();
        
        if(val) {
            U.name = val;
            localStorage.setItem('LB_LastUser', val);
            this.synchronize(); 
        } else {
            const last = localStorage.getItem('LB_LastUser');
            if(last) { input.value = last; return this.prepare(); } 
            else return alert("닉네임을 입력하세요!"); 
        }

        document.getElementById('intro').classList.remove('active');
        document.getElementById('story-screen').classList.add('active');
        this.renderShop();
    },

    synchronize: function() {
        const d = localStorage.getItem('LB_v17_'+U.name);
        if(d) {
            try { U = { ...U, ...JSON.parse(d) }; } catch(e) {}
        }
        
        // 데이터 초기화 및 안전장치
        if(!U.sword) U.sword = { lvl:0, shiny:false };
        if(!U.armor) U.armor = { lvl:0, shiny:false };
        if(!U.inv) U.inv = [null, null];
        if(!U.items) U.items = { potion:0, whetstone:0, charm:0, scrap:0 };
        if(typeof U.items.scrap === 'undefined') U.items.scrap = 0; // 구버전 호환
        
        if(!U.book) U.book = [];
        if(!U.stats) U.stats = { kill: 0, destroy: 0 };
        if(!U.achieved) U.achieved = [];
        if(typeof U.npcCharmCount === 'undefined') U.npcCharmCount = 0;
        if(typeof U.npcPunished === 'undefined') U.npcPunished = false;
        
        this.addBook('sword', U.sword.lvl, U.sword.shiny);
        this.addBook('armor', U.armor.lvl, U.armor.shiny);
        
        this.save();
    },

    enterWorld: function() {
        document.getElementById('story-screen').classList.remove('active');
        document.getElementById('game').classList.add('active');
        this.updateAll();
        UI.tab('forge');
        UI.log(`대장장이 [${U.name}]님, 환영합니다.`);
    },

    save: function(msg) {
        localStorage.setItem('LB_v17_'+U.name, JSON.stringify(U));
        if(msg) UI.toast("저장되었습니다.");
    },

    reset: function() {
        if(confirm("초기화하시겠습니까?")) {
            localStorage.clear();
            location.reload();
        }
    },

    switchEquipType: function(dir) {
        if(dir === 1) currentEquipType = 'armor';
        else currentEquipType = 'sword';
        
        const title = document.getElementById('forge-title');
        title.innerText = (currentEquipType === 'sword') ? "검 (Weapon)" : "갑옷 (Armor)";
        title.style.color = (currentEquipType === 'sword') ? "var(--gold)" : "#3498db";
        
        this.updateAll();
    },

    setMode: function(mode) {
        currentMode = mode;
        document.querySelectorAll('.mode-opt').forEach(el => el.classList.remove('active'));
        document.getElementById('mode-'+mode).classList.add('active');
        this.updateButton();
    },

    updateButton: function() {
        const btn = document.getElementById('btn-action');
        if(!btn) return;
        
        let icon = currentEquipType === 'sword' ? 'icon_atk.png' : 'icon_hp.png';
        
        if(currentMode === 'enhance') {
            btn.innerHTML = `<img src='${icon}' class='ico-s'> 강화 시도 (100G)`;
            btn.style.background = "#e94560";
        } else {
            btn.innerHTML = `<img src='icon_polish.png' class='ico-s' onerror="this.src='icon_shiny.png'"> 광내기 (2,000G)`;
            btn.style.background = "#9b59b6";
        }
    },

    doAction: function() {
        this.synchronize(); 
        if(currentMode === 'enhance') this.enhance();
        else this.polish();
    },

    enhance: function() {
        let target = (currentEquipType === 'sword') ? U.sword : U.armor;
        if(target.lvl >= 20) return UI.toast("최고 레벨입니다!");
        if(U.gold < 100) return UI.toast("골드가 부족합니다.");
        U.gold -= 100;
        this.save(); 
        this.updateAll();
        this.playAnim("enhance");
        setTimeout(() => {
            document.getElementById('anim-layer').style.display = 'none';
            document.getElementById('btn-action').disabled = false;
            this.procEnhance(target);
        }, 500);
    },

    polish: function() {
        let target = (currentEquipType === 'sword') ? U.sword : U.armor;
        if(U.gold < 2000) return UI.toast("비용 부족 (2,000G)");
        if(target.shiny) return UI.toast("이미 빛나고 있습니다!");
        U.gold -= 2000;
        this.save();
        this.updateAll();
        this.playAnim("polish");
        setTimeout(() => {
            document.getElementById('anim-layer').style.display = 'none';
            document.getElementById('btn-action').disabled = false;
            this.procPolish(target);
        }, 600);
    },

    playAnim: function(text) {
        const layer = document.getElementById('anim-layer');
        const img = document.getElementById('anim-equip');
        const tool = document.getElementById('anim-tool');
        const txt = document.getElementById('anim-text');
        
        let target = (currentEquipType === 'sword') ? U.sword : U.armor;
        let prefix = (currentEquipType === 'sword') ? 'sword' : 'armor';
        img.src = `${prefix}${target.lvl}.png`;
        
        layer.style.display = 'flex';
        tool.className = 'anim-tool-img'; 
        if(text === 'enhance') {
            tool.src = 'anim_hammer.png'; tool.classList.add('hammer-motion'); txt.innerText = "강화 중...";
        } else {
            tool.src = 'anim_cloth.png'; tool.classList.add('wipe-motion'); txt.innerText = "닦는 중...";
        }
        document.getElementById('btn-action').disabled = true;
    },

    procEnhance: function(target) {
        const chkW = document.getElementById('chk-whetstone');
        const chkC = document.getElementById('chk-charm'); 
        let useWhetstone = chkW && chkW.checked && U.items.whetstone > 0;
        let useCharm = chkC && chkC.checked && U.items.charm > 0;

        if(useWhetstone) { U.items.whetstone--; chkW.checked = false; }

        let p = EnhanceProbs[target.lvl] || {s:0, d:0};
        let rateS = p.s + (useWhetstone?5:0);
        let rateD = p.d || 0; 
        
        const r = Math.random() * 100;
        let msg = "";
        let destroyed = false;

        if(r < rateS) { 
            if(Math.random() < 0.05) { 
                target.lvl = Math.min(20, target.lvl + 2); 
                msg = "<img src='icon_great.png' class='ico-s'> 대성공! (+2)"; 
            } else {
                target.lvl++; 
                msg = "<img src='icon_success.png' class='ico-s'> 성공! (+1)"; 
            }
            target.shiny = false; 
            this.shinyChk(target);
        } 
        else if(r < rateS + rateD) { 
            if(target.lvl > 0) target.lvl--; 
            msg = "<img src='icon_fail.png' class='ico-s'> 하락 (-1)"; 
        }
        else { 
            // 파괴 로직
            if(useCharm) { 
                U.items.charm--; chkC.checked = false; 
                msg = "<img src='charm.png' class='ico-s'> 부적 사용!"; 
            } else { 
                destroyed = true;
                let oldLvl = target.lvl;
                target.lvl = 0; target.shiny = false; 
                msg = "<img src='icon_destroy.png' class='ico-s'> 파괴됨 (초기화)"; 
                
                if(!U.stats) U.stats = {kill:0, destroy:0};
                U.stats.destroy = (U.stats.destroy || 0) + 1; 
                
                // [파편 시스템] 파괴시 고철 지급
                let scrapGain = 0;
                if(oldLvl <= 6) scrapGain = Math.floor(Math.random() * 3); // 0~2
                else if(oldLvl <= 15) scrapGain = Math.floor(Math.random() * 3) + 1; // 1~3
                else scrapGain = Math.floor(Math.random() * 3) + 4; // 4~6
                
                if(scrapGain > 0) {
                    U.items.scrap += scrapGain;
                    msg += ` <span style="color:#aaa; font-size:0.8rem;">(고철 +${scrapGain})</span>`;
                }
            }
        } 

        UI.log(msg);
        this.addBook(currentEquipType, target.lvl, target.shiny);
        this.checkAchieve();
        this.updateAll();
        this.save();
    },

    procPolish: function(target) {
        if(Math.random() < 0.02) {
            target.shiny = true;
            UI.toast("<img src='icon_shiny.png' class='ico-s'> 성공! 이로치 발견!");
            this.addBook(currentEquipType, target.lvl, true);
        } else { UI.toast("아무 일도 일어나지 않았습니다..."); }
        this.updateAll();
        this.save();
    },

    shinyChk: function(target) {
        if(!target.shiny && Math.random() < 0.05) { target.shiny = true; UI.toast("<img src='icon_shiny.png' class='ico-s'> ✨ 이로치 발견!"); }
    },

    addBook: function(type, lvl, shiny) {
        let prefix = (type === 'sword') ? 's' : 'a';
        let key = `${prefix}_${lvl}`;
        if(!U.book.includes(key)) U.book.push(key);
        if(shiny) {
            let keyS = `${prefix}_${lvl}_s`;
            if(!U.book.includes(keyS)) U.book.push(keyS);
        }
    },

    store: function() { 
        this.synchronize();
        const idx = U.inv.findIndex(x => x === null);
        if(idx === -1) return UI.toast("가방이 꽉 찼습니다.");
        
        let target = (currentEquipType === 'sword') ? U.sword : U.armor;
        if(target.lvl === 0 && !target.shiny) return UI.toast("기본 장비는 보관 불가.");
        
        U.inv[idx] = { 
            type: (currentEquipType==='sword' ? 's' : 'a'), 
            l: target.lvl, s: target.shiny 
        };
        
        target.lvl = 0; target.shiny = false; 
        UI.toast("보관 완료.");
        this.updateAll(); this.save();
    },

    swap: function(idx) { 
        this.synchronize();
        let item = U.inv[idx];
        if(!item) return;
        
        let itemTypeStr = (item.type === 's') ? 'sword' : 'armor';
        if(itemTypeStr !== currentEquipType) currentEquipType = itemTypeStr;
        
        let target = (itemTypeStr === 'sword') ? U.sword : U.armor;
        let temp = { type: item.type, l: target.lvl, s: target.shiny };
        
        target.lvl = item.l;
        target.shiny = item.s;
        
        if(temp.l > 0 || temp.s) U.inv[idx] = temp;
        else U.inv[idx] = null;
        
        UI.toast("장착 완료.");
        this.updateAll(); this.save();
    },

    renderShop: function() { 
        const list = document.getElementById('shop-list'); 
        if(!list) return; 
        
        // NPC 이미지 ID 부여
        list.innerHTML = `<div class="shop-scene"><div class="npc-area" onclick="Game.touchNpc()"><div class="npc-bubble">어서옵쇼!</div><img id="npc-img-el" src="npc_goblin.png" class="npc-img" onerror="this.src='sword0.png'; this.style.filter='grayscale(100%)'"></div><div class="shop-stand" id="shop-stand-items"></div></div>`; 
        
        const stand = document.getElementById('shop-stand-items'); 
        const items = [ 
            { n:"체력 포션", p:500, k:'potion', img:'potion.png', d:"체력 50 회복 (자동)" }, 
            { n:"숫돌 (+5%)", p:8000, k:'whetstone', img:'whetstone.png', d:"성공률 +5% (1회용)" }, 
            { n:"파괴 방지 부적", p:100000, k:'charm', img:'charm.png', d:"파괴 방어" }, 
            { n:"랜덤 상자", p:2000, k:'box', img:'box.png', d:"랜덤 골드" } 
        ]; 
        items.forEach(it => { 
            const div = document.createElement('div'); div.className = 'shop-item'; 
            div.onclick = () => Game.showBuyModal(it); 
            div.innerHTML = `<img src="${it.img}" onerror="this.src='sword0.png'"><b>${it.n}</b><span><img src='icon_gold.png' class='ico-s'> ${it.p.toLocaleString()}</span>`; 
            stand.appendChild(div); 
        }); 
    },

    // [수정] 고블린 상호작용 (고철 교환 기능 추가)
    touchNpc: function() {
        const bubbleEl = document.querySelector('.npc-bubble');
        const imgEl = document.getElementById('npc-img-el');
        
        // 1순위: 고철 교환 (10개 이상이면 즉시 교환)
        if(U.items.scrap >= 10) {
            U.items.scrap -= 10;
            U.items.charm++;
            if(imgEl) imgEl.src = "npc_goblin.png";
            bubbleEl.innerText = "오오! 귀한 고철이잖아? 이걸 주면 부적을 주지!";
            UI.toast("⚙️ 고철 10개를 건네주고 '파괴 방지 부적'을 받았습니다!");
            this.updateAll();
            this.save();
            return; // 교환하면 클릭 카운트 로직은 패스
        }

        // 2순위: 클릭 상호작용
        npcClickCount++;
        
        if(imgEl) {
            if(npcClickCount < 5) imgEl.src = "npc_goblin.png";
            else if(npcClickCount < 10) imgEl.src = "npc_goblin_soso.png"; 
            else if(npcClickCount < 20) imgEl.src = "npc_goblin_sad.png";  
        }

        if(npcClickCount >= 20) {
            if(U.npcCharmCount < 5) {
                U.items.charm++;
                U.npcCharmCount++;
                bubbleEl.innerText = `에잉, 가져가라! (남은 재고: ${5 - U.npcCharmCount})`;
                UI.toast("🎁 고블린이 '파괴 방지 부적'을 던져주었습니다!");
                npcClickCount = 0;
                if(imgEl) imgEl.src = "npc_goblin.png"; 
            } 
            else if(!U.npcPunished) {
                U.npcPunished = true;
                if(imgEl) imgEl.src = "npc_goblin_angry.png";
                bubbleEl.innerText = "적당히 좀 하라고!!!";
                if(U.sword.lvl > 0) {
                    let oldLvl = U.sword.lvl;
                    U.sword.lvl = Math.max(0, U.sword.lvl - 2);
                    UI.toast(`💥 고블린이 망치로 검을 내려쳤습니다! (+${oldLvl} -> +${U.sword.lvl})`);
                    Game.addBook('sword', U.sword.lvl, U.sword.shiny);
                } else {
                    UI.toast("💥 고블린이 화를 냅니다!");
                }
                npcClickCount = 0;
            } 
            else {
                if(imgEl) imgEl.src = "npc_goblin_angry.png";
                bubbleEl.innerText = "썩 꺼져!";
                npcClickCount = 0;
            }
            this.updateAll();
            this.save();
        } else {
            const bubbles = ["어서옵쇼!", "고철 없나?", "만지지 마세요.", "바쁩니다.", "...", "후우..."];
            if(bubbleEl) bubbleEl.innerText = bubbles[Math.floor(Math.random() * bubbles.length)];
        }
    },

    showBuyModal: function(item) { this.synchronize(); buyTarget = { key: item.k, price: item.p, name: item.n }; document.getElementById('buy-title').innerText = item.n; document.getElementById('buy-icon').src = item.img; document.getElementById('buy-desc').innerText = item.d; document.getElementById('buy-qty').value = 1; document.getElementById('buy-total').innerText = item.p.toLocaleString(); document.getElementById('btn-buy-confirm').onclick = () => Game.confirmBuy(); document.getElementById('modal-buy').style.display = 'flex'; },
    adjustQty: function(delta) { const input = document.getElementById('buy-qty'); let val = parseInt(input.value) + delta; if(val < 1) val = 1; if(val > 99) val = 99; input.value = val; document.getElementById('buy-total').innerText = (val * buyTarget.price).toLocaleString(); },
    confirmBuy: function() { this.synchronize(); const qty = parseInt(document.getElementById('buy-qty').value); const total = qty * buyTarget.price; if(U.gold < total) return UI.toast("골드가 부족합니다."); U.gold -= total; if(buyTarget.key === 'box') { let gain = 0; for(let i=0; i<qty; i++) { let r = Math.random() * 100; if(r < 80) gain += Math.floor(Math.random() * 1500) + 1; else if(r < 95) gain += Math.floor(Math.random() * 3000) + 2000; else gain += Math.floor(Math.random() * 10000) + 10000; } U.gold += gain; UI.toast(`🎁 ${qty}개 오픈! ${gain.toLocaleString()}G`); } else { U.items[buyTarget.key] += qty; UI.toast(`${buyTarget.name} ${qty}개 구매!`); } document.getElementById('modal-buy').style.display = 'none'; this.updateAll(); this.save(); },
    
    checkAchieve: function() { 
        if(typeof ACHIEVEMENTS === 'undefined') return;
        ACHIEVEMENTS.forEach(ac => {
            if(U.achieved.includes(ac.id)) return;
            let pass = false;
            let maxLvl = Math.max(U.sword.lvl, U.armor.lvl);
            
            if(ac.type === 'level' && maxLvl >= ac.val) pass = true;
            if(ac.type === 'hunt' && (U.stats.kill||0) >= ac.val) pass = true;
            if(ac.type === 'gold' && U.gold >= ac.val) pass = true;
            if(ac.type === 'destroy' && (U.stats.destroy||0) >= ac.val) pass = true;

            if(pass) {
                U.achieved.push(ac.id);
                UI.toast(`🏆 업적 달성: ${ac.title}`);
                if(ac.reward > 0) { U.gold += ac.reward; UI.log(`보상 ${ac.reward}G`); }
                this.updateAll();
            }
        });
    },

    updateAll: function() {
        if(typeof SWORDS === 'undefined' || typeof ARMORS === 'undefined') return;

        const swBase = SWORDS[U.sword.lvl] ? SWORDS[U.sword.lvl].atk : 10;
        let finalAtk = U.sword.shiny ? Math.floor(swBase * 1.5) : swBase;
        
        const arBase = ARMORS[U.armor.lvl] ? ARMORS[U.armor.lvl].hp : 100;
        let finalHp = U.armor.shiny ? Math.floor(arBase * 1.5) : arBase;

        // [세트 효과 구현]
        isSetEffectOn = (U.sword.lvl > 0 && U.sword.lvl === U.armor.lvl);
        if(isSetEffectOn) {
            finalAtk = Math.floor(finalAtk * 1.1); // 공격력 10% 증가
            finalHp = Math.floor(finalHp * 1.1);   // 체력 10% 증가
        }
        U.atk = finalAtk;
        U.maxHp = finalHp;

        // UI 업데이트
        setText('ui-name', U.name);
        setText('ui-gold', U.gold.toLocaleString());
        
        // 세트 효과 표시 (공격력/체력 옆에 표시)
        let atkTxt = U.atk.toLocaleString();
        let hpTxt = U.maxHp.toLocaleString();
        if(isSetEffectOn) {
            atkTxt += " <span style='color:#00ffff; font-size:0.8em;'>(Set!)</span>";
            hpTxt += " <span style='color:#00ffff; font-size:0.8em;'>(Set!)</span>";
        }
        document.getElementById('ui-atk').innerHTML = atkTxt;
        document.getElementById('ui-hp').innerHTML = hpTxt;
        
        // 고철 개수 표시 추가
        if(document.getElementById('cnt-whetstone')) setText('cnt-whetstone', U.items.whetstone);
        if(document.getElementById('cnt-charm')) setText('cnt-charm', U.items.charm);
        
        // 고철 UI가 없다면 생성 (골드 옆 등 적절한 위치에) -> 여기선 골드 아래에 텍스트로 추가 예시
        // 실제로는 별도 UI칸이 없으므로, 상점 UI나 별도 표시가 필요하나 
        // 일단 편의상 닉네임 옆이나 로그로 확인 가능하게 함. 
        // (가장 좋은 건 상점 진입 시 확인)
        
        const isSword = (currentEquipType === 'sword');
        const target = isSword ? U.sword : U.armor;
        const Data = isSword ? SWORDS : ARMORS;
        const prefix = isSword ? 'sword' : 'armor';
        
        const itemData = Data[target.lvl] || Data[0];
        
        const nm = document.getElementById('ui-equip-name');
        if(nm) {
            if(target.shiny) {
                nm.innerHTML = `<img src='icon_shiny.png' class='ico-m'> ${itemData.n}`;
                nm.style.color = "#ff00ff";
            } else {
                nm.innerText = itemData.n;
                nm.style.color = (target.lvl >= 10) ? "gold" : "#fff";
            }
        }
        setText('ui-equip-lvl', "+" + target.lvl);

        const img = document.getElementById('equip-display');
        if(img) {
            let imgName = `${prefix}${target.lvl}`;
            if(target.shiny) imgName += "_s";
            
            img.src = `${imgName}.png`;
            img.onerror = function() { 
                this.src = `${prefix}${target.lvl}.png`; 
                if(target.shiny) this.style.filter = "invert(1) hue-rotate(180deg)";
            };
            img.className = isSword ? "img-display" : "img-display armor-img"; 
            
            const wrap = document.getElementById('sword-wrap');
            if(target.shiny) {
                img.classList.add('shiny-aura');
                if(wrap) wrap.classList.add('shiny-active');
            } else {
                if(wrap) wrap.classList.remove('shiny-active');
                img.classList.remove('shiny-aura', 'aura-1', 'aura-2', 'aura-3', 'aura-4', 'aura-5');
                if(target.lvl >= 20) img.classList.add('aura-5');
                else if(target.lvl >= 16) img.classList.add('aura-4');
                else if(target.lvl >= 13) img.classList.add('aura-3');
                else if(target.lvl >= 9) img.classList.add('aura-2');
                else if(target.lvl >= 6) img.classList.add('aura-1');
            }
        }

        const chk = document.getElementById('chk-whetstone');
        let addS = (chk && chk.checked && U.items.whetstone > 0) ? 5 : 0;
        let p = EnhanceProbs[target.lvl] || {s:0, d:0};
        let rateDestroy = 100 - (p.s + addS) - (p.d || 0);
        if(rateDestroy < 0) rateDestroy = 0;
        if(target.lvl === 0) rateDestroy = 0; 
        
        setText('p-g', "5%");
        setText('p-s', (p.s + addS) + "%");
        setText('p-d', (p.d || 0) + "%");
        setText('p-f', rateDestroy + "%");

        this.updateButton();
        UI.renderList(); 
    }
};

/* UI */
const UI = {
    tab: function(id) {
        if(Battle.on) return UI.toast("전투 중 이동 불가");
        document.querySelectorAll('.tab-view').forEach(e => e.classList.remove('show'));
        const target = document.getElementById('tab-'+id);
        if(target) target.classList.add('show');
        document.querySelectorAll('.nav-item').forEach(e => e.classList.remove('on'));
        const nav = document.getElementById('nav-'+id);
        if(nav) nav.classList.add('on');
    },
    log: function(m) { const b = document.getElementById('global-log'); if(b) b.innerHTML = `<div><span style="color:#666">[${new Date().toLocaleTimeString().split(" ")[0]}]</span> ${m}</div>` + b.innerHTML; },
    
    toast: function(msg) { 
        const con = document.getElementById('toast-container'); 
        if(!con) return; 
        const div = document.createElement('div'); 
        div.className = 'toast-msg'; 
        div.innerHTML = msg; 
        con.appendChild(div); 
        setTimeout(() => div.remove(), 2000); 
    },

    setBookTab: function(type) { currentBookTab = type; document.querySelectorAll('.book-tab').forEach(e => e.classList.remove('active')); document.getElementById('btab-'+type).classList.add('active'); this.renderList(); },
    renderList: function() {
        const il = document.getElementById('inv-list');
        if(il) {
            il.innerHTML = "";
            U.inv.forEach((it, i) => {
                const d = document.createElement('div'); d.className = 'item-slot';
                if(it) {
                    let prefix = (it.type === 's') ? 'sword' : 'armor';
                    let src = `${prefix}${it.l}.png`;
                    d.innerHTML = `<img src="${src}" onerror="this.src='${prefix}0.png'"><span class="item-lvl">+${it.l}</span>`;
                    if(it.s) d.style.border = "1px solid #ff00ff";
                    d.onclick = () => Game.swap(i);
                } else { d.innerHTML = `<span style="color:#444">+</span>`; }
                il.appendChild(d);
            });
        }
        const bl = document.getElementById('book-list');
        if(bl) {
            bl.innerHTML = "";
            let Data = (currentBookTab === 'sword') ? SWORDS : ARMORS;
            let prefix = (currentBookTab === 'sword') ? 's' : 'a';
            let imgPrefix = (currentBookTab === 'sword') ? 'sword' : 'armor';
            Data.forEach((s, i) => {
                let key = `${prefix}_${i}`; let keyS = `${prefix}_${i}_s`;
                const has = U.book.includes(key); const hasShiny = U.book.includes(keyS);
                const d = document.createElement('div'); d.className = has ? 'book-slot got' : 'book-slot locked';
                let mark = hasShiny ? `<div class="shiny-mark"><img src='icon_shiny.png' class='ico-s'></div>` : "";
                d.innerHTML = `${mark}<img src="${imgPrefix}${i}.png" onerror="this.src='sword0.png'">`;
                d.onclick = function() { if(has) UI.lore(i, currentBookTab); else UI.toast("미획득"); };
                bl.appendChild(d);
            });
        }
        const hl = document.getElementById('hunt-list');
        if(hl && typeof MOBS !== 'undefined') {
            hl.innerHTML = "";
            MOBS.forEach((m, i) => {
                const d = document.createElement('div'); d.className = 'hunt-card';
                d.innerHTML = `<div style="display:flex; align-items:center;"><img src="${m.img}" class="mob-thumb" onerror="this.src='sword0.png'"><div><div>${m.n}</div><div style="font-size:0.7rem; color:#aaa;">HP: ${m.hp}</div></div></div><button class="btn-small" onclick="Battle.start(${i})">입장</button>`;
                hl.appendChild(d);
            });
        }
    },
    curLoreIdx: 0, curLoreType: 'sword', isShinyView: false,
    lore: function(i, type) { this.curLoreIdx = i; this.curLoreType = type; this.isShinyView = false; this.updateLoreView(); document.getElementById('modal-help').style.display = 'flex'; document.getElementById('help-body').style.display = 'none'; document.getElementById('lore-body').style.display = 'block'; },
    toggleLoreMode: function() { this.isShinyView = !this.isShinyView; this.updateLoreView(); },
    
    updateLoreView: function() {
        if(typeof SWORDS === 'undefined') return;
        let Data = (this.curLoreType === 'sword') ? SWORDS : ARMORS;
        let prefix = (this.curLoreType === 'sword') ? 's' : 'a';
        let imgPrefix = (this.curLoreType === 'sword') ? 'sword' : 'armor';
        
        const s = Data[this.curLoreIdx];
        const btn = document.getElementById('btn-lore-switch');
        const img = document.getElementById('lore-img');
        const nm = document.getElementById('lore-name');
        const desc = document.getElementById('lore-desc');
        const owner = document.getElementById('lore-owner');
        const stats = document.getElementById('lore-stats');
        
        let val = (this.curLoreType === 'sword') ? s.atk : s.hp;
        let valS = Math.floor(val*1.5);
        let statLabel = (this.curLoreType === 'sword') ? "⚔️ 공격력" : "🛡️ 체력";

        let hasShiny = U.book.includes(`${prefix}_${this.curLoreIdx}_s`);

        if(this.isShinyView) {
            btn.innerHTML = "<img src='icon_refresh.png' class='ico-s'> 모드 전환 (Shiny)";
            img.src = `${imgPrefix}${this.curLoreIdx}_s.png`; 
            img.onerror = function() { 
                this.src = `${imgPrefix}${UI.curLoreIdx}.png`; 
                this.style.filter = "invert(1) hue-rotate(180deg)"; 
            };
            
            if(hasShiny) {
                img.style.filter = "none";
                nm.innerHTML = `<img src='icon_shiny.png' class='ico-s'> ${s.n}`; 
                nm.style.color = "#ff00ff"; 
                desc.innerText = s.s_desc; 
                stats.innerText = `${statLabel}: ${valS}`;
                owner.innerText = s.s_owner || "정보 없음";
            } else {
                img.style.filter = "brightness(0)"; 
                nm.innerText = "???";
                nm.style.color = "#888";
                desc.innerText = "아직 발견하지 못한 이로치입니다.";
                stats.innerText = "???";
                owner.innerText = "???";
            }
        } else {
            btn.innerHTML = "<img src='icon_refresh.png' class='ico-s'> 모드 전환 (Normal)";
            img.src = `${imgPrefix}${this.curLoreIdx}.png`; 
            img.style.filter = "none"; 
            nm.innerText = s.n; 
            nm.style.color = "var(--main)"; 
            desc.innerText = s.desc;
            stats.innerText = `${statLabel}: ${val}`;
            owner.innerText = s.owner || "정보 없음";
        }
    },
    help: function() { document.getElementById('modal-help').style.display = 'flex'; document.getElementById('help-body').style.display = 'block'; document.getElementById('lore-body').style.display = 'none'; const tb = document.getElementById('prob-tbody'); tb.innerHTML = ""; EnhanceProbs.forEach((p, i) => { if(i % 2 !== 0 && i !== 19) return; let lb = i === 20 ? "MAX" : `+${i}`; let rateF = 100 - p.s - (p.d || 0); if(rateF < 0) rateF = 0; if(i<7) rateF=0; tb.innerHTML += `<tr><td>${lb}</td><td style="color:#2ecc71">${p.s}%</td><td style="color:#f39c12">${p.d}%</td><td style="color:#e74c3c">${rateF}%</td></tr>`; }); },
    openProfile: function() { 
        if(typeof ACHIEVEMENTS === 'undefined') return UI.toast("업적 데이터를 불러오는 중...");
        const list = document.getElementById('achieve-list'); list.innerHTML = ""; ACHIEVEMENTS.forEach(ac => { const done = U.achieved.includes(ac.id); const div = document.createElement('div'); div.className = `achieve-item ${done ? 'unlocked' : 'locked'}`; let icon = done ? "<img src='icon_trophy.png' class='ico-m'>" : "<img src='icon_lock.png' class='ico-m'>"; div.innerHTML = `<div class="achieve-info" style="display:flex; align-items:center; gap:10px;">${icon}<div><h4>${ac.title}</h4><p>${ac.desc}</p></div></div>${ac.reward > 0 ? `<div class="achieve-reward">+${ac.reward}G</div>` : ''}`; list.appendChild(div); }); document.getElementById('modal-profile').style.display = 'flex'; }
};

/* Battle */
const Battle = {
    on: false, mob: null, timer: null, userCooldown: 0, mobCooldown: 0,
    start: function(i) {
        Game.synchronize(); 
        if(!U.stats) U.stats = {kill:0, destroy:0};
        this.on = true; this.mob = {...MOBS[i], cur:MOBS[i].hp}; U.hp = U.maxHp;
        const res = document.getElementById('battle-res'); res.style.display = 'none'; document.getElementById('modal-battle').style.display = 'flex';
        const field = document.getElementById('battle-field'); field.style.backgroundColor = "#111"; field.style.backgroundImage = `url('bg_${i}.png')`; field.style.backgroundSize = "cover"; field.style.backgroundPosition = "center";
        
        const usr = document.getElementById('btl-user'); const mob = document.getElementById('btl-mob');
        // 전투: 무조건 검 이미지
        let imgName = `sword${U.sword.lvl}`; if(U.sword.shiny) imgName += "_s";
        usr.src = `${imgName}.png`; usr.onerror = function() { this.src = `sword${U.sword.lvl}.png`; if(U.sword.shiny) this.style.filter = "invert(1) hue-rotate(180deg)"; };
        usr.className = "unit user"; 
        
        if(U.sword.shiny) usr.classList.add('shiny-aura');
        else {
            if(U.sword.lvl >= 20) usr.classList.add('aura-5'); else if(U.sword.lvl >= 16) usr.classList.add('aura-4'); else if(U.sword.lvl >= 13) usr.classList.add('aura-3'); else if(U.sword.lvl >= 9) usr.classList.add('aura-2'); else if(U.sword.lvl >= 6) usr.classList.add('aura-1');
        }
        mob.src = this.mob.img;
        
        this.userCooldown = 0; this.mobCooldown = 0;
        document.getElementById('btl-log').innerHTML = "";
        this.log(`⚔️ [${this.mob.n}] 전투 시작!`);
        this.upd();
        this.timer = requestAnimationFrame(this.loop.bind(this));
    },
    log: function(msg) { const box = document.getElementById('btl-log'); if(box) box.innerHTML = `<div>${msg}</div>` + box.innerHTML; },
    loop: function() { if(!this.on) return; this.userCooldown -= 16; this.mobCooldown -= 16; if(this.userCooldown <= 0) { this.userAtk(); this.userCooldown = 1000; } if(this.mobCooldown <= 0) { this.mobAtk(); this.mobCooldown = this.mob.spd; } if(this.on) this.timer = requestAnimationFrame(this.loop.bind(this)); },
    
    // [전투 이펙트] 검기 발사
    userAtk: function() {
        const group = document.getElementById('btl-player-group'); 
        group.classList.remove('slash-anim'); void group.offsetWidth; group.classList.add('slash-anim');
        
        const field = document.getElementById('battle-field');
        const wave = document.createElement('img');
        wave.className = 'sword-wave';
        wave.src = 'effect_slash.png'; 
        wave.onerror = function() {
            this.src = '';
            this.classList.add('css-wave');
        };
        field.appendChild(wave);
        setTimeout(() => wave.remove(), 400); 

        let dmg = Math.floor(U.atk * (0.9 + Math.random()*0.2)); 
        this.mob.cur -= dmg; 
        this.showDmg(dmg, document.getElementById('btl-mob'), '#fff'); 
        this.log(`<img src='icon_hit.png' class='ico-s'> 유저 공격! ${dmg}`);
        
        const m = document.getElementById('btl-mob'); 
        m.classList.add('hit'); 
        setTimeout(()=>m.classList.remove('hit'), 200); 
        this.upd(); 
        if(this.mob.cur <= 0) this.end(true);
    },

    mobAtk: function() {
        const m = document.getElementById('btl-mob'); m.classList.remove('mob-atk-anim'); void m.offsetWidth; m.classList.add('mob-atk-anim');
        if(this.mob.type === 'range') { this.fireProjectile(); } else { this.hitUser(); }
    },
    fireProjectile: function() {
        const field = document.getElementById('battle-field'); const b = document.createElement('img');
        if(this.mob.bullet) { b.src = this.mob.bullet; b.className = `bullet`; if(this.mob.css.includes('axe')) b.classList.add('spin-anim'); b.onerror = function() { this.src=''; this.className = `bullet bullet-fallback ${Battle.mob.css} ${Battle.mob.css.includes('axe') ? 'spin-anim' : ''}`; }; } else { b.className = `bullet bullet-fallback ${this.mob.css}`; }
        b.style.right = "80px"; b.style.top = "80px"; b.style.transition = "0.5s linear"; field.appendChild(b);
        setTimeout(() => { b.style.right = "calc(100% - 100px)"; }, 10); setTimeout(() => { b.remove(); if(this.on) this.hitUser(); }, 500);
    },
    hitUser: function() {
        if(Math.random() < 0.1) { this.showDmg("MISS", document.getElementById('btl-player-group'), '#aaa'); this.log(`<img src='icon_miss.png' class='ico-s'> 회피함!`); const u = document.getElementById('btl-player-group'); u.classList.add('dodge'); setTimeout(()=>u.classList.remove('dodge'), 300); return; }
        let dmg = Math.floor(this.mob.dmg * (0.8 + Math.random()*0.4));
        if(Math.random() < 0.05) { dmg = Math.floor(dmg * 1.5); this.log(`💥 치명타 피격! -${dmg}`); } else { this.log(`🛡️ 피격 -${dmg}`); }
        U.hp -= dmg;
        if(U.hp <= 0 && U.items.potion > 0) { U.items.potion--; U.hp += 50; if(U.hp > U.maxHp) U.hp = U.maxHp; this.showDmg("+50", document.getElementById('btl-player-group'), '#2ecc71'); this.log(`<img src='potion.png' class='ico-s'> 포션 사용!`); }
        this.showDmg(dmg, document.getElementById('btl-player-group'), '#e74c3c');
        const u = document.getElementById('btl-user'); u.classList.add('hit'); setTimeout(()=>u.classList.remove('hit'), 200);
        this.upd(); if(U.hp <= 0) this.end(false);
    },
    showDmg: function(val, target, color) { const el = document.createElement('div'); el.className = 'float-text'; el.innerText = val; el.style.color = color; const rect = target.getBoundingClientRect(); el.style.left = (rect.left + 20) + 'px'; el.style.top = (rect.top) + 'px'; document.body.appendChild(el); setTimeout(() => el.remove(), 800); },
    upd: function() { if(document.getElementById('btl-potion')) document.getElementById('btl-potion').innerText = U.items.potion; const m = this.mob; document.getElementById('txt-mob-hp').innerText = Math.max(0, m.cur); document.getElementById('bar-mob').style.width = Math.max(0, (m.cur/m.hp)*100) + "%"; document.getElementById('txt-user-hp').innerText = Math.max(0, U.hp); document.getElementById('bar-user').style.width = Math.max(0, (U.hp/U.maxHp)*100) + "%"; },
    end: function(win) {
        this.on = false; cancelAnimationFrame(this.timer); const res = document.getElementById('battle-res'); res.style.display = 'flex'; const t = document.getElementById('res-title'); const m = document.getElementById('res-msg');
        if(!U.stats) U.stats = {kill:0, destroy:0};
        if(win) { t.innerText = "승리!"; t.style.color = "gold"; const rGold = Math.floor(this.mob.g * (0.5 + Math.random())); m.innerText = `${rGold}G 획득`; U.gold += rGold; U.stats.kill = (U.stats.kill || 0) + 1; try { Game.checkAchieve(); } catch(e){} } 
        else { t.innerText = "패배..."; t.style.color = "red"; if(U.sword.lvl > 0) { let pMsg = ""; U.sword.lvl--; if(U.sword.shiny) { if(Math.random() < 0.05) { pMsg = "등급 하락 (이로치 유지!)"; } else { U.sword.shiny = false; pMsg = "등급 하락 & 이로치 소멸"; } } else { pMsg = "등급 하락 (-1)"; } m.innerHTML = `<span style='color:red'>${pMsg}</span>`; Game.addBook('sword', U.sword.lvl, U.sword.shiny); } else { m.innerText = ""; } }
        Game.save(); Game.updateAll();
    },
    retry: function() { const i = MOBS.findIndex(x => x.img === this.mob.img); this.start(i); },
    run: function() { this.on = false; cancelAnimationFrame(this.timer); document.getElementById('modal-battle').style.display = 'none'; this.log(`<img src='icon_run.png' class='ico-s'> 도망쳤습니다.`); },
    quit: function() { this.on = false; cancelAnimationFrame(this.timer); document.getElementById('modal-battle').style.display = 'none'; }
};

