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

function draw() {
    const W = canvas.clientWidth;
    const H = canvas.clientHeight;
    ctx.clearRect(0, 0, W, H);

    // 1. Получаем входные данные
    const T = parseInt(sliders.temp.value);
    const M = parseInt(sliders.manure.value);
    const V = parseInt(sliders.vol.value);

    // 2. Логика перегрузки и активности
    const isOverloaded = M > V / 15;
    let activityFactor = 1 - Math.abs(T - 37) / 35;
    activityFactor = Math.max(0.1, activityFactor);
    
    // Если перегрузка — режем активность на 40%
    if (isOverloaded) {
        activityFactor *= 0.6;
    }

    const biogasTotal = Math.round(M * 70 * activityFactor);

    // Обновляем дисплеи
    displays.temp.textContent = T;
    displays.manure.textContent = M;
    displays.vol.textContent = V;
    displays.activity.textContent = Math.round(activityFactor * 100);
    displays.biogas.textContent = biogasTotal.toLocaleString();

    // 3. Геометрия реактора
    const rw = W * 0.7 * (0.6 + V / 3000);
    const rh = H * 0.7;
    const rx = (W - rw) / 2;
    const ry = (H - rh) / 2;
    const rb = ry + rh;

    // --- ФИЗИКА 1: Уровень жидкости ---
    const fill = Math.min(1, M / (V / 20));
    // liquidLevel теперь динамический. Если M=0, он равен rb (дно).
    const liquidLevel = rb - (rh * fill);

    // --- ФИЗИКА 3: Давление газа (визуализация сверху) ---
    const gasSpaceHeight = liquidLevel - ry;
    if (gasSpaceHeight > 0) {
        // Пульсация давления
        const pressurePulse = Math.sin(Date.now() / 400) * (biogasTotal / 10000);
        // Насыщенность цвета от производства газа
        const gasOpacity = Math.min(0.6, biogasTotal / 40000);
        
        ctx.fillStyle = `rgba(44, 62, 80, ${gasOpacity})`;
        ctx.beginPath();
        ctx.roundRect(rx, ry, rw, gasSpaceHeight + pressurePulse, {tl: 15, tr: 15, bl: 0, br: 0});
        ctx.fill();
    }

    // --- КОРПУС РЕАКТОРА ---
    ctx.strokeStyle = isOverloaded ? "#e74c3c" : "#7f8c8d"; // Краснеет при перегрузке
    ctx.lineWidth = isOverloaded ? 6 : 4;
    ctx.beginPath();
    ctx.roundRect(rx, ry, rw, rh, 15);
    ctx.stroke();

    // --- ВИЗУАЛИЗАЦИЯ ЖИДКОСТИ ---
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

    // --- ИНДИКАТОР ПЕРЕГРУЗКИ ---
    if (isOverloaded) {
        ctx.fillStyle = "#e74c3c";
        ctx.font = "bold 16px Arial";
        ctx.textAlign = "center";
        ctx.fillText("⚠️ ПЕРЕГРУЗКА", W / 2, ry - 10);
    }

    // --- ГАЗОВЫЕ ПУЗЫРЬКИ ---
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

    requestAnimationFrame(draw);
}
draw();
