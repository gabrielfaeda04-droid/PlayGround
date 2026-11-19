const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
let W,H,DPR,started=false,won=false,last=0;
const keys={},player={x:0,y:0,r:13,angle:0,carry:false,energy:100,inv:0,step:0};
let leaves=[],beetles=[],obstacles=[],particles=[];
const goal=12;
function resize(){DPR=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;canvas.width=W*DPR;canvas.height=H*DPR;canvas.style.width=W+'px';canvas.style.height=H+'px';ctx.setTransform(DPR,0,0,DPR,0,0)}addEventListener('resize',resize);resize();
function rnd(a,b){return a+Math.random*(b-a)}
function reset(){
 player.x=0;player.y=210;player.carry=false;player.energy=100;player.inv=0;
 leaves=[];beetles=[];obstacles=[];particles=[];
 for(let i=0;i<goal;i++) leaves.push({x:rnd(-620,620),y:rnd(-330,330),taken:false,rot:rnd(0,6)});
 for(let i=0;i<7;i++) beetles.push({x:rnd(-700,700),y:rnd(-380,380),vx:rnd(-1,1),vy:rnd(-1,1),phase:rnd(0,6)});
 for(let i=0;i<38;i++){let x=rnd(-760,760),y=rnd(-430,430);if(Math.abs(x)<100&&Math.abs(y-210)<100)continue;obstacles.push({x,y,s:rnd(5,13),type:Math.random()<.25?'rock':'grass'})}
 document.getElementById('score').textContent='0 / '+goal;document.getElementById('energy').style.width='100%';document.getElementById('objectiveText').textContent='Gather '+goal+' leaves';
}
reset();
addEventListener('keydown',e=>{keys[e.key.toLowerCase()]=true;if(e.key===' '||e.key==='Shift')keys.dash=true});
addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false;if(e.key===' '||e.key==='Shift')keys.dash=false});
// Camera transform: isometric-ish world top-down with pitch
function cam(){let z=.72;return{x:W/2-player.x,y:H*.58-player.y*z,scale:1,z}}
function world(p){let c=cam();return{x:c.x+p.x,y:c.y+p.y*c.z}}
function ellipse(x,y,rx,ry,color){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=color;ctx.fill()}
function drawGround(){
 let c=cam();ctx.fillStyle='#71805a';ctx.fillRect(0,0,W,H);
 // soft vignette / map
 ctx.save();ctx.translate(c.x,c.y);let z=c.z;
 ctx.fillStyle='#7f8e63';ctx.beginPath();ctx.moveTo(-760,-460*z);ctx.lineTo(760,-460*z);ctx.lineTo(760,460*z);ctx.lineTo(-760,460*z);ctx.closePath();ctx.fill();
 ctx.strokeStyle='#6d7b58';ctx.lineWidth=1;for(let i=-800;i<=800;i+=80){ctx.beginPath();ctx.moveTo(i,-460*z);ctx.lineTo(i,460*z);ctx.stroke();ctx.beginPath();ctx.moveTo(-760,i*z);ctx.lineTo(760,i*z);ctx.stroke()}
 // colony nest
 ellipse(0,210,110,58,'#5a5139');ellipse(0,210,85,43,'#9b7447');ellipse(0,210,55,28,'#302e25');ellipse(0,210,38,18,'#171d17');
 ctx.restore();
}
function drawLeaf(l){if(l.taken)return;let p=world(l);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(l.rot);ellipse(0,5,11,5,'#43513755');ctx.fillStyle='#8ca55d';ctx.strokeStyle='#52673e';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-15,0);ctx.quadraticCurveTo(-5,-14,15,-2);ctx.quadraticCurveTo(4,12,-15,0);ctx.fill();ctx.stroke();ctx.restore()}
function drawObstacle(o){let p=world(o);ellipse(p.x,p.y+o.s*.5,o.s*1.3,o.s*.6,'#4a593c55');if(o.type==='rock'){ctx.fillStyle='#687064';ctx.beginPath();ctx.moveTo(p.x-o.s,p.y);ctx.lineTo(p.x-o.s*.7,p.y-o.s*.7);ctx.lineTo(p.x+o.s*.3,p.y-o.s);ctx.lineTo(p.x+o.s,p.y-o.s*.2);ctx.lineTo(p.x+o.s*.7,p.y+o.s*.3);ctx.closePath();ctx.fill()}else{ctx.strokeStyle='#596b43';ctx.lineWidth=2;for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(p.x+i*3,p.y+5);ctx.quadraticCurveTo(p.x+i*5,p.y-o.s,p.x+i*8,p.y-o.s*.5);ctx.stroke()}}}
function drawBeetle(b){let p=world(b);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(Math.atan2(b.vy,b.vx)+Math.PI/2);ellipse(0,9,18,7,'#30351f55');ellipse(0,-2,15,20,'#1b211b');ellipse(-5,-5,7,12,'#293528');ellipse(5,-5,7,12,'#293528');ctx.fillStyle='#0d110d';ctx.beginPath();ctx.arc(0,-19,6,0,7);ctx.fill();ctx.strokeStyle='#151913';ctx.lineWidth=3;for(let s of [-1,1]){ctx.beginPath();ctx.moveTo(s*10,-8);ctx.lineTo(s*20,2);ctx.moveTo(s*10,4);ctx.lineTo(s*21,12);ctx.stroke()}ctx.restore()}
function drawAnt(){let p=world(player);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(player.angle+Math.PI/2);ellipse(0,11,12,5,'#26301e55');ctx.fillStyle='#d6a36a';ctx.beginPath();ctx.ellipse(0,16,8,13,0,0,7);ctx.ellipse(0,-13,7,10,0,0,7);ctx.fill();ctx.fillStyle='#171811';ctx.beginPath();ctx.arc(0,-24,7,0,7);ctx.fill();ctx.strokeStyle='#171811';ctx.lineWidth=3;for(let s of [-1,1])for(let y of [-12,0,10]){ctx.beginPath();ctx.moveTo(s*7,y);ctx.lineTo(s*21,y+(y%3)*2);ctx.stroke()}if(player.carry){ctx.fillStyle='#96ad62';ctx.strokeStyle='#52673e';ctx.beginPath();ctx.moveTo(-15,-31);ctx.quadraticCurveTo(-3,-43,16,-33);ctx.quadraticCurveTo(5,-24,-15,-31);ctx.fill();ctx.stroke()}ctx.restore()}
function update(dt){
 let dx=(keys.d||keys.arrowright?1:0)-(keys.a||keys.arrowleft?1:0),dy=(keys.s||keys.arrowdown?1:0)-(keys.w||keys.arrowup?1:0);
 let len=Math.hypot(dx,dy);if(len){dx/=len;dy/=len;player.angle=Math.atan2(dy,dx)}
 let dash=(keys.dash||keys[' '])&&player.energy>8;let speed=dash?300:165;if(dash){player.energy-=32*dt;if(player.inv<=0){for(let i=0;i<3;i++)particles.push({x:player.x,y:player.y,vx:rnd(-30,30),vy:rnd(-30,30),life:.25})}}else player.energy=Math.min(100,player.energy+18*dt);
 document.getElementById('energy').style.width=player.energy+'%';
 player.x+=dx*speed*dt;player.y+=dy*speed*.72*dt;player.x=Math.max(-730,Math.min(730,player.x));player.y=Math.max(-390,Math.min(390,player.y));player.step+=len*dt*(dash?18:10);player.inv=Math.max(0,player.inv-dt);
 if(keys.e||touchLift){let near=Math.hypot(player.x,player.y-210)<85;if(!player.carry&&near){end(true);return}}
 for(let l of leaves){if(!l.taken&&Math.hypot(player.x-l.x,player.y-l.y)<24){l.taken=true;player.carry=true;document.getElementById('objectiveText').textContent='Return to the nest' }}
 if(player.carry&&Math.hypot(player.x,player.y-210)<60){player.carry=false;let n=Number(document.getElementById('score').textContent.split('/')[0].trim())+1;document.getElementById('score').textContent=n+' / '+goal;if(n>=goal)end(true);else document.getElementById('objectiveText').textContent='Gather more leaves'}
 for(let b of beetles){let tx=(b.phase<3?player.x:0),ty=(b.phase<3?player.y:210);let bx=player.x-b.x,by=player.y-b.y,dist=Math.hypot(bx,by);if(dist<300||b.phase<3){b.vx+=(bx/dist||0)*dt*20;b.vy+=(by/dist||0)*dt*20}else{b.vx+=Math.sin(performance.now*.001+b.phase)*dt*15;b.vy+=Math.cos(performance.now*.001+b.phase)*dt*15}let v=Math.hypot(b.vx,b.vy);if(v>55){b.vx=b.vx/v*55;b.vy=b.vy/v*55}b.x+=b.vx*dt;b.y+=b.vy*dt;b.phase+=dt*.15;if(b.phase>6)b.phase=0;if(dist<26&&player.inv<=0){player.inv=1.5;player.energy-=20;if(player.carry){player.carry=false;document.getElementById('objectiveText').textContent='Gather a leaf' }}}
 if(player.energy<=0)end(false);
 particles.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt});particles=particles.filter(p=>p.life>0);
}
function end(success){if(won)return;won=true;started=false;let end=document.getElementById('end');document.getElementById('endEyebrow').textContent=success?'COLONY FED':'SHIFT ENDED';document.getElementById('endTitle').textContent=success?'SHIFT COMPLETE':'RUN OUT';document.getElementById('endText').textContent=success?'The workers carry a record haul.':'The beetles forced you back. Rest, then try again.';end.classList.add('visible')}
function loop(t){let dt=Math.min(.033,(t-last)/1000||0);last=t;if(started&&!won)update(dt);drawGround();let items=[...obstacles.map(o=>({y:o.y,draw:()=>drawObstacle(o)})),...leaves.map(l=>({y:l.y,draw:()=>drawLeaf(l)})),...beetles.map(b=>({y:b.y,draw:()=>drawBeetle(b)})),{y:player.y,draw:drawAnt}].sort((a,b)=>a.y-b.y);items.forEach(i=>i.draw());requestAnimationFrame(loop)}requestAnimationFrame(loop);
let touchLift=false;
document.getElementById('startBtn').onclick=()=>{reset();won=false;started=true;document.getElementById('start').classList.remove('visible')};document.getElementById('restartBtn').onclick=()=>{reset();won=false;started=true;document.getElementById('end').classList.remove('visible')};
// Touch joystick
const stick=document.getElementById('stick'),knob=stick.querySelector('i');let joy={active:false,x:0,y:0};
stick.addEventListener('touchstart',e=>{e.preventDefault();joy.active=true},{passive:false});stick.addEventListener('touchmove',e=>{let r=stick.getBoundingClientRect(),t=e.touches[0],x=t.clientX-(r.left+r.width/2),y=t.clientY-(r.top+r.height/2),len=Math.hypot(x,y),m=32;if(len>m){x=x/len*m;y=y/len*m}joy.x=x/m;joy.y=y/m;knob.style.transform=`translate(${x}px,${y}px)`;e.preventDefault()},{passive:false});stick.addEventListener('touchend',()=>{joy.active=false;joy.x=joy.y=0;knob.style.transform=''},{passive:true});
// merge touch into keyboard loop
const oldUpdate=update;update=function(dt){if(joy.active){keys.a=joy.x<-.25;keys.d=joy.x>.25;keys.w=joy.y<-.25;keys.s=joy.y>.25}else if(!keys.a&&!keys.d&&!keys.w&&!keys.s){keys.a=keys.d=keys.w=keys.s=false}oldUpdate(dt)};
document.getElementById('dashBtn').addEventListener('touchstart',e=>{keys.dash=true;e.preventDefault()},{passive:false});document.getElementById('dashBtn').addEventListener('touchend',()=>keys.dash=false);
const liftBtn=document.getElementById('liftBtn');liftBtn.addEventListener('touchstart',e=>{touchLift=true;e.preventDefault()},{passive:false});liftBtn.addEventListener('touchend',()=>touchLift=false);
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
