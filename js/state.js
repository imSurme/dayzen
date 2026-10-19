// Günün çizelge durumu ve yerleştirme kuralları (DOM'dan bağımsız).
(function (root) {
  'use strict';
  const OG = root.OG;
  const C = OG.CONFIG;

  let uidCounter = 1;
  // hand: bugün elindeki kart id'leri, fixed: [{taskId, slot}], bedSlot: yatma saati slotu
  const state = (OG.state = { schedule: [], hand: [], fixed: [], bedSlot: C.SLOTS });

  OG.resetSchedule = function () {
    state.schedule = state.fixed.map((f) => ({ uid: uidCounter++, taskId: f.taskId, slot: f.slot, locked: true }));
  };

  OG.usesOf = (taskId) => state.schedule.filter((i) => i.taskId === taskId && !i.locked).length;
  OG.remainingUses = (taskId) => OG.TASK_MAP[taskId].max - OG.usesOf(taskId);

  OG.canPlace = function (taskId, slot, ignoreUid) {
    const t = OG.TASK_MAP[taskId];
    if (slot < 0) return { ok: false, reason: 'Gün 08:00’de başlıyor' };
    if (slot + t.dur > state.bedSlot) {
      return { ok: false, reason: state.bedSlot < C.SLOTS ? `${OG.fmtSlot(state.bedSlot)}’da uyuyor olacaksın 😴` : 'Gün 24:00’te bitiyor' };
    }
    if (!ignoreUid) {
      if (!state.hand.includes(taskId)) return { ok: false, reason: 'Bu kart bugün elinde değil' };
      if (OG.remainingUses(taskId) <= 0) return { ok: false, reason: `${t.name} en fazla ${t.max} kez eklenebilir` };
    }
    for (const o of state.schedule) {
      if (o.uid === ignoreUid) continue;
      const od = OG.TASK_MAP[o.taskId].dur;
      if (slot < o.slot + od && o.slot < slot + t.dur) {
        return { ok: false, reason: `Çakışma: ${OG.TASK_MAP[o.taskId].name}` };
      }
    }
    return { ok: true };
  };

  OG.placeTask = function (taskId, slot) {
    const res = OG.canPlace(taskId, slot);
    if (res.ok) state.schedule.push({ uid: uidCounter++, taskId, slot, locked: false });
    return res;
  };

  OG.moveItem = function (uid, slot) {
    const item = state.schedule.find((i) => i.uid === uid);
    if (!item || item.locked) return { ok: false, reason: 'Bu görev taşınamaz' };
    const res = OG.canPlace(item.taskId, slot, uid);
    if (res.ok) item.slot = slot;
    return res;
  };

  OG.removeItem = function (uid) {
    state.schedule = state.schedule.filter((i) => i.uid !== uid || i.locked);
  };

  // Yatma saatini değiştir: sonrasına taşan görev varsa izin verme
  OG.setBedSlot = function (bedSlot) {
    const over = state.schedule.find((i) => i.slot + OG.TASK_MAP[i.taskId].dur > bedSlot);
    if (over) {
      const t = OG.TASK_MAP[over.taskId];
      return { ok: false, reason: over.locked ? `${t.name} bitmeden yatamazsın` : `Önce ${OG.fmtSlot(bedSlot)} sonrasındaki “${t.name}” görevini kaldır` };
    }
    state.bedSlot = bedSlot;
    return { ok: true };
  };

  // Kaydedilmiş planı (yalnız serbest görevler) geri yükle
  OG.restoreSchedule = function (items) {
    OG.resetSchedule();
    for (const { taskId, slot } of items || []) {
      if (OG.TASK_MAP[taskId]) OG.placeTask(taskId, slot);
    }
  };

  OG.saveSchedule = function () {
    if (OG.campaign) OG.campaign.saveWeek();
  };
})(typeof window !== 'undefined' ? window : globalThis);
