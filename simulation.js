const canvas = document.getElementById("reactorCanvas");
const ctx = canvas.getContext("2d");

let waveOffset = 0;

// ✅ Адаптация canvas под реальный размер на экране
function resizeCanvas() {
    const ratio = window.devicePixelRatio || 1;
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;

    canvas.width = width * ratio;
    canvas.height = height * ratio;

    canvas.style.width = width + "px";
    canvas.style.height = height + "px";

    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// 🫧 Пузырьки газа
const bubbles = [];

function createBubble(reactorX, reactorWidth, liquidBottom) {
bubbles.push({
x: reactorX + 20 + Math.random() * (reactorWidth - 40),
y: liquidBottom,
r: 3 + Math.random() * 6,
speed: 0.5 + Math.random() * 1.2,
wobble: Math.random() * Math.PI * 2,
wobbleSpeed: 0.03 + Math.random() * 0.03,
opacity: 0.6 + Math.random() * 0.4
});
}

function drawReactor() {
ctx.clearRect(0, 0, canvas.width, canvas.height);


const W = canvas.width;
const H = canvas.height;

const reactorWidth  = W * 0.6;
const reactorHeight = H * 0.75;
const reactorX = (W - reactorWidth) / 2;
const reactorY = H * 0.1;
const reactorBottom = reactorY + reactorHeight;

// === КОРПУС РЕАКТОРА — металлический градиент ===
const wallGrad = ctx.createLinearGradient(reactorX, 0, reactorX + reactorWidth, 0);
wallGrad.addColorStop(0,   "#95a5a6");
wallGrad.addColorStop(0.1, "#bdc3c7");
wallGrad.addColorStop(0.5, "#ecf0f1");
wallGrad.addColorStop(0.9, "#bdc3c7");
wallGrad.addColorStop(1,   "#7f8c8d");
ctx.fillStyle = wallGrad;
ctx.beginPath();
ctx.roundRect(reactorX, reactorY, reactorWidth, reactorHeight, 8);
ctx.fill();

// Тёмный контур корпуса
ctx.strokeStyle = "#5d6d7e";
ctx.lineWidth = 2;
ctx.beginPath();
ctx.roundRect(reactorX, reactorY, reactorWidth, reactorHeight, 8);
ctx.stroke();

// === ЖИДКОСТЬ — биомасса с градиентом ===
const liquidLevel = reactorY + reactorHeight * 0.62;

const liquidGrad = ctx.createLinearGradient(0, liquidLevel, 0, reactorBottom);
liquidGrad.addColorStop(0,   "#c17f3a");
liquidGrad.addColorStop(0.3, "#a0622a");
liquidGrad.addColorStop(1,   "#4a2810");

ctx.fillStyle = liquidGrad;
ctx.beginPath();
ctx.moveTo(reactorX, liquidLevel);

for (let x = reactorX; x <= reactorX + reactorWidth; x++) {
    const wave = Math.sin((x * 0.025) + waveOffset) * 5
               + Math.sin((x * 0.05)  + waveOffset * 1.3) * 2;
    ctx.lineTo(x, liquidLevel + wave);
}

ctx.lineTo(reactorX + reactorWidth, reactorBottom - 8);
ctx.lineTo(reactorX, reactorBottom - 8);
ctx.closePath();
ctx.fill();

// Блик на поверхности жидкости
ctx.strokeStyle = "rgba(255, 200, 100, 0.3)";
ctx.lineWidth = 2;
ctx.beginPath();
for (let x = reactorX + 10; x <= reactorX + reactorWidth - 10; x++) {
    const wave = Math.sin((x * 0.025) + waveOffset) * 5
               + Math.sin((x * 0.05)  + waveOffset * 1.3) * 2;
    if (x === reactorX + 10) ctx.moveTo(x, liquidLevel + wave);
    else ctx.lineTo(x, liquidLevel + wave);
}
ctx.stroke();

waveOffset += 0.03;

// === ПУЗЫРЬКИ ===
// Генерируем новые пузырьки случайно
if (Math.random() < 0.15) {
    createBubble(reactorX, reactorWidth, reactorBottom - 10);
}

const gasZoneTop = reactorY + 10;

for (let i = bubbles.length - 1; i >= 0; i--) {
    const b = bubbles[i];
    b.y -= b.speed;
    b.wobble += b.wobbleSpeed;
    b.x += Math.sin(b.wobble) * 0.6;

    // Пузырёк ниже поверхности жидкости — коричневатый
    // Выше — прозрачный газовый
    const inLiquid = b.y > liquidLevel;

    if (inLiquid) {
        ctx.strokeStyle = `rgba(200, 140, 60, ${b.opacity})`;
        ctx.fillStyle   = `rgba(220, 170, 80, ${b.opacity * 0.3})`;
    } else {
        ctx.strokeStyle = `rgba(160, 200, 160, ${b.opacity * 0.7})`;
        ctx.fillStyle   = `rgba(180, 230, 180, ${b.opacity * 0.15})`;
    }

    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Блик на пузырьке
    ctx.fillStyle = `rgba(255,255,255,${b.opacity * 0.5})`;
    ctx.beginPath();
    ctx.arc(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Удаляем пузырёк, если ушёл за верх реактора
    if (b.y + b.r < gasZoneTop) {
        bubbles.splice(i, 1);
    }
}

// === ТРУБА ДЛЯ ГАЗА (сверху реактора) ===
const pipeX = reactorX + reactorWidth / 2 - 10;
const pipeW = 20;
const pipeTopY = reactorY - 40;
const pipeBottomY = reactorY;

const pipeGrad = ctx.createLinearGradient(pipeX, 0, pipeX + pipeW, 0);
pipeGrad.addColorStop(0,   "#7f8c8d");
pipeGrad.addColorStop(0.5, "#bdc3c7");
pipeGrad.addColorStop(1,   "#7f8c8d");
ctx.fillStyle = pipeGrad;
ctx.fillRect(pipeX, pipeTopY, pipeW, pipeBottomY - pipeTopY);

// Стрелка газа вверх
ctx.fillStyle = "rgba(100, 200, 100, 0.8)";
ctx.beginPath();
const arrowCX = pipeX + pipeW / 2;
ctx.moveTo(arrowCX,        pipeTopY - 12);
ctx.lineTo(arrowCX - 8,    pipeTopY + 4);
ctx.lineTo(arrowCX + 8,    pipeTopY + 4);
ctx.closePath();
ctx.fill();

// Подпись «Биогаз»
ctx.fillStyle = "#27ae60";
ctx.font = `bold ${Math.max(10, W * 0.022)}px Segoe UI, sans-serif`;
ctx.textAlign = "center";
ctx.fillText("Биогаз ↑", arrowCX, pipeTopY - 16);

// === ПОДПИСЬ ВНУТРИ РЕАКТОРА ===
ctx.fillStyle = "rgba(255,255,255,0.7)";
ctx.font = `${Math.max(9, W * 0.018)}px Segoe UI, sans-serif`;
ctx.textAlign = "center";
ctx.fillText("Биомасса (брожение)", reactorX + reactorWidth / 2, liquidLevel + reactorHeight * 0.18);

// === НОЖКИ РЕАКТОРА ===
ctx.fillStyle = "#5d6d7e";
const legW = 14;
const legH = H * 0.08;
const legY = reactorBottom;

ctx.fillRect(reactorX + 20,               legY, legW, legH);
ctx.fillRect(reactorX + reactorWidth - 20 - legW, legY, legW, legH);


}

function animate() {
drawReactor();
requestAnimationFrame(animate);
}

animate();