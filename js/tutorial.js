// İlk gün eğitimi: ilgili alanı spot ışığıyla vurgular, bazı adımlarda oyuncunun bir şey yapmasını bekler.
(function (root) {
  'use strict';
  const OG = root.OG;
  const tut = (OG.tutorial = { active: false });

  let steps = [];
  let i = 0;
  let coach = null;
  let spot = null;

  // wait: adımı geçmek için beklenen oyuncu hareketi · skipIf: koşul tutarsa adım atlanır
  const mobile = () => root.matchMedia('(max-width: 760px)').matches;
  const STEPS = () => [
    { text: OG.t('👋 <b>Hoş geldin!</b> Bu senin ilk günün. Kısa bir turla nasıl oynandığını göstereyim.',
        '👋 <b>Welcome!</b> This is your first day. Let me show you how to play with a quick tour.') },
    { target: '#missionBox', text: OG.t('🦸 Bu haftanın <b>ana görevi</b>. Süresi dolmadan çubuğu doldurmalısın; görev kartları (🎯 işaretli) buraya ilerleme katar.',
        '🦸 This is the week’s <b>main mission</b>. Fill the bar before time runs out; mission cards (marked 🎯) add progress here.') },
    { target: '.life-box', text: OG.t('⚖️ <b>Yaşam dengesi</b>: İş, Sağlık, Sosyal ve Ev her gece azalır. Biri sıfıra düşerse <b>kriz</b> yaşarsın ve bir can gider. “→” bu gecenin tahmini.',
        '⚖️ <b>Life balance</b>: Work, Health, Social and Home drop every night. If one hits zero you have a <b>crisis</b> and lose a heart. “→” is tonight’s forecast.') },
    { target: '#heartsPill', text: OG.t('❤️ Bunlar <b>canların</b>. Krizler, kaçan yapılacaklar ve ana görevin kaçması can götürür. Hepsi biterse hafta kaybedilir.',
        '❤️ These are your <b>hearts</b>. Crises, missed to-dos and a failed main mission cost hearts. Lose them all and the week is lost.') },
    { target: '.deck-panel', text: OG.t('🃏 Bunlar bugün <b>elindeki kartlar</b>. Hepsi güne sığmaz, seçmen gerekir! Alt satırda ana göreve (🎯) ve yaşam alanlarına katkısı, varsa 🔒 ön koşulu yazar. <b>Bir karta tıklarsan büyüyüp tüm detaylarını gösterir.</b>',
        '🃏 These are <b>your cards</b> for today. They won’t all fit, so you have to choose! The bottom line shows what each adds to the mission (🎯) and life areas, plus any 🔒 requirement. <b>Click a card to enlarge it and see every detail.</b>') },
    { target: '.day-panel', text: OG.t('🗓️ Burası <b>günün</b>. 🔒 kilitli bloklar <b>sabit programın</b>: saati belli, kendiliğinden yapılır. Taşıyamazsın ama cezası da yok.',
        '🗓️ This is <b>your day</b>. 🔒 Locked blocks are your <b>fixed schedule</b>: set times that happen on their own. You can’t move them, but they carry no penalty.') },
    { target: '.card[data-id="ogle"]', outline: true,
      text: mobile()
        ? OG.t('👉 Hadi deneyelim: aşağıdaki <b>Öğle Yemeği</b> kartını tut, <b>yukarı çek</b> ve çizelgede <b>12:00</b> satırına bırak. Yerleşen bir bloğu taşımak için üstüne <b>basılı tut</b>.',
        '👉 Let’s try it: hold the <b>Lunch</b> card below, <b>pull it up</b> and drop it on the <b>12:00</b> row. To move a placed block, <b>press and hold</b> it.')
        : OG.t('👉 Hadi deneyelim: <b>Öğle Yemeği</b> kartını tut ve çizelgede <b>12:00</b> satırına <b>sürükleyip bırak</b>. Yemekler kendi saat aralığında bonus verir.',
        '👉 Let’s try it: grab the <b>Lunch</b> card and <b>drag and drop</b> it on the <b>12:00</b> row. Meals give a bonus in their own time window.'),
      wait: (ev, id) => ev === 'place' && id === 'ogle', skipIf: () => OG.remainingUses('ogle') <= 0 },
    { target: '#forecast', text: OG.t('🔮 Bu şerit günün <b>tahmini</b>. Blokların üstündeki küçük etiket de o görevden tahmini kaç ⭐ alacağını gösterir; <b>⚠️</b> görürsen orada verim düşüyor demektir.',
        '🔮 This strip is the day’s <b>forecast</b>. The small tag on each block shows the ⭐ you’ll likely get from it; a <b>⚠️</b> means efficiency drops there.') },
    { target: '.meters', text: OG.t('⚡ Enerjin düşer ya da 😰 stresin artarsa görevlerden daha az puan alırsın. Kesikli çizgiler eşikleri, “→” işareti gün sonu tahminini gösterir.',
        '⚡ When your energy drops or 😰 stress rises, tasks earn fewer points. Dashed lines mark the thresholds; “→” shows the end-of-day forecast.') },
    { target: '.goals', text: OG.t('🎯 <b>Günün hedefleri</b> yıldız kazandırır. 📌 işaretliler <b>yapılacaklar</b>: yerini sen seçersin, yazan saatten önce bitmeli. Son saat çizelgede kırmızı çizgiyle gösterilir.',
        '🎯 <b>Today’s goals</b> earn stars. Items marked 📌 are <b>to-dos</b>: you choose when, but they must be done before the listed time. The deadline is a red line on the schedule.') },
    { target: '#bedControl', text: OG.t('🛏️ <b>Yatış saatini</b> buradan seç. Erken yatarsan bugün daha az vaktin olur ama yarın daha dinç başlarsın; günler birbirine bağlı!',
        '🛏️ Pick your <b>bedtime</b> here. Going to bed early leaves less time today but you start tomorrow fresher; the days are connected!') },
    { target: '#startBtn', text: OG.t('✨ Kalan saatleri dilediğin gibi doldur, sonra <b>▶ Günü Başlat</b>’a bas. Gün akarken sürpriz olaylar çıkacak; karar senin!',
        '✨ Fill the remaining hours however you like, then press <b>▶ Start Day</b>. Surprise events will pop up as the day runs; the choice is yours!'),
      wait: (ev) => ev === 'start', allowNext: true },
  ];

  function build() {
    if (coach) return;
    spot = document.createElement('div');
    spot.className = 'tut-spot';
    coach = document.createElement('div');
    coach.className = 'tut-coach hidden';
    coach.setAttribute('role', 'dialog');
    coach.setAttribute('aria-live', 'polite');
    coach.innerHTML = `
      <div class="tut-face">🎓</div>
      <div class="tut-body">
        <div class="tut-text"></div>
        <div class="tut-actions">
          <span class="tut-count"></span>
          <button class="btn link tut-skip">Eğitimi geç</button>
          <button class="btn small primary tut-next">İleri ▶</button>
        </div>
      </div>`;
    document.body.append(spot, coach);
    coach.querySelector('.tut-skip').addEventListener('click', finish);
    coach.querySelector('.tut-next').addEventListener('click', advance);
    root.addEventListener('resize', tut.reposition);
    document.addEventListener('scroll', tut.reposition, true);
  }

  tut.start = function () {
    if (!OG.campaign.week) return;
    build();
    steps = STEPS();
    i = 0;
    tut.active = true;
    show();
  };

  function show() {
    while (steps[i] && steps[i].skipIf && steps[i].skipIf()) i++;
    const s = steps[i];
    if (!s) { finish(); return; }
    coach.querySelector('.tut-text').innerHTML = s.text;
    coach.querySelector('.tut-count').textContent = `${i + 1}/${steps.length}`;
    const next = coach.querySelector('.tut-next');
    next.style.display = s.wait && !s.allowNext ? 'none' : '';
    next.textContent = i === steps.length - 1 ? 'Anladım 👍' : 'İleri ▶';
    coach.classList.remove('hidden', 'pop');
    void coach.offsetWidth;
    coach.classList.add('pop');
    if (s.target && OG.ui.setMobileTab && root.matchMedia('(max-width: 760px)').matches) {
      const tab = /deck|card/.test(s.target) ? 'day' : /goals|meters|startBtn|mission|life/.test(s.target) ? 'hero' : 'day';
      OG.ui.setMobileTab(tab);
    }
    const el = s.target && document.querySelector(s.target);
    // Öğeyi bulunduğu panelin ortasına getir (alttaki sabit Başlat butonunun arkasında kalmasın)
    if (el) {
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      setTimeout(tut.reposition, 400);
    }
    tut.reposition();
  }

  tut.reposition = function () {
    if (!tut.active || !coach) return;
    const s = steps[i];
    const el = s && s.target && document.querySelector(s.target);
    if (!el) {
      // Vurgulanacak öğe yoksa (ör. hoş geldin) tüm ekranı karart
      spot.classList.add('dim-only');
      Object.assign(spot.style, { display: 'block', left: '50%', top: '50%', width: '0px', height: '0px' });
      coach.classList.remove('at-top');
      coach.classList.add('center');
      return;
    }
    spot.classList.remove('dim-only');
    // Sürükleme adımında ekran kararmaz; kart sadece çerçeveyle işaretlenir
    spot.classList.toggle('outline-only', !!s.outline);
    coach.classList.remove('center');
    const r = el.getBoundingClientRect();
    const pad = 6;
    Object.assign(spot.style, {
      display: 'block',
      left: `${r.left - pad}px`,
      top: `${r.top - pad}px`,
      width: `${r.width + pad * 2}px`,
      height: `${r.height + pad * 2}px`,
    });
    // Konuşma kutusu, vurgulanan alanın üstünü kapatmasın diye ekranın diğer yarısına geçer
    coach.classList.toggle('at-top', r.top + r.height / 2 > innerHeight * 0.55);
  };

  tut.notify = function (ev, id) {
    if (!tut.active) return;
    const s = steps[i];
    if (ev === 'start') { finish(); return; }
    if (s && s.wait && s.wait(ev, id)) setTimeout(advance, 250);
  };

  function advance() {
    i++;
    if (i >= steps.length) finish();
    else show();
  }

  function finish() {
    tut.active = false;
    if (coach) coach.classList.add('hidden');
    if (spot) spot.style.display = 'none';
    OG.campaign.profile.tutorialDone = true;
    OG.campaign.saveProfile();
  }
})(window);
