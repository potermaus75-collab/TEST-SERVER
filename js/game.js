/* [game.js] 메인 게임 로직 (Game 객체) */

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
        if(typeof U.items.scrap === 'undefined') U.items.scrap = 0;
        
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
                
                let scrapGain = 0;
                if(oldLvl <= 6) scrapGain = Math.floor(Math.random() * 3); 
                else if(oldLvl <= 15) scrapGain = Math.floor(Math.random() * 3) + 1; 
                else scrapGain = Math.floor(Math.random() * 3) + 4; 
                
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

    touchNpc: function() {
        const bubbleEl = document.querySelector('.npc-bubble');
        const imgEl = document.getElementById('npc-img-el');
        
        if(U.items.scrap >= 10) {
            U.items.scrap -= 10;
            U.items.charm++;
            if(imgEl) imgEl.src = "npc_goblin.png";
            bubbleEl.innerText = "오오! 귀한 고철이잖아? 이걸 주면 부적을 주지!";
            UI.toast("⚙️ 고철 10개를 건네주고 '파괴 방지 부적'을 받았습니다!");
            this.updateAll();
            this.save();
            return;
        }

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

        isSetEffectOn = (U.sword.lvl > 0 && U.sword.lvl === U.armor.lvl);
        if(isSetEffectOn) {
            finalAtk = Math.floor(finalAtk * 1.1); 
            finalHp = Math.floor(finalHp * 1.1);   
        }
        U.atk = finalAtk;
        U.maxHp = finalHp;

        setText('ui-name', U.name);
        setText('ui-gold', U.gold.toLocaleString());
        
        let atkTxt = U.atk.toLocaleString();
        let hpTxt = U.maxHp.toLocaleString();
        if(isSetEffectOn) {
            atkTxt += " <span style='color:#00ffff; font-size:0.8em;'>(Set!)</span>";
            hpTxt += " <span style='color:#00ffff; font-size:0.8em;'>(Set!)</span>";
        }
        document.getElementById('ui-atk').innerHTML = atkTxt;
        document.getElementById('ui-hp').innerHTML = hpTxt;
        
        if(document.getElementById('cnt-whetstone')) setText('cnt-whetstone', U.items.whetstone);
        if(document.getElementById('cnt-charm')) setText('cnt-charm', U.items.charm);
        
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
