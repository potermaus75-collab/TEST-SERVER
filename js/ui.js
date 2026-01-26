/* [js/ui.js] renderList 함수 교체 */

    renderList: function() {
        // 1. 장비 목록 렌더링
        const il = document.getElementById('inv-list');
        if(il) {
            il.innerHTML = "";
            U.inv.forEach((it, i) => {
                const d = document.createElement('div'); d.className = 'item-slot';
                if(it) {
                    let prefix = (it.type === 's') ? 'sword' : 'armor';
                    let src = `images/${prefix}${it.l}.png`; // 이미지 경로 주의 (폴더 구조에 맞게)
                    // 만약 images 폴더 적용 안했으면: let src = `${prefix}${it.l}.png`;
                    // 현재 상태에 맞게:
                    let imgSrc = `${prefix}${it.l}.png`; 

                    d.innerHTML = `<img src="${imgSrc}" onerror="this.src='${prefix}0.png'"><span class="item-lvl">+${it.l}</span>`;
                    if(it.s) d.style.border = "1px solid #ff00ff";
                    d.onclick = () => Game.swap(i);
                } else { d.innerHTML = `<span style="color:#444">+</span>`; }
                il.appendChild(d);
            });
        }

        // 2. 재료 목록 렌더링 (NEW)
        const ml = document.getElementById('inv-mat-list');
        if(ml) {
            ml.innerHTML = "";
            
            // 표시할 재료 리스트 정의
            const mats = [
                { k:'potion', n:'포션', img:'potion.png' },
                { k:'whetstone', n:'숫돌', img:'whetstone.png' },
                { k:'charm', n:'부적', img:'charm.png' },
                { k:'scrap', n:'검의 파편', img:'icon_destroy.png' } // 고철 -> 검의 파편
            ];

            mats.forEach(mat => {
                const count = U.items[mat.k] || 0;
                if(count > 0) { // 개수가 0보다 클 때만 표시 (옵션)
                    const d = document.createElement('div'); d.className = 'item-slot';
                    // 파편 이미지가 없으면 파괴 아이콘 등을 임시로 사용
                    let imgTag = `<img src="${mat.img}" onerror="this.src='sword0.png'">`;
                    d.innerHTML = `${imgTag}<span class="mat-count">${count}</span>`;
                    d.onclick = () => UI.toast(`${mat.n}: ${count}개 보유 중`);
                    ml.appendChild(d);
                }
            });
            
            // 재료가 하나도 없으면 안내 문구
            if(ml.innerHTML === "") {
                ml.innerHTML = "<div style='color:#555; font-size:0.8rem; grid-column:span 4; text-align:center;'>재료가 없습니다.</div>";
            }
        }

        // 3. 도감 및 사냥터 (기존 코드 유지)
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

