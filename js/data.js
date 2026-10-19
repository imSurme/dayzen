// Oyun verileri: sabitler, görevler, karakterler, yetenekler, senaryolar, hedefler, olaylar, rozetler.
// Not: dosyalar file:// üzerinden de çalışsın diye ES modülü yerine global "OG" kullanılıyor.
(function (root) {
  'use strict';
  const OG = (root.OG = root.OG || {});
  const WEEKDAYS = [0, 1, 2, 3, 4];

  OG.CONFIG = {
    DAY_START: 8 * 60, // 08:00 (dakika)
    DAY_END: 24 * 60, // 24:00
    SLOT_MIN: 30, // bir slot = 30 dakika
    SLOTS: 32, // 16 saat
    START_ENERGY: 80,
    START_STRESS: 20,
    IDLE_ENERGY: 3, // boş slot başına
    IDLE_STRESS: -3,
    HAND_SIZE: 9,
    BED_OPTIONS: [28, 30, 32], // 22:00, 23:00, 24:00
  };

  OG.CATEGORIES = {
    is: { name: 'İş / Okul', color: '#6c8cff' },
    saglik: { name: 'Sağlık', color: '#3ccf8e' },
    yemek: { name: 'Yemek', color: '#ffa630' },
    dinlenme: { name: 'Dinlenme', color: '#a77bff' },
    sosyal: { name: 'Sosyal', color: '#ff6fb5' },
    eglence: { name: 'Eğlence', color: '#2ec4f0' },
    ev: { name: 'Ev İşleri', color: '#d99a5b' },
    gelisim: { name: 'Gelişim', color: '#14b8a6' },
  };

  // dur: slot sayısı (1 slot = 30 dk), pts: temel puan, energy/stress: etki, max: günde en fazla kaç kez
  // kind: 'common' (herkesin destesinde), 'unlock' (yıldızla açılır), 'char' (karaktere özel), 'fixed' (sadece sabit görev)
  const T = (o) => Object.assign({ max: 1, kind: 'common' }, o);
  OG.TASKS = [
    // Ortak deste
    T({ id: 'derin', name: 'Derin Çalışma', icon: '💼', cat: 'is', dur: 4, pts: 50, energy: -20, stress: 15, max: 2, focus: true, desc: '12:00 öncesi ×1.2' }),
    T({ id: 'ders', name: 'Ders Çalış', icon: '📚', cat: 'is', dur: 3, pts: 35, energy: -15, stress: 10, max: 2, focus: true, desc: '12:00 öncesi ×1.2' }),
    T({ id: 'eposta', name: 'E-postalar', icon: '📧', cat: 'is', dur: 1, pts: 10, energy: -5, stress: 5, max: 3 }),
    T({ id: 'spor', name: 'Spor', icon: '🏃', cat: 'saglik', dur: 2, pts: 20, energy: -15, stress: -20, outdoor: true }),
    T({ id: 'dus', name: 'Duş', icon: '🚿', cat: 'saglik', dur: 1, pts: 5, energy: 5, stress: -5, max: 2, desc: 'Spordan hemen sonra bonus' }),
    T({ id: 'meditasyon', name: 'Meditasyon', icon: '🧘', cat: 'saglik', dur: 1, pts: 5, energy: 5, stress: -15, max: 2 }),
    T({ id: 'ogle', name: 'Öğle Yemeği', icon: '🍽️', cat: 'yemek', dur: 2, pts: 10, energy: 20, stress: -5, window: [12 * 60, 14 * 60], desc: '12:00–14:00 arası bonus' }),
    T({ id: 'aksam', name: 'Akşam Yemeği', icon: '🍝', cat: 'yemek', dur: 2, pts: 10, energy: 20, stress: -5, window: [18 * 60, 21 * 60], desc: '18:00–21:00 arası bonus' }),
    T({ id: 'kahve', name: 'Kahve Molası', icon: '☕', cat: 'yemek', dur: 1, pts: 0, energy: 10, stress: 5, max: 2, desc: '18:00 sonrası stres +5' }),
    T({ id: 'sekerleme', name: 'Şekerleme', icon: '😴', cat: 'dinlenme', dur: 1, pts: 0, energy: 15, stress: -5, max: 2 }),
    T({ id: 'arkadas', name: 'Arkadaşlarla Buluşma', icon: '👫', cat: 'sosyal', dur: 4, pts: 25, energy: -10, stress: -25 }),
    T({ id: 'aile', name: 'Aileyi Ara', icon: '📞', cat: 'sosyal', dur: 1, pts: 10, energy: 0, stress: -10 }),
    T({ id: 'oyun', name: 'Oyun Oyna', icon: '🎮', cat: 'eglence', dur: 2, pts: 10, energy: -5, stress: -15, max: 2 }),
    T({ id: 'dizi', name: 'Dizi İzle', icon: '📺', cat: 'eglence', dur: 2, pts: 5, energy: 5, stress: -10, max: 2 }),
    T({ id: 'temizlik', name: 'Ev Temizliği', icon: '🧹', cat: 'ev', dur: 2, pts: 15, energy: -10, stress: -5 }),
    T({ id: 'market', name: 'Market Alışverişi', icon: '🛒', cat: 'ev', dur: 2, pts: 15, energy: -10, stress: 5 }),
    T({ id: 'kitap', name: 'Kitap Oku', icon: '📖', cat: 'gelisim', dur: 2, pts: 15, energy: -5, stress: -10 }),
    // Temel gündelik aktiviteler
    T({ id: 'kahvaltisabah', name: 'Kahvaltı', icon: '🍳', cat: 'yemek', dur: 1, pts: 5, energy: 15, stress: -5, window: [8 * 60, 10 * 60], desc: '08:00–10:00 arası bonus' }),
    T({ id: 'araogun', name: 'Ara Öğün', icon: '🥪', cat: 'yemek', dur: 1, pts: 0, energy: 8, stress: 0, max: 2 }),
    T({ id: 'yemekyap', name: 'Yemek Yap', icon: '🍲', cat: 'ev', dur: 2, pts: 15, energy: -5, stress: -5 }),
    T({ id: 'bulasik', name: 'Bulaşık', icon: '🧽', cat: 'ev', dur: 1, pts: 5, energy: -5, stress: 0 }),
    T({ id: 'muzik', name: 'Müzik Dinle', icon: '🎵', cat: 'eglence', dur: 1, pts: 5, energy: 5, stress: -10 }),
    T({ id: 'uzan', name: 'Uzanıp Dinlen', icon: '🛋️', cat: 'dinlenme', dur: 2, pts: 0, energy: 15, stress: -10 }),

    // Yıldızla açılan kartlar
    T({ id: 'yoga', kind: 'unlock', cost: 3, name: 'Yoga', icon: '🤸', cat: 'saglik', dur: 2, pts: 15, energy: 5, stress: -20 }),
    T({ id: 'yuruyus', kind: 'unlock', cost: 2, name: 'Doğa Yürüyüşü', icon: '🚶', cat: 'saglik', dur: 2, pts: 15, energy: -5, stress: -15, outdoor: true }),
    T({ id: 'podcast', kind: 'unlock', cost: 2, name: 'Podcast Dinle', icon: '🎧', cat: 'gelisim', dur: 1, pts: 10, energy: 0, stress: -5, max: 2 }),
    T({ id: 'kurs', kind: 'unlock', cost: 4, name: 'Online Kurs', icon: '💻', cat: 'gelisim', dur: 3, pts: 35, energy: -15, stress: 5, focus: true, desc: '12:00 öncesi ×1.2' }),
    T({ id: 'masaj', kind: 'unlock', cost: 5, name: 'Masaj', icon: '💆', cat: 'dinlenme', dur: 2, pts: 5, energy: 20, stress: -25 }),
    T({ id: 'gonullu', kind: 'unlock', cost: 5, name: 'Gönüllülük', icon: '🤝', cat: 'sosyal', dur: 4, pts: 40, energy: -15, stress: -15 }),

    // Karaktere özel kartlar
    T({ id: 'kutuphane', kind: 'char', name: 'Kütüphane', icon: '🏛️', cat: 'is', dur: 4, pts: 50, energy: -15, stress: 10, focus: true, desc: '12:00 öncesi ×1.2' }),
    T({ id: 'kulup', kind: 'char', name: 'Kampüs Kulübü', icon: '🎭', cat: 'sosyal', dur: 3, pts: 25, energy: -10, stress: -15 }),
    T({ id: 'kod', kind: 'char', name: 'Kod Yaz', icon: '⌨️', cat: 'is', dur: 4, pts: 55, energy: -20, stress: 15, max: 2, focus: true, desc: '12:00 öncesi ×1.2' }),
    T({ id: 'bug', kind: 'char', name: 'Bug Avı', icon: '🐛', cat: 'is', dur: 2, pts: 25, energy: -10, stress: 15, max: 2 }),
    T({ id: 'cocuk', kind: 'char', name: 'Çocukla Oyun', icon: '🧸', cat: 'sosyal', dur: 2, pts: 20, energy: -10, stress: -15, max: 2 }),
    T({ id: 'odev', kind: 'char', name: 'Ödev Yardımı', icon: '✏️', cat: 'is', dur: 2, pts: 20, energy: -5, stress: 10 }),
    T({ id: 'yemekhaz', kind: 'char', name: 'Yemek Hazırla', icon: '🥘', cat: 'ev', dur: 2, pts: 15, energy: -5, stress: 0 }),
    T({ id: 'kagit', kind: 'char', name: 'Sınav Kâğıdı Oku', icon: '📝', cat: 'is', dur: 3, pts: 30, energy: -10, stress: 10, max: 2 }),
    T({ id: 'veli', kind: 'char', name: 'Veli Görüşmesi', icon: '🗣️', cat: 'is', dur: 2, pts: 20, energy: -5, stress: 10 }),
    T({ id: 'vizit', kind: 'char', name: 'Hasta Viziti', icon: '🩹', cat: 'is', dur: 3, pts: 40, energy: -15, stress: 15, max: 2 }),
    T({ id: 'makale', kind: 'char', name: 'Makale Oku', icon: '🔬', cat: 'gelisim', dur: 2, pts: 20, energy: -5, stress: 0 }),
    T({ id: 'resim', kind: 'char', name: 'Atölye Çalışması', icon: '🖌️', cat: 'is', dur: 4, pts: 45, energy: -15, stress: -5, max: 2, focus: true, desc: '12:00 öncesi ×1.2' }),
    T({ id: 'ilham', kind: 'char', name: 'İlham Yürüyüşü', icon: '🌳', cat: 'saglik', dur: 2, pts: 15, energy: -5, stress: -15, outdoor: true }),
    T({ id: 'antrenman', kind: 'char', name: 'Antrenman', icon: '🏋️', cat: 'saglik', dur: 4, pts: 40, energy: -25, stress: -15, max: 2 }),
    T({ id: 'esneme', kind: 'char', name: 'Esneme', icon: '🙆', cat: 'saglik', dur: 1, pts: 10, energy: 5, stress: -5, max: 2 }),
    T({ id: 'protein', kind: 'char', name: 'Protein Öğünü', icon: '🥩', cat: 'yemek', dur: 1, pts: 5, energy: 15, stress: 0 }),
    T({ id: 'tarif', kind: 'char', name: 'Tarif Denemesi', icon: '🧁', cat: 'is', dur: 3, pts: 35, energy: -10, stress: 5 }),
    T({ id: 'pazar', kind: 'char', name: 'Semt Pazarı', icon: '🧺', cat: 'ev', dur: 2, pts: 15, energy: -5, stress: -5 }),
    T({ id: 'yayinhaz', kind: 'char', name: 'Yayın Hazırlığı', icon: '🎬', cat: 'is', dur: 2, pts: 25, energy: -5, stress: 5, max: 2 }),
    T({ id: 'sohbet', kind: 'char', name: 'Takipçi Sohbeti', icon: '💬', cat: 'sosyal', dur: 2, pts: 20, energy: -5, stress: -10 }),
    T({ id: 'pitch', kind: 'char', name: 'Sunum Hazırla', icon: '📊', cat: 'is', dur: 4, pts: 60, energy: -20, stress: 20, focus: true, desc: '12:00 öncesi ×1.2' }),
    T({ id: 'network', kind: 'char', name: 'Network Etkinliği', icon: '🥂', cat: 'sosyal', dur: 4, pts: 35, energy: -15, stress: 5 }),

    // Sabit görevler (karakter programı ve günlük senaryolar)
    T({ id: 'okulders', kind: 'fixed', name: 'Okul Dersleri', icon: '🏫', cat: 'is', dur: 4, pts: 40, energy: -15, stress: 10 }),
    T({ id: 'standup', kind: 'fixed', name: 'Daily Standup', icon: '🧍', cat: 'is', dur: 1, pts: 10, energy: -5, stress: 5 }),
    T({ id: 'okulbirak', kind: 'fixed', name: 'Okula Bırak', icon: '🚸', cat: 'ev', dur: 1, pts: 5, energy: -5, stress: 5 }),
    T({ id: 'okulal', kind: 'fixed', name: 'Okuldan Al', icon: '🎒', cat: 'ev', dur: 1, pts: 5, energy: -5, stress: 5 }),
    T({ id: 'anlatim', kind: 'fixed', name: 'Ders Anlatımı', icon: '🖍️', cat: 'is', dur: 6, pts: 60, energy: -25, stress: 15 }),
    T({ id: 'ameliyat', kind: 'fixed', name: 'Ameliyat', icon: '🏥', cat: 'is', dur: 4, pts: 60, energy: -25, stress: 20 }),
    T({ id: 'atolye', kind: 'fixed', name: 'Atölye Dersi', icon: '🎨', cat: 'is', dur: 2, pts: 25, energy: -10, stress: 5 }),
    T({ id: 'takim', kind: 'fixed', name: 'Takım Antrenmanı', icon: '⚽', cat: 'saglik', dur: 4, pts: 45, energy: -25, stress: -10 }),
    T({ id: 'servis', kind: 'fixed', name: 'Akşam Servisi', icon: '🔥', cat: 'is', dur: 6, pts: 70, energy: -25, stress: 20 }),
    T({ id: 'canli', kind: 'fixed', name: 'Canlı Yayın', icon: '🔴', cat: 'is', dur: 4, pts: 50, energy: -15, stress: 10 }),
    T({ id: 'yatirimci', kind: 'fixed', name: 'Yatırımcı Görüşmesi', icon: '💰', cat: 'is', dur: 2, pts: 35, energy: -10, stress: 20 }),
    T({ id: 'planlama', kind: 'fixed', name: 'Haftalık Planlama', icon: '🗒️', cat: 'is', dur: 2, pts: 20, energy: -5, stress: 5 }),
    T({ id: 'gorusme', kind: 'fixed', name: 'Önemli Görüşme', icon: '🤵', cat: 'is', dur: 2, pts: 30, energy: -10, stress: 15 }),
    T({ id: 'teslim', kind: 'fixed', name: 'Proje Teslimi', icon: '📦', cat: 'is', dur: 2, pts: 45, energy: -10, stress: 20 }),
    T({ id: 'parti', kind: 'fixed', name: 'Doğum Günü Partisi', icon: '🎂', cat: 'sosyal', dur: 4, pts: 30, energy: -15, stress: -20 }),
    T({ id: 'kahvalti', kind: 'fixed', name: 'Aile Kahvaltısı', icon: '🥐', cat: 'sosyal', dur: 2, pts: 15, energy: 10, stress: -10 }),
  ];
  OG.TASK_MAP = Object.fromEntries(OG.TASKS.map((t) => [t.id, t]));

  // ---------- Karakterler ----------
  // trait davranışları simulation.js içinde karakter id'sine göre uygulanır
  OG.CHARACTERS = [
    { id: 'ogrenci', name: 'Öğrenci', icon: '🎓', cost: 0, energy: 85, stress: 25, desc: 'Dersler, sınavlar ve bitmeyen kampüs hayatı.',
      trait: { name: 'Hızlı Toparlanma', desc: 'Boş zaman ve şekerleme daha çok dinlendirir.' },
      cards: ['kutuphane', 'kulup'], fixed: [{ taskId: 'okulders', slot: 4, days: WEEKDAYS }] },
    { id: 'yazilimci', name: 'Yazılımcı', icon: '💻', cost: 0, energy: 75, stress: 25, desc: 'Kod, kahve, tekrar kod.',
      trait: { name: 'Akış Hali', desc: 'Monotonluk cezası 3. değil 4. aynı tür görevde başlar.' },
      cards: ['kod', 'bug'], fixed: [{ taskId: 'standup', slot: 3, days: WEEKDAYS }] },
    { id: 'ebeveyn', name: 'Ebeveyn', icon: '👪', cost: 0, energy: 70, stress: 30, desc: 'Okul servisi, ödevler ve sonsuz sevgi.',
      trait: { name: 'Aile Sıcaklığı', desc: 'Sosyal görevler stresi ekstra 5 azaltır.' },
      cards: ['cocuk', 'odev', 'yemekhaz'], fixed: [{ taskId: 'okulbirak', slot: 0, days: WEEKDAYS }, { taskId: 'okulal', slot: 16, days: WEEKDAYS }] },
    { id: 'ogretmen', name: 'Öğretmen', icon: '🍎', cost: 0, energy: 80, stress: 25, desc: 'Sabah dersleri, akşam kâğıt okuma.',
      trait: { name: 'Sabırlı', desc: 'Stres eşikleri 10 puan daha yüksek.' },
      cards: ['kagit', 'veli'], fixed: [{ taskId: 'anlatim', slot: 2, days: WEEKDAYS }] },
    { id: 'doktor', name: 'Doktor', icon: '🩺', cost: 6, energy: 85, stress: 30, desc: 'Ameliyatlar, vizitler, uzun günler.',
      trait: { name: 'Dayanıklı', desc: 'Enerji eşikleri 10 puan daha düşük; yorgunluğu geç hisseder.' },
      cards: ['vizit', 'makale'], fixed: [{ taskId: 'ameliyat', slot: 2, days: [0, 2, 4] }] },
    { id: 'sanatci', name: 'Sanatçı', icon: '🎨', cost: 6, energy: 75, stress: 20, desc: 'İlham gelince durmak yok.',
      trait: { name: 'İlham', desc: 'Eğlence, sosyal ya da gelişimden hemen sonraki iş görevi ×1.3.' },
      cards: ['resim', 'ilham'], fixed: [{ taskId: 'atolye', slot: 14, days: [1, 3] }] },
    { id: 'sporcu', name: 'Sporcu', icon: '🏋️', cost: 8, energy: 90, stress: 20, desc: 'Antrenman, protein, tekrar.',
      trait: { name: 'Atletik', desc: 'Sağlık görevleri +10 ⭐ ve yarı enerji harcar.' },
      cards: ['antrenman', 'esneme', 'protein'], fixed: [{ taskId: 'takim', slot: 2, days: WEEKDAYS }] },
    { id: 'asci', name: 'Aşçı', icon: '🍳', cost: 8, energy: 80, stress: 25, desc: 'Akşamları mutfak alev alır.',
      trait: { name: 'Gurme', desc: 'Yemekler iki kat enerji verir.' },
      cards: ['tarif', 'pazar'], fixed: [{ taskId: 'servis', slot: 20, days: [0, 1, 2, 3, 4, 5] }] },
    { id: 'yayinci', name: 'Yayıncı', icon: '🎙️', cost: 10, energy: 75, stress: 20, desc: 'Geceleri canlı yayında.',
      trait: { name: 'Gece Kuşu', desc: '20:00 sonrası ×1.2 puan ve gece cezası yok; 10:00 öncesi ×0.8.' },
      cards: ['yayinhaz', 'sohbet'], fixed: [{ taskId: 'canli', slot: 24, days: [0, 1, 2, 3, 4, 5] }] },
    { id: 'girisimci', name: 'Girişimci', icon: '🚀', cost: 12, energy: 80, stress: 35, desc: 'Büyük hayaller, büyük stres.',
      trait: { name: 'Hırslı', desc: 'İş görevleri ×1.2 puan ama +5 stres.' },
      cards: ['pitch', 'network'], fixed: [{ taskId: 'yatirimci', slot: 6, days: [0, 2, 4] }] },
  ];
  OG.CHAR_MAP = Object.fromEntries(OG.CHARACTERS.map((c) => [c.id, c]));

  // ---------- Yetenekler (her hafta başında bir tane seçilir) ----------
  OG.PERKS = [
    { id: 'sabahci', icon: '🌅', name: 'Sabah İnsanı', cost: 0, desc: 'Sabah odak bonusu ×1.2 yerine ×1.4.' },
    { id: 'zen', icon: '🧘', name: 'Zen Ustası', cost: 0, desc: 'Boş zaman iki kat dinlendirir.' },
    { id: 'kahveci', icon: '☕', name: 'Kahve Tutkunu', cost: 0, desc: 'Kahve +20 enerji verir ve stres yapmaz.' },
    { id: 'sosyal', icon: '🦋', name: 'Sosyal Kelebek', cost: 4, desc: 'Sosyal görevler +10 ⭐.' },
    { id: 'uykucu', icon: '🛌', name: 'Uykucu', cost: 4, desc: 'Erken yatmanın ertesi güne etkisi iki kat.' },
    { id: 'demir', icon: '💪', name: 'Demir İrade', cost: 5, desc: 'Görevler ancak enerji 0 ya da stres 100 olunca başarısız olur.' },
    { id: 'sansli', icon: '🍀', name: 'Şanslı', cost: 6, desc: 'Her gün elinde 2 kart fazla ve 1 ekstra yeniden çekme hakkı.' },
  ];
  OG.PERK_MAP = Object.fromEntries(OG.PERKS.map((p) => [p.id, p]));

  // ---------- Haftanın günleri (senaryolar) ----------
  // mods: catPts (kategori puan çarpanı), catStress (kategori ek stres), startEnergy, calmMult
  OG.SCENARIOS = [
    { day: 'Pazartesi', short: 'Pzt', icon: '🌱', name: 'Haftanın İlk Günü', desc: 'Yeni hafta, yeni başlangıç. 14:00’te haftalık planlama var.',
      fixed: [{ taskId: 'planlama', slot: 12 }], mods: {}, prefer: ['work3', 'focus', 'health1'] },
    { day: 'Salı', short: 'Sal', icon: '📈', name: 'Yoğun Salı', desc: 'İş/okul görevleri ×1.2 puan ama her biri +5 stres. 15:00’te önemli bir görüşme var.',
      fixed: [{ taskId: 'gorusme', slot: 14 }], mods: { catPts: { is: 1.2 }, catStress: { is: 5 } }, prefer: ['work3', 'stress60'] },
    { day: 'Çarşamba', short: 'Çar', icon: '⏰', name: 'Teslim Günü', desc: '16:00’da proje teslimi var. Oraya enerjik ve sakin varmaya çalış!',
      fixed: [{ taskId: 'teslim', slot: 16 }], mods: {}, prefer: ['energy25', 'stress60', 'focus'] },
    { day: 'Perşembe', short: 'Per', icon: '🎉', name: 'Parti Gecesi', desc: 'Akşam bir doğum günü partisi var. Sosyal görevler ×1.3 puan.',
      fixed: [{ taskId: 'parti', slot: 24 }], mods: { catPts: { sosyal: 1.3 } }, prefer: ['social2', 'variety5'] },
    { day: 'Cuma', short: 'Cum', icon: '🥱', name: 'Cuma Yorgunluğu', desc: 'Haftanın yorgunluğu çöktü: güne 10 enerji eksik başlarsın. Eğlence ×2 puan.',
      fixed: [], mods: { startEnergy: -10, catPts: { eglence: 2 } }, prefer: ['fun2', 'energy50'] },
    { day: 'Cumartesi', short: 'Cmt', icon: '🏖️', name: 'Hafta Sonu', desc: 'Sağlık, sosyal ve eğlence ×1.5 puan. Hafta sonu çalışmak her iş görevinde +10 stres.',
      fixed: [], mods: { catPts: { saglik: 1.5, sosyal: 1.5, eglence: 1.5 }, catStress: { is: 10 } }, prefer: ['health1', 'fun2', 'social2'] },
    { day: 'Pazar', short: 'Paz', icon: '🛋️', name: 'Pazar Keyfi', desc: '09:00’da aile kahvaltısı. Günü sakin bitirme bonusu iki kat!',
      fixed: [{ taskId: 'kahvalti', slot: 2 }], mods: { calmMult: 2 }, prefer: ['calm', 'early', 'free3'] },
  ];

  // ---------- Günlük hedefler ----------
  // needs: elde olması gereken kart kapasitesi (kategori ya da 'focus'); ok: o gün yapılabilir mi?
  OG.OBJECTIVES = [
    { id: 'stress60', icon: '🧊', text: 'Stresin hiç 60’ı geçmesin', check: (r) => r.maxStress <= 60 },
    { id: 'energy25', icon: '🔋', text: 'Enerjin hiç 25’in altına düşmesin', check: (r) => r.minEnergy >= 25 },
    { id: 'social2', icon: '👫', text: 'En az 2 sosyal aktivite yap', needs: { sosyal: 2 }, check: (r) => (r.catCounts.sosyal || 0) >= 2 },
    { id: 'health1', icon: '💚', text: 'En az 1 sağlık aktivitesi yap', needs: { saglik: 1 }, check: (r) => (r.catCounts.saglik || 0) >= 1 },
    { id: 'growth1', icon: '📖', text: 'Kendini geliştir: 1 gelişim görevi', needs: { gelisim: 1 }, check: (r) => (r.catCounts.gelisim || 0) >= 1 },
    { id: 'fun2', icon: '🎉', text: '2 eğlence aktivitesi yap', needs: { eglence: 2 }, check: (r) => (r.catCounts.eglence || 0) >= 2 },
    { id: 'meals', icon: '🍽️', text: 'Öğle ve akşam yemeğini vaktinde ye', check: (r) => r.stats.mainMealsOnTime >= 2, ok: 'meals' },
    { id: 'variety5', icon: '🌈', text: '5 farklı türde görev yap', check: (r) => Object.keys(r.catCounts).length >= 5 },
    { id: 'free3', icon: '☁️', text: 'En az 3 saat boş zaman bırak', check: (r) => r.stats.idleSlots >= 6 },
    { id: 'early', icon: '🛏️', text: '23:00’te ya da daha erken yat', check: (r) => r.bedSlot <= 30, ok: 'early' },
    { id: 'calm', icon: '😌', text: 'Günü stres ≤ 20 ile bitir', check: (r) => r.finalStress <= 20 },
    { id: 'nofail', icon: '✅', text: 'En az 7 görev yap, hiçbiri başarısız olmasın', check: (r) => r.stats.failed === 0 && r.stats.completed >= 7 },
    { id: 'work3', icon: '💼', text: 'En az 3 iş/okul görevi tamamla', needs: { is: 2 }, check: (r) => (r.catCounts.is || 0) >= 3 },
    { id: 'focus', icon: '🌅', text: 'Bir odak görevini 12:00’den önce yap', needs: { focus: 1 }, check: (r) => r.stats.morningFocus >= 1, ok: 'focus' },
    { id: 'energy50', icon: '⚡', text: 'Günü en az 50 enerjiyle bitir', check: (r) => r.finalEnergy >= 50 },
  ];
  OG.OBJECTIVE_MAP = Object.fromEntries(OG.OBJECTIVES.map((o) => [o.id, o]));

  // Sürpriz olaylar: js/events.js

  // ---------- Rozetler ----------
  OG.BADGES = [
    { id: 'kusursuz', icon: '🏆', name: 'Kusursuz Gün', desc: 'Bir günde S notu al.' },
    { id: 'ucyildiz', icon: '🌟', name: 'Üç Yıldız', desc: 'Bir günün 3 hedefini de tuttur.' },
    { id: 'buz', icon: '🧊', name: 'Buz Gibi', desc: 'En az 5 görevli bir günde stresin hiç 40’ı geçmesin.' },
    { id: 'gecekusu', icon: '🦉', name: 'Gece Kuşu', desc: '22:00 sonrası 2 görev tamamla.' },
    { id: 'tamsarj', icon: '🔋', name: 'Tam Şarj', desc: 'En az 5 görevli bir günü 80+ enerjiyle bitir.' },
    { id: 'rekortmen', icon: '💯', name: 'Rekortmen', desc: 'Bir günde 450+ puan topla.' },
    { id: 'kalabalik', icon: '🥳', name: 'Sosyal Kelebek', desc: 'Bir günde 3 sosyal aktivite yap.' },
    { id: 'tukenis', icon: '🤯', name: 'Tükeniş', desc: 'Stresin 95’e dayansın. (Pek gurur duyulacak bir şey değil!)' },
    { id: 'olayavcisi', icon: '🎲', name: 'Olay Avcısı', desc: 'Toplam 10 sürpriz olayla karşılaş.' },
    { id: 'nadir', icon: '🍀', name: 'Şans Kuşu', desc: 'Nadir bir olayla karşılaş.' },
    { id: 'kasif', icon: '🧭', name: 'Kâşif', desc: '40 farklı olay keşfet.' },
    { id: 'haftatamam', icon: '📅', name: 'Hafta Tamam', desc: 'Bir haftayı canını kaybetmeden sonuna kadar götür.' },
    { id: 'kurtarici', icon: '🦸', name: 'Günü Kurtaran', desc: 'Ana görevi tamamlayıp bir haftayı kurtar.' },
    { id: 'kusursuzhafta', icon: '💖', name: 'Tek Parça', desc: 'Hiç can kaybetmeden bir haftayı kurtar.' },
    { id: 'zorlu', icon: '🔥', name: 'Ateşten Gömlek', desc: 'Zor modda bir haftayı kurtar.' },
    { id: 'efsane', icon: '👑', name: 'Efsane Hafta', desc: 'Bir haftada 18+ hedef yıldızı topla.' },
    { id: 'uyku', icon: '🛏️', name: 'Uyku Düzeni', desc: 'Bir hafta boyunca her gün en geç 23:00’te yat.' },
    { id: 'cokyonlu', icon: '🎭', name: 'Çok Yönlü', desc: '4 farklı karakterle hafta bitir.' },
  ];

  // Harf notu eşikleri (günlük toplam puan)
  OG.GRADES = [
    { grade: 'S', min: 370 },
    { grade: 'A', min: 310 },
    { grade: 'B', min: 240 },
    { grade: 'C', min: 160 },
    { grade: 'D', min: -Infinity },
  ];
})(typeof window !== 'undefined' ? window : globalThis);
