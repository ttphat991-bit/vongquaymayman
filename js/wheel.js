/* ===== MOBILE ===== */
const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
let muted = false;

const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");
const spinBtn = document.getElementById("spin");
const resultEl = document.getElementById("result");
const historyEl = document.getElementById("history");
const adminBox = document.getElementById("admin");
const adminList = document.getElementById("adminList");
const statsBox = document.getElementById("stats");
const confettiBox = document.getElementById("confetti");
const spinSound = document.getElementById("spinSound");
const winSound = document.getElementById("winSound");
const clickSound = document.getElementById("clickSound");
let lastSliceIndex = null; // dùng để chống phát trùng tiếng



/* ===== RESPONSIVE ===== */
function resize(){
    const s = canvas.parentElement.clientWidth;
    canvas.width = s;
    canvas.height = s;
}
window.addEventListener("resize", resize);
resize();

/* ===== DATA ===== */
let prizes = JSON.parse(localStorage.getItem("prizes")) || [
    { text:"🎁 100.000đ", chance:20, color:"#fde047" },
    { text:"🎉 50.000đ", chance:20, color:"#86efac" },
    { text:"💰 200.000đ", chance:10, color:"#93c5fd" },
    { text:"😢 Chúc may mắn", chance:20, color:"#fca5a5" },
    { text:"🎁 20.000đ", chance:25, color:"#c4b5fd" },
    { text:"🎊 500.000đ", chance:5, color:"#fcd34d" }
];

let history = JSON.parse(localStorage.getItem("history") || "[]");
let stats = JSON.parse(localStorage.getItem("stats")) || {
    total: 0,
    items: prizes.map(() => 0)
};

let rotation = 0;
let fixedPrizeIndex = null;
let highlightIndex = null; // ô cần vẽ viền sáng
let highlightPulse = 0;   // dùng cho hiệu ứng nhấp nháy


/* ===== EP TONG % = 100 ===== */
function totalChance(){
    return prizes.reduce((s,p)=>s + Number(p.chance || 0), 0);
}

/* ===== SLICE ===== */
function getSlices(){
    const count = prizes.length;
    const angle = (Math.PI * 2) / count;

    return prizes.map((_, i)=>({
        start: i * angle,
        angle: angle
    }));
}



/* ===== DRAW ===== */
function draw(rot = 0){
    const c = canvas.width/2;
    const r = c - 5;
    ctx.clearRect(0,0,canvas.width,canvas.height);

    const slices = getSlices();
    slices.forEach((s,i)=>{
        ctx.beginPath();
        ctx.moveTo(c,c);
        ctx.arc(c,c,r, s.start+rot, s.start+s.angle+rot);
        ctx.fillStyle = prizes[i].color;
        ctx.fill();

        ctx.save();
        ctx.translate(c,c);
        ctx.rotate(s.start + s.angle/2 + rot);
        ctx.textAlign="right";
        ctx.font=`bold ${Math.max(12,canvas.width/25)}px Arial`;
        ctx.fillStyle="#000";
        ctx.fillText(prizes[i].text, r-10, 5);
        ctx.restore();
    });
	    // ✨ VẼ VIỀN SÁNG Ô TRÚNG
    if (highlightIndex !== null) {
        const s = slices[highlightIndex];
        ctx.save();
        ctx.beginPath();
        ctx.arc(c, c, r - 2, s.start + rot, s.start + s.angle + rot);
        ctx.strokeStyle = "rgba(255,215,0,0.9)";
        ctx.lineWidth = 8;
        ctx.shadowBlur = 20;
        ctx.shadowColor = "#fde047";
        ctx.stroke();
        ctx.restore();
    }
	    // ✨ VIỀN SÁNG NHẤP NHÁY Ô TRÚNG
    if (highlightIndex !== null) {
        const s = slices[highlightIndex];

        // tạo hiệu ứng pulse
        highlightPulse += 0.08;
        const glow = 6 + Math.sin(highlightPulse) * 4;

        ctx.save();
        ctx.beginPath();
        ctx.arc(c, c, r - 2, s.start + rot, s.start + s.angle + rot);
        ctx.strokeStyle = "rgba(255,215,0,0.95)";
        ctx.lineWidth = glow;
        ctx.shadowBlur = 15 + glow * 2;
        ctx.shadowColor = "#fde047";
        ctx.stroke();
        ctx.restore();
    }


}
draw();

