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

    // 1. Получаем значения
    const T = parseInt(sliders.temp.value);
    const M = parseInt(sliders.manure.value);
    const V = parseInt(sliders.vol.value);

    // 2. Расчет активности бактерий (Оптимум 37°C)
    // Используем формулу колокола: чем дальше от 37, тем ниже активность
    let activityFactor = 1 - Math.abs(T - 37) / 35;
    activityFactor = Math.max(0.1, activityFactor); // Минимум 10% активности
    
    // 3. Расчет биогаза по формуле
    // Biogas = Manure * 70 * Activity
    const biogasTotal = Math.round(M * 70 * activityFactor);

    // Обновляем текст на странице
    displays.temp.textContent = T;
    displays.manure.textContent = M;
    displays.vol.textContent = V;
    displays.activity.textContent = Math.round(activityFactor * 100);
    displays.biogas.textContent = biogasTotal.toLocaleString();

    // Параметры отрисовки реактора (зависят от объема V)
    const reactorWidthBase = W * 0.7;
    const rw = reactorWidthBase * (0.5 + V / 4000); // Реактор чуть шире, если объем больше
    const rh = H * 0.7;
    const rx = (W - rw) / 2;
    const ry = (H - rh) / 2;
    const rb = ry + rh;

    // Отрисовка корпуса
    ctx.fillStyle = "#ecf0f1";
    ctx.beginPath();
    ctx.roundRect(rx, ry, rw, rh, 15);
    ctx.fill();
    ctx.strokeStyle = "#7f8c8d";
    ctx.lineWidth = 4;
    ctx.stroke();

    // Жидкость
    const liquidLevel = ry + rh * 0.4;
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
    for (let x = rx; x <= rx + rw; x += 2) {
        const w = Math.sin((x - rx) * 0.04 + wave) * 3 + Math.sin((x - rx) * 0.02 + wave * 0.8) * 2;
        ctx.lineTo(x, liquidLevel + w);
    }
    ctx.lineTo(rx + rw, rb);
    ctx.fill();
    ctx.restore();

    wave += 0.02 + (T / 100);

    // 4. Создание пузырьков (зависит от производства биогаза)
    const bubbleChance = biogasTotal / 10000; // Чем больше газа, тем чаще пузырьки
    if (bubbles.length < 100 && Math.random() < bubbleChance) {
        bubbles.push({
            x: rx + 20 + Math.random() * (rw - 40),
            y: rb - 10,
            r: 2 + Math.random() * 4,
            speed: 0.5 + Math.random() * 1.5,
            opacity: 0.8,
            popping: false
        });
    }

    // Отрисовка пузырьков
    for (let i = bubbles.length - 1; i >= 0; i--) {
        let b = bubbles[i];
        const surfaceY = liquidLevel + Math.sin((b.x - rx) * 0.04 + wave) * 3;

        if (!b.popping) {
            b.y -= b.speed;
            if (b.y <= surfaceY) b.popping = true;
        } else {
            b.r += 1;
            b.opacity -= 0.2;
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
