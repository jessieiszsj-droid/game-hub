(function(root){'use strict';
function install(Adventure,stages){
 const R=(id,x,z,w,d,y=0)=>({id,x,z,w,d,y}),O=(id,type,x,z,role=-1,label='')=>({id,type,x,z,role,y:0,label});
 const chapters=[
 ['珊瑚之门','coral',['focus','cut','sync'],'灯塔下出现发光的航路。激光唤醒珊瑚，剑刃清出新的入口。'],
 ['泡泡苗圃','coral',['escort','focus','sync'],'两人护送小潜航器，把最后一株海草送回苗圃。'],
 ['海葵回廊','coral',['cut','focus','cut'],'海葵定时喷流。先关闭电网，再让岚切开缠绕的海藤。'],
 ['鲸歌音阶','coral',['sync','focus','escort'],'在双人音阶上停留，让鲸歌带领迷路的声呐浮标。'],
 ['珊瑚守望者','coral',['focus','defend','duel'],'修复花园能源，然后共同阻止失控的珊瑚守望者。'],
 ['漂流邮局','lagoon',['escort','cut','focus'],'护送海底邮筒，找到被海流卷走的信件航线。'],
 ['水母灯会','lagoon',['focus','sync','focus'],'依次接通三段灯路，让沉睡的水母广场亮起来。'],
 ['逆流快递','lagoon',['cut','escort','sync'],'横向海流冲过平台；靠近同伴，护送快递浮标穿过水道。'],
 ['珍珠天文台','lagoon',['sync','cut','focus'],'用双人星盘定位珍珠，再解除观测镜前的藤网。'],
 ['漩涡引航员','lagoon',['escort','defend','duel'],'把引航器送入港湾，击败抢走导航信号的机械猎手。'],
 ['沉船植物园','wreck',['cut','escort','focus'],'进入长满植物的沉船温室，为发光种子重新接通能源。'],
 ['失重货舱','wreck',['sync','cut','escort'],'配合货舱喷流的间歇，把维修机器人带出废弃运输船。'],
 ['磁光工坊','wreck',['focus','defend','cut'],'激光接通磁光机床，剑盾守护它完成海底维修。'],
 ['回声航线','wreck',['escort','sync','focus'],'跟随浮标穿过回声区域，两人一起校准失真的航向。'],
 ['铁壳收藏家','wreck',['cut','defend','duel'],'打开沉船展厅，夺回铁壳收藏家藏起的航行罗盘。'],
 ['深渊花火','abyss',['focus','cut','sync'],'不是黑暗牢房，而是一座会发光的深海火山花园。'],
 ['热泉接力','abyss',['cut','escort','defend'],'热泉喷发前地面亮起警示，护送冷却核心穿越泉群。'],
 ['星砂长桥','abyss',['sync','focus','escort'],'在星砂筑成的海底长路上，为归航浮标点亮最后的路标。'],
 ['万潮之心','abyss',['focus','defend','sync'],'把海底三处能源接入潮汐心脏，守住它重新启动的瞬间。'],
 ['蓝海新黎明','abyss',['escort','duel','sync'],'护送海洋之心，击败深渊机甲；两人共同点亮新海域的晨光。']
 ];
 const tips={focus:'岚站在橘色稳压盘；烁用激光命中蓝色晶体。',cut:'烁用激光关闭电网12秒；岚靠近海藤，使用剑斩开。',sync:'两人站在各自颜色的音盘上，保持2秒。',escort:'两人靠近潜航器，在6米内一起护送它到光圈。',defend:'两人靠近信标，任意一人按使用启动；剑破甲，激光清除守卫。',duel:'岚用剑击碎机甲护甲；烁用激光击败它。盾牌可以挡住近身攻击。'};
 chapters.forEach(([title,theme,tasks,story],n)=>{
  const objects=[],walls=[],phases=tasks.map((kind,j)=>{
   const z=28-j*22,side=(n+j)%2?1:-1,spread=5+n%3;
   const a=O('task'+j+'a',kind==='sync'?'plate':kind==='escort'?'drone':kind==='defend'||kind==='duel'?'beacon':'laserNode',-side*spread,z,0);
   const b=O('task'+j+'b',kind==='focus'||kind==='sync'?'plate':kind==='escort'?'dock':kind==='cut'?'kelp':'beacon',side*spread,z,1);
   if(kind==='escort'){a.x=0;b.x=0;b.z=z-7;b.role=-1;}
   if(kind==='defend'||kind==='duel'){a.x=-2;b.x=2;}
   a.label=kind==='cut'?'烁 · 激光断电':kind==='focus'?'烁 · 激光晶体':kind==='sync'?'烁 · 蓝色音盘':kind==='escort'?'两人靠近 · 护送潜航器':'共同启动战斗信标';
   b.label=kind==='cut'?'岚 · 剑斩海藤':kind==='focus'?'岚 · 留守稳压盘':kind==='sync'?'岚 · 橘色音盘':kind==='escort'?'潜航器目的地':'岚 · 剑破甲 / 盾保护';
   objects.push(a,b);
   // Obstacles leave a continuous central and two outer walking routes.
   if((n+j)%3===0)walls.push({...R('coral'+j,side*10,z-5,3,3),h:1.2});
   if((n+j)%3===1)walls.push({...R('arch'+j,0,z+5,4,1.3),h:.65});
   return {kind,z,a:a.id,b:b.id,tip:tips[kind]};
  });
  objects.push(O('relic','relic',(n%2?1:-1)*14,-18,-1,'深海航海日志'));
  stages.push({name:String(n+9).padStart(2,'0')+' · '+title,subtitle:story,theme,bounds:[18,40],spawn:[[-3,36],[3,36]],exit:[0,-36],floors:[R('seabed',0,0,36,80)],walls,objects,guards:[],phases,goal:tips[tasks[0]],story,current:n%4===3?(n%2?1:-1)*1.25:0,vents:n>1,ventOffset:n*.41});
 });
 const old={};for(const k of ['load','use','puzzle','gates','objectActive','target','ready','objective','status','tick','emit','hit'])old[k]=Adventure.prototype[k];
 const deep=g=>g.level>=8,near=(p,o,r)=>!p.down&&Math.hypot(p.x-o.x,p.z-o.z)<r;
 Adventure.prototype.emit=function(type,text,extra){if(deep(this)&&type==='switch')text=this.players.map(p=>(p.id?'岚：'+(p.mode?'盾牌':'剑'):'烁：'+(p.mode?'诱饵':'蓝色激光枪'))).join(' · ');old.emit.call(this,type,text,extra);};
 Adventure.prototype.hit=function(s){if(deep(this)&&s.kind==='enemy'&&this.enemies.find(e=>e.id===s.id)?.armor){this.emit('hint','机甲还有护甲！岚切换到剑，靠近挥剑破甲。');return;}old.hit.call(this,s);};
 Adventure.prototype.phase=function(){return this.config.phases?.findIndex((_,j)=>!this.flags['deep'+j]);};
 Adventure.prototype.load=function(level,flags){old.load.call(this,level,flags);if(deep(this)){this.deepHold=0;this.deepPower=0;this.deepBattle=-1;this.droneZ=null;const j=this.phase();if(j>0)this.checkpointAll(0,34-j*22);}};
 Adventure.prototype.deepFinish=function(j){this.flags['deep'+j]=true;this.deepHold=0;this.deepPower=0;this.deepBattle=-1;this.droneZ=null;this.enemies=[];this.checkpointAll(0,20-j*22);this.emit('progress',null,{id:'deep'+j});this.emit('mechanism',j===2?'海流门开启！一起去北侧光圈。':'这一段完成！通过光幕，继续下一段合作。');};
 Adventure.prototype.gates=function(){if(!deep(this))return old.gates.call(this);return this.config.phases.flatMap((p,j)=>this.flags['deep'+j]?[]:[{...R('flowGate'+j,0,p.z-9,36,.7),h:4}]);};
 Adventure.prototype.objectActive=function(o){if(!deep(this))return old.objectActive.call(this,o);if(o.type==='relic')return !this.relics[this.level];const j=this.phase(),p=this.config.phases[j];return !!p&&(p.a===o.id||p.b===o.id);};
 Adventure.prototype.target=function(p){if(!deep(this))return old.target.call(this,p);return this.config.objects.filter(o=>this.objectActive(o)&&(!p.mode||o.type==='relic')&&(o.role<0||o.role===p.id)&&!['plate','dock','drone'].includes(o.type)&&near(p,o,o.type==='laserNode'?18:3)&&this.visible(p,o)).sort((a,b)=>Math.hypot(p.x-a.x,p.z-a.z)-Math.hypot(p.x-b.x,p.z-b.z))[0];};
 Adventure.prototype.use=function(i){if(!deep(this))return old.use.call(this,i);const p=this.players[i];if(p.down||p.cool>0)return;p.cool=.4;p.action=.35;const j=this.phase(),phase=this.config.phases[j],o=this.target(p);
  if(o?.type==='relic'){this.relics[this.level]=true;this.emit('relic','找到深海日志 '+Object.keys(this.relics).length+'/'+stages.length);return;}
  if(o&&phase){const b=this.config.objects.find(v=>v.id===phase.b);
   if(phase.kind==='focus'){if(near(this.players[1],b,1.65)&&this.players[1].ground){this.shots.push({x:p.x,y:1,z:p.z,tx:o.x,ty:1,tz:o.z,kind:'light',life:.4});this.emit('shot');this.deepFinish(j);}else this.emit('hint','岚先站稳橘色稳压盘，烁再发射激光。');return;}
   if(phase.kind==='cut'){if(i===0){this.deepPower=this.t+12;this.emit('shot');this.emit('mechanism','电网停机12秒！岚靠近海藤用剑斩开。');}else if(this.deepPower>this.t){this.emit('attack');this.deepFinish(j);}else this.emit('hint','先让烁用激光击中蓝色断电装置。');return;}
   if(['defend','duel'].includes(phase.kind)&&this.deepBattle!==j){if(!this.players.every(a=>Math.abs(a.z-phase.z)<6)){this.emit('hint','等同伴靠近信标后，一起启动。');return;}this.deepBattle=j;const count=phase.kind==='duel'?1:2+(this.level%2);this.enemies=Array.from({length:count},(_,k)=>{const e=this.enemy('deepGuard'+j+'_'+k,(k-(count-1)/2)*5,phase.z-4,0,0,true);if(phase.kind==='duel'){e.hp=e.max=this.level===27?12:7;e.deepBoss=true;}return e;});this.emit('warning',phase.kind==='duel'?'深海机甲启动！岚挥剑破甲，烁用激光支援。':'守卫启动！两人一起清除它们。');return;}
  }
  if(i===0){if(p.mode){this.decoys.push({x:p.x-Math.sin(p.yaw)*5,z:p.z-Math.cos(p.yaw)*5,life:8});this.emit('decoy','蓝色诱饵吸引守卫8秒。');p.cool=1;}else{const e=this.enemies.filter(e=>e.hp>0&&near(p,e,20)&&this.visible(p,e)).sort((a,b)=>Math.hypot(p.x-a.x,p.z-a.z)-Math.hypot(p.x-b.x,p.z-b.z))[0];if(e){this.shoot(p,e,'enemy');this.shots[this.shots.length-1].laser=true;}else{this.shots.push({x:p.x,y:1,z:p.z,tx:p.x-Math.sin(p.face)*16,ty:1,tz:p.z-Math.cos(p.face)*16,kind:'light',life:.4,laser:true});this.emit('shot');}}}
  else if(p.mode){p.shield=3.2;p.cool=.6;this.emit('shield','岚举盾，抵挡3秒。');}else{for(const e of this.enemies)if(e.hp>0&&near(p,e,3.8)&&this.visible(p,e)){e.armor=false;e.stun=1.1;e.hp-=2;if(e.hp<=0)this.kill(e);}this.emit('attack');}
 };
 Adventure.prototype.puzzle=function(){if(!deep(this))return old.puzzle.call(this);const j=this.phase(),p=this.config.phases[j];if(!p)return;const a=this.config.objects.find(o=>o.id===p.a),b=this.config.objects.find(o=>o.id===p.b),dt=this.deepDt||0;
  if(p.kind==='sync'){if(this.players.every((v,i)=>near(v,i?b:a,1.65)&&v.ground))this.deepHold+=dt;else this.deepHold=0;if(this.deepHold>=2)this.deepFinish(j);}
  if(p.kind==='escort'){if(this.droneZ===null)this.droneZ=a.z;const d={x:0,z:this.droneZ};if(this.players.every(v=>near(v,d,6)))this.droneZ-=dt*1.3;if(this.droneZ<=b.z+.4)this.deepFinish(j);}
  if(['defend','duel'].includes(p.kind)&&this.deepBattle===j&&this.enemies.every(e=>e.hp<=0))this.deepFinish(j);
 };
 Adventure.prototype.ventState=function(){return (this.t+(this.config.ventOffset||0))%7;};
 Adventure.prototype.tick=function(dt,held,pressed){if(!deep(this))return old.tick.call(this,dt,held,pressed);this.deepDt=dt/2;old.tick.call(this,dt,held,pressed);this.deepDt=0;if(this.finished)return;for(const p of this.players){if(p.down)continue;const x=p.x+(this.config.current||0)*dt;if(!this.blocked(x,p.y,p.z))p.x=x;if(this.config.vents&&this.ventState()>5&&p.y<.8&&Math.abs(p.x)>8&&this.config.phases.some(s=>Math.abs(p.z-(s.z-3))<2))this.hurt(p);}};
 Adventure.prototype.ready=function(){return deep(this)?this.phase()===-1:old.ready.call(this);};
 Adventure.prototype.objective=function(i){if(!deep(this))return old.objective.call(this,i);const p=this.config.phases[this.phase()];if(!p)return{x:0,z:-36,id:'exit',type:'exit'};if(p.kind==='escort')return{x:0,z:this.droneZ??p.z,id:p.a,type:'drone',label:'两人靠近潜航器'};return this.config.objects.find(o=>o.id===(i?p.b:p.a));};
 Adventure.prototype.status=function(){if(!deep(this))return old.status.call(this);const j=this.phase();return j<0?'航路已开启 · 两人到出口会合':(j+1)+'/3 · '+this.config.phases[j].tip+(this.deepPower>this.t?' · 断电剩余 '+Math.ceil(this.deepPower-this.t)+' 秒':'')+(this.deepHold>0?' · 共鸣 '+Math.min(100,Math.floor(this.deepHold/2*100))+'%':'');};
}
if(typeof module!=='undefined')module.exports=install;else root.installDeepSea=install;
})(typeof window!=='undefined'?window:globalThis);