/* ===== RANDOM ===== */
function pickPrize(){
    let r = Math.random() * 100;
    for(let i=0;i<prizes.length;i++){
        r -= prizes[i].chance;
        if(r<=0) return i;
    }
    return prizes.length - 1;
}


/* ===== HISTORY ===== */
function renderHistory(){
    historyEl.innerHTML = history.map(h=>`<div>${h}</div>`).join("");
}
renderHistory();

/* ===== STATS ===== */
function renderStats(){
    const totalCfg = totalChance();
    let warn = "";
    if(totalCfg !== 100){
        warn = `<div style="color:#f87171;font-weight:bold;margin-bottom:6px">
        ⚠️ Tổng % cấu hình = ${totalCfg}% (PHẢI = 100%)
        </div>`;
    }

    if(!stats.total){
        statsBox.innerHTML = warn + "<i>Chưa có dữ liệu</i>";
        return;
    }

    let html=`<table>
        <tr><th>Phần thưởng</th><th>% cấu hình</th><th>Lượt</th><th>% thực tế</th></tr>`;
    prizes.forEach((p,i)=>{
        const real=((stats.items[i]/stats.total)*100).toFixed(2);
        html+=`<tr>
            <td>${p.text}</td>
            <td>${p.chance}%</td>
            <td>${stats.items[i]}</td>
            <td>${real}%</td>
        </tr>`;
    });
    html+=`<tr>
        <th>Tổng</th>
        <th>${totalCfg}%</th>
        <th>${stats.total}</th>
        <th>100%</th>
    </tr></table>`;

    statsBox.innerHTML = warn + html;
}

/* ===== CONFETTI ===== */
function confetti(){
    confettiBox.innerHTML="";
    for(let i=0;i<80;i++){
        const s=document.createElement("span");
        s.style.left=Math.random()*100+"%";
        s.style.background=`hsl(${Math.random()*360},100%,50%)`;
        s.style.animationDuration=2+Math.random()*2+"s";
        confettiBox.appendChild(s);
        setTimeout(()=>s.remove(),4000);
    }
}

