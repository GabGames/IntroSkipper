// ==UserScript==
// @name         FRAnime Skip Tools (Contrôle vidéo Sibnet)
// @namespace    https://franime.fr/
// @version      2.3
// @description  UI pour contrôler l’intro/outro + auto next sur FRAnime (iframe Sibnet)
// @match        *://franime.fr/anime/*
// @grant        none
// ==/UserScript==

(function() {
  'use strict';

  const defaultParams = {
    skipIntro: true,
    skipOutro: true,
    autoNext: true,
    introEnd: 90,
    outroStart: 1300,
    outroEnd: 1400,
    useSeconds: false  // Nouveau paramètre pour mode secondes ou mm:ss
  };

  let params = loadParams();

  function saveParams() {
    localStorage.setItem('franime-video-params', JSON.stringify(params));
  }

  function loadParams() {
    const saved = localStorage.getItem('franime-video-params');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...defaultParams, ...parsed };
      } catch {
        return { ...defaultParams };
      }
    }
    return { ...defaultParams };
  }

  function sync() {
    saveParams();
    const message = { type: 'franime-controls', params };
    const iframe = document.querySelector('iframe[src*="sibnet.ru"]');
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage(message, '*');
      console.log('Message envoyé au iframe:', message);
    } else {
      console.log('Iframe Sibnet non trouvé, message NON envoyé');
    }
  }

  function toTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
  }

  function toSeconds(str) {
    if (!str) return 0;
    if (str.includes(':')) {
      const parts = str.split(':').map(x => parseInt(x, 10));
      if (parts.some(isNaN)) return 0;
      if (parts.length === 1) return parts[0];
      if (parts.length === 2) return parts[0] * 60 + parts[1];
      return 0;
    }
    // Si pas de :, on suppose que c’est déjà en secondes
    const val = parseInt(str, 10);
    return isNaN(val) ? 0 : val;
  }

  function createUI() {
    const panel = document.createElement('div');
    panel.style = 'position:fixed;top:10px;right:10px;background:#111;color:#fff;padding:10px;border-radius:8px;z-index:9999;font-size:14px;max-width:200px;';
    panel.innerHTML = `
      <strong style="font-size:16px">🎬 FRAnime Tools</strong><br><br>
      <label><input type="checkbox" id="skIntro"/> ⏩ Skip Intro</label><br>
      <label><input type="checkbox" id="skOutro"/> ⏩ Skip Outro</label><br>
      <label><input type="checkbox" id="autoN"/> ⏭ Auto Next</label><br><br>

      <label><input type="checkbox" id="useSec"/> Utiliser secondes (ex: 165) au lieu de mm:ss</label><br><br>

      Intro fin: <input type="text" id="inEnd" style="width:60px"/> <br>
      Outro début: <input type="text" id="outStart" style="width:60px"/> <br>
      Outro fin: <input type="text" id="outEnd" style="width:60px"/> <br><br>

      <button id="resetBtn">🔄 Réinitialiser</button>
    `;
    document.body.appendChild(panel);

    const inEndInput = document.getElementById('inEnd');
    const outStartInput = document.getElementById('outStart');
    const outEndInput = document.getElementById('outEnd');
    const useSecCheckbox = document.getElementById('useSec');

    // Initialiser checkboxes
    document.getElementById('skIntro').checked = params.skipIntro;
    document.getElementById('skOutro').checked = params.skipOutro;
    document.getElementById('autoN').checked = params.autoNext;
    useSecCheckbox.checked = params.useSeconds;

    // Fonction pour mettre à jour l'affichage des inputs en fonction de useSeconds
    function updateInputsDisplay() {
      if (params.useSeconds) {
        inEndInput.value = params.introEnd;
        outStartInput.value = params.outroStart;
        outEndInput.value = params.outroEnd;
      } else {
        inEndInput.value = toTime(params.introEnd);
        outStartInput.value = toTime(params.outroStart);
        outEndInput.value = toTime(params.outroEnd);
      }
    }

    // Event listeners checkbox
    document.getElementById('skIntro').addEventListener('change', e => { params.skipIntro = e.target.checked; sync(); });
    document.getElementById('skOutro').addEventListener('change', e => { params.skipOutro = e.target.checked; sync(); });
    document.getElementById('autoN').addEventListener('change', e => { params.autoNext = e.target.checked; sync(); });

    useSecCheckbox.addEventListener('change', e => {
      params.useSeconds = e.target.checked;
      updateInputsDisplay();
      sync();
    });

    // Event listeners inputs temps
    inEndInput.addEventListener('change', e => {
      params.introEnd = toSeconds(e.target.value);
      updateInputsDisplay();
      sync();
    });
    outStartInput.addEventListener('change', e => {
      params.outroStart = toSeconds(e.target.value);
      updateInputsDisplay();
      sync();
    });
    outEndInput.addEventListener('change', e => {
      params.outroEnd = toSeconds(e.target.value);
      updateInputsDisplay();
      sync();
    });

    // Reset
    document.getElementById('resetBtn').addEventListener('click', () => {
      params = { ...defaultParams };
      saveParams();
      document.getElementById('skIntro').checked = params.skipIntro;
      document.getElementById('skOutro').checked = params.skipOutro;
      document.getElementById('autoN').checked = params.autoNext;
      useSecCheckbox.checked = params.useSeconds;
      updateInputsDisplay();
      sync();
    });

    // Affiche au chargement
    updateInputsDisplay();
    sync();
  }

  window.addEventListener('load', () => {
    createUI();
  });
})();
