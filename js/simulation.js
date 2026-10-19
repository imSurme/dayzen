// Gün simülasyonu: saf fonksiyon. Çizelge + gün bağlamını alır, adım adım sonuçları ve gün sonu değerlendirmesini döndürür.
(function (root) {
  'use strict';
  const OG = root.OG;
  const C = OG.CONFIG;

  const clamp = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));
  const pad = (n) => String(n).padStart(2, '0');
  const SPORTY = ['spor', 'antrenman', 'yuruyus', 'takim', 'ilham', 'yoga'];

  OG.clamp = clamp;
  OG.slotToMin = (slot) => C.DAY_START + slot * C.SLOT_MIN;
  OG.fmtTime = (min) => `${pad(Math.floor(min / 60))}:${pad(Math.round(min % 60))}`;
  OG.fmtSlot = (slot) => OG.fmtTime(OG.slotToMin(slot));
  OG.fmtDur = (slots) => {
    const mins = slots * C.SLOT_MIN;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const [hu, mu] = OG.lang === 'en' ? ['h', 'min'] : ['sa', 'dk'];
    if (!h && !m) return `0 ${hu}`;
    return [h ? `${h} ${hu}` : '', m ? `${m} ${mu}` : ''].filter(Boolean).join(' ');
  };

  /**
   * ctx: { startEnergy, startStress, bedSlot, mods, trait (karakter id), perk, events: [{id, slot, choice}] }
   */
  OG.simulateDay = function (schedule, ctx = {}) {
    ctx = Object.assign({ startEnergy: C.START_ENERGY, startStress: C.START_STRESS, bedSlot: C.SLOTS, mods: {}, trait: null, perk: null, events: [], chores: [] }, ctx);
    const mods = ctx.mods || {};
    const perk = (p) => ctx.perk === p;
    const trait = (t) => ctx.trait === t;
    const end = ctx.bedSlot;

    const items = schedule
      .filter((it) => it.slot < end)
      .map((it) => ({ ...it, task: OG.TASK_MAP[it.taskId] }))
      .sort((a, b) => a.slot - b.slot);
    const evs = ctx.events
      .map((e, idx) => ({ ...e, idx, def: OG.EVENT_MAP[e.id], done: false }))
      .sort((a, b) => a.slot - b.slot);

    const monoLimit = trait('yazilimci') ? 4 : 3;
    const eThr = trait('doktor') ? [50, 20] : [60, 30];
    const sThr = trait('ogretmen') ? [60, 90] : [50, 80];
    const failE = perk('demir') ? 0 : 5;
    const failS = perk('demir') ? 100 : 95;
    const idleE = C.IDLE_ENERGY + (perk('zen') ? 3 : 0) + (trait('ogrenci') ? 1 : 0);
    const idleS = C.IDLE_STRESS - (perk('zen') ? 3 : 0) - (trait('ogrenci') ? 1 : 0);
    const energyFactor = (e) => (e >= eThr[0] ? 1 : e >= eThr[1] ? 0.8 : 0.5);
    const stressFactor = (s) => (s <= sThr[0] ? 1 : s <= sThr[1] ? 0.85 : 0.6);

    let energy = clamp(ctx.startEnergy);
    let stress = clamp(ctx.startStress);
    let score = 0;
    const steps = [];
    const samples = [{ slot: 0, energy, stress }];
    const catCounts = {};
    const stats = {
      completed: 0, failed: 0, canceled: 0, mealsEaten: 0, mealsOnTime: 0, mainMealsOnTime: 0, monotony: 0, lateWork: 0, lateDone: 0,
      lowEnergyTasks: 0, highStressTasks: 0, lethargy: 0, synergy: 0, morningFocus: 0,
      focusPlaced: 0, sporPlaced: false, idleSlots: 0, burnout: false, eveningCoffee: 0, events: 0, rareEvents: 0, eventIds: [], reqFailed: 0,
    };

    let slot = 0;
    let idx = 0;
    let prev = null; // { task, end }
    let chain = { cat: null, len: 0 };
    let nextMult = 1;
    let cancelNext = false;

    while (slot < end) {
      // 1) Zamanı gelmiş sürpriz olay
      const ev = evs.find((e) => !e.done && e.slot <= slot);
      if (ev) {
        ev.done = true;
        const nextItem = items[idx];
        if (ev.def.cond && !ev.def.cond(nextItem ? nextItem.task : null)) continue;
        const before = { energy, stress };
        const notes = [];
        let points = 0;
        if (ev.choice != null) {
          const opt = ev.def.options[ev.choice];
          const fx = opt.fx;
          energy = clamp(energy + (fx.energy || 0));
          stress = clamp(stress + (fx.stress || 0));
          points = fx.points || 0;
          score += points;
          if (fx.nextMult) nextMult *= fx.nextMult;
          if (fx.cancelNext && nextItem && !nextItem.locked) cancelNext = true;
          if (fx.cancelNext && nextItem && nextItem.locked) notes.push({ type: 'info', text: 'Sabit program iptal edilemedi.' });
          notes.unshift({ type: 'info', text: `Seçimin: ${opt.label}` });
          stats.events++;
          stats.eventIds.push(ev.id);
          if (ev.def.rare) stats.rareEvents++;
          samples.push({ slot, energy, stress });
        }
        steps.push({ type: 'event', slot, end: slot, eventIdx: ev.idx, eventId: ev.id, choice: ev.choice, points, failed: false, before, energy, stress, score, notes });
        continue;
      }

      const it = items[idx];
      if (it && it.slot < slot) { idx++; continue; } // bozuk/çakışan kayıt: atla
      if (it && it.slot === slot) {
        const t = it.task;
        const startMin = OG.slotToMin(slot);
        const before = { energy, stress };
        const notes = [];

        // Olay yüzünden iptal edilen görev
        if (cancelNext) {
          cancelNext = false;
          stats.canceled++;
          for (let k = 1; k <= t.dur; k++) samples.push({ slot: slot + k, energy, stress });
          steps.push({ type: 'task', uid: it.uid, taskId: t.id, slot, end: slot + t.dur, points: 0, failed: false, canceled: true,
            before, energy, stress, score, notes: [{ type: 'bad', text: 'Olay yüzünden iptal edildi.' }] });
          prev = null;
          chain = { cat: null, len: 0 };
          slot += t.dur;
          idx++;
          continue;
        }

        const adjacent = prev && prev.end === slot;
        if (adjacent && chain.cat === t.cat) chain.len++;
        else chain = { cat: t.cat, len: 1 };
        if (t.focus) stats.focusPlaced++;
        if (SPORTY.includes(t.id)) stats.sporPlaced = true;

        let failed = false;
        let points = 0;
        let eff = 0; // verim çarpanı (ana göreve ilerleme bununla ölçeklenir)
        let dE = t.energy;
        let dS = t.stress;

        if (t.energy < 0 && energy <= failE) {
          failed = true;
          notes.push({ type: 'bad', text: 'Çok yorgundun, görevi tamamlayamadın.' });
        } else if (t.cat === 'is' && stress >= failS) {
          failed = true;
          stats.burnout = true;
          notes.push({ type: 'bad', text: 'Tükenmişlik! Hiç odaklanamadın.' });
        } else if (t.req && ((t.req.minEnergy && energy < t.req.minEnergy) || (t.req.maxStress && stress > t.req.maxStress))) {
          failed = true;
          stats.reqFailed++;
          notes.push({ type: 'bad', text: `Ön koşul sağlanmadı (${OG.reqText(t.req)}), görev yapılamadı.` });
        }

        if (failed) {
          dE = 0;
          dS = 5;
          stats.failed++;
          nextMult = 1;
        } else {
          let mult = nextMult;
          let flat = 0;
          if (nextMult > 1) notes.push({ type: 'good', text: `Olay etkisi: ×${+nextMult.toFixed(2)}` });
          if (nextMult < 1) notes.push({ type: 'bad', text: `Olay etkisi: ×${+nextMult.toFixed(2)}` });
          nextMult = 1;

          const ef = energyFactor(energy);
          const sf = stressFactor(stress);
          eff = ef * sf;
          if (t.pts > 0 && ef < 1) {
            stats.lowEnergyTasks++;
            notes.push({ type: 'bad', text: `Yorgunluk: puan ×${ef}` });
          }
          if (t.pts > 0 && sf < 1) {
            stats.highStressTasks++;
            notes.push({ type: 'bad', text: `Stres: puan ×${sf}` });
          }
          if (t.focus && startMin < 12 * 60) {
            const b = perk('sabahci') ? 1.4 : 1.2;
            mult *= b;
            stats.morningFocus++;
            notes.push({ type: 'good', text: `Sabah odaklanması: ×${b}` });
          }
          if (trait('yayinci')) {
            if (startMin >= 20 * 60) { mult *= 1.2; notes.push({ type: 'good', text: 'Gece kuşu: ×1.2' }); }
            else if (startMin < 10 * 60) { mult *= 0.8; notes.push({ type: 'bad', text: 'Sabah uykusu: ×0.8' }); }
          }
          if (t.cat === 'is' && startMin >= 22 * 60 && !trait('yayinci')) {
            mult *= 0.8;
            dS += 10;
            stats.lateWork++;
            notes.push({ type: 'bad', text: 'Gece mesaisi: ×0.8, stres +10' });
          }
          if (t.window && startMin >= t.window[0] && startMin < t.window[1]) {
            flat += 10;
            dE += 5;
            stats.mealsOnTime++;
            if (t.id === 'ogle' || t.id === 'aksam') stats.mainMealsOnTime++;
            notes.push({ type: 'good', text: 'Tam zamanında yemek: +10 ⭐, enerji +5' });
          }
          if (t.cat === 'yemek' && t.id !== 'kahve') stats.mealsEaten++;
          if (t.cat === 'yemek' && t.energy > 0 && trait('asci')) {
            dE += t.energy;
            notes.push({ type: 'good', text: 'Gurme: yemek enerjisi ×2' });
          }
          if (t.id === 'kahve') {
            if (perk('kahveci')) { dE = 20; dS = 0; }
            else if (startMin >= 18 * 60) {
              dS += 5;
              stats.eveningCoffee++;
              notes.push({ type: 'bad', text: 'Akşam kahvesi: stres +5' });
            }
          }
          if (t.id === 'sekerleme' && trait('ogrenci')) dE += 5;
          if (adjacent && SPORTY.includes(prev.task.id) && t.id === 'dus') {
            flat += 5;
            dS -= 10;
            stats.synergy++;
            notes.push({ type: 'good', text: 'Spor + Duş: +5 ⭐, stres −10' });
          }
          if (adjacent && (prev.task.id === 'ogle' || prev.task.id === 'aksam') && t.cat === 'is') {
            dE -= 5;
            stats.lethargy++;
            notes.push({ type: 'bad', text: 'Yemek sonrası rehavet: enerji −5' });
          }
          if (trait('sanatci') && adjacent && ['eglence', 'sosyal', 'gelisim'].includes(prev.task.cat) && t.cat === 'is') {
            mult *= 1.3;
            notes.push({ type: 'good', text: 'İlham: ×1.3' });
          }
          if (trait('sporcu') && t.cat === 'saglik') {
            flat += 10;
            if (dE < 0) dE = Math.round(dE / 2);
            notes.push({ type: 'good', text: 'Atletik: +10 ⭐, yarı enerji' });
          }
          if (trait('ebeveyn') && t.cat === 'sosyal') dS -= 5;
          if (trait('girisimci') && t.cat === 'is') { mult *= 1.2; dS += 5; }
          if (perk('sosyal') && t.cat === 'sosyal') flat += 10;
          const cm = mods.catPts && mods.catPts[t.cat];
          if (cm) { mult *= cm; notes.push({ type: 'good', text: `Günün etkisi: ×${cm}` }); }
          const cs = mods.catStress && mods.catStress[t.cat];
          if (cs) dS += cs;
          if (chain.len >= monoLimit) {
            mult *= 0.7;
            dS += 5;
            stats.monotony++;
            notes.push({ type: 'bad', text: `Monotonluk (${chain.len}. aynı tür): ×0.7, stres +5` });
          }

          points = Math.round(t.pts * energyFactor(energy) * stressFactor(stress) * mult + flat);
          stats.completed++;
          catCounts[t.cat] = (catCounts[t.cat] || 0) + 1;
          if (startMin >= 22 * 60) stats.lateDone++;
        }

        energy = clamp(energy + dE);
        stress = clamp(stress + dS);
        if (energy === 0 && before.energy > 0) notes.push({ type: 'bad', text: 'Enerjin tükendi!' });
        if (stress >= failS && before.stress < failS) notes.push({ type: 'bad', text: 'Stres zirvede! İş görevleri artık başarısız olur.' });
        score += points;

        for (let k = 1; k <= t.dur; k++) {
          samples.push({
            slot: slot + k,
            energy: before.energy + ((energy - before.energy) * k) / t.dur,
            stress: before.stress + ((stress - before.stress) * k) / t.dur,
          });
        }
        steps.push({ type: 'task', uid: it.uid, taskId: t.id, slot, end: slot + t.dur, points, failed, eff, before, energy, stress, score, notes });
        prev = { task: t, end: slot + t.dur };
        slot += t.dur;
        idx++;
      } else {
        // Boş zaman: bir sonraki göreve, olaya ya da yatma saatine kadar
        let next = it ? it.slot : end;
        const nextEv = evs.find((e) => !e.done);
        if (nextEv && nextEv.slot > slot && nextEv.slot < next) next = nextEv.slot;
        const before = { energy, stress };
        for (let s = slot; s < next; s++) {
          energy = clamp(energy + idleE);
          stress = clamp(stress + idleS);
          samples.push({ slot: s + 1, energy, stress });
        }
        stats.idleSlots += next - slot;
        steps.push({ type: 'idle', slot, end: next, points: 0, failed: false, before, energy, stress, score, notes: [] });
        slot = next;
      }
    }

    // Yatma saatinden sonrası grafikte uyku olarak düz gider
    for (let s = end + 1; s <= C.SLOTS; s++) samples.push({ slot: s, energy, stress, sleep: true });

    // Zorunlu işler: son saatinden önce tamamlandı mı?
    const chores = ctx.chores.map((c) => ({
      ...c,
      done: steps.some((st) => st.type === 'task' && st.taskId === c.taskId && !st.failed && !st.canceled && st.end <= c.deadline),
    }));

    // Gün sonu bonus ve cezaları
    const bonuses = [];
    chores.filter((c) => !c.done).forEach((c) => bonuses.push({ label: `Yapılacak kaçtı: ${OG.TASK_MAP[c.taskId].name}`, value: OG.CHORE_PENALTY.points }));
    if (stats.mealsEaten === 0) bonuses.push({ label: 'Hiç yemek yemedin', value: -40 });
    if (stress <= 30) bonuses.push({ label: `Huzurlu kapanış (stres ≤ 30)${mods.calmMult ? ` ×${mods.calmMult}` : ''}`, value: 40 * (mods.calmMult || 1) });
    else if (stress >= 80) bonuses.push({ label: 'Stresli kapanış (stres ≥ 80)', value: -40 });
    if (energy >= 20) bonuses.push({ label: 'Enerjini korudun (≥ 20)', value: 20 });
    else if (energy === 0) bonuses.push({ label: 'Günü bitkin bitirdin', value: -20 });
    const catNum = Object.keys(catCounts).length;
    if (catNum >= 5) bonuses.push({ label: `Çok yönlü gün (${catNum} tür)`, value: 30 });

    const total = Math.max(0, score + bonuses.reduce((sum, b) => sum + b.value, 0));
    const grade = OG.GRADES.find((g) => total >= g.min).grade;
    const awake = samples.filter((p) => !p.sleep);

    return {
      steps, samples, stats, bonuses, total, grade, catCounts, chores,
      taskScore: score, finalEnergy: energy, finalStress: stress, bedSlot: end,
      maxStress: Math.max(...awake.map((p) => p.stress)),
      minEnergy: Math.min(...awake.map((p) => p.energy)),
      title: pickTitle(grade, total, energy, stress, stats),
      tips: buildTips(stats, stress, energy),
    };
  };

  function pickTitle(grade, total, energy, stress, stats) {
    if (stats.burnout || stress >= 80) return '🔥 Tükenmiş Kahraman';
    if (grade === 'S') return '🚀 Verimlilik Canavarı';
    if (energy >= 70 && total < 150) return '🛋️ Kanepe Filozofu';
    if (grade === 'A') return stress <= 40 ? '🧘 Dengeli Bilge' : '💪 Çalışkan Arı';
    if (grade === 'B') return '🙂 Gayet İyi Bir Gün';
    if (grade === 'C') return '😐 Ortalama Bir Gün';
    return '🌧️ Zor Bir Gün';
  }

  function buildTips(s, stress, energy) {
    const tips = [];
    const good = (text) => tips.push({ type: 'good', text });
    const bad = (text) => tips.push({ type: 'bad', text });

    if (s.morningFocus) good(`${s.morningFocus} odak görevini sabah yaptın, ekstra puan aldın.`);
    if (s.synergy) good('Spordan sonra duş alarak stresini ekstra düşürdün.');
    if (s.mealsOnTime) good('Yemeklerini doğru saatte yedin.');
    if (stress <= 30) good('Günü sakin bitirdin.');

    if (s.mealsEaten === 0) bad('Hiç yemek yemedin. Yemek enerji kazandırır ve cezadan kurtarır.');
    if (s.failed) bad(`${s.failed} görev başarısız oldu. Enerjin bitince ya da stresin tavan yapınca görevler yarım kalır.`);
    if (s.lowEnergyTasks) bad(`${s.lowEnergyTasks} görevi düşük enerjiyle yaptın. Araya şekerleme, yemek ya da boş zaman koy.`);
    if (s.highStressTasks) bad(`${s.highStressTasks} görevi yüksek stresle yaptın. Meditasyon, spor ve sosyal aktiviteler stresi düşürür.`);
    if (s.monotony) bad('Aynı türden görevleri art arda dizdin. Araya farklı bir şey koy.');
    if (s.lateWork) bad('22:00 sonrası çalışmak verimsiz ve stresli.');
    if (s.lethargy) bad('Yemekten hemen sonra iş koymak enerjini düşürdü.');
    if (s.focusPlaced && !s.morningFocus) bad('Odak görevleri 12:00 öncesinde ekstra puan verir.');
    if (s.sporPlaced && !s.synergy) bad('Spordan hemen sonra duş alırsan bonus kazanırsın.');
    if (s.eveningCoffee) bad('Akşam kahvesi stresini artırdı.');
    if (s.reqFailed) bad(`${s.reqFailed} görev ön koşulu (🔒) sağlanmadığı için yapılamadı. O kartları enerjin yüksek ya da stresin düşükken koy.`);
    if (energy === 0) bad('Günü sıfır enerjiyle bitirdin; yarın da yorgun başlayacaksın.');
    if (s.idleSlots >= 14) bad(`${OG.fmtDur(s.idleSlots)} boş zaman bıraktın. Daha fazla puan için daha çok görev ekleyebilirsin.`);

    if (!tips.some((t) => t.type === 'bad')) good('Neredeyse kusursuz! Daha yüksek skor için görevlerin sırasıyla oynayabilirsin.');
    return tips;
  }
})(typeof window !== 'undefined' ? window : globalThis);
