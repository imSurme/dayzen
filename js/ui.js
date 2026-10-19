// Oyun tahtası: el, gün çizelgesi, karakter, hedefler, gökyüzü ve simülasyon animasyonu.
(function (root) {
  'use strict';
  const OG = root.OG;
  const C = OG.CONFIG;
  const $ = (s) => document.querySelector(s);
  const ui = (OG.ui = {});

  const SLOT_MS = 600; // ×1 hızda bir 30 dakikalık slotun animasyon süresi
  const SPEEDS = [0.5, 1, 2, 4];
  const speedLabel = (v) => `Hız ×${v}`;
  let els = {};
  let selectedTaskId = null;
  let drag = null; // { taskId, uid?, grabOffset }
  let simulating = false;
  let speed = 1;
  let skip = false;
  let newUid = null; // son eklenen blok (yalnız o animasyon oynatır)
  let forecast = null; // planlama tahmini: { r, byUid, ev }
  let toastTimer = null;

  const signed = (v) => (v > 0 ? `+${v}` : `${v}`);
  const pct = (slots) => `${(slots / C.SLOTS) * 100}%`;
  const lerp = (a, b, p) => a + (b - a) * p;
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const shortDur = (slots) => (slots === 1 ? OG.t('30 dk', '30 min') : `${Math.floor(slots / 2)}${slots % 2 ? '½' : ''} ${OG.t('sa', 'h')}`);
  const camp = () => OG.campaign;
  const cur = () => OG.campaign.week && OG.campaign.week.current;
  const tut = (ev, id) => OG.tutorial && OG.tutorial.notify(ev, id);
  ui.isSimulating = () => simulating;

  // Karakterin söyledikleri
  const LINES = {
    place: {
      is: ['Çalışma vakti! 💪', 'Odaklanıyorum... 🧠', 'Bunu da halledelim!'],
      saglik: ['Sağlık her şeydir! 💚', 'Vücudum teşekkür eder.', 'Harika bir fikir!'],
      yemek: ['Afiyet olsun bana! 😋', 'Karnım zaten guruldıyordu.', 'Yemek molası, en sevdiğim!'],
      dinlenme: ['Biraz kestirmek iyi gelir 😴', 'Şarj olma vakti 🔋'],
      sosyal: ['Onları çok özlemiştim! 🥰', 'Sohbet ruhuma iyi gelir.'],
      eglence: ['Biraz eğlence şart 🎉', 'Hak ettim bunu!'],
      ev: ['Ev işleri de bitmeli 🧹', 'Kimse benim yerime yapmayacak...'],
      gelisim: ['Her gün biraz daha iyi! 📈', 'Beynim bayram ediyor 🧠'],
    },
    conflict: ['O saat dolu! 😅', 'İki işi aynı anda yapamam!', 'Hop, orası müsait değil.'],
    remove: ['Peki, onu iptal ediyorum.', 'Tamam, o iş yattı 🙃'],
    idle: ['Biraz soluklanayım... ☁️', 'Hiçbir şey yapmamak da güzel.', 'Kafa dinliyorum 😌'],
    failed: ['Olmuyor... hiç halim yok 😫', 'Yapamadım, tükendim...'],
    start: ['Hadi bakalım, gün başlıyor! ☀️', 'Alarm çaldı, kalkıyorum! ⏰'],
  };

  // Gün içi gökyüzü renkleri: [dakika, üst, alt]
  const SKY = [
    [8 * 60, '#ffb88c', '#ffe6c7'],
    [10 * 60, '#7cc8ff', '#d4f0ff'],
    [14 * 60, '#4fb3ff', '#bfe6ff'],
    [17 * 60, '#6fb6f0', '#ffd9a8'],
    [19 * 60, '#ff8a65', '#ffc58a'],
    [20 * 60 + 30, '#6a4c9c', '#e47a8f'],
    [22 * 60, '#232a6b', '#4b3f86'],
    [24 * 60, '#0f1236', '#1f2257'],
  ];
  function mixHex(a, b, t) {
    const pa = parseInt(a.slice(1), 16);
    const pb = parseInt(b.slice(1), 16);
    const ch = (sh) => Math.round(lerp((pa >> sh) & 255, (pb >> sh) & 255, t));
    return `rgb(${ch(16)}, ${ch(8)}, ${ch(0)})`;
  }
  function setSky(min) {
    let i = 0;
    while (i < SKY.length - 2 && min > SKY[i + 1][0]) i++;
    const [m0, t0, b0] = SKY[i];
    const [m1, t1, b1] = SKY[i + 1];
    const t = Math.max(0, Math.min(1, (min - m0) / (m1 - m0)));
    const hud = els.hud.style;
    hud.setProperty('--sky-top', mixHex(t0, t1, t));
    hud.setProperty('--sky-bottom', mixHex(b0, b1, t));
    hud.setProperty('--night', Math.max(0, Math.min(1, (min - 19.5 * 60) / 90)).toFixed(2));
    placeOrbs(min);
  }

  // Güneş ve ay, ufkun hemen altındaki bir merkez etrafında aynı yayda döner:
  // güneş 08:00'de soldan doğar, 21:00 civarı sağdan batar; ay 20:00'de soldan doğup gece boyunca yükselir.
  let skyMin = C.DAY_START;
  function placeOrbs(min) {
    skyMin = min;
    const sky = els.sun.parentElement;
    const w = sky.clientWidth;
    const h = sky.clientHeight;
    if (!w) return;
    const horizon = h + 26; // ufuk HUD'un biraz altında: alçaktaki güneş yarı görünür
    const rx = w * 0.46;
    const ry = h - 4;
    const sunDeg = 15 + ((min - 8 * 60) / 60) * 12.5;
    const pos = (el, deg) => {
      const a = (deg * Math.PI) / 180;
      const x = w / 2 - rx * Math.cos(a);
      const y = horizon - ry * Math.sin(a);
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%)`;
    };
    pos(els.sun, sunDeg);
    pos(els.moon, sunDeg - 165);
  }

  function moodOf(e, s) {
    if (s >= 85) return { face: '🤯', mood: 'bad' };
    if (e <= 10) return { face: '😵', mood: 'bad' };
    if (e < 30) return { face: '😩', mood: 'bad' };
    if (s >= 60) return { face: '😰', mood: 'ok' };
    if (e >= 65 && s <= 30) return { face: '😄', mood: 'good' };
    if (e >= 45) return { face: '🙂', mood: 'good' };
    return { face: '😐', mood: 'ok' };
  }

  ui.init = function () {
    els = {
      hud: $('#hud'), sun: $('#sun'), moon: $('#moon'), dayPill: $('#dayPill'), walletVal: $('#walletVal'),
      pool: $('#pool'), timeline: $('#timeline'), clock: $('#clock'),
      dayTitle: $('#dayTitle'), scenarioTag: $('#scenarioTag'), bedControl: $('#bedControl'),
      redrawBtn: $('#redrawBtn'), redrawLeft: $('#redrawLeft'),
      energyBar: $('#energyBar'), energyVal: $('#energyVal'),
      stressBar: $('#stressBar'), stressVal: $('#stressVal'),
      scoreVal: $('#scoreVal'), scorePill: document.querySelector('.pill-score'),
      planned: $('#plannedTime'), free: $('#freeTime'),
      avatar: $('#avatar'), face: $('#face'), charBadge: $('#charBadge'), bubble: $('#bubble'),
      goals: $('#goals'), goalStars: $('#goalStars'), goalsNote: $('#goalsNote'), forecast: $('#forecast'),
      energyFc: $('#energyFc'), stressFc: $('#stressFc'),
      startBtn: $('#startBtn'), speedBtn: $('#speedBtn'), skipBtn: $('#skipBtn'), clearBtn: $('#clearBtn'),
      log: $('#log'), toast: $('#toast'),
      hearts: $('#heartsPill'), missionBox: $('#missionBox'), lifeGrid: $('#lifeGrid'), lifeNote: $('#lifeNote'),
      dayScroll: document.querySelector('.day-scroll'), dayBanner: $('#dayBanner'), logWrap: $('#logWrap'),
    };
    buildTimeline();
    bindTimelineEvents();

    els.startBtn.addEventListener('click', runSimulation);
    els.clearBtn.addEventListener('click', () => {
      if (simulating || !cur()) return;
      OG.resetSchedule();
      OG.saveSchedule();
      selectTask(null);
      render();
      say('Temiz bir sayfa! Baştan planlayalım ✨');
    });
    $('#randomBtn').addEventListener('click', () => {
      if (simulating || !cur()) return;
      randomPlace();
    });
    els.redrawBtn.addEventListener('click', () => {
      if (simulating || !cur()) return;
      if (!camp().redraw()) {
        OG.sfx('error');
        say('Bugünlük yeniden çekme hakkın bitti 🙈', 'shake');
        return;
      }
      OG.sfx('shuffle');
      selectTask(null);
      render();
      renderPool(true);
      say('Yeni kartlar geldi! 🃏 Yerleştirdiklerin elinde kaldı.');
    });
    els.bedControl.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-bed]');
      if (!b || simulating) return;
      const res = OG.setBedSlot(Number(b.dataset.bed));
      if (!res.ok) {
        OG.sfx('error');
        say(res.reason, 'shake');
        return;
      }
      OG.saveSchedule();
      render();
      tut('bed');
      const bed = OG.state.bedSlot;
      say(bed === 28 ? 'Erkenden yatıyorum: yarın çok dinç olacağım! 😴' : bed === 30 ? '23:00’te yatarım, yarın biraz daha dinç olurum.' : 'Gece yarısına kadar ayaktayım 🌙');
    });
    els.speedBtn.addEventListener('click', () => {
      speed = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length];
      els.speedBtn.textContent = speedLabel(speed);
      OG.prefs.speed = speed; // seçilen hız sonraki günlerde de geçerli
      OG.savePrefs();
    });
    els.skipBtn.addEventListener('click', () => { skip = true; });
    els.scenarioTag.addEventListener('click', () => { if (!simulating) OG.screens.dayIntro(); });
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      selectTask(null);
      $('#cardZoom').classList.add('hidden');
    });
    $('#cardZoom').addEventListener('click', (e) => { if (e.target.id === 'cardZoom') e.target.classList.add('hidden'); });
    // Telefon sekmeleri
    document.body.dataset.mtab = 'day';
    document.querySelectorAll('#mobileTabs [data-mtab]').forEach((b) =>
      b.addEventListener('click', () => ui.setMobileTab(b.dataset.mtab)));
    $('#mobileStart').addEventListener('click', () => els.startBtn.click());
    root.addEventListener('resize', () => { fitTimeline(); placeOrbs(skyMin); });
    bindTray();
    setSky(C.DAY_START);
    fitTimeline();
  };

  const isMobile = () => root.matchMedia('(max-width: 760px)').matches;
  const coarse = () => root.matchMedia('(pointer: coarse)').matches; // dokunmatik ekran
  ui.setMobileTab = function (tab) {
    if (tab === 'deck') tab = 'day'; // kartlar gün ekranının altındaki tepside
    document.body.dataset.mtab = tab;
    document.querySelectorAll('#mobileTabs [data-mtab]').forEach((b) => b.classList.toggle('active', b.dataset.mtab === tab));
    if (tab === 'day') fitTimeline();
  };

  // Günün tamamı tek bakışta görünsün: satır yüksekliği panel yüksekliğine göre ayarlanır
  function fitTimeline() {
    const sc = els.dayScroll;
    if (!sc) return;
    let rh = 28;
    if (!isMobile()) {
      const style = getComputedStyle(sc);
      // çizelgenin alt boşluğu (14px) + kenarlık ve gölge payı
      const avail = sc.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom) - 26;
      rh = Math.max(17, Math.min(34, Math.floor(avail / C.SLOTS)));
    }
    document.documentElement.style.setProperty('--row-h', `${rh}px`);
    document.body.classList.toggle('tl-compact', rh < 24);
    if (OG.tutorial) OG.tutorial.reposition();
  }
  ui.fitTimeline = fitTimeline;

  // Elindeki kartları çizelgeye rastgele dağıt (sabit görevler ve yatış saati korunur)
  function randomPlace() {
    OG.resetSchedule();
    const cards = [];
    for (const id of OG.state.hand) {
      const t = OG.TASK_MAP[id];
      for (let u = 0; u < t.max; u++) if (u === 0 || Math.random() < 0.5) cards.push(id);
    }
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    let placed = 0;
    for (const id of cards) {
      for (let tries = 0; tries < 10; tries++) {
        if (OG.placeTask(id, Math.floor(Math.random() * OG.state.bedSlot)).ok) { placed++; break; }
      }
    }
    OG.saveSchedule();
    OG.sfx('shuffle');
    selectTask(null);
    render();
    say(`Zar atıldı! 🎲 ${placed} kart yerleşti. Beğenmezsen tekrar bas.`);
  }

  // Günün kısa tanıtım şeridi (gün tanıtım penceresine gerek kalmadan)
  function showDayBanner() {
    const w = camp().week;
    const c = cur();
    const sc = OG.SCENARIOS[w.day];
    const prev = w.days[w.day - 1];
    els.dayBanner.innerHTML = `
      <span class="db-icon">${sc.icon}</span>
      <div class="db-text"><b>${sc.name}</b><span>${sc.desc}</span></div>
      <span class="db-start" title="${prev ? 'Dünden devreden' : 'Haftanın başı'}">⚡${c.startEnergy} 😰${c.startStress}</span>
      <button class="db-close" aria-label="Kapat">✕</button>`;
    els.dayBanner.classList.remove('hidden');
    els.dayBanner.querySelector('.db-close').addEventListener('click', () => {
      els.dayBanner.classList.add('hidden');
      fitTimeline();
    });
  }

  // Kampanyadaki güncel günü tahtaya yükle
  ui.loadDay = function () {
    const w = camp().week;
    if (!w) return;
    const sc = OG.SCENARIOS[w.day];
    const ch = OG.CHAR_MAP[w.charId];
    els.dayPill.textContent = `📅 ${sc.short} ${w.day + 1}/7`;
    els.dayTitle.textContent = `${sc.icon} ${sc.day}`;
    els.scenarioTag.textContent = sc.name;
    els.charBadge.textContent = ch.icon;
    els.log.innerHTML = '<li class="log-empty">Günü başlatınca olanlar burada akacak.</li>';
    els.clock.textContent = '08:00';
    setSky(C.DAY_START);
    resetStats();
    selectedTaskId = null;
    els.logWrap.open = false;
    ui.setTray(true);
    showDayBanner();
    render();
    renderPool(true);
    fitTimeline();
    if (isMobile()) ui.setMobileTab('day');
    say(`${sc.icon} ${sc.name}! Hadi günü planlayalım.`);
  };

  function resetStats() {
    const c = cur();
    if (c) setStats(c.startEnergy, c.startStress, 0);
  }

  function render() {
    if (!cur()) return;
    computeForecast();
    renderPool();
    renderTimeline();
    renderMeta();
    renderGoals();
    renderForecast();
    renderMission();
    renderLife();
    ui.updateWallet();
    // Planlamaya başlanınca gün şeridi kapanır, çizelgeye yer açılır
    if (!els.dayBanner.classList.contains('hidden') && OG.state.schedule.some((i) => !i.locked)) els.dayBanner.classList.add('hidden');
    fitTimeline();
  }

  // ---------- Planlama tahmini (olaylar hariç) ----------
  function computeForecast() {
    forecast = null;
    if (!cur() || simulating || !OG.prefs.forecast) return;
    const r = OG.simulateDay(OG.state.schedule, { ...camp().dayContext(), events: [] });
    const byUid = {};
    r.steps.forEach((st) => { if (st.uid) byUid[st.uid] = st; });
    forecast = { r, byUid, ev: camp().evaluate(r) };
  }

  function fcChip(st) {
    const tip = st.notes.map((n) => n.text).concat(`⚡ ${st.before.energy}→${st.energy} · 😰 ${st.before.stress}→${st.stress}`).join('&#10;');
    if (st.failed) return `<span class="block-fc fail" title="${tip}">✖ başarısız</span>`;
    const bad = st.notes.some((n) => n.type === 'bad');
    const good = st.notes.some((n) => n.type === 'good');
    return `<span class="block-fc ${bad ? 'warn' : good ? 'good' : ''}" title="${tip}">${bad ? '⚠️ ' : good ? '✨ ' : ''}~${st.points}⭐</span>`;
  }

  function renderForecast() {
    const el = els.forecast;
    els.energyFc.textContent = '';
    els.stressFc.textContent = '';
    if (!OG.prefs.forecast) {
      el.innerHTML = '<span class="fc-off">🔮 Tahmin kapalı · ⚙️ Ayarlar’dan açabilirsin</span>';
      return;
    }
    if (!forecast) { el.innerHTML = ''; return; }
    const { r, ev } = forecast;
    const warns = r.steps.filter((st) => st.type === 'task' && (st.failed || st.notes.some((n) => n.type === 'bad'))).length;
    el.title = `Planlama tahmini (sürpriz olaylar hariç) · boş zaman: ${OG.fmtDur(r.stats.idleSlots)}`;
    // Önem sırasına göre: dar alanda sondakiler kırpılır
    el.innerHTML = `
      <span class="fc-label">🔮</span>
      ${ev.night.heartLoss ? `<span class="fc-item fc-heart" title="${heartReasons(ev.night).join(' · ')}">💔 −${ev.night.heartLoss}</span>` : ''}
      ${ev.night.missionGain ? `<span class="fc-item fc-mission" title="Ana göreve tahmini katkı">${camp().mission().icon} +${ev.night.missionGain}</span>` : ''}
      <span class="fc-item" title="Tahmini puan">⭐ <b>~${r.total}</b></span>
      <span class="fc-item fc-stars" title="Tahmini hedef yıldızı">${'★'.repeat(ev.stars)}${'☆'.repeat(3 - ev.stars)}</span>
      <span class="fc-item" title="Gün sonu enerji ve stres">⚡<b>${r.finalEnergy}</b> 😰<b>${r.finalStress}</b></span>
      ${warns ? `<span class="fc-item fc-warn" title="${warns} görevde verim kaybı var">⚠️ ${warns}</span>` : ''}`;
    els.energyFc.textContent = `→ ${r.finalEnergy}`;
    els.stressFc.textContent = `→ ${r.finalStress}`;
  }
  ui.render = render;

  ui.updateWallet = function () {
    els.walletVal.textContent = camp().profile.stars;
    const w = camp().week;
    els.hearts.style.display = w ? '' : 'none';
    if (w) {
      els.hearts.textContent = '❤️'.repeat(w.hearts) + '🖤'.repeat(Math.max(0, w.maxHearts - w.hearts));
      els.hearts.title = `${w.hearts} canın kaldı · ⏪ ${w.rewinds} geri sarma hakkı`;
    }
  };

  function heartReasons(n) {
    const out = n.crises.map((id) => `${OG.METER_MAP[id].icon} ${OG.METER_MAP[id].name} krizi`);
    if (n.burnout) out.push('😵 Tükenmişlik');
    if (n.justFailed) out.push('Ana görev kaçtı (−2)');
    if (n.choreHearts) out.push(`Yapılacak kaçtı (−${n.choreHearts})`);
    return out;
  }
  ui.heartReasons = heartReasons;

  // Haftalık ana görev kartı
  function renderMission() {
    const w = camp().week;
    if (!w) return;
    const m = camp().mission();
    const st = w.mission;
    const gain = forecast && st.status === 'active' ? forecast.ev.night.missionGain : 0;
    const daysLeft = m.deadline - w.day;
    const left = Math.max(0, m.goal - st.progress);
    const pace = st.status === 'active' && daysLeft >= 0 ? Math.ceil(left / (daysLeft + 1)) : 0;
    const when = st.status === 'done' ? '✅ Tamamlandı!' : st.status === 'failed' ? '❌ Süre doldu'
      : daysLeft === 0 ? '⏰ Son gün: bu akşam!' : `${OG.byDay(m.deadline)} · ${OG.t(`${daysLeft + 1} gün`, `${daysLeft + 1} day${daysLeft ? 's' : ''} left`)}`;
    els.missionBox.className = `mission-box ${st.status}${st.status === 'active' && daysLeft === 0 ? ' urgent' : ''}`;
    els.missionBox.innerHTML = `
      <div class="ms-head">
        <span class="ms-icon">${m.icon}</span>
        <div class="ms-title"><b>${m.name}</b><small>${when}</small></div>
        <span class="ms-val">${st.progress}<small>/${m.goal}</small></span>
      </div>
      <div class="ms-bar">
        <div class="ms-fill-fc" style="width:${Math.min(100, ((st.progress + gain) / m.goal) * 100)}%"></div>
        <div class="ms-fill" style="width:${Math.min(100, (st.progress / m.goal) * 100)}%"></div>
      </div>
      ${st.status === 'active' ? `<div class="ms-foot"><span>Bugünkü plan: <b>+${gain}</b> ${m.unit}</span><span class="${gain >= pace ? 'ok' : 'behind'}">Günde ~${pace} gerek</span></div>` : ''}`;
  }

  // Yaşam dengesi: şimdiki değer ve bu gecenin tahmini
  function renderLife() {
    const w = camp().week;
    if (!w) return;
    const n = forecast && forecast.ev.night;
    els.lifeNote.textContent = `her gece −${camp().diff().decay}`;
    els.lifeGrid.innerHTML = OG.METERS.map((m) => {
      const v = w.meters[m.id];
      const crisis = n && n.crises.includes(m.id);
      const after = n ? n.meters[m.id] : null;
      let fc = '';
      if (n) fc = crisis ? '<small class="crisis">→ KRİZ!</small>' : `<small class="${after < OG.METER_LOW ? 'warn' : after >= v ? 'up' : 'down'}">→ ${after}</small>`;
      return `
        <div class="life ${v < OG.METER_LOW ? 'low' : ''}" title="${m.name}: ${v}/100${n ? ` · bu gece +${n.gains[m.id]} −${n.decay}` : ''}">
          <div class="life-top"><span>${m.icon} ${m.name}</span><b>${v} ${fc}</b></div>
          <div class="life-bar m-${m.id}">
            <div class="life-fill" style="width:${v}%"></div>
            ${n && !crisis ? `<span class="life-mark" style="left:${after}%"></span>` : ''}
            <span class="tick" style="left:${OG.METER_LOW}%"></span>
          </div>
        </div>`;
    }).join('');
  }

  function say(text, kind = 'pop') {
    els.bubble.textContent = text;
    els.bubble.classList.remove('pop', 'shake');
    void els.bubble.offsetWidth; // animasyonu yeniden tetikle
    els.bubble.classList.add(kind);
  }
  ui.say = say;
  function react() {
    els.avatar.classList.remove('react');
    void els.avatar.offsetWidth;
    els.avatar.classList.add('react');
  }

  // ---------- El ----------
  function cardHTML(t, left) {
    const dots = Array.from({ length: t.max }, (_, k) => `<span class="dot ${k < left ? 'on' : ''}"></span>`).join('');
    return `
      <div class="card-art">
        <span class="card-dur">⏱ ${shortDur(t.dur)}</span>
        <span class="card-icon">${t.icon}</span>
        <span class="card-uses" title="${left}/${t.max} hak kaldı">${dots}</span>
        ${t.kind === 'char' ? '<span class="card-tag">Özel</span>' : ''}
        ${t.kind === 'chore' ? '<span class="card-tag chore-tag">Yapılacak</span>' : ''}
      </div>
      <div class="card-body">
        <div class="card-name">${t.name}</div>
        <div class="card-stats">
          <span class="st pts">⭐${t.pts}</span>
          <span class="st ${t.energy > 0 ? 'pos' : t.energy < 0 ? 'neg' : ''}">⚡${signed(t.energy)}</span>
          <span class="st ${t.stress < 0 ? 'pos' : t.stress > 0 ? 'neg' : ''}">😰${signed(t.stress)}</span>
        </div>
        ${cardExtras(t)}
        ${t.desc ? `<div class="card-desc">${t.desc}</div>` : ''}
      </div>`;
  }

  // Kartın ana göreve katkısı, beslediği yaşam alanı, ön koşulu ve (zorunluysa) son saati
  function cardExtras(t) {
    const w = camp().week;
    const parts = [];
    const c = cur();
    const chore = c && t.kind === 'chore' && c.chores.find((x) => x.taskId === t.id);
    if (chore) parts.push(`<span class="xt deadline">⏰ ${OG.until(chore.deadline)}</span>`);
    if (w) {
      const mg = camp().missionGainOf(t.id);
      if (mg) parts.push(`<span class="xt mission" title="Ana göreve katkı (tam verimle)">${camp().mission().icon}+${mg * t.dur}</span>`);
      const life = OG.meterGainOf(t.id, w.charId);
      Object.entries(life).forEach(([k, v]) => parts.push(`<span class="xt life-${k}" title="${OG.METER_MAP[k].name} göstergesine katkı">${OG.METER_MAP[k].icon}+${v * t.dur}</span>`));
    }
    if (t.req) parts.push(`<span class="xt req" title="Ön koşul: sağlanmazsa görev yapılamaz">🔒 ${OG.reqText(t.req)}</span>`);
    return parts.length ? `<div class="card-extras">${parts.join('')}</div>` : '';
  }
  ui.cardHTML = cardHTML;

  function renderPool(deal = false) {
    els.pool.innerHTML = '';
    if (deal) {
      els.pool.classList.add('deal');
      setTimeout(() => els.pool.classList.remove('deal'), 800);
    }
    const c = cur();
    els.redrawLeft.textContent = c ? c.redrawsLeft : 0;
    els.redrawBtn.disabled = !c || c.redrawsLeft <= 0;
    OG.state.hand.forEach((id, i) => {
      const t = OG.TASK_MAP[id];
      const left = OG.remainingUses(t.id);
      const card = document.createElement('div');
      card.className = 'card' + (left <= 0 ? ' used-up' : '') + (selectedTaskId === t.id ? ' selected' : '') + (t.kind === 'char' ? ' special' : '') + (t.kind === 'chore' ? ' chore' : '');
      card.style.setProperty('--cat', OG.CATEGORIES[t.cat].color);
      card.style.animationDelay = `${i * 30}ms`;
      card.draggable = left > 0 && !coarse(); // dokunmatikte kendi sürüklememiz kullanılır
      card.innerHTML = cardHTML(t, left);
      card.dataset.id = t.id;
      card.tabIndex = left > 0 ? 0 : -1;
      card.setAttribute('role', 'button');
      card.setAttribute('aria-label', `${t.name}, ${OG.fmtDur(t.dur)}, ${t.pts} puan, enerji ${signed(t.energy)}, stres ${signed(t.stress)}`);
      card.title = t.desc ? `${t.name} · ${t.desc}` : t.name;
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); }
      });

      card.addEventListener('dragstart', (e) => {
        if (simulating || OG.remainingUses(t.id) <= 0) { e.preventDefault(); return; }
        drag = { taskId: t.id, grabOffset: 0 };
        e.dataTransfer.setData('text/plain', t.id);
        e.dataTransfer.effectAllowed = 'move';
      });
      card.addEventListener('dragend', () => { drag = null; hideGhost(); });
      attachTouchDrag(card, () => (OG.remainingUses(t.id) > 0 ? { taskId: t.id, grabOffset: 0 } : null), false);
      // Tıklayınca kart büyüyüp detaylarını gösterir; yerleştirmek için sürüklenir
      card.addEventListener('click', () => {
        if (Date.now() < suppressClickUntil) return;
        OG.sfx('select');
        openCardDetail(t, card);
      });
      els.pool.appendChild(card);
    });
  }

  // ---------- Büyük kart (detay) ----------
  const SPORTY = ['spor', 'antrenman', 'yuruyus', 'takim', 'ilham', 'yoga'];
  function reqLong(req) {
    if (OG.lang === 'en') {
      return [req.minEnergy ? `Energy must be at least <b>${req.minEnergy}</b>` : '', req.maxStress ? `stress must be at most <b>${req.maxStress}</b>` : '']
        .filter(Boolean).join(' and ') + ', or the task fails.';
    }
    return [req.minEnergy ? `Enerjin en az <b>${req.minEnergy}</b> olmalı` : '', req.maxStress ? `Stresin en fazla <b>${req.maxStress}</b> olmalı` : '']
      .filter(Boolean).join(' ve ') + '; yoksa görev yapılamaz.';
  }
  function cardTips(t) {
    const out = [];
    if (t.focus) out.push('🌅 12:00’den önce yapılırsa puan ×1.2');
    if (t.window) out.push(`🍽️ ${OG.fmtTime(t.window[0])}–${OG.fmtTime(t.window[1])} arasında başlarsa +10 ⭐ ve +5 ⚡`);
    if (t.id === 'kahve') out.push('🌙 18:00’den sonra içilirse stres +5');
    if (SPORTY.includes(t.id)) out.push('🚿 Hemen ardından Duş alırsan +5 ⭐ ve stres −10');
    if (t.id === 'dus') out.push('🏃 Spordan hemen sonra yapılırsa bonus verir');
    if (t.outdoor) out.push('🌧️ Dış mekân: yağmur olayı çıkabilir');
    if (t.cat === 'is') out.push('😪 Yemekten hemen sonra yapılırsa enerji −5 · 🌙 22:00 sonrası ×0.8');
    return out;
  }

  function openCardDetail(t, fromEl) {
    const layer = $('#cardZoom');
    const box = $('#cardZoomCard');
    const w = camp().week;
    const c = cur();
    const left = OG.remainingUses(t.id);
    const cat = OG.CATEGORIES[t.cat];
    const row = (icon, title, body, cls = '') => `<div class="cz-row ${cls}"><span class="cz-row-icon">${icon}</span><div><b>${title}</b><p>${body}</p></div></div>`;
    const rows = [];
    const mg = w ? camp().missionGainOf(t.id) : 0;
    if (mg) {
      const m = camp().mission();
      rows.push(row(m.icon, 'Ana göreve katkı', OG.t(`<b>+${mg * t.dur} ${m.unit}</b> (${m.name}). Tam verimle bu kadar; yorgun ya da stresliyken daha az sayılır.`,
      `<b>+${mg * t.dur} ${m.unit}</b> (${m.name}) at full efficiency; less counts when you are tired or stressed.`), 'mission'));
    }
    if (w) {
      const life = Object.entries(OG.meterGainOf(t.id, w.charId)).map(([k, v]) => `${OG.METER_MAP[k].icon} ${OG.METER_MAP[k].name} <b>+${v * t.dur}</b>`);
      if (life.length) rows.push(row('⚖️', 'Yaşam dengesi', `${life.join(' · ')} (verime göre değişir)`));
    }
    if (t.req) rows.push(row('🔒', 'Ön koşul', reqLong(t.req), 'warn'));
    const chore = c && c.chores.find((x) => x.taskId === t.id);
    if (chore) rows.push(row('📌', 'Yapılacak', OG.t(`<b>${OG.until(chore.deadline)}</b> bitmeli. Kaçarsa −25 ⭐ ve ilgili yaşam alanı −20; haftadaki ikinci kaçırmadan itibaren −1 ❤️.`,
      `Must be done <b>${OG.until(chore.deadline)}</b>. If missed: −25 ⭐ and −20 to its life area; from the second miss in a week, −1 ❤️.`), 'bad'));
    const tips = cardTips(t);
    if (tips.length) rows.push(row('💡', 'İpuçları', tips.join('<br>')));
    const placed = OG.state.schedule.filter((i) => i.taskId === t.id);
    if (placed.length) {
      rows.push(row('🗓️', 'Planında', placed.map((i) => {
        const st = forecast && forecast.byUid[i.uid];
        const fc = st ? (st.failed ? ' · <span class="neg">✖ başarısız olacak</span>' : ` · tahmini <b>+${st.points} ⭐</b>`) : '';
        return `${OG.fmtSlot(i.slot)}–${OG.fmtSlot(i.slot + t.dur)}${i.locked ? ' (sabit program)' : ''}${fc}`;
      }).join('<br>')));
    }
    const tag = t.kind === 'char' ? ' · Karaktere özel' : t.kind === 'chore' ? ' · Yapılacak' : t.kind === 'fixed' ? ' · Sabit program' : '';
    let action = '';
    if (t.kind !== 'fixed' && OG.state.hand.includes(t.id)) {
      if (left <= 0) action = '<span class="cz-hint">Bu kartın bugünkü hakkı doldu.</span>';
      else if (isMobile()) action = '<span class="cz-hint">✋ Kartı alttaki tepsiden yukarı, çizelgeye sürükle</span>';
      else action = '<span class="cz-hint">✋ Bu kartı tutup çizelgeye sürükleyebilirsin</span>';
    }
    box.innerHTML = `
      <div class="cz-card" style="--cat:${cat.color}" ${action.includes('sürükle') ? 'draggable="true"' : ''}>
        <div class="cz-art">
          <span class="cz-icon">${t.icon}</span>
          <div class="cz-head"><b>${t.name}</b><span>${cat.name}${tag}</span></div>
          <div class="cz-meta"><span class="cz-dur">⏱ ${OG.fmtDur(t.dur)}</span>${t.kind !== 'fixed' ? `<span class="cz-uses">${left}/${t.max} hak</span>` : ''}</div>
        </div>
        <div class="cz-stats">
          <div class="pts"><span>⭐</span><b>${t.pts}</b><small>puan</small></div>
          <div class="${t.energy > 0 ? 'pos' : t.energy < 0 ? 'neg' : ''}"><span>⚡</span><b>${signed(t.energy)}</b><small>enerji</small></div>
          <div class="${t.stress < 0 ? 'pos' : t.stress > 0 ? 'neg' : ''}"><span>😰</span><b>${signed(t.stress)}</b><small>stres</small></div>
        </div>
        <div class="cz-rows">${rows.join('')}</div>
        <div class="cz-actions">${action}<button class="btn" data-cz="close">Kapat</button></div>
      </div>`;
    // Kartın bulunduğu yerden ekranın ortasına büyüyerek gelsin
    const card = box.firstElementChild;
    if (fromEl) {
      const r = fromEl.getBoundingClientRect();
      card.style.setProperty('--fx', `${r.left + r.width / 2 - innerWidth / 2}px`);
      card.style.setProperty('--fy', `${r.top + r.height / 2 - innerHeight / 2}px`);
    }
    layer.classList.remove('hidden');
    const close = () => layer.classList.add('hidden');
    ui.closeCardDetail = close;
    box.querySelector('[data-cz="close"]').addEventListener('click', close);
    const placeBtn = box.querySelector('[data-cz="place"]');
    if (placeBtn) {
      placeBtn.addEventListener('click', () => {
        close();
        selectTask(t.id);
        tut('select', t.id);
        ui.setMobileTab('day');
        say(`${t.icon} ${t.name}: şimdi çizelgede bir saate dokun!`);
      });
    }
    // Büyük kartı doğrudan çizelgeye sürükleme
    card.addEventListener('dragstart', (e) => {
      if (simulating || OG.remainingUses(t.id) <= 0) { e.preventDefault(); return; }
      drag = { taskId: t.id, grabOffset: 0 };
      e.dataTransfer.setData('text/plain', t.id);
      e.dataTransfer.effectAllowed = 'move';
      setTimeout(close, 0);
    });
    card.addEventListener('dragend', () => { drag = null; hideGhost(); });
  }
  ui.openCardDetail = openCardDetail;

  function selectTask(id) {
    selectedTaskId = id;
    document.body.classList.toggle('placing', !!id);
    if (!id) hideGhost();
    renderPool();
  }

  // ---------- Hedefler ----------
  function renderGoals(results, choreResults) {
    const pred = !results && forecast ? forecast.ev.goals : null;
    const goals = results || pred || camp().goals();
    els.goals.innerHTML = goals.map((g) => {
      let st = '';
      let mark = '☆';
      if (results) { st = g.done ? ' done' : ' miss'; mark = g.done ? '★' : '✖'; }
      else if (pred) { st = g.done ? ' pred-yes' : ' pred-no'; mark = g.done ? '★' : '☆'; }
      return `<li class="goal${st}"><span class="goal-icon">${g.icon}</span><span class="goal-text">${g.text}</span><span class="goal-mark">${mark}</span></li>`;
    }).join('');
    const n = results || pred ? goals.filter((g) => g.done).length : 0;
    els.goalStars.textContent = '★'.repeat(n) + '☆'.repeat(3 - n);
    els.goalStars.classList.toggle('pred', !!pred);
    els.goalsNote.textContent = pred ? 'tahmini' : '';
    // Zorunlu işler
    const c = cur();
    if (!c) return;
    const ch = choreResults || (forecast ? forecast.r.chores : null);
    els.goals.innerHTML += c.chores.map((x, i) => {
      const t = OG.TASK_MAP[x.taskId];
      const res = ch && ch[i];
      const st = !res ? '' : choreResults ? (res.done ? ' done' : ' miss') : (res.done ? ' pred-yes' : ' pred-no');
      const mark = !res ? '☐' : res.done ? '✔' : '✖';
      return `<li class="goal chore${st}"><span class="goal-icon">📌</span><span class="goal-text">${t.icon} ${t.name} · <b>${OG.until(x.deadline)}</b></span><span class="goal-mark">${mark}</span></li>`;
    }).join('');
  }
  ui.showGoalResults = renderGoals;

  // ---------- Gün çizelgesi ----------
  function buildTimeline() {
    const tl = els.timeline;
    tl.innerHTML = '';
    for (let s = 0; s < C.SLOTS; s++) {
      const row = document.createElement('div');
      row.className = 'tl-row' + (s % 2 === 0 ? ' hour' : '');
      row.innerHTML = `<span class="tl-time">${OG.fmtSlot(s)}</span>`;
      tl.appendChild(row);
    }
    const end = document.createElement('div');
    end.className = 'tl-end tl-row hour';
    end.innerHTML = '<span class="tl-time">24:00</span>';
    tl.appendChild(end);

    els.track = document.createElement('div');
    els.track.className = 'tl-track';
    els.sleep = document.createElement('div');
    els.sleep.className = 'sleep-zone';
    els.sleep.innerHTML = '<span>😴 Uyku</span>';
    els.blocks = document.createElement('div');
    els.markers = document.createElement('div');
    els.ghost = document.createElement('div');
    els.ghost.className = 'ghost';
    els.now = document.createElement('div');
    els.now.className = 'now-line';
    els.now.innerHTML = '<span class="now-face"></span>';
    els.nowFace = els.now.firstChild;
    els.track.append(els.sleep, els.blocks, els.markers, els.ghost, els.now);
    tl.appendChild(els.track);
  }

  // ---------- Telefonda kart tepsisi: aşağı kaydır → kapanır, yukarı kaydır / dokun → açılır ----------
  ui.setTray = function (open) {
    if (document.body.classList.contains('tray-collapsed') === !open) return;
    document.body.classList.toggle('tray-collapsed', !open);
    if (isMobile()) OG.sfx(open ? 'select' : 'click');
  };
  function bindTray() {
    const panel = document.querySelector('.deck-panel');
    let t0 = null;
    panel.addEventListener('touchstart', (e) => {
      if (!isMobile() || !e.target.closest('.tray-handle, .panel-head') || e.target.closest('button')) return;
      t0 = { y: e.touches[0].clientY, dy: 0 };
    }, { passive: true });
    panel.addEventListener('touchmove', (e) => {
      if (!t0) return;
      t0.dy = e.touches[0].clientY - t0.y;
      e.preventDefault(); // tepsi başlığında dikey kaydırma sayfayı kaydırmasın
    }, { passive: false });
    panel.addEventListener('touchend', () => {
      if (!t0) return;
      const { dy } = t0;
      t0 = null;
      if (dy > 30) ui.setTray(false);
      else if (dy < -30) ui.setTray(true);
      else ui.setTray(document.body.classList.contains('tray-collapsed')); // dokunuş: aç/kapat
    });
    // Fareyle (ya da dokunma olayı yoksa) tutamaca tıklayınca aç/kapat
    document.querySelector('#trayHandle').addEventListener('click', () => {
      if (!('ontouchstart' in root)) ui.setTray(document.body.classList.contains('tray-collapsed'));
    });
  }

  // ---------- Dokunmatik sürükle-bırak ----------
  // Kart: yukarı doğru çekince sürüklenir (yana kaydırma tepsiyi kaydırır).
  // Blok: kısa bir süre basılı tutunca sürüklenir (hemen kaydırınca sayfa kayar).
  // Bloğu tepsiye geri bırakmak plandan kaldırır.
  let touchDrag = null;
  let suppressClickUntil = 0;
  let autoScrollTimer = null;
  const LONG_PRESS_MS = 260;

  function attachTouchDrag(el, getInfo, longPress) {
    el.addEventListener('touchstart', (e) => {
      if (simulating || e.touches.length !== 1 || e.target.closest('.block-remove')) return;
      const info = getInfo();
      if (!info) return;
      const t0 = e.touches[0];
      touchDrag = { ...info, el, longPress, x0: t0.clientX, y0: t0.clientY, x: t0.clientX, y: t0.clientY, active: false };
      if (longPress) {
        touchDrag.timer = setTimeout(() => {
          if (touchDrag && !touchDrag.active) beginTouchDrag();
        }, LONG_PRESS_MS);
      }
    }, { passive: true });
  }

  function beginTouchDrag() {
    const d = touchDrag;
    d.active = true;
    const t = OG.TASK_MAP[d.taskId];
    // Bloğu tuttuğu yerden taşı (üst kenarından değil)
    d.grabOffset = d.uid ? Math.max(0, slotFromEvent({ clientY: d.y0 }) - d.slot) : 0;
    drag = { taskId: d.taskId, uid: d.uid, grabOffset: d.grabOffset };
    d.ghost = document.createElement('div');
    d.ghost.className = 'touch-ghost';
    d.ghost.style.setProperty('--cat', OG.CATEGORIES[t.cat].color);
    d.ghost.innerHTML = `<span>${t.icon}</span><b>${t.name}</b><small>${OG.fmtDur(t.dur)}</small>`;
    document.body.appendChild(d.ghost);
    document.body.classList.add('touch-dragging', d.uid ? 'dragging-block' : 'dragging-card');
    if (d.uid) d.el.classList.add('dragging');
    if (navigator.vibrate) navigator.vibrate(12);
    OG.sfx('select');
    moveTouchDrag(d.x, d.y);
    autoScrollTimer = setInterval(autoScroll, 16);
  }

  function overEl(el, x, y) {
    const r = el.getBoundingClientRect();
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  }

  function moveTouchDrag(x, y) {
    const d = touchDrag;
    d.x = x;
    d.y = y;
    // Sürüklenen kart ekranın dışına taşmasın: yerleştir, ölç, taşıyorsa içeri it
    const gy = Math.max(86, y);
    d.ghost.style.transform = `translate(${x}px, ${gy}px)`;
    const gr = d.ghost.getBoundingClientRect();
    let shift = 0;
    if (gr.right > innerWidth - 8) shift = innerWidth - 8 - gr.right;
    if (gr.left + shift < 8) shift = 8 - gr.left;
    if (shift) d.ghost.style.transform = `translate(${x + shift}px, ${gy}px)`;
    const deck = document.querySelector('.deck-panel');
    const overDeck = isMobile() && overEl(deck, x, y);
    deck.classList.toggle('drop-remove', !!d.uid && overDeck);
    if (!overDeck && overEl(els.track, x, y)) showGhost(d.taskId, slotFromEvent({ clientY: y }) - d.grabOffset, d.uid);
    else hideGhost();
  }

  // Parmak ekranın üst/alt kenarına yaklaşınca çizelge kendiliğinden kayar
  function autoScroll() {
    const d = touchDrag;
    if (!d || !d.active) return;
    const deck = document.querySelector('.deck-panel');
    const bottomEdge = isMobile() ? deck.getBoundingClientRect().top : innerHeight;
    let dy = 0;
    if (d.y < 110) dy = -Math.ceil((110 - d.y) / 8);
    else if (d.y > bottomEdge - 50 && d.y < bottomEdge + 10) dy = Math.ceil((d.y - (bottomEdge - 50)) / 6);
    if (!dy) return;
    const sc = els.dayScroll;
    if (sc.scrollHeight > sc.clientHeight + 2) sc.scrollTop += dy;
    else root.scrollBy(0, dy);
    moveTouchDrag(d.x, d.y);
  }

  function endTouchDrag(cancel) {
    const d = touchDrag;
    touchDrag = null;
    if (!d) return;
    clearTimeout(d.timer);
    if (!d.active) return; // kısa dokunuş: tıklama (detay) normal çalışsın
    clearInterval(autoScrollTimer);
    suppressClickUntil = Date.now() + 400;
    d.ghost.remove();
    d.el.classList.remove('dragging');
    document.body.classList.remove('touch-dragging', 'dragging-block', 'dragging-card');
    const deck = document.querySelector('.deck-panel');
    deck.classList.remove('drop-remove');
    hideGhost();
    drag = null;
    if (cancel) return;
    if (d.uid && isMobile() && overEl(deck, d.x, d.y)) {
      OG.removeItem(d.uid);
      OG.saveSchedule();
      OG.sfx('remove');
      say(pick(LINES.remove));
      render();
      return;
    }
    if (overEl(els.track, d.x, d.y)) tryPlace(d.taskId, slotFromEvent({ clientY: d.y }) - d.grabOffset, d.uid);
  }

  document.addEventListener('touchmove', (e) => {
    const d = touchDrag;
    if (!d) return;
    const t = e.touches[0];
    const dx = t.clientX - d.x0;
    const dy = t.clientY - d.y0;
    if (!d.active) {
      if (d.longPress) {
        // Basılı tutmadan kaydırırsa sayfa kaysın
        if (Math.hypot(dx, dy) > 10) { clearTimeout(d.timer); touchDrag = null; }
        return;
      }
      // Kart: yukarı çekiş sürüklemeyi başlatır, aşağı çekiş tepsiyi kapatır, yatay hareket tepsiyi kaydırır
      if (dy < -10 && Math.abs(dy) > Math.abs(dx)) { d.x = t.clientX; d.y = t.clientY; beginTouchDrag(); }
      else if (dy > 14 && Math.abs(dy) > Math.abs(dx)) { touchDrag = null; ui.setTray(false); return; }
      else if (Math.abs(dx) > 10) { touchDrag = null; return; }
      else return;
    }
    e.preventDefault();
    moveTouchDrag(t.clientX, t.clientY);
  }, { passive: false });
  document.addEventListener('touchend', () => endTouchDrag(false));
  // Uzun basınca açılan tarayıcı menüsü sürüklemeyi bölmesin
  document.addEventListener('contextmenu', (e) => { if (touchDrag || (coarse() && e.target.closest('.card, .block'))) e.preventDefault(); });
  document.addEventListener('touchcancel', () => endTouchDrag(true));

  function slotFromEvent(e) {
    const r = els.track.getBoundingClientRect();
    const top = r.top + els.track.clientTop;
    return Math.floor((e.clientY - top) / (els.track.clientHeight / C.SLOTS));
  }

  function bindTimelineEvents() {
    const tr = els.track;
    tr.addEventListener('dragover', (e) => {
      if (!drag || simulating) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      showGhost(drag.taskId, slotFromEvent(e) - drag.grabOffset, drag.uid);
    });
    tr.addEventListener('dragleave', (e) => {
      if (!tr.contains(e.relatedTarget)) hideGhost();
    });
    tr.addEventListener('drop', (e) => {
      e.preventDefault();
      if (!drag || simulating) return;
      tryPlace(drag.taskId, slotFromEvent(e) - drag.grabOffset, drag.uid);
      drag = null;
      hideGhost();
    });
    tr.addEventListener('mousemove', (e) => {
      if (!selectedTaskId || simulating || drag) return;
      showGhost(selectedTaskId, slotFromEvent(e));
    });
    tr.addEventListener('mouseleave', () => { if (selectedTaskId) hideGhost(); });
    tr.addEventListener('click', (e) => {
      if (simulating || e.target.closest('.block-remove')) return;
      if (Date.now() < suppressClickUntil) return;
      if (!selectedTaskId) {
        const blk = e.target.closest('.block');
        if (blk) {
          const item = OG.state.schedule.find((i) => String(i.uid) === blk.dataset.uid);
          if (item) openCardDetail(OG.TASK_MAP[item.taskId], blk);
        } else say(isMobile() ? 'Alttaki kartlardan birini tutup yukarı, çizelgeye sürükle 👇' : 'Elindeki bir kartı tut ve çizelgeye sürükleyip bırak 👈');
        return;
      }
      tryPlace(selectedTaskId, slotFromEvent(e));
    });
  }

  function tryPlace(taskId, slot, uid) {
    const res = uid ? OG.moveItem(uid, slot) : OG.placeTask(taskId, slot);
    if (!res.ok) {
      OG.sfx('error');
      say(`${pick(LINES.conflict)} (${res.reason})`, 'shake');
      return;
    }
    OG.saveSchedule();
    OG.sfx('place');
    const t = OG.TASK_MAP[taskId];
    if (!uid) {
      tut('place', taskId);
      newUid = OG.state.schedule[OG.state.schedule.length - 1].uid;
      say(pick(LINES.place[t.cat]));
      react();
      if (OG.remainingUses(taskId) <= 0) selectedTaskId = null;
    }
    document.body.classList.toggle('placing', !!selectedTaskId);
    hideGhost();
    render();
  }

  function showGhost(taskId, slot, ignoreUid) {
    const t = OG.TASK_MAP[taskId];
    const check = OG.canPlace(taskId, slot, ignoreUid);
    const s = Math.max(0, Math.min(C.SLOTS - 1, slot));
    const dur = Math.min(t.dur, C.SLOTS - s);
    els.ghost.className = `ghost visible ${check.ok ? 'ok' : 'bad'}`;
    els.ghost.style.top = pct(s);
    els.ghost.style.height = `calc(${pct(dur)} - 4px)`;
    els.ghost.textContent = check.ok ? `${t.icon} ${OG.fmtSlot(slot)}–${OG.fmtSlot(slot + t.dur)}` : `✖ ${check.reason}`;
  }

  function hideGhost() {
    if (els.ghost) els.ghost.className = 'ghost';
  }

  function renderTimeline() {
    const bed = OG.state.bedSlot;
    els.sleep.style.top = pct(bed);
    els.sleep.style.height = pct(C.SLOTS - bed);
    els.sleep.style.display = bed < C.SLOTS ? 'flex' : 'none';
    els.bedControl.querySelectorAll('button').forEach((b) => b.classList.toggle('active', Number(b.dataset.bed) === bed));
    els.markers.innerHTML = '';
    const c = cur();
    if (c) {
      for (const x of c.chores) {
        const line = document.createElement('div');
        line.className = 'deadline-line';
        line.style.top = pct(x.deadline);
        line.innerHTML = `<span>⏰ ${OG.TASK_MAP[x.taskId].icon} ${OG.fmtSlot(x.deadline)}</span>`;
        els.markers.appendChild(line);
      }
    }

    els.blocks.innerHTML = '';
    for (const item of OG.state.schedule) {
      const t = OG.TASK_MAP[item.taskId];
      const block = document.createElement('div');
      block.className = 'block' + (item.locked ? ' locked' : '') + (t.dur === 1 ? ' short' : '') + (item.uid === newUid ? ' new' : '') + (t.kind === 'chore' ? ' chore' : '');
      block.dataset.uid = item.uid;
      block.style.setProperty('--cat', OG.CATEGORIES[t.cat].color);
      block.style.top = pct(item.slot);
      block.style.height = `calc(${pct(t.dur)} - 4px)`;
      block.innerHTML = `
        <span class="block-icon">${t.icon}</span>
        <div class="block-text">
          <div class="block-title">${t.name}</div>
          <div class="block-time">${OG.fmtSlot(item.slot)}–${OG.fmtSlot(item.slot + t.dur)}</div>
        </div>
        ${forecast && forecast.byUid[item.uid] ? fcChip(forecast.byUid[item.uid]) : ''}
        ${item.locked ? '<span class="block-lock" title="Sabit program: saati belli, kendiliğinden yapılır, taşınamaz">🔒</span>' : '<button class="block-remove" title="Kaldır" aria-label="Kaldır">✕</button>'}`;

      if (!item.locked) {
        block.draggable = !coarse();
        block.addEventListener('dragstart', (e) => {
          if (simulating) { e.preventDefault(); return; }
          drag = { taskId: item.taskId, uid: item.uid, grabOffset: slotFromEvent(e) - item.slot };
          e.dataTransfer.setData('text/plain', item.taskId);
          e.dataTransfer.effectAllowed = 'move';
          setTimeout(() => block.classList.add('dragging'), 0);
        });
        block.addEventListener('dragend', () => {
          block.classList.remove('dragging');
          drag = null;
          hideGhost();
        });
        attachTouchDrag(block, () => ({ taskId: item.taskId, uid: item.uid, slot: item.slot }), true);
        block.querySelector('.block-remove').addEventListener('click', (e) => {
          e.stopPropagation();
          if (simulating) return;
          OG.removeItem(item.uid);
          OG.saveSchedule();
          OG.sfx('remove');
          say(pick(LINES.remove));
          render();
        });
      }
      els.blocks.appendChild(block);
    }
    newUid = null;
  }

  function renderMeta() {
    const planned = OG.state.schedule.reduce((sum, i) => sum + OG.TASK_MAP[i.taskId].dur, 0);
    const awake = OG.state.bedSlot;
    els.planned.textContent = OG.fmtDur(planned);
    els.free.textContent = OG.fmtDur(Math.max(0, awake - planned));
    els.startBtn.classList.toggle('ready', OG.state.schedule.some((i) => !i.locked));
  }

  function setStats(energy, stress, score) {
    els.energyBar.style.width = `${energy}%`;
    els.energyBar.classList.toggle('low', energy < 30);
    els.energyVal.textContent = Math.round(energy);
    els.stressBar.style.width = `${stress}%`;
    els.stressBar.classList.toggle('calm', stress <= 30);
    els.stressVal.textContent = Math.round(stress);
    const m = moodOf(energy, stress);
    els.face.textContent = m.face;
    els.nowFace.textContent = m.face;
    els.avatar.dataset.mood = m.mood;
    if (score !== null && String(score) !== els.scoreVal.textContent) {
      els.scoreVal.textContent = score;
      els.scorePill.classList.remove('bump');
      void els.scorePill.offsetWidth;
      els.scorePill.classList.add('bump');
    }
  }

  function setNow(slotPos) {
    els.now.style.top = pct(slotPos);
    const min = OG.slotToMin(0) + slotPos * C.SLOT_MIN;
    els.clock.textContent = OG.fmtTime(Math.floor(min / 5) * 5);
    setSky(min);
    if (simulating) followNow();
  }

  // Gün akarken saat çizgisini ekranın ortasında tut: çizelge (ya da telefonda sayfa) onunla kayar
  function followNow() {
    const line = els.now.getBoundingClientRect();
    const sc = els.dayScroll;
    if (sc.scrollHeight > sc.clientHeight + 2) {
      const box = sc.getBoundingClientRect();
      sc.scrollTop = Math.max(0, sc.scrollTop + (line.top - box.top) - sc.clientHeight / 2);
    } else if (document.documentElement.scrollHeight > innerHeight + 2) {
      root.scrollTo(0, Math.max(0, root.scrollY + line.top - innerHeight / 2));
    }
  }

  ui.toast = function (msg, type = '') {
    els.toast.textContent = msg;
    els.toast.className = `toast show ${type}`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { els.toast.className = 'toast'; }, 2400);
  };

  // ---------- Simülasyon ----------
  const blockEl = (uid) => els.blocks.querySelector(`.block[data-uid="${uid}"]`);
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  async function runSimulation() {
    if (simulating || !cur()) return;
    if (!OG.state.schedule.some((i) => !i.locked)) {
      OG.sfx('error');
      say('Önce çizelgeye birkaç görev yerleştir! 👈', 'shake');
      return;
    }
    tut('start');
    OG.sfx('start');
    selectTask(null);
    simulating = true;
    ui.setTray(false); // gün akarken tepsi aşağı kayıp kapanır
    speed = SPEEDS.includes(OG.prefs.speed) ? OG.prefs.speed : 1;
    els.speedBtn.textContent = speedLabel(speed);
    forecast = null;
    els.logWrap.open = true;
    if (isMobile()) ui.setMobileTab('day');
    renderTimeline();
    renderForecast();
    skip = false;
    document.body.classList.add('simulating');
    els.log.innerHTML = '';
    els.now.classList.add('visible');
    resetStats();
    renderGoals();
    say(pick(LINES.start));

    // Olay seçimleri biliniyor oldukça simülasyon yeniden hesaplanır; önceki adımlar aynı kalır
    const choices = {};
    const compute = () => OG.simulateDay(OG.state.schedule, camp().dayContext(choices));
    let result = compute();
    let i = 0;
    while (i < result.steps.length) {
      const step = result.steps[i];
      if (step.type === 'event' && step.choice == null) {
        setNow(step.slot);
        choices[step.eventIdx] = await OG.screens.askEvent(step);
        result = compute();
        continue;
      }
      if (!skip && step.type !== 'event') {
        announce(step);
        await animateStep(step);
      }
      finishStep(step, !skip);
      i++;
    }
    setNow(OG.state.bedSlot);
    if (!skip) OG.sfx('sleep');
    say(OG.state.bedSlot < C.SLOTS ? 'Uyku vakti! Bakalım gün nasıl geçti... 😴' : 'Günün sonu! Bakalım nasıl geçti... 🥁');
    await wait(skip ? 150 : 800);
    const ev = camp().evaluate(result);
    renderGoals(ev.goals, result.chores);
    OG.showDayResult(result, ev);
  }

  // Görev başlarken karakter ne yaptığını söyler
  function announce(step) {
    if (step.type === 'idle') {
      say(pick(LINES.idle));
      return;
    }
    const t = OG.TASK_MAP[step.taskId];
    if (step.canceled) {
      say(`${t.icon} ${t.name} iptal oldu.`, 'shake');
      return;
    }
    if (step.failed) {
      say(`${t.icon} ${pick(LINES.failed)}`, 'shake');
      return;
    }
    const note = step.notes.find((n) => n.type === 'good') || step.notes.find((n) => n.type === 'bad');
    say(`${t.icon} ${t.name}${note ? ` · ${note.text}` : ''}`);
  }

  function animateStep(step) {
    return new Promise((resolve) => {
      const len = step.end - step.slot;
      const total = len * SLOT_MS;
      const block = step.uid ? blockEl(step.uid) : null;
      if (block) block.classList.add('active');
      // rAF yerine zamanlayıcı: sekme arka plandayken de simülasyon ilerlesin
      let p = 0;
      let last = performance.now();
      function frame() {
        if (skip) { resolve(); return; }
        const now = performance.now();
        p = Math.min(1, p + ((now - last) * speed) / total);
        last = now;
        setNow(step.slot + p * len);
        setStats(lerp(step.before.energy, step.energy, p), lerp(step.before.stress, step.stress, p), null);
        if (p < 1) setTimeout(frame, 16);
        else resolve();
      }
      setTimeout(frame, 16);
    });
  }

  function floatText(slot, text, bad) {
    const f = document.createElement('div');
    f.className = 'float' + (bad ? ' bad' : '');
    f.textContent = text;
    f.style.top = pct(slot);
    els.track.appendChild(f);
    setTimeout(() => f.remove(), 1300);
  }

  function finishStep(step, animate) {
    setStats(step.energy, step.stress, step.score);
    const start = OG.fmtSlot(step.slot);
    const end = OG.fmtSlot(step.end);
    const li = document.createElement('li');
    const fx = `⚡ ${step.before.energy}→${step.energy} · 😰 ${step.before.stress}→${step.stress}`;
    const notes = step.notes.filter((n) => n.type !== 'info').map((n) => `<div class="note ${n.type}">${n.text}</div>`).join('');

    if (step.type === 'event') {
      const def = OG.EVENT_MAP[step.eventId];
      const opt = def.options[step.choice];
      const m = document.createElement('div');
      m.className = 'event-marker';
      m.style.top = pct(step.slot);
      m.textContent = def.icon;
      m.title = `${def.title} · ${opt.label}`;
      els.markers.appendChild(m);
      if (animate && step.points) floatText(step.slot, `${step.points > 0 ? '+' : ''}${step.points} ⭐`, step.points < 0);
      li.className = 'log-item event';
      li.innerHTML = `
        <div class="log-head"><span class="log-time">${start}</span><strong>${def.icon} ${def.title}</strong>
          ${step.points ? `<span class="log-pts">${signed(step.points)} ⭐</span>` : ''}</div>
        <div class="log-fx">Seçimin: ${opt.label} · ${fx}</div>`;
    } else if (step.type === 'task') {
      const t = OG.TASK_MAP[step.taskId];
      const block = blockEl(step.uid);
      if (block) {
        block.classList.remove('active');
        block.classList.add(step.canceled ? 'canceled' : step.failed ? 'failed' : 'done');
      }
      if (animate) OG.sfx(step.canceled ? 'cancel' : step.failed ? 'fail' : 'coin', step.points);
      if (animate && block && !step.canceled) {
        floatText(step.slot, step.failed ? 'Başarısız!' : `+${step.points} ⭐`, step.failed);
        if (!step.failed && step.points > 0) react();
      }
      li.className = 'log-item task' + (step.failed || step.canceled ? ' failed' : '');
      li.innerHTML = `
        <div class="log-head"><span class="log-time">${start}</span><strong>${t.icon} ${t.name}</strong>
          <span class="log-pts">${step.canceled ? 'İptal' : step.failed ? '✖' : `+${step.points} ⭐`}</span></div>
        <div class="log-fx">${fx}</div>${notes}`;
    } else {
      li.className = 'log-item idle';
      li.innerHTML = `<div class="log-head"><span class="log-time">${start}–${end}</span><span>☁️ Boş zaman</span></div>
        <div class="log-fx">${fx}</div>`;
    }
    els.log.appendChild(li);
    els.log.scrollTop = els.log.scrollHeight;
  }

  // Sonuç ekranından planlama moduna dönüş (aynı gün tekrar ya da yeni gün)
  ui.endSimulation = function () {
    simulating = false;
    ui.setTray(true);
    skip = false;
    document.body.classList.remove('simulating');
    els.now.classList.remove('visible');
    els.clock.textContent = '08:00';
    setSky(C.DAY_START);
    resetStats();
    render();
  };
})(window);
