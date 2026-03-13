const canvas = document.getElementById("reactorCanvas");
const ctx = canvas.getContext("2d");

function resizeCanvas(){
canvas.width = canvas.offsetWidth;
canvas.height = canvas.offsetHeight;
}
resizeCanvas();
window.addEventListener("resize",resizeCanvas);

let wave=0;
const bubbles=[];

function createBubble(rx,rw,rb){
bubbles.push({
x:rx+20+Math.random()*(rw-40),
y:rb,
r:3+Math.random()*6,
speed:0.6+Math.random()*1.2,
wobble:Math.random()*Math.PI*2
});
}

function draw(){

ctx.clearRect(0,0,canvas.width,canvas.height);

const W=canvas.width;
const H=canvas.height;

const rw=W*0.6;
const rh=H*0.75;
const rx=(W-rw)/2;
const ry=H*0.1;
const rb=ry+rh;

ctx.fillStyle="#bdc3c7";
ctx.beginPath();
ctx.roundRect(rx,ry,rw,rh,10);
ctx.fill();

ctx.strokeStyle="#5d6d7e";
ctx.lineWidth=2;
ctx.stroke();

const liquidLevel=ry+rh*0.6;

ctx.fillStyle="#8b5a2b";

ctx.beginPath();
ctx.moveTo(rx,liquidLevel);

for(let x=rx;x<=rx+rw;x++){
const w=Math.sin(x*0.03+wave)*4;
ctx.lineTo(x,liquidLevel+w);
}

ctx.lineTo(rx+rw,rb);
ctx.lineTo(rx,rb);
ctx.closePath();
ctx.fill();

wave+=0.04;

if(Math.random()<0.15){
createBubble(rx,rw,rb-10);
}

for(let i=bubbles.length-1;i>=0;i--){

let b=bubbles[i];

b.y-=b.speed;
b.wobble+=0.05;
b.x+=Math.sin(b.wobble)*0.5;

ctx.strokeStyle="rgba(255,255,255,0.7)";
ctx.lineWidth=1;

ctx.beginPath();
ctx.arc(b.x,b.y,b.r,0,Math.PI*2);
ctx.stroke();

if(b.y-b.r<liquidLevel){
bubbles.splice(i,1);
}

}

requestAnimationFrame(draw);
}

draw();