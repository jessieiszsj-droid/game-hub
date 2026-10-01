/* Original, locally synthesized scores. No downloads or external audio services. */
(() => {
  'use strict';
  const themes = {
    'leaf-hero': { bpm: 108, root: 60, wave: 'triangle', melody: [12,16,19,16,14,17,21,17,16,19,24,19,14,17,19,null], chords: [0,5,9,7] },
    'my-world': { bpm: 76, root: 62, wave: 'sine', melody: [12,null,19,16,14,null,21,19,16,null,24,19,14,17,null,12], chords: [0,9,5,7] },
    'it-takes-two': { bpm: 116, root: 65, wave: 'triangle', melody: [12,19,16,24,21,17,14,19,16,24,19,16,14,21,19,null], chords: [0,5,2,7] },
    'tide-shadow': { bpm: 88, root: 57, wave: 'sine', melody: [12,15,19,null,22,19,17,15,12,null,19,22,20,19,15,10], chords: [0,8,5,7], minor: true }
  };
  const theme = themes[location.pathname.split('/').filter(Boolean)[0]] || themes['leaf-hero'];
  let prefs = { music: true, effects: true, volume: .55 };
  try { const p = JSON.parse(localStorage.getItem('percy.audio.v1')); if(p) prefs = {music:p.music!==false,effects:p.effects!==false,volume:Number.isFinite(p.volume)?Math.max(0,Math.min(1,p.volume)):.55}; } catch {}
  let ctx, master, musicBus, effectsBus, playing = false, next = 0, beat = 0;
  const voices = new Set(), recent = new Map();
  const hz = note => 440 * 2 ** ((note - 69) / 12);
  function tone(freq, at, duration, gain, wave, bus, end) {
    if (!ctx || voices.size > 72) return;
    const oscillator = ctx.createOscillator(), envelope = ctx.createGain();
    oscillator.type = wave; oscillator.frequency.setValueAtTime(freq, at);
    if (end) oscillator.frequency.exponentialRampToValueAtTime(end, at + duration);
    envelope.gain.setValueAtTime(0, at); envelope.gain.linearRampToValueAtTime(gain, at + .012);
    envelope.gain.exponentialRampToValueAtTime(.0001, at + duration);
    oscillator.connect(envelope); envelope.connect(bus); voices.add(oscillator);
    oscillator.onended = () => { voices.delete(oscillator); oscillator.disconnect(); envelope.disconnect(); };
    oscillator.start(at); oscillator.stop(at + duration + .02);
  }
  function sync() {
    if (!ctx) return;
    master.gain.setTargetAtTime(document.hidden ? 0 : prefs.volume, ctx.currentTime, .025);
    musicBus.gain.setTargetAtTime(prefs.music && playing ? .65 : 0, ctx.currentTime, .04);
    effectsBus.gain.setTargetAtTime(prefs.effects ? .8 : 0, ctx.currentTime, .015);
  }
  async function unlock(event) {
    if (event && !event.isTrusted) return;
    try {
      if (!ctx) {
        const Audio = window.AudioContext || window.webkitAudioContext;
        if (!Audio) return;
        ctx = new Audio(); master = ctx.createGain(); musicBus = ctx.createGain(); effectsBus = ctx.createGain();
        const limiter = ctx.createDynamicsCompressor(); master.connect(limiter); limiter.connect(ctx.destination);
        musicBus.connect(master); effectsBus.connect(master); next = ctx.currentTime + .04; sync();
      }
      if (ctx.state === 'suspended') await ctx.resume();
    } catch { /* Games remain playable if browser audio is unavailable. */ }
  }
  window.addEventListener('pointerdown', unlock, true);
  window.addEventListener('keydown', unlock, true);
  document.addEventListener('visibilitychange', () => { sync(); if(ctx) { next=ctx.currentTime+.05; if(document.hidden)ctx.suspend().catch(()=>{});else ctx.resume().catch(()=>{}); } });
  setInterval(() => {
    if (!ctx || ctx.state !== 'running' || !playing || !prefs.music || document.hidden) return;
    const step = 60 / theme.bpm / 2;
    if (next < ctx.currentTime) next = ctx.currentTime + .025;
    while (next < ctx.currentTime + .15) {
      const n = beat % 32, chord = theme.chords[Math.floor(n / 8)], melody = theme.melody[beat % 16];
      if (melody !== null) tone(hz(theme.root + melody),next,step*.9,.085,theme.wave,musicBus);
      if (n % 4 === 0) tone(hz(theme.root + chord - 12),next,step*2.8,.1,'sine',musicBus);
      if (n % 8 === 0) [0,theme.minor?3:4,7].forEach(interval => tone(hz(theme.root+chord+interval),next,step*6,.023,'sine',musicBus));
      if (n % 4 === 2) tone(95,next,.07,.035,'triangle',musicBus,45);
      beat++; next += step;
    }
  }, 60);
  const patterns = {
    jump:[[260,.16,620]], attack:[[220,.1,70]], shot:[[680,.13,160]],
    hit:[[140,.11,45]], mine:[[180,.09,65]], place:[[320,.1,130]], hurt:[[150,.3,48]],
    shield:[[170,.22,540]], warning:[[210,.2,170]], explode:[[90,.4,24]],
    collect:[[660,.14],[880,.2]], relic:[[523,.17],[659,.17],[1047,.4]],
    mechanism:[[330,.13],[494,.16],[659,.3]], prepare:[[392,.12],[523,.15]],
    rescue:[[294,.17],[392,.22]], complete:[[523,.16],[659,.16],[784,.16],[1047,.65]],
    victory:[[523,.15],[659,.15],[784,.15],[1047,.22],[784,.15],[1047,.8]],
    craft:[[392,.13],[587,.15],[784,.32]]
  };
  function sfx(type) {
    if (!ctx || ctx.state !== 'running' || !prefs.effects || document.hidden || !patterns[type]) return;
    const now = ctx.currentTime;
    if (now - (recent.get(type) ?? -10) < .075) return;
    recent.set(type, now); let at=now;
    patterns[type].forEach(([f,d,end]) => {tone(f,at,d,.16,end?'triangle':'sine',effectsBus,end);at+=d*.7;});
  }
  function save() { try {localStorage.setItem('percy.audio.v1',JSON.stringify(prefs));}catch{} sync(); }
  window.GameAudio = {
    sfx,
    setPlaying(value) { value=!!value; if(value===playing)return;playing=value;if(ctx)next=ctx.currentTime+.04;sync(); },
    setEffects(value) {prefs.effects=!!value;save();render();},
    setVolume(value) {prefs.volume=Math.max(0,Math.min(1,Number(value)||0));save();render();}
  };
  let controls;
  function render() { if(!controls)return;controls.querySelector('[data-music]').checked=prefs.music;controls.querySelector('[data-effects]').checked=prefs.effects;controls.querySelector('input[type=range]').value=prefs.volume; }
  function mount() {
    const style=document.createElement('style');style.textContent='.percy-audio{position:fixed;right:12px;top:76px;z-index:90;color:#ecf8e8;font:13px system-ui;background:#17332eee;border:1px solid #90b397;border-radius:13px;box-shadow:0 4px 18px #0003;padding:9px 12px}.percy-audio summary{cursor:pointer;list-style:none;font-weight:bold}.percy-audio label{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-top:12px}.percy-audio input{accent-color:#b9e99a}.percy-audio input[type=range]{width:110px}.percy-audio input[type=checkbox]{width:18px;height:18px}.percy-audio small{display:block;margin-top:10px;max-width:180px;color:#bdcec1;font-size:11px}@media(max-width:700px){.percy-audio{top:62px;right:8px;font-size:12px;padding:7px 10px}}';document.head.append(style);
    controls=document.createElement('details');controls.className='percy-audio';controls.innerHTML='<summary aria-label="音乐与音效设置">♫ 声音</summary><label>背景音乐<input data-music type="checkbox"></label><label>游戏音效<input data-effects type="checkbox"></label><label>音量<input aria-label="声音音量" type="range" min="0" max="1" step=".05"></label><small>开始游玩后播放音乐，暂停时自动停止。</small>';document.body.append(controls);render();
    controls.addEventListener('keydown',e=>e.stopPropagation());controls.addEventListener('keyup',e=>e.stopPropagation());
    controls.querySelector('[data-music]').onchange=e=>{prefs.music=e.target.checked;save();};
    controls.querySelector('[data-effects]').onchange=e=>{prefs.effects=e.target.checked;save();sfx('prepare');};
    controls.querySelector('input[type=range]').oninput=e=>{prefs.volume=+e.target.value;save();};
    const old=document.getElementById('mute');if(old)old.hidden=true;
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
