// Meydan okuma verileri: haftalık ana görevler, yaşam dengesi, zorluk seviyeleri, zorunlu işler, kart ön koşulları.
(function (root) {
  'use strict';
  const OG = root.OG;
  const C = OG.CONFIG;
  const at = (h) => (h - 8) * 2; // saat → slot

  // ---------- Yaşam dengesi ----------
  // Her gece hepsi azalır; biri sıfıra düşerse kriz yaşanır ve bir can gider.
  OG.METERS = [
    { id: 'is', icon: '💼', name: 'İş' },
    { id: 'saglik', icon: '💚', name: 'Sağlık' },
    { id: 'sosyal', icon: '👫', name: 'Sosyal' },
    { id: 'ev', icon: '🏠', name: 'Ev' },
  ];
  OG.METER_MAP = Object.fromEntries(OG.METERS.map((m) => [m.id, m]));
  // Görev kategorisi → 30 dakika başına kazanç
  OG.METER_GAIN = {
    is: { is: 4 }, gelisim: { is: 3 },
    saglik: { saglik: 6 }, dinlenme: { saglik: 4 }, yemek: { saglik: 2 },
    sosyal: { sosyal: 6 }, eglence: { sosyal: 3 },
    ev: { ev: 8 },
  };
  OG.METER_START = 60;
  OG.METER_LOW = 25; // altına düşerse ertesi sabah olumsuz etki
  OG.CRISIS_RESET = 20; // krizden sonra gösterge buraya döner
  OG.LOW_EFFECTS = {
    saglik: { energy: -10, text: 'Sağlığın zayıf: güne 10 enerji eksik başlarsın' },
    sosyal: { stress: 10, text: 'Yalnız hissediyorsun: güne 10 stres fazla başlarsın' },
    ev: { stress: 5, text: 'Ev dağınık: güne 5 stres fazla başlarsın' },
    is: { stress: 5, text: 'İşler birikti: güne 5 stres fazla başlarsın' },
  };

  // ---------- Zorluk ----------
  OG.DIFFICULTIES = {
    kolay: { id: 'kolay', icon: '🌱', name: 'Kolay', hearts: 4, rewinds: 3, decay: 18, chores: [1, 1], target: 0.9, mission: 0.85,
      desc: '4 can, 3 geri sarma, yaşam dengesi yavaş azalır.' },
    normal: { id: 'normal', icon: '⚖️', name: 'Normal', hearts: 3, rewinds: 2, decay: 24, chores: [1, 2], target: 1, mission: 1,
      desc: '3 can, 2 geri sarma. Asıl deneyim.' },
    zor: { id: 'zor', icon: '🔥', name: 'Zor', hearts: 2, rewinds: 1, decay: 28, chores: [2, 2], target: 1.12, mission: 1.15,
      desc: '2 can, 1 geri sarma, her gün 2 yapılacak iş, daha yüksek hedefler.' },
  };

  // ---------- Haftalık ana görevler (karaktere özel) ----------
  // gain: o görevden 30 dakika başına ilerleme (verim çarpanıyla çarpılır)
  OG.MISSIONS = {
    ogrenci: { icon: '📚', name: 'Sınav Haftası', unit: 'Bilgi', goal: 120, deadline: 4,
      desc: 'Cuma akşamına kadar sınava hazırlan.',
      gain: { ders: 5, kutuphane: 6, okulders: 2, kitap: 2, kurs: 5, podcast: 2 } },
    yazilimci: { icon: '🚀', name: 'Proje Teslimi', unit: 'İlerleme', goal: 120, deadline: 3,
      desc: 'Perşembe akşamına kadar projeyi bitir.',
      gain: { kod: 6, bug: 5, derin: 4, standup: 4, eposta: 2, kurs: 2 } },
    ebeveyn: { icon: '👪', name: 'Mutlu Aile', unit: 'Aile Mutluluğu', goal: 110, deadline: 6,
      desc: 'Pazar akşamına kadar ailene vakit ayır.',
      gain: { cocuk: 6, odev: 5, yemekhaz: 4, yemekyap: 3, aile: 4, kahvalti: 4, okulbirak: 2, okulal: 2, parti: 3 } },
    ogretmen: { icon: '📝', name: 'Karne Haftası', unit: 'Değerlendirme', goal: 110, deadline: 4,
      desc: 'Cuma akşamına kadar bütün sınav kâğıtlarını oku.',
      gain: { kagit: 6, veli: 5, anlatim: 1, ders: 3 } },
    doktor: { icon: '🏥', name: 'Yoğun Nöbet', unit: 'Hasta Bakımı', goal: 120, deadline: 5,
      desc: 'Cumartesi akşamına kadar hastalarına yetiş.',
      gain: { vizit: 6, ameliyat: 4, makale: 3 } },
    sanatci: { icon: '🖼️', name: 'Sergi Açılışı', unit: 'Eser', goal: 110, deadline: 5,
      desc: 'Cumartesi akşamına kadar sergi eserlerini bitir.',
      gain: { resim: 6, atolye: 4, ilham: 3, kitap: 2 } },
    sporcu: { icon: '🏆', name: 'Turnuva Hazırlığı', unit: 'Form', goal: 130, deadline: 5,
      desc: 'Cumartesi turnuvasına formda gir.',
      gain: { antrenman: 5, takim: 2, esneme: 4, spor: 5, yoga: 4, yuruyus: 3 } },
    asci: { icon: '⭐', name: 'Gurme Denetimi', unit: 'Mutfak Puanı', goal: 110, deadline: 4,
      desc: 'Cuma akşamki denetimden önce mutfağı hazırla.',
      gain: { tarif: 6, servis: 1, pazar: 5, market: 4, yemekhaz: 4, yemekyap: 4 } },
    yayinci: { icon: '📈', name: '10B Takipçi', unit: 'Büyüme', goal: 120, deadline: 6,
      desc: 'Pazar akşamına kadar kanalını büyüt.',
      gain: { canli: 2, yayinhaz: 6, sohbet: 5, oyun: 2 } },
    girisimci: { icon: '💰', name: 'Yatırım Turu', unit: 'Hazırlık', goal: 80, deadline: 2,
      desc: 'Çarşamba akşamına kadar yatırım sunumunu hazırla.',
      gain: { pitch: 6, network: 4, yatirimci: 6, derin: 3, eposta: 2 } },
  };

  // ---------- Kart ön koşulları ----------
  // Ön koşul sağlanmazsa görev yapılamaz (başarısız sayılır).
  const REQ = {
    spor: { minEnergy: 40 }, antrenman: { minEnergy: 50 }, yuruyus: { minEnergy: 30 },
    arkadas: { minEnergy: 30 }, gonullu: { minEnergy: 40 }, network: { minEnergy: 40 }, kulup: { minEnergy: 30 },
    derin: { maxStress: 70 }, kod: { maxStress: 70 }, pitch: { maxStress: 70 }, kurs: { maxStress: 70 },
    ders: { maxStress: 75 }, kutuphane: { maxStress: 75 }, resim: { maxStress: 75 }, kagit: { maxStress: 80 },
    vizit: { minEnergy: 30 }, tarif: { minEnergy: 30 },
  };
  Object.entries(REQ).forEach(([id, req]) => { if (OG.TASK_MAP[id]) OG.TASK_MAP[id].req = req; });
  OG.reqText = (req) => [req.minEnergy ? `⚡≥${req.minEnergy}` : '', req.maxStress ? `😰≤${req.maxStress}` : ''].filter(Boolean).join(' ');

  // ---------- Zorunlu işler ----------
  // Günün listesine eklenir; son saatinden önce bitirilmezse ceza.
  const chore = (o) => Object.assign({ max: 1, kind: 'chore' }, o);
  const CHORE_TASKS = [
    chore({ id: 'c_fatura', name: 'Faturayı Öde', icon: '🧾', cat: 'ev', dur: 1, pts: 5, energy: 0, stress: -5 }),
    chore({ id: 'c_kargo', name: 'Kargoyu Teslim Al', icon: '📦', cat: 'ev', dur: 1, pts: 5, energy: -5, stress: 0 }),
    chore({ id: 'c_dis', name: 'Diş Randevusu', icon: '🦷', cat: 'saglik', dur: 2, pts: 5, energy: -5, stress: 10 }),
    chore({ id: 'c_evrak', name: 'Resmi Evrak', icon: '📑', cat: 'is', dur: 2, pts: 10, energy: -10, stress: 10 }),
    chore({ id: 'c_ilac', name: 'Eczaneden İlaç', icon: '💊', cat: 'saglik', dur: 1, pts: 0, energy: -5, stress: -5 }),
    chore({ id: 'c_camasir', name: 'Çamaşır Yıka', icon: '🧺', cat: 'ev', dur: 2, pts: 10, energy: -5, stress: -5 }),
    chore({ id: 'c_mesaj', name: 'Arkadaşına Dön', icon: '💬', cat: 'sosyal', dur: 1, pts: 5, energy: 0, stress: -5 }),
  ];
  CHORE_TASKS.forEach((t) => { OG.TASKS.push(t); OG.TASK_MAP[t.id] = t; });
  // dl: son saat aralığı (slot) — gün kurulurken bu aralıktan rastgele seçilir
  OG.CHORES = [
    { taskId: 'c_fatura', dl: [at(11), at(17)] },
    { taskId: 'c_kargo', dl: [at(15), at(19)] },
    { taskId: 'c_dis', dl: [at(12), at(18)] },
    { taskId: 'c_evrak', dl: [at(12), at(17)] },
    { taskId: 'c_ilac', dl: [at(17), at(21)] },
    { taskId: 'c_camasir', dl: [at(19), at(23)] },
    { taskId: 'c_mesaj', dl: [at(14), at(22)] },
  ];
  OG.CHORE_PENALTY = { points: -25, meter: -20 };

  // "15:30’a kadar", "12:00’ye kadar": yönelme eki saatin okunuşuna göre değişir
  const HOUR_SUFFIX = { 8: 'e', 9: 'a', 10: 'a', 11: 'e', 12: 'ye', 13: 'e', 14: 'e', 15: 'e', 16: 'ya', 17: 'ye', 18: 'e', 19: 'a', 20: 'ye', 21: 'e', 22: 'ye', 23: 'e', 24: 'e' };
  OG.untilSlot = function (slot) {
    const min = OG.slotToMin(slot);
    const suffix = min % 60 === 30 ? 'a' : HOUR_SUFFIX[Math.floor(min / 60)] || 'e';
    return `${OG.fmtSlot(slot)}’${suffix}`;
  };
  // "Cuma akşamına kadar" / "by Friday evening"
  OG.byDay = (day) => OG.t(`${OG.SCENARIOS[day].day} akşamına kadar`, `by ${OG.SCENARIOS[day].day} evening`);
  // "15:30’a kadar" / "by 15:30"
  OG.until = (slot) => (OG.lang === 'en' ? `by ${OG.fmtSlot(slot)}` : `${OG.untilSlot(slot)} kadar`);

  // Bir görevin hangi göstergelere ne kadar kattığı (30 dk başına)
  OG.meterGainOf = function (taskId, charId) {
    const t = OG.TASK_MAP[taskId];
    const g = { ...(OG.METER_GAIN[t.cat] || {}) };
    const m = OG.MISSIONS[charId];
    // Ana görevine katkı veren işler (iş kategorisinde olmasa da) İş göstergesine de yazar
    if (m && m.gain[taskId] && t.cat !== 'is') g.is = (g.is || 0) + 4;
    return g;
  };

  C.HAND_SIZE = 10;
  OG.MISSION_SCALE = 1.3; // ana görev hedeflerinin genel çarpanı
})(typeof window !== 'undefined' ? window : globalThis);