/* ===== SPIN ===== */
spinBtn.onclick = () => {
	if (spinBtn.disabled) return;

	lastSliceIndex = null;
	highlightIndex = null; // reset viền cũ
    const total = totalChance();
    if (total !== 100) {
        alert("⚠️ Tổng % phải = 100%");
        return;
    }

    spinBtn.disabled = true;
    spinSound.currentTime = 0;
    safePlay(spinSound);
	
	// chuẩn hoá góc trước khi quay
	rotation = rotation % (Math.PI * 2)

    // 🔒 chọn kết quả DUY NHẤT
    const i = fixedPrizeIndex !== null
        ? fixedPrizeIndex
        : pickPrize();

    const slices = getSlices();
    const mid = slices[i].start + slices[i].angle / 2;

    // kim ở 12 giờ
    const pointerAngle = -Math.PI / 2;

    // góc cần dừng
    const target = pointerAngle - (mid + rotation);
	
	
	
    // 🔑 GÓC BẮT ĐẦU & KẾT THÚC (QUAN TRỌNG)
    const startAngle = rotation;
    const endAngle = startAngle + 6 * Math.PI * 2 + target;

    const startTime = performance.now();
    const dur = 4000;

    function anim(t) {
        const p = Math.min((t - startTime) / dur, 1);
        const e = 1 - Math.pow(1 - p, 3);

        // 🔥 VẼ THEO GÓC THAY ĐỔI THỰC SỰ
        const currentAngle = startAngle + (endAngle - startAngle) * e;
        draw(currentAngle);
		
		// 🔊 TẠCH THEO TỐC ĐỘ QUAY (NHỎ → TO)
		const slices = getSlices();
		const sliceAngle = slices[0].angle;

		// góc kim (12 giờ)
		const pointerAngle = -Math.PI / 2;

		// góc kim so với vòng quay
		let relativeAngle = (pointerAngle - currentAngle) % (Math.PI * 2);
		if (relativeAngle < 0) relativeAngle += Math.PI * 2;

		// xác định kim đang ở ô nào
		const currentSlice = Math.floor(relativeAngle / sliceAngle);

		// % thời gian còn lại (0 → 1)
		const remain = 1 - p;

		if (currentSlice !== lastSliceIndex) {
			clickSound.pause();
			clickSound.currentTime = 0;

			// âm lượng: quay nhanh nhỏ – gần dừng to
			clickSound.volume = Math.min(1, 0.2 + (1 - remain) * 0.9);

			safePlay(clickSound);
			lastSliceIndex = currentSlice;

			// rung kim đồng bộ
			bouncePointer(0.12 + (1 - remain) * 0.25);
			// 📳 rung theo tốc độ
			
		}
		if (remain > 0.6) {
				vibratePhone(10);          // quay nhanh → rung rất nhẹ
			} else if (remain > 0.3) {
				vibratePhone(20);          // chậm dần
			} else {
				vibratePhone([30, 20, 30]); // gần dừng
			}
		
		

		

        if (p < 1) {
            requestAnimationFrame(anim);
        } else {
            // lưu lại góc cuối
            rotation = endAngle;
			highlightIndex = i;
			draw(rotation); // vẽ lại để thấy viền sáng

            spinSound.pause();
            safePlay(winSound);
			// 📳 RUNG MẠNH KHI TRÚNG
			vibratePhone([60, 30, 60, 30, 100]);
			// 🔊 TẠCH MẠNH Ô TRÚNG
			clickSound.pause();
			clickSound.currentTime = 0;
			clickSound.volume = 1;
			safePlay(clickSound);

			// rung kim mạnh khi trúng
			bouncePointer(0.6);
			
			
			
			const pointer = document.querySelector(".pointer");
			pointer.classList.remove("bounce"); // reset
			void pointer.offsetWidth;           // force reflow
			pointer.classList.add("bounce");

            resultEl.textContent = "🎯 Trúng: " + prizes[i].text;

            confetti();

            history.unshift(new Date().toLocaleString() + " — " + prizes[i].text);
            history = history.slice(0, 10);
            localStorage.setItem("history", JSON.stringify(history));
            renderHistory();

            stats.total++;
            stats.items[i]++;
            localStorage.setItem("stats", JSON.stringify(stats));
            renderStats();

            spinBtn.disabled = false;
			
			

			
        }
    }

    requestAnimationFrame(anim);
};


/* ===== ADMIN CRUD ===== */
function renderAdmin(){
    adminList.innerHTML="";

    prizes.forEach((p,i)=>{
        const row=document.createElement("div");
        row.className="admin-row";
        row.innerHTML=`
            <input type="text" value="${p.text}">
            <input type="number" value="${p.chance}" min="0">
            <input type="color" value="${p.color}">
            <button>❌</button>
        `;

        const [textInput,chanceInput,colorInput,delBtn] =
            row.querySelectorAll("input,button");

        // ✏️ sửa tên
        textInput.onchange=e=>{
            p.text=e.target.value;
            saveAdmin();
        };

        // ✏️ sửa %
        chanceInput.onchange=e=>{
            p.chance=+e.target.value;
            saveAdmin();
        };

        // 🎨 sửa màu
        colorInput.onchange=e=>{
            p.color=e.target.value;
            draw(rotation);
            saveAdmin(false);
        };

        // ❌ xóa
        delBtn.onclick=()=>{
            if(prizes.length<=2){
                alert("Cần ít nhất 2 phần thưởng");
                return;
            }
            if(confirm("Xóa phần thưởng này?")){
                prizes.splice(i,1);
                stats.items.splice(i,1);
                saveAdmin();
            }
        };

        adminList.appendChild(row);
    });

    renderStats();
    draw(rotation);
}

