(function(root){
'use strict';
const SIZE=88,MIN=-44,YMIN=-14,HEIGHT=34;
const B={AIR:0,GRASS:1,DIRT:2,STONE:3,WOOD:4,LEAF:5,IRON:6,GOLD:7,EMERALD:8,REDSTONE:9,DIAMOND:10,DIVINE:11,WATER:12,LAVA:13,ICE:14,SAND:15,PLANK:16,BRICK:17,GLASS:18,BEDROCK:19};
const blocks=[['空气',0],['草地',0x7fa552,'dirt',0,.35],['泥土',0x866342,'dirt',0,.35],['石头',0x849198,'stone',1,.7],['原木',0x9a724b,'wood',0,.5],['树叶',0x619361,'wood',0,.35],['铁矿',0xb9958a,'iron',2,1],['金矿',0xf4cf6c,'gold',2,1.15],['绿宝石矿',0x52dcb2,'emerald',2,1.3],['红石矿',0xe77b79,'redstone',2,1.1],['钻石矿',0x82def4,'diamond',3,1.5],['神石',0xe7a1ff,'divine',3,2],['水',0x4fabc8],['岩浆',0xf79548],['冰',0xb6e8eb,'ice',1,.7],['沙子',0xd7cb9c,'sand',0,.3],['木板',0xc79d69,'plank',0,.5],['石砖',0x566e72,'brick',1,.7],['玻璃',0xb8d9cb,'glass',0,.4],['基岩',0x3d4957]];
const names={wood:'木头',stone:'石头',iron:'铁',gold:'黄金',emerald:'绿宝石',redstone:'红石',diamond:'钻石',divine:'神石',dirt:'泥土',sand:'沙子',ice:'冰',plank:'木板',brick:'石砖',glass:'玻璃',bench:'工作台',chest:'宝箱',toolbox:'工具箱',bed:'床'};
const recipes={woodpick:{name:'木镐',cost:{wood:3},hand:true,tier:1},stonepick:{name:'石镐',cost:{wood:2,stone:4},tier:2},ironpick:{name:'铁镐',cost:{wood:2,iron:3},tier:3},spear:{name:'长矛',cost:{wood:4,stone:2}},hammer:{name:'重锤',cost:{wood:3,iron:4}},bucket:{name:'桶',cost:{iron:3}},boat:{name:'船',cost:{wood:8}},armor:{name:'铁甲',cost:{iron:6}},plank:{name:'木板 ×4',cost:{wood:2},hand:true,output:{item:'plank',count:4}},brick:{name:'石砖 ×4',cost:{stone:4},output:{item:'brick',count:4}},glass:{name:'玻璃 ×2',cost:{sand:2,stone:1},output:{item:'glass',count:2}},bench:{name:'工作台',cost:{wood:6,stone:2},hand:true,output:{item:'bench',count:1}},chest:{name:'宝箱',cost:{wood:6,iron:1},output:{item:'chest',count:1}},toolbox:{name:'工具箱',cost:{wood:3,iron:1},output:{item:'toolbox',count:1}},bed:{name:'床',cost:{wood:5},output:{item:'bed',count:1}}};
function hash(x,y,z){return ((Math.imul(x+194,73856093)^Math.imul(y+47,19349663)^Math.imul(z+255,83492791))>>>0)/4294967296;}
class World{
constructor(){this.data=new Uint8Array(SIZE*SIZE*HEIGHT);this.edits={};this.dirty=new Set();this.generate();this.dirty.clear();}
index(x,y,z){x=Math.floor(x);y=Math.floor(y);z=Math.floor(z);if(x<MIN||x>=MIN+SIZE||z<MIN||z>=MIN+SIZE||y<YMIN||y>=YMIN+HEIGHT)return -1;return ((y-YMIN)*SIZE+(z-MIN))*SIZE+x-MIN;}
get(x,y,z){const i=this.index(x,y,z);return i<0?(y<YMIN?B.BEDROCK:B.AIR):this.data[i];}
raw(x,y,z,id){const i=this.index(x,y,z);if(i>=0)this.data[i]=id;}
set(x,y,z,id){x=Math.floor(x);y=Math.floor(y);z=Math.floor(z);const i=this.index(x,y,z);if(i<0)return false;this.data[i]=id;this.edits[i]=id;for(const [dx,dz]of [[0,0],[-1,0],[1,0],[0,-1],[0,1]])this.dirty.add(Math.floor((x+dx-MIN)/11)+','+Math.floor((z+dz-MIN)/11));return true;}
solid(x,y,z){const b=this.get(x,y,z);return b!==0&&b!==B.WATER&&b!==B.LAVA;}
surface(x,z){for(let y=YMIN+HEIGHT-1;y>=YMIN;y--)if(this.solid(x,y,z))return y+1;return YMIN;}
generate(){
for(let x=MIN;x<MIN+SIZE;x++)for(let z=MIN;z<MIN+SIZE;z++){
let h=Math.floor(1+Math.sin(x*.14)*1.4+Math.cos(z*.16)*1.3);if(Math.abs(x)<12&&Math.abs(z)<13)h=2;
if(x>25)h=-4+Math.floor(Math.sin(z*.23));if(x>=21&&x<=25)h=0;if(z<-24&&x>-10&&x<13)h=-2;
for(let y=YMIN;y<=h;y++){let id=y===YMIN?B.BEDROCK:y===h?(x>20?B.SAND:B.GRASS):y>h-3?B.DIRT:B.STONE;const r=hash(x,y,z);if(id===B.STONE){if(r<.05)id=B.IRON;else if(r<.075&&y<-3)id=B.GOLD;else if(r<.095&&y<-5)id=B.REDSTONE;else if(r<.111&&y<-6)id=B.EMERALD;else if(r<.123&&y<-8)id=B.DIAMOND;}this.raw(x,y,z,id);}
if(x>25)for(let y=h+1;y<=0;y++)this.raw(x,y,z,B.WATER);
if(z<-24&&x>-10&&x<13){for(let y=h+1;y<=0;y++)this.raw(x,y,z,B.WATER);this.raw(x,1,z,B.ICE);}
}
// Home: large walkable hall; the south-facing doorway is always open.
for(let x=-8;x<=8;x++)for(let z=-7;z<=8;z++){
this.raw(x,3,z,B.PLANK);for(let y=4;y<=8;y++){
let id=0;if(x===-8||x===8||z===-7||z===8){id=B.PLANK;if(y>=5&&y<=6&&((z===8||z===-7)?Math.abs(x)>3:Math.abs(z-1)<4))id=B.GLASS;if(z===8&&Math.abs(x)<=1&&y<=6)id=0;}this.raw(x,y,z,id);}
this.raw(x,9,z,B.BRICK);
}
// Steps outside the house.
for(let x=-2;x<=2;x++)for(let z=9;z<=11;z++)this.raw(x,2,z,B.PLANK);
// Orchard, grove and scattered woodland; no trees on the main paths.
for(let x=-37;x<=19;x+=7)for(let z=-35;z<=37;z+=8){if((Math.abs(x)<13&&Math.abs(z)<15)||(x<-10&&z<-6)||(z<-22&&x>-12))continue;if(hash(x,0,z)>.73)continue;this.tree(x,z);}
this.tree(5,15);this.tree(-6,17);this.tree(12,16);
// Open-cut steps to the accessible mine, descending one block every two metres.
for(let z=-10;z>=-32;z--){let floor=2-Math.floor((-z-10)/2);for(let x=-21;x<=-16;x++){for(let y=floor+1;y<=12;y++)this.raw(x,y,z,0);this.raw(x,floor,z,B.STONE);}}
// Underground chamber connected to the last steps.
for(let x=-28;x<=-11;x++)for(let z=-38;z<=-29;z++){for(let y=-9;y<=-3;y++)this.raw(x,y,z,0);this.raw(x,-10,z,B.STONE);}
for(let i=0;i<6;i++){let id=[B.IRON,B.GOLD,B.EMERALD,B.REDSTONE,B.DIAMOND,B.DIVINE][i];for(let dx=0;dx<2;dx++)for(let dy=0;dy<2;dy++)this.raw(-26+i*2+dx,-8+dy,-38,id);}
// Exposed stone and iron beside the mine entrance support the tool progression.
for(let x=-24;x<=-22;x++)for(let y=2;y<=4;y++)this.raw(x,y,-11,y===3?B.IRON:B.STONE);
// Lava spring, visible and reachable on the surface.
for(let x=-37;x<=-30;x++)for(let z=19;z<=26;z++){for(let y=3;y<=12;y++)this.raw(x,y,z,0);this.raw(x,1,z,B.STONE);this.raw(x,2,z,(x===-37||x===-30||z===19||z===26)?B.STONE:B.LAVA);}
}
tree(x,z){let h=this.surface(x,z);for(let y=h;y<h+5;y++)this.raw(x,y,z,B.WOOD);for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++)for(let dy=3;dy<=5;dy++)if(Math.abs(dx)+Math.abs(dz)<4&&this.get(x+dx,h+dy,z+dz)===0)this.raw(x+dx,h+dy,z+dz,B.LEAF);}
applyEdits(edits){for(const [key,id]of Object.entries(edits||{})){const i=Number(key);if(Number.isInteger(i)&&i>=0&&i<this.data.length&&Number.isInteger(id)&&id>=0&&id<blocks.length){this.data[i]=id;this.edits[i]=id;}}}
}
class Game{
constructor(saved){this.world=new World();this.inv={};this.tools={pick:0,spear:false,hammer:false,bucket:false,boat:false,armor:false};this.armorEquipped=false;this.furniture=[];this.chest={};this.bucket=null;this.pos={x:.5,y:4,z:5.5};this.hp=10;this.found=false;this.savedBoat=null;if(saved?.version===1){this.world.applyEdits(saved.edits);for(const k of Object.keys(names)){this.inv[k]=Math.max(0,Math.min(9999,Math.floor(Number(saved.inv?.[k])||0)));this.chest[k]=Math.max(0,Math.min(9999,Math.floor(Number(saved.chest?.[k])||0)));}this.tools={...this.tools,...saved.tools};this.tools.pick=Math.max(0,Math.min(3,Number(this.tools.pick)||0));this.bucket=['water','lava'].includes(saved.bucket)?saved.bucket:null;this.found=!!saved.found;if(saved.pos&&['x','y','z'].every(k=>Number.isFinite(saved.pos[k])))this.pos={x:Math.max(-42,Math.min(42,saved.pos.x)),y:Math.max(-12,Math.min(19,saved.pos.y)),z:Math.max(-42,Math.min(42,saved.pos.z))};this.savedBoat=saved.boat||null;this.armorEquipped=!!saved.armorEquipped&&!!this.tools.armor;this.furniture=Array.isArray(saved.furniture)?saved.furniture.filter(p=>['bench','chest','toolbox','bed'].includes(p.type)&&[p.x,p.y,p.z].every(Number.isFinite)).slice(0,100):[];}}
add(key,n=1){this.inv[key]=(this.inv[key]||0)+n;}
mineInfo(id,tool='hand'){if(id===0||id===B.WATER||id===B.LAVA)return{ok:false,reason:'选择桶来盛装液体'};if(id===B.BEDROCK)return{ok:false,reason:'基岩是世界的边界'};const required=blocks[id][3]||0, tier=tool==='pick'?this.tools.pick:0;if(required>tier)return{ok:false,reason:'需要'+['徒手','木镐','石镐','铁镐'][required]+'，按 C 查看配方'};return{ok:true,time:blocks[id][4]/(tier>required?1.5:1)};}
mine(x,y,z,tool){const id=this.world.get(x,y,z),info=this.mineInfo(id,tool);if(!info.ok)return info;this.world.set(x,y,z,0);this.add(blocks[id][2]);if(id===B.DIVINE)this.found=true;return{ok:true,item:blocks[id][2],divine:id===B.DIVINE};}
craft(id,atBench=false){const r=recipes[id];if(!r)return{ok:false,reason:'未知配方'};if((r.tier&&this.tools.pick>=r.tier)||(!r.tier&&!r.output&&this.tools[id]))return{ok:false,reason:'已拥有这件工具'};if(!r.hand&&!atBench)return{ok:false,reason:'靠近家中的工作台再制作（H 归家）'};if(Object.entries(r.cost).some(([k,n])=>(this.inv[k]||0)<n))return{ok:false,reason:'材料不足，请先采集'};for(const [k,n]of Object.entries(r.cost))this.inv[k]-=n;if(r.output)this.add(r.output.item,r.output.count);else if(r.tier)this.tools.pick=r.tier;else this.tools[id]=true;return{ok:true,name:r.name};}
place(x,y,z,item){const ids={plank:B.PLANK,brick:B.BRICK,glass:B.GLASS,wood:B.WOOD,stone:B.STONE,dirt:B.DIRT,sand:B.SAND,ice:B.ICE,iron:B.IRON,gold:B.GOLD,emerald:B.EMERALD,redstone:B.REDSTONE,diamond:B.DIAMOND,divine:B.DIVINE};if(!ids[item]||(this.inv[item]||0)<1)return{ok:false,reason:'背包中没有这种方块'};if(this.world.get(x,y,z)!==0||!this.world.set(x,y,z,ids[item]))return{ok:false,reason:'这里不能放置'};this.inv[item]--;return{ok:true};}
scoop(x,y,z){if(!this.tools.bucket)return{ok:false,reason:'先用 3 铁制作桶'};if(this.bucket)return{ok:false,reason:'桶已装满，用右键倒出'};const b=this.world.get(x,y,z);if(![B.WATER,B.LAVA].includes(b))return{ok:false,reason:'瞄准水或岩浆，左键盛装'};this.bucket=b===B.WATER?'water':'lava';this.world.set(x,y,z,0);return{ok:true};}
pour(x,y,z){if(!this.bucket)return{ok:false,reason:'桶是空的，左键盛装液体'};if(this.world.get(x,y,z)!==0)return{ok:false,reason:'对着空位置倒出'};const id=this.bucket==='water'?B.WATER:B.LAVA;if(!this.world.set(x,y,z,id))return{ok:false,reason:'超出边界'};this.bucket=null;const other=id===B.WATER?B.LAVA:B.WATER;for(const [dx,dy,dz]of [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]])if(this.world.get(x+dx,y+dy,z+dz)===other){this.world.set(x+dx,y+dy,z+dz,B.STONE);this.world.set(x,y,z,B.STONE);}return{ok:true};}
equipArmor(){if(!this.tools.armor)return false;this.armorEquipped=!this.armorEquipped;return true;}
absorbDamage(n){return this.armorEquipped?Math.max(1,Math.floor(n*.6)):n;}
placeFurniture(type,x,y,z){if(!['bench','chest','toolbox','bed'].includes(type)||(this.inv[type]||0)<1)return{ok:false,reason:'需要先制作这件家具'};if(this.furniture.length>=100)return{ok:false,reason:'世界最多可放 100 件自制家具'};this.inv[type]--;const p={type,x,y,z};this.furniture.push(p);return{ok:true,furniture:p};}
storeAll(){for(const [k,n]of Object.entries(this.inv)){this.chest[k]=(this.chest[k]||0)+n;this.inv[k]=0;}}
takeAll(){for(const [k,n]of Object.entries(this.chest)){this.add(k,n);this.chest[k]=0;}}
save(boat){return{version:1,edits:this.world.edits,inv:this.inv,tools:this.tools,chest:this.chest,bucket:this.bucket,pos:this.pos,found:this.found,boat,armorEquipped:this.armorEquipped,furniture:this.furniture};}
}
const api={World,Game,B,blocks,names,recipes,SIZE,MIN,YMIN,HEIGHT,hash};if(typeof module!=='undefined')module.exports=api;else root.Sandbox=api;
})(typeof window!=='undefined'?window:globalThis);
