const canvas = document.getElementById("reactorCanvas");
const ctx = canvas.getContext("2d");

// Элементы управления температурой (берем из вашего HTML)
const tempSlider = document.getElementById("tempSlider");
const tempValue = document.getElementById("tempValue");

// ✅ 1. Поддержка Retina-экранов и правильный ресайз
function resizeCanvas() {
    // Получаем реальные размеры элемента на странице
    const rect = canvas.getBoundingClientRect();
    // Определяем плотность пикселей устройства (для телефонов обычно 2 или 3)
    const dpr = window.devicePixelRatio || 1;
    
    // Устанавливаем физическое разрешение холста
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    // Масштабируем контекст, чтобы рисовать в привычных CSS-пикселях
    ctx.resetTransform();
    ctx.scale(dpr, dpr);
}

// Вызываем при старте и при изменении размера окна
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

let wave = 0;
const bubbles = [];
const MAX_BUBBLES = 60; // Ограничение для 60 FPS на слабых телефонах

function createBubble(rx, rw, rb) {
    bubbles.push({
        x: rx + 20 + Math.random() * (rw - 40),
        y: rb - 10, // Появляются чуть выше дна
        r: 3 + Math.random() * 5, // Немного разный размер
        speed: 0.8 + Math.random() * 1.5,
        wobble: Math.random() * Math.PI * 2,
        opacity: 0.7 + Math.random() * 0.3, // ✅ Начальная прозрачность
        popping: false // ✅ Флаг: лопается ли пузырек сейчас
    });
}

function draw() {
    // Берем CSS-размеры (так как мы масштабировали контекст через dpr)
    const W = canvas.clientWidth;
    const H = canvas.clientHeight;

    ctx.clearRect(0, 0, W, H);

    // Считываем текущую температуру из ползунка
    let currentTemp = 35;
    if (tempSlider) {
        currentTemp = parseInt(tempSlider.value);
        if (tempValue) tempValue.textContent = currentTemp;
    }

    // Динамика от температуры: выше градус = быстрее волны и больше газа
    const waveSpeed = 0.02 + (currentTemp / 60) * 0.04;
    const bubbleChance = 0.05 + (currentTemp / 60) * 0.2;

    // Размеры реактора (адаптивные)
    const rw = W * 0.8; // Ширина 80% от доступного места
    const rh = H * 0.8;
    const rx = (W - rw) / 2;
    const ry = H * 0.1;
    const rb = ry + rh;

    // --- Отрисовка корпуса реактора ---
    ctx.fillStyle = "#ecf0f1";
    ctx.beginPath();
    ctx.roundRect(rx, ry, rw, rh, 15);
    ctx.fill();

    ctx.strokeStyle = "#7f8c8d";
    ctx.lineWidth = 4;
    ctx.stroke();

    // Уровень жидкости (заполнен на 60%)
    const liquidLevel = ry + rh * 0.4;

    // --- Отрисовка биомассы (жидкости) ---
    // ✅ Используем clip(), чтобы жидкость не вылезала за закругленные края реактора
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(rx, ry, rw, rh, 15);
    ctx.clip(); // Всё, что рисуется дальше, останется внутри этой формы

    // Создаем красивый градиент
    const gradient = ctx.createLinearGradient(0, liquidLevel, 0, rb);
    gradient.addColorStop(0, "#8b5a2b");
    gradient.addColorStop(1, "#5c3a18");
    ctx.fillStyle = gradient;

    ctx.beginPath();
    ctx.moveTo(rx, rb);
    ctx.lineTo(rx, liquidLevel);

    // ✅ Мягкие волны (комбинация двух синусоид)
    for (let x = rx; x <= rx + rw; x += 2) {
        const w = Math.sin((x - rx) * 0.04 + wave) * 4 + 
                  Math.sin((x - rx) * 0.02 + wave * 0.8) * 2;
        ctx.lineTo(x, liquidLevel + w);
    }

    ctx.lineTo(rx + rw, rb);
    ctx.closePath();
    ctx.fill();
    ctx.restore(); // Отменяем clip()

    wave += waveSpeed;

    // --- Генерация газа ---
    if (bubbles.length < MAX_BUBBLES && Math.random() < bubbleChance) {
        createBubble(rx, rw, rb);
    }

    // --- Обновление и отрисовка пузырьков ---
    for (let i = bubbles.length - 1; i >= 0; i--) {
        let b = bubbles[i];

        // Точное вычисление высоты волны в том месте, где находится пузырек
        const surfaceY = liquidLevel + 
                         Math.sin((b.x - rx) * 0.04 + wave) * 4 + 
                         Math.sin((b.x - rx) * 0.02 + wave * 0.8) * 2;

        if (!b.popping) {
            b.y -= b.speed;
            b.wobble += 0.05;
            b.x += Math.sin(b.wobble) * 0.5; // Покачивание

            // Если пузырек достиг поверхности волны — начинаем лопать
            if (b.y - b.r <= surfaceY) {
                b.popping = true;
            }
        } else {
            // ✅ Анимация лопания
            b.r += 0.8; // Резко увеличивается
            b.opacity -= 0.15; // Растворяется
        }

        // Рисуем пузырек, если он еще видим
        if (b.opacity > 0) {
            ctx.fillStyle = `rgba(255, 255, 255, ${b.opacity * 0.3})`;
            ctx.strokeStyle = `rgba(255, 255, 255, ${b.opacity})`;
            ctx.lineWidth = 1.5;

            ctx.beginPath();
            ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        } else {
            // Безопасно удаляем из массива
            bubbles.splice(i, 1);
        }
    }

    requestAnimationFrame(draw);
}

// Запускаем симуляцию
requestAnimationFrame(draw);
