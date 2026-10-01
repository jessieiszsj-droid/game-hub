'use strict';
// This script shares the game's lexical scope, while the server owns simulation.
const roomKind=location.pathname.includes('it-takes-two')?'star':'tide';
let roomRevision=0,roomFinished=false;
const localStart=start,localPlay=play,localPause=pause;
const net=new RoomClient(roomKind,{
 local:()=>menu(),joined:()=>{held={};pressed={};},
 state:m=>{const changed=roomRevision!==m.revision;if(changed){game.load(m.state.level);roomRevision=m.revision;roomFinished=false;}
  Object.assign(game,m.state);if(changed){if(roomKind==='star')buildStage();else build();}
  if(!game.finished&&!m.paused){mode='play';$('panel').hidden=true;}else if(game.finished&&!roomFinished){roomFinished=true;game.onEvent({type:'complete'});}
  for(const event of m.events||[])if(event.type!=='complete')game.onEvent(event);updateUI();
 }
});
start=function(level,...args){if(net.active){net.send({type:'level',level});return;}localStart(level,...args);};
play=function(){if(net.active)net.send({type:'pause',value:false});localPlay();};
pause=function(){if(net.active){net.keys.clear();net.send({type:'input',keys:[]});net.send({type:'pause',value:mode==='play'});}localPause();};
$('pause').onclick=pause;
const simulationTick=game.tick.bind(game);game.tick=function(...args){if(!net.active)simulationTick(...args);};
function roomBinding(){return roomKind==='star'?controls[net.role]:keys[net.role];}
function normalizedKey(code){const binding=roomBinding();if(code==='NumpadEnter')return roomKind==='star'?binding.fire:binding.use;if(roomKind==='star'&&code==='Enter')return binding.fire;return code;}
document.addEventListener('keydown',e=>{if(!net.active||e.code==='Escape')return;if(e.target.closest?.('button,input,a,select')){e.stopImmediatePropagation();return;}e.preventDefault();e.stopImmediatePropagation();if(mode==='play'&&net.running&&!game.finished)net.input(normalizedKey(e.code),true);},true);
document.addEventListener('keyup',e=>{if(!net.active||e.code==='Escape')return;e.preventDefault();e.stopImmediatePropagation();net.input(normalizedKey(e.code),false);},true);
new TouchControls({actions:roomKind==='star'?[['跳跃','jump'],['准备','ready'],['使用','fire']]:[['跳跃','jump'],['切换','switch'],['使用','use'],['转左','camL'],['转右','camR']],isPlaying:()=>net.active&&net.running&&mode==='play'&&!game.finished,change:(action,down)=>net.input(roomBinding()[action],down)});
// Each side of one tablet controls its own player, without a room or keyboard.
function localTouchInput(player,action,down){
 const binding=roomKind==='star'?controls[player]:game.bindings[player];
 const code=roomKind==='star'&&action==='fire'?game.fireKeys[player]:binding[action];
 if(!code)return;
 if(down&&!held[code])pressed[code]=true;
 held[code]=down;
}
for(let player=0;player<2;player++)new TouchControls({
 player,label:roomKind==='star'?(player?'玩家2 · 小梅':'玩家1 · 科迪'):(player?'玩家2 · 烁':'玩家1 · 岚'),
 actions:roomKind==='star'?[['跳跃','jump'],['准备','ready'],['使用','fire']]:[['跳跃','jump'],['切换','switch'],['使用','use'],['转左','camL'],['转右','camR']],
 isPlaying:()=>!net.active&&net.lobby.hidden&&mode==='play'&&!game.finished,
 change:(action,down)=>localTouchInput(player,action,down)
});
