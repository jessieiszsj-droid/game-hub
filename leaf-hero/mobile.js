'use strict';
(()=>{const mapping={up:'ArrowUp',down:'ArrowDown',left:'ArrowLeft',right:'ArrowRight',attack:'a'};new TouchControls({actions:[['攻击','attack']],isPlaying:()=>state==='playing',change:(action,down)=>{const key=mapping[action];if(down&&!keys[key])just[key]=true;keys[key]=down;}});})();
