// Kampanya: haftalık akış, gün kurulumu (sabit görevler, el, hedefler, zorunlu işler, olaylar),
// yaşam dengesi, haftalık ana görev, canlar, geri sarma, yıldızlar, rozetler, kilit açma ve kalıcı kayıt.
(function (root) {
  'use strict';
  const OG = root.OG;
  const C = OG.CONFIG;
  const PROFILE_KEY = 'optimizeGun.profile';
  const WEEK_KEY = 'optimizeGun.week';
  const camp = (OG.campaign = {});

  // Tohumlu rastgele sayı üreteci (mulberry32): aynı gün tekrar oynanınca aynı el ve olaylar gelir
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const pickOne = (r, arr) => arr[Math.floor(r() * arr.length)];
  const round5 = (v) => Math.round(v / 5) * 5;

  function load(key, fallback) {
    try {
      const v = JSON.parse(localStorage.getItem(key));
      return v == null ? fallback : v;
    } catch (e) { return fallback; }
  }
  function store(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* depolama kapalı olabilir */ }
  }

  function defaultProfile() {
    return {
      stars: 0, totalStars: 0,
      chars: OG.CHARACTERS.filter((c) => !c.cost).map((c) => c.id),
      cards: [],
      perks: OG.PERKS.filter((p) => !p.cost).map((p) => p.id),
      badges: {}, weeksDone: 0, weeksSaved: 0, charsDone: [], bestWeek: 0, bestDay: 0, eventsSeen: 0, seenEvents: [],
    };
  }
  camp.profile = Object.assign(defaultProfile(), load(PROFILE_KEY, {}));
  camp.week = load(WEEK_KEY, null);
  // Eski sürümden kalan (canı/ana görevi olmayan) hafta kayıtları geçersiz
  if (camp.week && (!OG.CHAR_MAP[camp.week.charId] || !camp.week.current || !camp.week.meters)) camp.week = null;

  camp.saveProfile = () => store(PROFILE_KEY, camp.profile);
  camp.saveWeek = function () {
    const w = camp.week;
    if (w && w.current) {
      w.current.schedule = OG.state.schedule.filter((i) => !i.locked).map(({ taskId, slot }) => ({ taskId, slot }));
      w.current.bedSlot = OG.state.bedSlot;
      w.current.hand = OG.state.hand.slice();
    }
    store(WEEK_KEY, w);
  };
  camp.abandonWeek = function () {
    camp.week = null;
    store(WEEK_KEY, null);
  };

  camp.char = () => OG.CHAR_MAP[camp.week.charId];
  camp.scenario = () => OG.SCENARIOS[camp.week.day];
  camp.diff = () => OG.DIFFICULTIES[camp.week.difficulty] || OG.DIFFICULTIES.normal;
  camp.mission = function (charId = camp.week.charId, difficulty = camp.week && camp.week.difficulty) {
    const m = OG.MISSIONS[charId];
    const d = OG.DIFFICULTIES[difficulty] || OG.DIFFICULTIES.normal;
    return { ...m, goal: round5(m.goal * d.mission * OG.MISSION_SCALE) };
  };
  const daySeed = (extra = 0) => (camp.week.seed + camp.week.day * 1013 + extra * 7919) >>> 0;

  // ---------- Hafta ----------
  camp.startWeek = function (charId, perkId, difficulty = 'normal') {
    const ch = OG.CHAR_MAP[charId];
    const d = OG.DIFFICULTIES[difficulty] || OG.DIFFICULTIES.normal;
    camp.week = {
      charId, perkId, difficulty: d.id, seed: Math.floor(Math.random() * 1e9), day: 0,
      start: { energy: ch.energy, stress: ch.stress }, days: [], current: null,
      hearts: d.hearts, maxHearts: d.hearts, rewinds: d.rewinds,
      meters: Object.fromEntries(OG.METERS.map((m) => [m.id, OG.METER_START])),
      mission: { progress: 0, status: 'active' },
      choreStrikes: 0, // haftada kaçırılan zorunlu iş sayısı (ilki uyarı, sonrakiler can götürür)
    };
    buildDay();
    camp.applyDay();
    camp.saveWeek();
  };

  // Karakter programı + günün senaryosu; çakışırsa senaryo görevi en yakın boş saate kayar
  function computeFixed(dayIdx) {
    const ch = camp.char();
    const placed = [];
    const overlaps = (s, dur) => placed.some((p) => s < p.slot + OG.TASK_MAP[p.taskId].dur && p.slot < s + dur);
    const add = (taskId, slot) => {
      const dur = OG.TASK_MAP[taskId].dur;
      for (let d = 0; d < C.SLOTS; d++) {
        for (const s of d === 0 ? [slot] : [slot + d, slot - d]) {
          if (s >= 0 && s + dur <= C.SLOTS && !overlaps(s, dur)) {
            placed.push({ taskId, slot: s });
            return;
          }
        }
      }
    };
    ch.fixed.filter((f) => f.days.includes(dayIdx)).forEach((f) => add(f.taskId, f.slot));
    OG.SCENARIOS[dayIdx].fixed.forEach((f) => add(f.taskId, f.slot));
    return placed.sort((a, b) => a.slot - b.slot);
  }

  const busy = (fixed, s, dur) => fixed.some((p) => s < p.slot + OG.TASK_MAP[p.taskId].dur && p.slot < s + dur);
  // [fromMin, toMin) aralığında başlayan, dur uzunluğunda boş bir yer var mı?
  function windowFree(fixed, fromMin, toMin, dur) {
    const s0 = (fromMin - C.DAY_START) / C.SLOT_MIN;
    const s1 = (toMin - C.DAY_START) / C.SLOT_MIN;
    for (let s = s0; s < s1 && s + dur <= C.SLOTS; s++) if (!busy(fixed, s, dur)) return true;
    return false;
  }
  function objectiveOk(o, fixed) {
    if (o.ok === 'meals') return windowFree(fixed, 12 * 60, 14 * 60, 2) && windowFree(fixed, 18 * 60, 21 * 60, 2);
    if (o.ok === 'early') return fixed.every((p) => p.slot + OG.TASK_MAP[p.taskId].dur <= 30);
    if (o.ok === 'focus') return windowFree(fixed, 8 * 60, 12 * 60, 3);
    return true;
  }
  function pickObjectives(r, fixed, sc) {
    const eligible = OG.OBJECTIVES.filter((o) => objectiveOk(o, fixed));
    const chosen = [];
    const prefer = eligible.filter((o) => sc.prefer.includes(o.id));
    if (prefer.length) chosen.push(pickOne(r, prefer));
    const rest = eligible.filter((o) => !chosen.includes(o));
    while (chosen.length < 2 && rest.length) chosen.push(rest.splice(Math.floor(r() * rest.length), 1)[0]);
    return chosen.map((o) => o.id);
  }
  camp.targetScore = (dayIdx) => round5((230 + dayIdx * 5) * camp.diff().target);

  // Günün zorunlu işleri: son saatten önce sığabilecek olanlar arasından
  function pickChores(r, fixed) {
    const [lo, hi] = camp.diff().chores;
    const count = lo + Math.floor(r() * (hi - lo + 1));
    const pool = OG.CHORES.slice();
    const out = [];
    while (out.length < count && pool.length) {
      const c = pool.splice(Math.floor(r() * pool.length), 1)[0];
      const dur = OG.TASK_MAP[c.taskId].dur;
      const deadline = c.dl[0] + Math.floor(r() * (c.dl[1] - c.dl[0] + 1));
      let fits = false;
      for (let s = 0; s + dur <= deadline; s++) if (!busy(fixed, s, dur)) { fits = true; break; }
      if (fits) out.push({ taskId: c.taskId, deadline });
    }
    return out;
  }

  // ---------- El (rastgele kartlar) ----------
  camp.deck = function () {
    const ch = camp.char();
    return OG.TASKS.filter((t) =>
      t.kind === 'common' ||
      (t.kind === 'unlock' && camp.profile.cards.includes(t.id)) ||
      (t.kind === 'char' && ch.cards.includes(t.id))).map((t) => t.id);
  };
  const missionGainOf = (id) => {
    const m = camp.week && OG.MISSIONS[camp.week.charId];
    return (m && m.gain[id]) || 0;
  };
  camp.missionGainOf = missionGainOf;
  const matches = (id, key) => {
    if (key === 'focus') return !!OG.TASK_MAP[id].focus;
    if (key === 'mission') return missionGainOf(id) > 0;
    return OG.TASK_MAP[id].cat === key;
  };
  const capacity = (hand, key) => hand.reduce((sum, id) => sum + (matches(id, key) ? OG.TASK_MAP[id].max : 0), 0);

  function drawHand(seed, objectives, keep = []) {
    const r = rng(seed);
    const size = C.HAND_SIZE + (camp.week.perkId === 'sansli' ? 2 : 0);
    const all = camp.deck();
    const hand = [...new Set(['ogle', 'aksam', ...keep.filter((id) => OG.TASK_MAP[id].kind !== 'chore')])];
    const need = (key, amount) => {
      while (capacity(hand, key) < amount) {
        const pool = all.filter((id) => !hand.includes(id) && matches(id, key));
        if (!pool.length) break;
        hand.push(pickOne(r, pool));
      }
    };
    // Ana görev için en az 2 hak, her yaşam alanı için en az 1 kart, sonra hedeflerin gerektirdikleri
    need('mission', 2);
    need('sosyal', 2);
    need('ev', 2);
    need('saglik', 1);
    for (const oid of objectives) {
      for (const [key, amount] of Object.entries(OG.OBJECTIVE_MAP[oid].needs || {})) need(key, amount);
    }
    // Kalan yerler: karakter kartları 3 kat şanslı
    while (hand.length < size) {
      const pool = all.filter((id) => !hand.includes(id));
      if (!pool.length) break;
      const weights = pool.map((id) => (OG.TASK_MAP[id].kind === 'char' ? 3 : 1));
      let x = r() * weights.reduce((a, b) => a + b, 0);
      let i = 0;
      while (x > weights[i]) { x -= weights[i]; i++; }
      hand.push(pool[i]);
    }
    return hand;
  }
  // Zorunlu işlerin kartları her zaman elde (el boyutuna sayılmaz)
  const withChores = (hand, chores) => [...chores.map((c) => c.taskId), ...hand.filter((id) => !chores.some((c) => c.taskId === id))];

  // Olay ağırlıkları: karaktere ve güne özel olaylar daha sık, nadir olaylar çok seyrek
  const eventWeight = (e) => (e.rare ? 0.2 : e.chars || e.days ? 2.5 : 1);
  camp.eventPool = function (charId, day) {
    return OG.EVENTS.filter((e) => (!e.chars || e.chars.includes(charId)) && (!e.days || e.days.includes(day)));
  };
  function pickEvents(seed) {
    const r = rng(seed);
    const pool = camp.eventPool(camp.week.charId, camp.week.day);
    const count = r() < 0.3 ? 3 : 2;
    const ids = [];
    while (ids.length < count) {
      const left = pool.filter((e) => !ids.includes(e.id));
      const weights = left.map(eventWeight);
      let x = r() * weights.reduce((a, b) => a + b, 0);
      let i = 0;
      while (x > weights[i]) { x -= weights[i]; i++; }
      ids.push(left[i].id);
    }
    const slots = [];
    while (slots.length < count) {
      const s = 3 + Math.floor(r() * 22); // 09:30 – 20:00 arası
      if (slots.every((x) => Math.abs(x - s) >= 4)) slots.push(s);
    }
    return slots.sort((a, b) => a - b).map((slot, i) => ({ id: ids[i], slot }));
  }

  // Düşük yaşam göstergelerinin ertesi sabaha etkisi
  camp.lowEffects = function (meters) {
    const out = { energy: 0, stress: 0, list: [] };
    for (const m of OG.METERS) {
      if (meters[m.id] < OG.METER_LOW) {
        const e = OG.LOW_EFFECTS[m.id];
        out.energy += e.energy || 0;
        out.stress += e.stress || 0;
        out.list.push({ meter: m.id, text: e.text });
      }
    }
    return out;
  };

  function buildDay() {
    const w = camp.week;
    const sc = OG.SCENARIOS[w.day];
    const fixed = computeFixed(w.day);
    const objectives = pickObjectives(rng(daySeed() + 17), fixed, sc);
    const chores = pickChores(rng(daySeed() + 51), fixed);
    const low = camp.lowEffects(w.meters);
    w.current = {
      fixed, objectives, chores, target: camp.targetScore(w.day), low: low.list,
      hand: withChores(drawHand(daySeed(), objectives), chores), redraws: 0, redrawsLeft: 1 + (w.perkId === 'sansli' ? 1 : 0),
      events: pickEvents(daySeed() + 99), schedule: [], bedSlot: C.SLOTS,
      startEnergy: OG.clamp(w.start.energy + (sc.mods.startEnergy || 0) + low.energy),
      startStress: OG.clamp(w.start.stress + low.stress),
    };
  }

  // Kayıttaki günü oyun durumuna yükle
  camp.applyDay = function () {
    const cur = camp.week.current;
    OG.state.fixed = cur.fixed;
    OG.state.hand = cur.hand.slice();
    OG.state.bedSlot = cur.bedSlot;
    OG.restoreSchedule(cur.schedule);
  };

  // Yerleştirilmiş kartları tutarak elin geri kalanını yeniden çek
  camp.redraw = function () {
    const cur = camp.week.current;
    if (cur.redrawsLeft <= 0) return false;
    cur.redrawsLeft--;
    cur.redraws++;
    const keep = [...new Set(OG.state.schedule.filter((i) => !i.locked).map((i) => i.taskId))];
    OG.state.hand = withChores(drawHand(daySeed(cur.redraws), cur.objectives, keep), cur.chores);
    camp.saveWeek();
    return true;
  };

  // Aynı günü tekrar oynamak haftalık geri sarma hakkı harcar
  camp.useRewind = function () {
    const w = camp.week;
    if (!w || w.rewinds <= 0) return false;
    w.rewinds--;
    camp.saveWeek();
    return true;
  };

  camp.goals = function () {
    const cur = camp.week.current;
    return [{ id: 'score', icon: '🎯', text: `En az ${cur.target} puan topla` }]
      .concat(cur.objectives.map((id) => ({ id, icon: OG.OBJECTIVE_MAP[id].icon, text: OG.OBJECTIVE_MAP[id].text })));
  };

  camp.dayContext = function (choices = {}) {
    const w = camp.week;
    const cur = w.current;
    return {
      startEnergy: cur.startEnergy, startStress: cur.startStress, bedSlot: OG.state.bedSlot,
      mods: OG.SCENARIOS[w.day].mods, trait: w.charId, perk: w.perkId,
      events: cur.events.map((e, i) => ({ ...e, choice: choices[i] })),
      chores: cur.chores,
    };
  };

  // ---------- Gece: yaşam dengesi, ana görev, canlar ----------
  const doneTasks = (r) => r.steps.filter((st) => st.type === 'task' && !st.failed && !st.canceled);

  camp.missionGain = function (r) {
    const w = camp.week;
    if (w.mission.status !== 'active') return 0;
    return Math.round(doneTasks(r).reduce((sum, st) => sum + missionGainOf(st.taskId) * OG.TASK_MAP[st.taskId].dur * st.eff, 0));
  };

  camp.meterGains = function (r) {
    const g = Object.fromEntries(OG.METERS.map((m) => [m.id, 0]));
    for (const st of doneTasks(r)) {
      const per = OG.meterGainOf(st.taskId, camp.week.charId);
      // Yorgun/stresli yapılan iş daha az sayılır
      const q = 0.3 + 0.7 * st.eff;
      for (const [k, v] of Object.entries(per)) g[k] += v * OG.TASK_MAP[st.taskId].dur * q;
    }
    g.saglik += r.stats.idleSlots; // boş zaman biraz sağlık
    for (const k in g) g[k] = Math.round(g[k]);
    return g;
  };

  // Gecenin sonucunu hesaplar (kaydetmez): önizleme, tahmin ve gün sonu ekranı için
  camp.computeNight = function (r) {
    const w = camp.week;
    const d = camp.diff();
    const mission = camp.mission();
    const before = { ...w.meters };
    const gains = camp.meterGains(r);
    const meters = {};
    for (const m of OG.METERS) meters[m.id] = Math.min(100, before[m.id] + gains[m.id]);
    const choreMiss = (r.chores || []).filter((c) => !c.done);
    for (const c of choreMiss) {
      const meter = Object.keys(OG.METER_GAIN[OG.TASK_MAP[c.taskId].cat] || { ev: 1 })[0];
      meters[meter] += OG.CHORE_PENALTY.meter;
    }
    for (const m of OG.METERS) meters[m.id] -= d.decay;
    const crises = OG.METERS.filter((m) => meters[m.id] <= 0).map((m) => m.id);
    crises.forEach((id) => { meters[id] = OG.CRISIS_RESET; });
    for (const m of OG.METERS) meters[m.id] = OG.clamp(Math.round(meters[m.id]));
    const burnout = r.maxStress >= 100;

    const missionGain = camp.missionGain(r);
    const progress = w.mission.progress + missionGain;
    let status = w.mission.status;
    if (status === 'active' && progress >= mission.goal) status = 'done';
    else if (status === 'active' && w.day >= mission.deadline) status = 'failed';
    const justDone = status === 'done' && w.mission.status !== 'done';
    const justFailed = status === 'failed' && w.mission.status !== 'failed';

    const strikesBefore = w.choreStrikes || 0;
    const strikes = strikesBefore + choreMiss.length;
    const choreHearts = Math.max(0, strikes - 1) - Math.max(0, strikesBefore - 1);

    const heartLoss = crises.length + (burnout ? 1 : 0) + (justFailed ? 2 : 0) + choreHearts;
    const hearts = Math.max(0, w.hearts - heartLoss);
    return {
      before, gains, meters, decay: d.decay, choreMiss, crises, burnout,
      missionGain, mission: { progress, status }, missionGoal: mission.goal, justDone, justFailed,
      strikes, choreHearts, heartLoss, hearts, weekLost: hearts <= 0,
    };
  };

  // ---------- Gün sonu ----------
  function nextStart(r) {
    const ch = camp.char();
    const k = camp.week.perkId === 'uykucu' ? 2 : 1;
    const sleepE = ({ 28: 20, 30: 10 }[r.bedSlot] || 0) * k;
    const sleepS = ({ 28: 10, 30: 5 }[r.bedSlot] || 0) * k;
    return {
      energy: OG.clamp(Math.round(ch.energy - 40 + r.finalEnergy * 0.4 + sleepE)),
      stress: OG.clamp(Math.round(r.finalStress * 0.5 + ch.stress * 0.5 - sleepS)),
    };
  }
  camp.nextStart = nextStart;

  function dayBadges(r, stars) {
    const out = [];
    if (r.grade === 'S') out.push('kusursuz');
    if (stars === 3) out.push('ucyildiz');
    if (r.maxStress <= 40 && r.stats.completed >= 5) out.push('buz');
    if (r.stats.lateDone >= 2) out.push('gecekusu');
    if (r.finalEnergy >= 80 && r.stats.completed >= 5) out.push('tamsarj');
    if (r.total >= 450) out.push('rekortmen');
    if ((r.catCounts.sosyal || 0) >= 3) out.push('kalabalik');
    if (r.maxStress >= 95) out.push('tukenis');
    if (camp.profile.eventsSeen + r.stats.events >= 10) out.push('olayavcisi');
    if (r.stats.rareEvents) out.push('nadir');
    if (new Set([...camp.profile.seenEvents, ...r.stats.eventIds]).size >= 40) out.push('kasif');
    return out;
  }

  // Sonucu değerlendir (henüz kaydetmez; geri sarma mümkün)
  camp.evaluate = function (r) {
    const cur = camp.week.current;
    const goals = camp.goals().map((g) => ({
      ...g, done: g.id === 'score' ? r.total >= cur.target : !!OG.OBJECTIVE_MAP[g.id].check(r),
    }));
    const stars = goals.filter((g) => g.done).length;
    const night = camp.computeNight(r);
    const low = camp.lowEffects(night.meters);
    const raw = nextStart(r);
    return {
      goals, stars, night, low: low.list,
      next: { energy: OG.clamp(raw.energy + low.energy), stress: OG.clamp(raw.stress + low.stress) },
      isLast: camp.week.day === OG.SCENARIOS.length - 1 || night.weekLost,
      badges: [...new Set(dayBadges(r, stars))].filter((id) => !camp.profile.badges[id]),
    };
  };

  // Günü kesinleştir, sonraki güne geç. Hafta bittiyse özet döndürür.
  camp.commitDay = function (r, ev) {
    const w = camp.week;
    const p = camp.profile;
    const n = ev.night;
    w.days.push({
      total: r.total, stars: ev.stars, grade: r.grade, bedSlot: r.bedSlot,
      crises: n.crises, heartLoss: n.heartLoss, missionGain: n.missionGain,
      // Can kaybının nedenleri (hafta karnesinde gösterilir)
      reasons: [
        ...n.crises.map((id) => `${OG.METER_MAP[id].icon} ${OG.METER_MAP[id].name} krizi`),
        n.burnout ? '😵 Tükenmişlik' : null,
        n.justFailed ? '⏳ Ana görev kaçtı (−2)' : null,
        n.choreHearts ? `📌 Yapılacak kaçtı${n.choreHearts > 1 ? ` (−${n.choreHearts})` : ''}` : null,
      ].filter(Boolean),
    });
    p.stars += ev.stars;
    p.totalStars += ev.stars;
    p.bestDay = Math.max(p.bestDay, r.total);
    p.eventsSeen += r.stats.events;
    p.seenEvents = [...new Set([...p.seenEvents, ...r.stats.eventIds])];
    ev.badges.forEach((id) => { p.badges[id] = Date.now(); });
    w.meters = n.meters;
    w.hearts = n.hearts;
    w.mission = n.mission;
    w.choreStrikes = n.strikes;
    w.start = nextStart(r);
    w.day++;
    let summary = null;
    if (n.weekLost || w.day >= OG.SCENARIOS.length) {
      summary = finishWeek(n.weekLost);
    } else {
      buildDay();
      camp.applyDay();
    }
    camp.saveProfile();
    camp.saveWeek();
    return summary;
  };

  function finishWeek(lost) {
    const w = camp.week;
    const p = camp.profile;
    const total = w.days.reduce((s, d) => s + d.total, 0);
    const dayStars = w.days.reduce((s, d) => s + d.stars, 0);
    const missionDone = w.mission.status === 'done';
    const saved = !lost && missionDone;
    const bonus = (missionDone ? 5 : 0) + (saved ? 3 : 0);
    p.stars += bonus;
    p.totalStars += bonus;
    p.weeksDone++;
    if (saved) p.weeksSaved = (p.weeksSaved || 0) + 1;
    if (!lost && !p.charsDone.includes(w.charId)) p.charsDone.push(w.charId);
    // Rekor yalnız kaybedilmeyen haftalarda sayılır
    const newBest = !lost && total > p.bestWeek;
    if (!lost) p.bestWeek = Math.max(p.bestWeek, total);
    const badges = [];
    const add = (id) => {
      if (!p.badges[id]) { p.badges[id] = Date.now(); badges.push(id); }
    };
    if (!lost) add('haftatamam');
    if (saved) add('kurtarici');
    if (saved && w.difficulty === 'zor') add('zorlu');
    if (saved && w.hearts === w.maxHearts) add('kusursuzhafta');
    if (dayStars >= 18) add('efsane');
    if (!lost && w.days.every((d) => d.bedSlot <= 30)) add('uyku');
    if (p.charsDone.length >= 4) add('cokyonlu');
    let grade = dayStars >= 18 ? 'S' : dayStars >= 14 ? 'A' : dayStars >= 10 ? 'B' : dayStars >= 6 ? 'C' : 'D';
    if (!saved && (grade === 'S' || grade === 'A')) grade = 'B'; // kurtarılmayan hafta en fazla B
    camp.week = null;
    return {
      charId: w.charId, perkId: w.perkId, difficulty: w.difficulty, days: w.days, total, stars: dayStars, bonus, grade, badges, newBest,
      lost, saved, missionDone, mission: w.mission, missionGoal: camp.missionGoalFor(w), hearts: w.hearts, maxHearts: w.maxHearts,
    };
  }
  camp.missionGoalFor = (w) => round5(OG.MISSIONS[w.charId].goal * (OG.DIFFICULTIES[w.difficulty] || OG.DIFFICULTIES.normal).mission * OG.MISSION_SCALE);

  // ---------- Kilit açma ----------
  camp.buy = function (type, id) {
    const p = camp.profile;
    const item = type === 'char' ? OG.CHAR_MAP[id] : type === 'perk' ? OG.PERK_MAP[id] : OG.TASK_MAP[id];
    const list = type === 'char' ? p.chars : type === 'perk' ? p.perks : p.cards;
    if (list.includes(id)) return { ok: true };
    if (p.stars < item.cost) return { ok: false, reason: `${item.cost - p.stars} yıldız daha lazım` };
    p.stars -= item.cost;
    list.push(id);
    camp.saveProfile();
    return { ok: true };
  };
})(typeof window !== 'undefined' ? window : globalThis);
