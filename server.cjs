'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {WebSocketServer}=require('ws');
const tide=require('./tide-shadow/engine.js'),star=require('./it-takes-two/logic.js');
const games={tide:{Engine:tide.Adventure,keys:tide.keys,count:8},star:{Engine:star.Coop,keys:star.controls,count:6}};
const root=__dirname,rooms=new Map();
const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.webp':'image/webp','.ico':'image/x-icon'};
const server=http.createServer((req,res)=>{let url;try{url=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400).end();return;}
 if(url==='/health'){res.writeHead(200,{'Content-Type':'text/plain'}).end('ok');return;}
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405).end();return;}
 if(url==='/' )url='/index.html';if(url.endsWith('/'))url+='index.html';
 const parts=url.split('/');if(parts.some(p=>p.startsWith('.')||p==='node_modules'||p==='test')||!mime[path.extname(url)]){res.writeHead(404).end();return;}
 const file=path.resolve(root,'.'+url);if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end('Not found');return;}res.writeHead(200,{'Content-Type':mime[path.extname(file)],'X-Content-Type-Options':'nosniff','Cache-Control':'no-cache'});res.end(req.method==='HEAD'?undefined:data);});
});
const wss=new WebSocketServer({server,path:'/room',maxPayload:4096});
function send(ws,msg){if(ws?.readyState===1&&ws.bufferedAmount<256000)ws.send(JSON.stringify(msg));}
function snapshot(r){const state={};for(const [k,v]of Object.entries(r.game))if(k!=='config'&&typeof v!=='function')state[k]=v;return state;}
function publish(r,events=[]){const msg={type:'state',state:snapshot(r),revision:r.revision,paused:r.paused,online:r.slots.map(s=>!!s?.ws),events};r.slots.forEach(s=>send(s?.ws,msg));}
function error(ws,message){send(ws,{type:'error',message});}
wss.on('connection',(ws,req)=>{const origin=req.headers.origin;if(origin){try{if(new URL(origin).host!==req.headers.host){ws.close(1008);return;}}catch{ws.close(1008);return;}}
 let room=null,slot=null,messages=0,lastWindow=Date.now();ws.alive=true;ws.on('pong',()=>ws.alive=true);
 ws.on('message',raw=>{if(Date.now()-lastWindow>1000){lastWindow=Date.now();messages=0;}if(++messages>100){ws.close(1008);return;}let m;try{m=JSON.parse(raw);}catch{return;}if(!m||typeof m!=='object')return;
  if(m.type==='join'&&!room){if(!games[m.game])return error(ws,'游戏不存在');let r;
   if(m.create){if(rooms.size>=200)return error(ws,'房间暂时已满，请稍后重试');let code;do{code=crypto.randomBytes(4).toString('hex').slice(0,6).toUpperCase();}while(rooms.has(code));r={code,kind:m.game,game:new games[m.game].Engine(0),slots:[null,null],paused:false,revision:1,events:[],lastActive:Date.now()};r.game.onEvent=e=>r.events.push(e);rooms.set(code,r);}
   else{r=rooms.get(String(m.code||'').toUpperCase());if(!r||r.kind!==m.game)return error(ws,'没有找到这个房间，请核对房间码');}
   let i=r.slots.findIndex(s=>s&&s.token===m.token);if(i<0)i=r.slots.findIndex(s=>s===null);if(i<0)return error(ws,'房间已有两位玩家');
   const old=r.slots[i];if(old?.ws)old.ws.close(1000,'Reconnected');slot={token:old?.token||crypto.randomBytes(24).toString('hex'),ws,held:{},pressed:{},lastInput:Date.now()};r.slots[i]=slot;room=r;ws.role=i;r.lastActive=Date.now();send(ws,{type:'joined',code:r.code,role:i,token:slot.token});publish(r);return;
  }
  if(!room||room.slots[ws.role]!==slot)return;
  if(m.type==='input'){const allowed=new Set(Object.values(games[room.kind].keys[ws.role]));const next={};for(const k of Array.isArray(m.keys)?m.keys.slice(0,12):[])if(allowed.has(k)){next[k]=true;if(!slot.held[k])slot.pressed[k]=true;}slot.held=next;slot.lastInput=Date.now();}
  if(m.type==='pause'){room.paused=!!m.value;room.slots.forEach(s=>{if(s){s.held={};s.pressed={};}});publish(room);}
  if(m.type==='level'&&Number.isInteger(m.level)){const n=m.level;if(n===room.game.level||n===0||(room.game.finished&&n===room.game.level+1&&n<games[room.kind].count)){room.events=[];room.game.load(n);room.revision++;room.paused=false;room.slots.forEach(s=>{if(s){s.held={};s.pressed={};}});publish(room);}}
 });
 ws.on('close',()=>{if(slot&&slot.ws===ws){slot.ws=null;slot.held={};slot.pressed={};if(room){room.lastActive=Date.now();publish(room);}}});ws.on('error',()=>{});
});
let ticks=0;
const loop=setInterval(()=>{for(const r of rooms.values()){if(!r.slots.some(s=>s?.ws)){if(Date.now()-r.lastActive>10*60*1000)rooms.delete(r.code);continue;}r.lastActive=Date.now();if(!r.paused&&r.slots.every(s=>s?.ws)&&!r.game.finished){const held={},pressed={};r.slots.forEach(s=>{if(Date.now()-s.lastInput>1500)s.held={};Object.assign(held,s.held);Object.assign(pressed,s.pressed);s.pressed={};});r.game.tick(1/60,held,pressed);}if(ticks%3===0){publish(r,r.events.splice(0));}}ticks++;},1000/60);
const heartbeat=setInterval(()=>{for(const ws of wss.clients){if(!ws.alive){ws.terminate();continue;}ws.alive=false;ws.ping();}},30000);
server.listen(Number(process.env.PORT)||8771,'0.0.0.0',()=>console.log('Game server ready on '+server.address().port));
function shutdown(){clearInterval(loop);clearInterval(heartbeat);wss.clients.forEach(ws=>ws.terminate());wss.close();server.close();}process.on('SIGTERM',shutdown);process.on('SIGINT',shutdown);
