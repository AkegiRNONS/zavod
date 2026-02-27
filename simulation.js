const canvas = document.getElementById("reactorCanvas");
const ctx = canvas.getContext("2d");

let waveOffset = 0;

function drawReactor() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Корпус реактора
    ctx.fillStyle = "#7f8c8d";
    ctx.fillRect(150, 50, 300, 300);

    // Жидкость
    ctx.fillStyle = "#8e5a2a";
    ctx.beginPath();

    const liquidHeight = 220;
    const baseY = 50 + liquidHeight;

    ctx.moveTo(150, baseY);

    for (let x = 150; x <= 450; x++) {
        let wave = Math.sin((x * 0.03) + waveOffset) * 8;
        ctx.lineTo(x, baseY - 150 + wave);
    }

    ctx.lineTo(450, 350);
    ctx.lineTo(150, 350);
    ctx.closePath();
    ctx.fill();

    waveOffset += 0.05;
}

function animate() {
    drawReactor();
    requestAnimationFrame(animate);
}

animate();