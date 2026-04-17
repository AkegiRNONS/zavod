const canvas = document.getElementById("reactorCanvas");
const ctx = canvas.getContext("2d");

// Элементы управления
const sliders = {
    temp: document.getElementById("tempSlider"),
    manure: document.getElementById("manureSlider"),
    vol: document.getElementById("volSlider")
};

const displays = {
    temp: document.getElementById("tempValue"),
    manure: document.getElementById("manureValue"),
    vol: document.getElementById("volValue"),
    activity: document.getElementById("activityValue"),
    biogas: document.getElementById("biogasValue")
};

function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.resetTransform();
    ctx.scale(dpr, dpr);
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

let wave = 0;
const bubbles = [];
let bacteria = [];

function draw() {
    const W = canvas.clientWidth;
    const H = canvas.clientHeight;
    ctx.clearRect(0, 0, W, H);

    // Получаем входные данные
    const T = parseInt(sliders.temp.value);
    const M = parseInt(sliders.manure.value);
    const V = parseInt(sliders.vol.value);

    // Логика перегрузки и активности
    const isOverloaded = M > V / 15;
    let activityFactor = 1 - Math.abs(T - 37) / 35;
    activityFactor = Math.max(0.1, activityFactor);
    if (isOverloaded) activityFactor *= 0.6;

    const biogasTotal = Math.round(M * 70 * activityFactor);

    // Обновляем дисплеи
    displays.temp.textContent = T;
    displays.manure.textContent = M;
    displays.vol.textContent = V;
    displays.activity.textContent = Math.round(activityFactor * 100);
    displays.biogas.textContent = biogasTotal.toLocaleString();

    // Геометрия реактора
    const rw = W * 0.7 * (0.6 + V / 3000);
    const rh = H * 0.7;
    const rx = (W - rw) / 2;
    const ry = (H - rh) / 2;
    const rb = ry + rh;

    // Уровень жидкости
    const fill = Math.min(1, M / (V / 20));
    const liquidLevel = rb - (rh * fill);

    // Давление газа (визуализация сверху)
    const gasSpaceHeight = liquidLevel - ry;
    if (gasSpaceHeight > 0) {
        const pressurePulse = Math.sin(Date.now() / 400) * (biogasTotal / 10000);
        const gasOpacity = Math.min(0.6, biogasTotal / 40000);
        ctx.fillStyle = `rgba(44, 62, 80, ${gasOpacity})`;
        ctx.beginPath();
        ctx.roundRect(rx, ry, rw, gasSpaceHeight + pressurePulse, {tl: 15, tr: 15, bl: 0, br: 0});
        ctx.fill();
    }

    // КОРПУС РЕАКТОРА
    ctx.strokeStyle = isOverloaded ? "#e74c3c" : "#7f8c8d";
    ctx.lineWidth = isOverloaded ? 6 : 4;
    ctx.beginPath();
    ctx.roundRect(rx, ry, rw, rh, 15);
    ctx.stroke();

    // ВИЗУАЛИЗАЦИЯ ЖИДКОСТИ
    if (fill > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(rx, ry, rw, rh, 15);
        ctx.clip();
        const grad = ctx.createLinearGradient(0, liquidLevel, 0, rb);
        grad.addColorStop(0, "#8b5a2b");
        grad.addColorStop(1, "#5c3a18");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(rx, rb);
        ctx.lineTo(rx, liquidLevel);
        for (let x = rx; x <= rx + rw; x += 5) {
            const w = Math.sin((x - rx) * 0.04 + wave) * 3;
            ctx.lineTo(x, liquidLevel + w);
        }
        ctx.lineTo(rx + rw, rb);
        ctx.fill();
        ctx.restore();
    }

    // --- БАКТЕРИИ ---
    // Подсчет и рождение
    const requiredBacteria = Math.round(activityFactor * 80 * fill);
    while (bacteria.length < requiredBacteria) {
        bacteria.push({
            x: rx + 10 + Math.random() * (rw - 20),
            y: liquidLevel - Math.random() * (liquidLevel - ry - 15),
            vx: (Math.random() - 0.5) * 0.8,
            vy: (Math.random() - 0.5) * 0.8,
            life: 80 + Math.random() * 60,
            size: 2 + Math.random() * 2,
        });
    }
    // Движение и смерть
    for (let i = bacteria.length - 1; i >= 0; i--) {
        const b = bacteria[i];
        b.x += b.vx;
        b.y += b.vy;
        if (b.x < rx + 10 || b.x > rx + rw - 10) b.vx *= -1;
        if (b.y < ry + 10 || b.y > liquidLevel - 5) b.vy *= -1;
        b.life -= 1;
        if (activityFactor < 0.25 || b.life <= 0) bacteria.splice(i, 1);
    }
    // Отрисовка бактерий
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(rx, ry, rw, rh, 15);
    ctx.clip();
    for (const b of bacteria) {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(50,200,50,0.86)";
        ctx.fill();
    }
    ctx.restore();

    // --- НИЖНЯЯ ТРУБА С ВЫДАЧЕЙ УДОБРЕНИЙ ---
    const pipeW = 32;
    const pipeH = 32;
    const pipeX = rx + rw / 2 - pipeW / 2;
    // Труба
    ctx.fillStyle = "#9e7c46";
    ctx.fillRect(pipeX, rb, pipeW, pipeH);
    // Анимация выхода массы
    const manureOutSpeed = fill * 14 * activityFactor;
    ctx.fillStyle = "#8b5a2b";
    ctx.fillRect(pipeX + 6, rb + pipeH, pipeW - 12, manureOutSpeed);

    // ИНДИКАТОР ПЕРЕГРУЗКИ
    if (isOverloaded) {
        ctx.fillStyle = "#e74c3c";
        ctx.font = "bold 16px Arial";
        ctx.textAlign = "center";
        ctx.fillText("⚠️ ПЕРЕГРУЗКА", W / 2, ry - 10);
    }

    // ГАЗОВЫЕ ПУЗЫРЬКИ
    wave += 0.03 + (T / 150);
    const bubbleChance = biogasTotal / 12000;
    if (bubbles.length < 100 && Math.random() < bubbleChance && fill > 0.1) {
        bubbles.push({
            x: rx + 20 + Math.random() * (rw - 40),
            y: rb - 10,
            r: 2 + Math.random() * 4,
            speed: 0.5 + Math.random() * 1.5,
            opacity: 0.8,
            popping: false
        });
    }
    for (let i = bubbles.length - 1; i >= 0; i--) {
        let b = bubbles[i];
        if (!b.popping) {
            b.y -= b.speed;
            if (b.y <= liquidLevel) b.popping = true;
        } else {
            b.r += 1;
            b.opacity -= 0.1;
        }
        if (b.opacity > 0) {
            ctx.strokeStyle = `rgba(255, 255, 255, ${b.opacity})`;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
            ctx.stroke();
        } else {
            bubbles.splice(i, 1);
        }
    }

    // --- КПД реактора ---
    let efficiency = (1 - Math.abs(T - 37) / 37) * (isOverloaded ? 0.8 : 1) * (0.5 + fill / 2);
    efficiency = Math.max(0, Math.min(1, efficiency));
    // Показ в stats-panel
    if (!document.getElementById("efficiencyValue")) {
        const panel = document.querySelector(".stats-panel");
        if (panel) {
            const effBox = document.createElement("div");
            effBox.className = "stat-box";
            effBox.innerHTML = `
                <p>КПД реактора</p>
                <span id=\"efficiencyValue\">0</span> %
            `;
            panel.appendChild(effBox);
        }
    }
    const effSpan = document.getElementById("efficiencyValue");
    if (effSpan) effSpan.textContent = Math.round(efficiency * 100);

    requestAnimationFrame(draw);
}
draw();