// 💾 lưu + reset stats
function saveAdmin(resetStats=true){
    localStorage.setItem("prizes",JSON.stringify(prizes));

    if(resetStats){
        stats={ total:0, items:prizes.map(()=>0) };
        localStorage.setItem("stats",JSON.stringify(stats));
    }

    renderAdmin();
}

/* ===== AUTO SPLIT PERCENT ===== */
const autoBtn = document.getElementById("autoPercent");

if (autoBtn) {
    autoBtn.onclick = () => {
        const n = prizes.length;
        if (n === 0) return;

        // chia đều, làm tròn 2 số
        const base = Math.floor((100 / n) * 100) / 100;
        let remain = 100;

        prizes.forEach((p, i) => {
            if (i === n - 1) {
                p.chance = +remain.toFixed(2); // phần dư dồn vào ô cuối
            } else {
                p.chance = base;
                remain -= base;
            }
        });

        localStorage.setItem("prizes", JSON.stringify(prizes));

        // reset thống kê vì thay đổi tỉ lệ
        stats = {
            total: 0,
            items: prizes.map(() => 0)
        };
        localStorage.setItem("stats", JSON.stringify(stats));

        renderAdmin();
        renderStats();
        draw(rotation);
    };
}

/* ===== CLEAR CACHE ===== */
const clearCacheBtn = document.getElementById("clearCache");

if (clearCacheBtn) {
    clearCacheBtn.onclick = () => {
        if (!confirm(
            "Reset phần thưởng\n" +
            "Trang sẽ tải lại!"
        )) return;

        // xóa cache
        localStorage.removeItem("prizes");
        //localStorage.removeItem("stats");
        //localStorage.removeItem("history");

        // reload để lấy dữ liệu mặc định
        location.reload();
    };
}

const xoalichsuBtn = document.getElementById("xoalichsu");

if (xoalichsuBtn) {
    xoalichsuBtn.onclick = () => {
        if (!confirm(
            "Xóa toàn bộ lịch sử?\n" +
            "Trang sẽ tải lại!"
        )) return;

        // xóa cache
        
        localStorage.removeItem("history");

        // reload để lấy dữ liệu mặc định
        location.reload();
    };
}






// ➕ thêm phần thưởng
document.getElementById("addPrize").onclick=()=>{
    prizes.push({
        text:"🎁 Phần thưởng mới",
        chance:0,
        color:"#ffffff"
    });
    stats.items.push(0);
    saveAdmin();
};

// bật tắt admin
document.getElementById("adminToggle").onclick=()=>{
    adminBox.style.display =
        adminBox.style.display==="block"?"none":"block";
    renderAdmin();
};

// Reset thống kê
document.getElementById("resetStats").onclick=()=>{
    if(confirm("Reset thống kê?")){
        stats={total:0,items:prizes.map(()=>0)};
        localStorage.setItem("stats",JSON.stringify(stats));
        renderStats();
    }
};

// 🔔 RUNG KIM THEO CƯỜNG ĐỘ
function bouncePointer(power = 0.3) {
    const pointer = document.querySelector(".pointer");
    if (!pointer) return;

    pointer.style.animation = "none";
    pointer.offsetHeight; // force reflow

    pointer.style.animation =
        `pointerBounce ${0.25 + power}s ease-out`;
}

// 📳 RUNG ĐIỆN THOẠI (SAFE)
function safePlay(audio){
    if(!audio || muted) return;
    audio.currentTime = 0;
    audio.play().catch(()=>{});
}

function vibratePhone(pattern){
    if(!isMobile) return;
    if(!("vibrate" in navigator)) return;
    navigator.vibrate(pattern);
}



// 🔁 LOOP NHẤP NHÁY VIỀN SÁNG
function highlightLoop() {
    if (highlightIndex !== null) {
        draw(rotation);
    }
    requestAnimationFrame(highlightLoop);
}
highlightLoop();

// Nút bật tắt âm thanh
const muteBtn = document.getElementById("muteBtn");
muteBtn.onclick = ()=>{
    muted = !muted;
    spinSound.muted = winSound.muted = clickSound.muted = muted;
    muteBtn.textContent = muted ? "🔇" : "🔊";
};
