/* [battle.js] 전투 시스템 */

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

