// Başlatma
(function (root) {
  'use strict';
  const OG = root.OG;

  OG.i18nStart();
  document.querySelector('#logoMark').innerHTML = OG.LOGO_SVG;
  OG.applyFavicon();
  OG.ui.init();
  OG.ui.updateWallet();
  if (OG.campaign.week) {
    OG.campaign.applyDay();
    OG.ui.loadDay();
  }

  document.querySelector('#menuBtn').addEventListener('click', () => {
    if (OG.ui.isSimulating()) {
      OG.ui.toast('Gün bitene kadar bekle ya da “Sonuca Atla”ya bas', 'bad');
      return;
    }
    OG.screens.menu();
  });

  document.querySelector('#settingsBtn').addEventListener('click', () => {
    if (OG.ui.isSimulating()) {
      OG.ui.toast('Gün bitene kadar bekle ya da “Sonuca Atla”ya bas', 'bad');
      return;
    }
    OG.screens.settings(OG.campaign.week ? 'board' : 'menu');
  });

  // Ses: tarayıcılar ilk kullanıcı etkileşiminden önce ses çalmaya izin vermez
  document.addEventListener('pointerdown', () => {
    OG.audioUnlock();
    OG.music.start();
  }, { once: true });
  document.addEventListener('click', (e) => {
    if (e.target.closest('.btn, .icon-btn, .tab, .bed-control button, .scenario-tag')) OG.sfx('click');
  }, true);

  // Kurallar penceresi
  const rules = document.querySelector('#rules');
  const closeRules = () => rules.classList.add('hidden');
  document.querySelectorAll('[data-open-rules]').forEach((b) =>
    b.addEventListener('click', () => rules.classList.remove('hidden')));
  rules.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', closeRules));
  rules.addEventListener('click', (e) => { if (e.target === rules) closeRules(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeRules(); });

  OG.screens.menu();
})(window);
