// ==UserScript==
// @name         Sibnet Skip Intro/Outro Controller (avec debug UI)
// @namespace    https://video.sibnet.ru/
// @version      2.3
// @description  Skip intro/outro et auto next, contrôlé depuis FRAnime + affichage en overlay
// @match        *://video.sibnet.ru/*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  let params = {
    skipIntro: true,
    skipOutro: true,
    autoNext: true,
    introEnd: 146,
    outroStart: 1342,
    outroEnd: 1374
  };

  let lastSkip = null;
  let videoHooked = false;
  let videoElement = null; // Stocker la vidéo une fois hookée

  function createOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'debug-overlay';
    overlay.style = `
      position: fixed;
      top: 10px;
      left: 10px;
      background: rgba(0, 0, 0, 0.75);
      color: #0f0;
      padding: 8px 12px;
      font-family: monospace;
      font-size: 13px;
      border-radius: 6px;
      z-index: 999999;
      max-width: 400px;
      pointer-events: none;
      user-select: none;
      white-space: nowrap;
    `;
    overlay.textContent = '[Sibnet] En attente de la vidéo...';
    document.body.appendChild(overlay);
    // return overlay;
  }

  const overlay = createOverlay();

  function logToOverlay(message) {
    // overlay.textContent = message;  // Désactivé
    // console.log(message); // Ou aussi à enlever si tu veux pas du tout les logs
  }

  function hookVideo(video) {
    if (!video || videoHooked) return;
    videoHooked = true;
    videoElement = video;
    logToOverlay('[Sibnet] 🎬 Vidéo détectée et hookée');

    video.addEventListener('timeupdate', () => {
      const t = video.currentTime;
      const dur = video.duration || 0;

      if (params.skipIntro && t > 0 && t < params.introEnd) {
        if (lastSkip !== 'intro') {
          logToOverlay(`[Sibnet] ⏩ Intro sautée à ${params.introEnd}s`);
          lastSkip = 'intro';
          video.currentTime = params.introEnd;
          return;
        }
      } else if (params.skipOutro && t >= params.outroStart && t < params.outroEnd) {
        if (lastSkip !== 'outro') {
          logToOverlay(`[Sibnet] ⏩ Outro sautée à ${params.outroEnd}s`);
          lastSkip = 'outro';
          video.currentTime = params.outroEnd;
          return;
        }
      } else if (params.autoNext && dur > 0 && t >= dur - 1) {
        if (lastSkip !== 'end') {
          logToOverlay('[Sibnet] 📺 Fin de vidéo – Auto next activé (bloqué en iframe)');
          lastSkip = 'end';
          return;
        }
      } else {
        if (lastSkip !== null) {
          lastSkip = null;
          logToOverlay(`[Sibnet] Lecture à ${t.toFixed(1)}s`);
        }
      }
    });
  }

  function observeVideo() {
    logToOverlay('[Sibnet] Observation de la vidéo...');
    const observer = new MutationObserver(() => {
      const video = document.querySelector('video');
      if (video) {
        hookVideo(video);
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  window.addEventListener('message', (event) => {
    if (event.data?.type === 'franime-controls') {
      params = { ...params, ...event.data.params };
      lastSkip = null; // reset skip pour appliquer les nouvelles règles
      logToOverlay(`[Sibnet] 🔄 Paramètres reçus : Intro ${params.introEnd}s, Outro ${params.outroStart}-${params.outroEnd}s`);
      // console.log('[Sibnet] Paramètres mis à jour :', params);

      // Si la vidéo est déjà hookée, tu peux "forcer" la réévaluation en simulant un timeupdate
      if (videoElement) {
        videoElement.dispatchEvent(new Event('timeupdate'));
      }
    }
  });

  observeVideo();
})();
