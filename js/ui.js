/* [ui.js] 화면 UI 처리 */

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

