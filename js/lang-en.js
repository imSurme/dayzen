// İngilizce içerik: oyun verilerinin İngilizce adları/açıklamaları ve arayüz sözlüğü.
// Yalnız İngilizce seçiliyse uygulanır. Türkçe adlar sözlüğe de eklenir (kayıtlı eski metinler için).
(function (root) {
  'use strict';
  const OG = root.OG;
  if (OG.lang !== 'en') return;

  const learned = {};
  // obj[key] alanlarını İngilizcesiyle değiştir, eski Türkçe metni sözlüğe ekle
  function put(obj, fields) {
    if (!obj) return;
    for (const [k, v] of Object.entries(fields)) {
      if (typeof obj[k] === 'string' && obj[k] !== v) learned[obj[k]] = v;
      obj[k] = v;
    }
  }

  // ---------- Kategoriler ----------
  const CATS = { is: 'Work / School', saglik: 'Health', yemek: 'Food', dinlenme: 'Rest', sosyal: 'Social', eglence: 'Fun', ev: 'Chores', gelisim: 'Growth' };
  Object.entries(CATS).forEach(([id, name]) => put(OG.CATEGORIES[id], { name }));

  // ---------- Görevler: [ad, açıklama?] ----------
  const MORNING = 'Before 12:00 ×1.2';
  const TASKS = {
    derin: ['Deep Work', MORNING], ders: ['Study', MORNING], eposta: ['Emails'], spor: ['Workout'],
    dus: ['Shower', 'Bonus right after a workout'], meditasyon: ['Meditation'],
    ogle: ['Lunch', 'Bonus between 12:00–14:00'], aksam: ['Dinner', 'Bonus between 18:00–21:00'],
    kahve: ['Coffee Break', 'Stress +5 after 18:00'], sekerleme: ['Nap'], arkadas: ['Meet Friends'],
    aile: ['Call Family'], oyun: ['Play Games'], dizi: ['Watch a Show'], temizlik: ['House Cleaning'],
    market: ['Grocery Shopping'], kitap: ['Read a Book'],
    kahvaltisabah: ['Breakfast', 'Bonus between 08:00–10:00'], araogun: ['Snack'], yemekyap: ['Cook a Meal'],
    bulasik: ['Dishes'], muzik: ['Listen to Music'], uzan: ['Lie Down & Rest'],
    yoga: ['Yoga'], yuruyus: ['Nature Walk'], podcast: ['Podcast'], kurs: ['Online Course', MORNING],
    masaj: ['Massage'], gonullu: ['Volunteering'],
    kutuphane: ['Library', MORNING], kulup: ['Campus Club'], kod: ['Write Code', MORNING], bug: ['Bug Hunt'],
    cocuk: ['Play with Kids'], odev: ['Homework Help'], yemekhaz: ['Prepare Food'], kagit: ['Grade Exams'],
    veli: ['Parent Meeting'], vizit: ['Ward Rounds'], makale: ['Read Papers'], resim: ['Studio Work', MORNING],
    ilham: ['Inspiration Walk'], antrenman: ['Training'], esneme: ['Stretching'], protein: ['Protein Meal'],
    tarif: ['Recipe Test'], pazar: ['Farmers Market'], yayinhaz: ['Stream Prep'], sohbet: ['Fan Chat'],
    pitch: ['Build the Pitch', MORNING], network: ['Networking Event'],
    okulders: ['School Classes'], standup: ['Daily Standup'], okulbirak: ['School Drop-off'], okulal: ['School Pick-up'],
    anlatim: ['Teaching'], ameliyat: ['Surgery'], atolye: ['Studio Class'], takim: ['Team Practice'],
    servis: ['Dinner Service'], canli: ['Live Stream'], yatirimci: ['Investor Meeting'], planlama: ['Weekly Planning'],
    gorusme: ['Important Meeting'], teslim: ['Project Delivery'], parti: ['Birthday Party'], kahvalti: ['Family Breakfast'],
    c_fatura: ['Pay the Bill'], c_kargo: ['Pick up a Parcel'], c_dis: ['Dentist Appointment'], c_evrak: ['Paperwork'],
    c_ilac: ['Pharmacy Run'], c_camasir: ['Do the Laundry'], c_mesaj: ['Text a Friend Back'],
  };
  Object.entries(TASKS).forEach(([id, [name, desc]]) => put(OG.TASK_MAP[id], desc ? { name, desc } : { name }));

  // ---------- Karakterler ----------
  const CHARS = {
    ogrenci: ['Student', 'Classes, exams and endless campus life.', 'Quick Recovery', 'Free time and naps restore more.'],
    yazilimci: ['Developer', 'Code, coffee, more code.', 'Flow State', 'The monotony penalty starts at the 4th same-type task instead of the 3rd.'],
    ebeveyn: ['Parent', 'School runs, homework and endless love.', 'Family Warmth', 'Social tasks reduce stress by an extra 5.'],
    ogretmen: ['Teacher', 'Morning classes, evening grading.', 'Patient', 'Stress thresholds are 10 points higher.'],
    doktor: ['Doctor', 'Surgeries, rounds, long days.', 'Resilient', 'Energy thresholds are 10 points lower; feels tired later.'],
    sanatci: ['Artist', 'No stopping once inspiration strikes.', 'Inspiration', 'A work task right after fun, social or growth gets ×1.3.'],
    sporcu: ['Athlete', 'Training, protein, repeat.', 'Athletic', 'Health tasks give +10 ⭐ and use half the energy.'],
    asci: ['Chef', 'The kitchen catches fire in the evenings.', 'Gourmet', 'Meals give double energy.'],
    yayinci: ['Streamer', 'Live on stream every night.', 'Night Owl', '×1.2 points after 20:00 and no late-night penalty; ×0.8 before 10:00.'],
    girisimci: ['Founder', 'Big dreams, big stress.', 'Ambitious', 'Work tasks get ×1.2 points but +5 stress.'],
  };
  Object.entries(CHARS).forEach(([id, [name, desc, tn, td]]) => {
    const c = OG.CHAR_MAP[id];
    put(c, { name, desc });
    put(c.trait, { name: tn, desc: td });
  });

  // ---------- Yetenekler ----------
  const PERKS = {
    sabahci: ['Morning Person', 'Morning focus bonus is ×1.4 instead of ×1.2.'],
    zen: ['Zen Master', 'Free time restores twice as much.'],
    kahveci: ['Coffee Lover', 'Coffee gives +20 energy and no stress.'],
    sosyal: ['Social Butterfly', 'Social tasks +10 ⭐.'],
    uykucu: ['Sleepyhead', 'Going to bed early has double the effect on the next day.'],
    demir: ['Iron Will', 'Tasks only fail at 0 energy or 100 stress.'],
    sansli: ['Lucky', '2 extra cards in hand every day and 1 extra redraw.'],
  };
  Object.entries(PERKS).forEach(([id, [name, desc]]) => put(OG.PERK_MAP[id], { name, desc }));

  // ---------- Günler ----------
  const DAYS = [
    ['Monday', 'Mon', 'First Day of the Week', 'New week, fresh start. Weekly planning at 14:00.'],
    ['Tuesday', 'Tue', 'Busy Tuesday', 'Work/school tasks ×1.2 points but +5 stress each. An important meeting at 15:00.'],
    ['Wednesday', 'Wed', 'Deadline Day', 'Project delivery at 16:00. Try to get there energetic and calm!'],
    ['Thursday', 'Thu', 'Party Night', 'A birthday party in the evening. Social tasks ×1.3 points.'],
    ['Friday', 'Fri', 'Friday Fatigue', 'The week’s fatigue hits: you start with 10 less energy. Fun ×2 points.'],
    ['Saturday', 'Sat', 'Weekend', 'Health, social and fun ×1.5 points. Working on the weekend adds +10 stress per work task.'],
    ['Sunday', 'Sun', 'Lazy Sunday', 'Family breakfast at 09:00. The calm-finish bonus is doubled!'],
  ];
  DAYS.forEach(([day, short, name, desc], i) => put(OG.SCENARIOS[i], { day, short, name, desc }));

  // ---------- Günlük hedefler ----------
  const OBJ = {
    stress60: 'Keep stress at or below 60 all day', energy25: 'Never let energy drop below 25',
    social2: 'Do at least 2 social activities', health1: 'Do at least 1 health activity',
    growth1: 'Grow yourself: 1 growth task', fun2: 'Do 2 fun activities',
    meals: 'Eat lunch and dinner on time', variety5: 'Do 5 different types of tasks',
    free3: 'Leave at least 3 hours of free time', early: 'Go to bed at 23:00 or earlier',
    calm: 'End the day with stress ≤ 20', nofail: 'Do at least 7 tasks with none failing',
    work3: 'Complete at least 3 work/school tasks', focus: 'Do a focus task before 12:00',
    energy50: 'End the day with at least 50 energy',
  };
  Object.entries(OBJ).forEach(([id, text]) => put(OG.OBJECTIVE_MAP[id], { text }));

  // ---------- Rozetler ----------
  const BADGES = {
    kusursuz: ['Perfect Day', 'Get an S grade on a day.'],
    ucyildiz: ['Three Stars', 'Hit all 3 goals of a day.'],
    buz: ['Ice Cold', 'On a day with 5+ tasks, keep stress at or below 40.'],
    gecekusu: ['Night Owl', 'Complete 2 tasks after 22:00.'],
    tamsarj: ['Fully Charged', 'End a day with 5+ tasks at 80+ energy.'],
    rekortmen: ['Record Breaker', 'Score 450+ points in a day.'],
    kalabalik: ['Social Butterfly', 'Do 3 social activities in a day.'],
    tukenis: ['Burnout', 'Let stress reach 95. (Not exactly something to be proud of!)'],
    olayavcisi: ['Event Hunter', 'Encounter 10 surprise events in total.'],
    nadir: ['Lucky Bird', 'Encounter a rare event.'],
    kasif: ['Explorer', 'Discover 40 different events.'],
    haftatamam: ['Week Complete', 'Make it to the end of a week without running out of hearts.'],
    kurtarici: ['Day Saver', 'Complete the main mission and save a week.'],
    kusursuzhafta: ['In One Piece', 'Save a week without losing a single heart.'],
    zorlu: ['Trial by Fire', 'Save a week on Hard.'],
    efsane: ['Legendary Week', 'Collect 18+ goal stars in one week.'],
    uyku: ['Sleep Routine', 'Go to bed by 23:00 every day for a whole week.'],
    cokyonlu: ['Versatile', 'Finish a week with 4 different characters.'],
  };
  OG.BADGES.forEach((b) => BADGES[b.id] && put(b, { name: BADGES[b.id][0], desc: BADGES[b.id][1] }));

  // ---------- Yaşam dengesi, zorluk, ana görevler ----------
  put(OG.METER_MAP.is, { name: 'Work' });
  put(OG.METER_MAP.saglik, { name: 'Health' });
  put(OG.METER_MAP.sosyal, { name: 'Social' });
  put(OG.METER_MAP.ev, { name: 'Home' });
  put(OG.LOW_EFFECTS.saglik, { text: 'Your health is weak: you start the day with 10 less energy' });
  put(OG.LOW_EFFECTS.sosyal, { text: 'You feel lonely: you start the day with 10 more stress' });
  put(OG.LOW_EFFECTS.ev, { text: 'The house is a mess: you start the day with 5 more stress' });
  put(OG.LOW_EFFECTS.is, { text: 'Work piled up: you start the day with 5 more stress' });
  put(OG.DIFFICULTIES.kolay, { name: 'Easy', desc: '4 hearts, 3 rewinds, life balance drops slowly.' });
  put(OG.DIFFICULTIES.normal, { name: 'Normal', desc: '3 hearts, 2 rewinds. The intended experience.' });
  put(OG.DIFFICULTIES.zor, { name: 'Hard', desc: '2 hearts, 1 rewind, 2 to-dos every day, higher targets.' });
  const MISSIONS = {
    ogrenci: ['Exam Week', 'Knowledge', 'Prepare for the exam by Friday evening.'],
    yazilimci: ['Project Delivery', 'Progress', 'Finish the project by Thursday evening.'],
    ebeveyn: ['Happy Family', 'Family Joy', 'Spend time with your family by Sunday evening.'],
    ogretmen: ['Report Card Week', 'Grading', 'Grade all the exam papers by Friday evening.'],
    doktor: ['Heavy Shift', 'Patient Care', 'Get to all your patients by Saturday evening.'],
    sanatci: ['Gallery Opening', 'Artwork', 'Finish the exhibition pieces by Saturday evening.'],
    sporcu: ['Tournament Prep', 'Form', 'Be in shape for Saturday’s tournament.'],
    asci: ['Gourmet Inspection', 'Kitchen Score', 'Get the kitchen ready before Friday evening’s inspection.'],
    yayinci: ['10K Followers', 'Growth', 'Grow your channel by Sunday evening.'],
    girisimci: ['Funding Round', 'Readiness', 'Prepare the investor pitch by Wednesday evening.'],
  };
  Object.entries(MISSIONS).forEach(([id, [name, unit, desc]]) => put(OG.MISSIONS[id], { name, unit, desc }));

  // ---------- Olaylar: [başlık, metin, seçenek1, seçenek2] ----------
  const EVENTS = {
    patron: ['Urgent call!', 'Something urgent came up and you’re needed right away.', 'Handle it now', 'Politely postpone'],
    yagmur: ['It started raining!', 'Your next outdoor activity might get soaked.', 'Keep going in the rain', 'Cancel, stay in'],
    kahvedavet: ['Coffee invite', 'A friend invites you for a quick coffee.', 'Go', 'Politely decline'],
    kedi: ['A kitten!', 'A cute cat on the street is looking at you.', 'Pet it', 'Keep walking'],
    otobus: ['Missed the bus', 'The next one comes in 20 minutes.', 'Take a taxi', 'Walk there'],
    fikir: ['Bright idea!', 'A great idea for your next task just popped up.', 'Use it now', 'Jot it down for later'],
    bildirim: ['Notification storm', 'Your phone won’t stop buzzing.', 'Mute it', 'Check them all'],
    paket: ['Surprise package', 'There’s a package for you at the door!', 'Open it now', 'Save it for tonight'],
    basagrisi: ['Headache', 'Your head started pounding.', 'Take a pill, keep going', 'Lie down for a bit'],
    anne: ['Mom is calling', 'You haven’t properly talked in a while.', 'Have a long chat', 'Call back later'],
    motivasyon: ['Motivation burst', 'You feel unstoppable!', 'Make the most of it', 'Stay calm'],
    bilgisayar: ['Computer froze!', 'The screen locked up right as you sat down to work.', 'Fight to fix it', 'Take a break'],
    komsu: ['Neighbor renovating', 'A drill keeps going next door.', 'Put on headphones', 'Escape to a café'],
    eskiarkadas: ['An old friend wrote', 'A message from a friend you haven’t seen in years.', 'Chat for ages', 'Send a quick heart'],
    cuzdan: ['A wallet on the ground!', 'You found a full wallet on the sidewalk.', 'Find the owner', 'Drop it at the police'],
    elektrik: ['Power outage!', 'No power in the neighborhood, no idea when it’s back.', 'Light a candle, rest', 'Move to a café'],
    dokuldu: ['Spilled your coffee!', 'Coffee all over you.', 'Laugh it off', 'Change clothes'],
    diziOnerisi: ['Show recommendation', 'A friend said “you absolutely have to watch this.”', 'Watch an episode', 'Add it to the list'],
    ovgu: ['A compliment!', 'Someone sincerely praised something you did.', 'Say thanks', 'Blush and run'],
    sicak: ['Scorching heat', 'It’s unbearably hot today.', 'Get ice cream', 'Tough it out'],
    anahtar: ['Where are the keys?', 'You realize you left your keys at home.', 'Go back for them', 'Deal with it tonight'],
    fatura: ['A bill arrived', 'A bill higher than you expected.', 'Pay it now', 'Look at it later'],
    bilet: ['You won concert tickets!', 'A raffle got you a ticket for tonight’s concert.', 'Go happily', 'Gift it to a friend'],
    gunesli: ['Perfect weather', 'The sun is just right and the breeze is cool.', 'A short walk', 'Opening the window is enough'],
    eposta: ['Inbox explosion', 'Dozens of emails landed at once.', 'Clear them all', 'Ignore them'],
    esneme: ['Yawning fit', 'Your eyes keep closing on their own.', 'Drink coffee', 'Rest your eyes for 10 min'],
    sarki: ['Your favorite song!', 'Your favorite song just came on the radio.', 'Turn it up and dance', 'Hum along'],
    pasta: ['Cake from the neighbor', 'Your neighbor brought you a homemade cake.', 'Eat it now', 'Save it for tonight'],
    quiz: ['Pop quiz!', 'The teacher gave an unannounced quiz.', 'Do your best', 'Leave it blank'],
    grupodev: ['Group project crisis', 'Your teammate never did their part.', 'Do it for them', 'Tell the teacher'],
    burs: ['Scholarship email!', 'Your scholarship was approved!', 'Celebrate', 'Stay calm, carry on'],
    prod: ['Production is down!', 'The live system is broken and everyone is looking at you.', 'Jump in now', 'Leave it to on-call'],
    review: ['Code review request', 'A teammate sent a huge change.', 'Review it carefully', 'Write “LGTM” and move on'],
    cozum: ['You found the fix!', 'The fix for the bug you’ve fought for hours just came to you.', 'Try it now', 'Take a note'],
    ates: ['Call from school', 'Your child has a fever and they’re calling you.', 'Go right away', 'Call your partner'],
    cocukresim: ['A drawing for you!', 'Your child drew a picture for you.', 'Put it on the fridge', 'Say “so pretty”, carry on'],
    veligrup: ['Parents’ group on alert', '87 unread messages in the parents’ group chat.', 'Read them all', 'Mute it'],
    sessizsinif: ['An angelic class today', 'The students are unusually quiet and focused.', 'Teach an extra topic', 'Chat a little'],
    zorsoru: ['A really hard question', 'A student asked something you don’t know.', 'Let’s research it together', 'I’ll answer next week'],
    eskiogrenci: ['Message from a former student', 'They wrote that they never forgot you and want to thank you.', 'Write a long reply', 'A short thank-you'],
    acil: ['Emergency patient!', 'The ER is paging you.', 'Step in now', 'Hand it to the resident'],
    nobetdegis: ['Shift swap', 'A colleague wants to swap shifts with you.', 'Accept', 'Decline'],
    hastatesekkur: ['Thanks from a patient', 'A recovered patient left you a card.', 'Get emotional', 'Back to work'],
    ilhamperisi: ['The muse dropped by', 'An amazing composition appeared in your head.', 'Seize the moment', 'Note it in the sketchbook'],
    galeri: ['Call from a gallery', 'A gallery wants to exhibit your work!', 'Meet them now', 'Call back tomorrow'],
    tikanma: ['Creative block', 'You stare at the blank canvas and nothing comes.', 'Force it', 'Go for a walk'],
    burkulma: ['Mild sprain', 'You twisted your ankle a bit while warming up.', 'Ice it, rest', 'Tape it, keep going'],
    rekor: ['Personal best!', 'You broke your own record in training!', 'Share it with everyone', 'Celebrate quietly'],
    koc: ['Extra from the coach', 'Your coach added an extra set today.', 'Do the extra set', 'Choose recovery'],
    elestirmen: ['Food critic!', 'A famous food critic came to the restaurant.', 'Make a special plate', 'Regular service'],
    malzeme: ['Out of ingredients!', 'The menu’s star ingredient ran out.', 'Improvise a recipe', 'Run to the store'],
    alev: ['The pan caught fire!', 'Flames suddenly shot up from the stove.', 'Calmly put it out', 'Call for help'],
    viral: ['Your clip went viral!', 'A moment from yesterday’s stream got millions of views.', 'Go live now', 'Enjoy it'],
    trol: ['Troll comments', 'The comments filled up with nasty messages.', 'Reply to each one', 'Block and move on'],
    sponsor: ['Sponsorship offer', 'A brand wants to sponsor your channel.', 'Accept', 'Not for me'],
    yatirimilgi: ['Investor interest!', 'An angel investor wants to talk right now.', 'Pitch right now', 'Schedule a meeting'],
    rakip: ['Competitor move', 'A competitor announced almost the same product.', 'Emergency strategy meeting', 'Stay focused'],
    istifa: ['Resignation letter', 'Your best employee says they want to leave.', 'Try to convince them', 'Post a new job ad'],
    sendrom: ['Monday blues', 'After the weekend your body is resisting.', 'Fight it with coffee', 'Start slowly'],
    haftalikliste: ['Weekly goal list', 'A good moment to write down this week’s plans.', 'Make a detailed plan', 'Go with the flow'],
    ekis: ['Extra work dumped on you', 'Another file landed on your desk.', 'Take it on', 'Politely say no'],
    uzayan: ['Meeting ran over', 'The half-hour meeting just won’t end.', 'Sit through it', 'Politely leave'],
    sondakika: ['Last-minute change!', 'They want everything changed before delivery.', 'Fix it fast', 'Push back'],
    destek: ['Offer of help', 'A friend wants to help with the delivery.', 'Accept', 'I’ll handle it myself'],
    hediyelazim: ['A gift for the party!', 'You still haven’t bought a gift for tonight’s birthday.', 'Choose carefully', 'Get a gift card'],
    kiyafet: ['What do I wear?', 'You seem to have nothing to wear to the party.', 'Buy something new', 'Trust the classics'],
    cumaacil: ['Urgent work on Friday evening!', 'Urgent work arrived just as the week was ending.', 'Do it and finish', 'Leave it for Monday'],
    erkencikis: ['Chance to leave early', 'You’re told you can leave a bit early today.', 'Take it', 'Finish the shift'],
    piknik: ['Picnic invite!', 'Your friends are heading to the park for a picnic.', 'Join them', 'Stick to your plan'],
    yatak: ['Can’t get out of bed', 'The duvet is way too warm on a Saturday morning.', 'Sleep a bit more', 'Get up, start the day'],
    uzunkahvalti: ['Endless breakfast', 'Sunday breakfast just won’t end.', 'Enjoy it', 'Get up and back to work'],
    kaygi: ['Monday anxiety', 'The new week starts tomorrow and it’s weighing on you.', 'Plan tomorrow', 'Live in the moment'],
    piyango: ['You won the lottery!', 'Your little ticket won a prize!', 'Treat everyone to dessert', 'Quietly save it'],
    ufo: ['A strange light', 'A light you can’t explain is gliding across the sky...', 'Take a photo', 'Rub your eyes'],
    unlu: ['You ran into a celebrity!', 'A celebrity you like walks right past you.', 'Ask for a photo', 'Don’t bother them'],
    gokkusagi: ['Double rainbow!', 'Two rainbows appeared in the sky at once.', 'Stop and watch', 'Take a photo'],
    zaman: ['You gained an hour!', 'You notice your watch was an hour fast.', 'Rest', 'Make use of it'],
    kopek: ['Lost dog', 'You found a cute dog with a collar, clearly lost.', 'Return it to its owner', 'Call the shelter'],
  };
  Object.entries(EVENTS).forEach(([id, [title, text, a, b]]) => {
    const e = OG.EVENT_MAP[id];
    if (!e) return;
    put(e, { title, text });
    put(e.options[0], { label: a });
    if (e.options[1]) put(e.options[1], { label: b });
  });

  // ---------- Arayüz sözlüğü ----------
  OG.addDict(learned);
  OG.addDict({
    // Başlık, HUD, tahta
    'Haftanın günü': 'Day of the week', 'Canların': 'Your hearts', 'Saat': 'Time', 'Bugünkü puan': 'Today’s score',
    'Yıldızların (kilit açmak için)': 'Your stars (for unlocks)', 'Ana menü': 'Main menu', 'Kurallar': 'Rules', 'Ayarlar': 'Settings',
    'Kart tepsisini aç/kapat': 'Open/close the card tray', 'Elindeki Kartlar': 'Your Cards',
    'Yerleştirmediğin kartları değiştir': 'Swap the cards you haven’t placed', 'Yeniden çek': 'Redraw',
    'Kartı çizelgeye sürükle · 🔍 detay için karta tıkla': 'Drag a card onto the schedule · 🔍 click a card for details',
    'Kartı yukarı, çizelgeye sürükle · 🔍 detay için dokun': 'Drag a card up onto the schedule · 🔍 tap for details',
    'Elindeki kartları çizelgeye rastgele yerleştir': 'Place your cards on the schedule at random', 'Rastgele': 'Random',
    'Yerleştirdiğin kartları kaldır': 'Remove the cards you placed', 'Temizle': 'Clear', 'Günün detayları': 'Day details',
    'Yatış saati': 'Bedtime', 'Yatış': 'Bed', 'Dolu': 'Busy', 'Boş': 'Free',
    'Selam! Bugünümü planlar mısın?': 'Hi! Will you plan my day?', 'Yaşam Dengesi': 'Life Balance',
    'Enerji': 'Energy', 'Stres': 'Stress', 'Günün Hedefleri': 'Today’s Goals', 'Günü Başlat': 'Start Day',
    'Sonuca atla »': 'Skip to result »', 'Olay Günlüğü': 'Event Log', 'Paneller': 'Panels', 'Gün': 'Day', 'Durum': 'Status', 'Başlat': 'Start',
    'Giriş': 'Title', 'Kart detayı': 'Card details', 'Gün sonu değerlendirmesi': 'End-of-day review', 'Kapat': 'Close',
    'Günü başlatınca olanlar burada akacak.': 'Once you start the day, everything that happens will appear here.',
    'Uyku': 'Sleep', 'Kaldır': 'Remove', 'Sabit program: saati belli, kendiliğinden yapılır, taşınamaz': 'Fixed schedule: set time, happens on its own, can’t be moved',
    'Hız ×{n}': 'Speed ×{n}', 'tahmini': 'forecast', 'her gece −{n}': '−{n} every night', 'KRİZ!': 'CRISIS!',
    'Dünden devreden': 'Carried over from yesterday', 'Haftanın başı': 'Start of the week',
    '{x}! Hadi günü planlayalım.': '{x}! Let’s plan the day.',
    'Tahmin kapalı · ⚙️ Ayarlar’dan açabilirsin': 'Forecast off · ⚙️ turn it on in Settings',
    'Planlama tahmini (sürpriz olaylar hariç) · boş zaman: {d}': 'Planning forecast (excluding surprise events) · free time: {d}',
    'Ana göreve tahmini katkı': 'Estimated mission progress', 'Tahmini puan': 'Estimated score', 'Tahmini hedef yıldızı': 'Estimated goal stars',
    'Gün sonu enerji ve stres': 'End-of-day energy and stress', '{n} görevde verim kaybı var': '{n} tasks lose efficiency',
    '{n} canın kaldı · ⏪ {r} geri sarma hakkı': '{n} hearts left · ⏪ {r} rewinds',
    '{x} krizi': '{x} crisis', 'Tükenmişlik': 'Burnout', 'Ana görev kaçtı (−2)': 'Main mission failed (−2)',
    'Yapılacak kaçtı (−{n})': 'Missed to-do (−{n})', 'Yapılacak kaçtı': 'Missed to-do',
    'Tamamlandı!': 'Completed!', 'Tamamlandı': 'Completed', 'Süre doldu': 'Time’s up', 'Süresi doldu': 'Time’s up', 'Son gün: bu akşam!': 'Last day: tonight!',
    'Bugünkü plan:': 'Today’s plan:', 'Günde ~{n} gerek': 'Need ~{n}/day',
    '{m}: {v}/100 · bu gece +{g} −{d}': '{m}: {v}/100 · tonight +{g} −{d}',
    '{a}/{b} hak kaldı': '{a}/{b} uses left', 'Özel': 'Special', 'Yapılacak': 'To-do',
    'Ana göreve katkı (tam verimle)': 'Mission progress (at full efficiency)', '{x} göstergesine katkı': 'Adds to {x}',
    'Ön koşul: sağlanmazsa görev yapılamaz': 'Requirement: the task fails if it isn’t met',
    '{n} sa': '{n} h', 'Yorgunluk: puan ×{n}': 'Fatigue: points ×{n}', 'Stres: puan ×{n}': 'Stress: points ×{n}',
    'Olay etkisi: ×{n}': 'Event effect: ×{n}', 'En az {n} puan topla': 'Score at least {n} points', 'Sabit program iptal edilemedi.': 'The fixed schedule can’t be canceled.',
    '{a}, {d}, {p} puan, enerji {e}, stres {s}': '{a}, {d}, {p} points, energy {e}, stress {s}',
    // Karakter repliği
    'Çalışma vakti! 💪': 'Time to work! 💪', 'Odaklanıyorum... 🧠': 'Focusing... 🧠', 'Bunu da halledelim!': 'Let’s get this done too!',
    'Sağlık her şeydir! 💚': 'Health is everything! 💚', 'Vücudum teşekkür eder.': 'My body thanks me.', 'Harika bir fikir!': 'Great idea!',
    'Afiyet olsun bana! 😋': 'Bon appétit to me! 😋', 'Karnım zaten guruldıyordu.': 'My stomach was already growling.', 'Yemek molası, en sevdiğim!': 'Meal break, my favorite!',
    'Biraz kestirmek iyi gelir 😴': 'A little nap will do me good 😴', 'Şarj olma vakti 🔋': 'Time to recharge 🔋',
    'Onları çok özlemiştim! 🥰': 'I missed them so much! 🥰', 'Sohbet ruhuma iyi gelir.': 'A good chat feeds the soul.',
    'Biraz eğlence şart 🎉': 'A bit of fun is a must 🎉', 'Hak ettim bunu!': 'I’ve earned this!',
    'Ev işleri de bitmeli 🧹': 'Chores need doing too 🧹', 'Kimse benim yerime yapmayacak...': 'Nobody’s going to do it for me...',
    'Her gün biraz daha iyi! 📈': 'A little better every day! 📈', 'Beynim bayram ediyor 🧠': 'My brain is throwing a party 🧠',
    'O saat dolu! 😅 ({r})': 'That slot is taken! 😅 ({r})', 'İki işi aynı anda yapamam! ({r})': 'I can’t do two things at once! ({r})',
    'Hop, orası müsait değil. ({r})': 'Oops, that spot isn’t free. ({r})',
    'Peki, onu iptal ediyorum.': 'Okay, I’m canceling that.', 'Tamam, o iş yattı 🙃': 'Fine, that one’s off 🙃',
    'Biraz soluklanayım... ☁️': 'Let me catch my breath... ☁️', 'Hiçbir şey yapmamak da güzel.': 'Doing nothing is nice too.', 'Kafa dinliyorum 😌': 'Just chilling 😌',
    'Olmuyor... hiç halim yok 😫': 'Can’t do it... no strength left 😫', 'Yapamadım, tükendim...': 'Couldn’t do it, I’m spent...',
    'Hadi bakalım, gün başlıyor! ☀️': 'Here we go, the day begins! ☀️', 'Alarm çaldı, kalkıyorum! ⏰': 'Alarm’s ringing, I’m up! ⏰',
    'Temiz bir sayfa! Baştan planlayalım ✨': 'A clean slate! Let’s plan again ✨',
    'Bugünlük yeniden çekme hakkın bitti 🙈': 'No redraws left for today 🙈',
    'Yeni kartlar geldi! 🃏 Yerleştirdiklerin elinde kaldı.': 'New cards! 🃏 The ones you placed stay in your hand.',
    'Erkenden yatıyorum: yarın çok dinç olacağım! 😴': 'Early night: I’ll be so fresh tomorrow! 😴',
    '23:00’te yatarım, yarın biraz daha dinç olurum.': 'Bed at 23:00, I’ll be a bit fresher tomorrow.',
    'Gece yarısına kadar ayaktayım 🌙': 'Up until midnight 🌙',
    'Zar atıldı! 🎲 {n} kart yerleşti. Beğenmezsen tekrar bas.': 'Dice rolled! 🎲 {n} cards placed. Don’t like it? Press again.',
    'Alttaki kartlardan birini tutup yukarı, çizelgeye sürükle 👇': 'Hold one of the cards below and drag it up onto the schedule 👇',
    'Elindeki bir kartı tut ve çizelgeye sürükleyip bırak 👈': 'Grab one of your cards and drag it onto the schedule 👈',
    'Önce çizelgeye birkaç görev yerleştir! 👈': 'Place a few tasks on the schedule first! 👈',
    'Uyku vakti! Bakalım gün nasıl geçti... 😴': 'Bedtime! Let’s see how the day went... 😴',
    'Günün sonu! Bakalım nasıl geçti... 🥁': 'End of the day! Let’s see how it went... 🥁',
    '{x} iptal oldu.': '{x} was canceled.', '{x}: şimdi çizelgede bir saate dokun!': '{x}: now tap a time on the schedule!',
    'Seçimin: {x}': 'Your choice: {x}', 'Başarısız!': 'Failed!', 'İptal': 'Canceled', 'Boş zaman': 'Free time',
    'başarısız': 'failed',
    // Büyük kart
    'Ana göreve katkı': 'Mission progress', 'Yaşam dengesi': 'Life balance', '(verime göre değişir)': '(depends on efficiency)',
    'Ön koşul': 'Requirement', 'İpuçları': 'Tips', 'Planında': 'In your plan', 'başarısız olacak': 'will fail',
    'tahmini': 'forecast', '(sabit program)': '(fixed schedule)', 'Karaktere özel': 'Character card', 'Sabit program': 'Fixed schedule',
    'Bu kartın bugünkü hakkı doldu.': 'This card is used up for today.',
    'Kartı alttaki tepsiden yukarı, çizelgeye sürükle': 'Drag the card up from the tray onto the schedule',
    'Bu kartı tutup çizelgeye sürükleyebilirsin': 'Grab this card and drag it onto the schedule',
    '{a}/{b} hak': '{a}/{b} uses', 'puan': 'points', 'enerji': 'energy', 'stres': 'stress',
    '12:00’den önce yapılırsa puan ×1.2': 'Points ×1.2 if done before 12:00',
    '{a}–{b} arasında başlarsa +10 ⭐ ve +5 ⚡': '+10 ⭐ and +5 ⚡ if it starts between {a}–{b}',
    '18:00’den sonra içilirse stres +5': 'Stress +5 if had after 18:00',
    'Hemen ardından Duş alırsan +5 ⭐ ve stres −10': 'Shower right after for +5 ⭐ and stress −10',
    'Spordan hemen sonra yapılırsa bonus verir': 'Gives a bonus right after a workout',
    'Dış mekân: yağmur olayı çıkabilir': 'Outdoors: a rain event may happen',
    'Yemekten hemen sonra yapılırsa enerji −5 · 🌙 22:00 sonrası ×0.8': 'Energy −5 right after a meal · 🌙 ×0.8 after 22:00',
    // Hedefler ve çizelge
    'Gün 08:00’de başlıyor': 'The day starts at 08:00', 'Gün 24:00’te bitiyor': 'The day ends at 24:00',
    '{t}’da uyuyor olacaksın 😴': 'You’ll be asleep at {t} 😴', 'Bu kart bugün elinde değil': 'This card isn’t in your hand today',
    '{x} en fazla {n} kez eklenebilir': '{x} can be added at most {n} times', 'Çakışma: {x}': 'Overlaps: {x}',
    'Bu görev taşınamaz': 'This task can’t be moved', '{x} bitmeden yatamazsın': 'You can’t go to bed before {x} ends',
    'Önce {t} sonrasındaki “{x}” görevini kaldır': 'First remove “{x}”, it runs past {t}',
    // Simülasyon notları
    'Olay yüzünden iptal edildi.': 'Canceled because of an event.', 'Çok yorgundun, görevi tamamlayamadın.': 'You were too tired to finish the task.',
    'Tükenmişlik! Hiç odaklanamadın.': 'Burnout! You couldn’t focus at all.',
    'Ön koşul sağlanmadı ({r}), görev yapılamadı.': 'Requirement not met ({r}), the task failed.',
    'Sabah odaklanması: ×{n}': 'Morning focus: ×{n}', 'Gece kuşu: ×1.2': 'Night owl: ×1.2',
    'Tam zamanında yemek: +10 ⭐, enerji +5': 'Meal right on time: +10 ⭐, energy +5', 'Akşam kahvesi: stres +5': 'Evening coffee: stress +5',
    'Spor + Duş: +5 ⭐, stres −10': 'Workout + Shower: +5 ⭐, stress −10', 'Yemek sonrası rehavet: enerji −5': 'Post-meal slump: energy −5',
    'İlham: ×1.3': 'Inspiration: ×1.3', 'Atletik: +10 ⭐, yarı enerji': 'Athletic: +10 ⭐, half energy',
    'Günün etkisi: ×{n}': 'Day effect: ×{n}', 'Monotonluk ({n}. aynı tür): ×0.7, stres +5': 'Monotony ({n}th of a kind): ×0.7, stress +5',
    'Gece mesaisi: ×0.8, stres +10': 'Working late: ×0.8, stress +10',
    'Enerjin tükendi!': 'You ran out of energy!', 'Stres zirvede! İş görevleri artık başarısız olur.': 'Stress maxed out! Work tasks will fail now.',
    'Yapılacak kaçtı: {x}': 'Missed to-do: {x}', 'Hiç yemek yemedin': 'You didn’t eat at all',
    'Huzurlu kapanış (stres ≤ 30)': 'Calm finish (stress ≤ 30)', 'Huzurlu kapanış (stres ≤ 30) ×{n}': 'Calm finish (stress ≤ 30) ×{n}',
    'Stresli kapanış (stres ≥ 80)': 'Stressful finish (stress ≥ 80)', 'Günü bitkin bitirdin': 'You ended the day exhausted',
    'Enerjini korudun (≥ 20)': 'Kept your energy (≥ 20)', 'Çok yönlü gün ({n} tür)': 'Varied day ({n} types)',
    'Tükenmiş Kahraman': 'Burnt-out Hero', 'Verimlilik Canavarı': 'Productivity Beast', 'Dengeli Bilge': 'Balanced Sage',
    'Çalışkan Arı': 'Busy Bee', 'Gayet İyi Bir Gün': 'A Pretty Good Day', 'Ortalama Bir Gün': 'An Average Day', 'Zor Bir Gün': 'A Tough Day',
    '{n} odak görevini sabah yaptın, ekstra puan aldın.': 'You did {n} focus tasks in the morning for extra points.',
    'Spordan sonra duş alarak stresini ekstra düşürdün.': 'Showering after a workout cut your stress even more.',
    'Yemeklerini doğru saatte yedin.': 'You ate your meals at the right time.', 'Günü sakin bitirdin.': 'You ended the day calm.',
    'Hiç yemek yemedin. Yemek enerji kazandırır ve cezadan kurtarır.': 'You didn’t eat at all. Food restores energy and avoids a penalty.',
    '{n} görev başarısız oldu. Enerjin bitince ya da stresin tavan yapınca görevler yarım kalır.': '{n} tasks failed. Tasks are left unfinished when energy runs out or stress maxes out.',
    '{n} görevi düşük enerjiyle yaptın. Araya şekerleme, yemek ya da boş zaman koy.': 'You did {n} tasks on low energy. Add naps, meals or free time in between.',
    '{n} görevi yüksek stresle yaptın. Meditasyon, spor ve sosyal aktiviteler stresi düşürür.': 'You did {n} tasks under high stress. Meditation, workouts and social activities lower stress.',
    'Aynı türden görevleri art arda dizdin. Araya farklı bir şey koy.': 'You stacked tasks of the same type back to back. Mix in something different.',
    '22:00 sonrası çalışmak verimsiz ve stresli.': 'Working after 22:00 is inefficient and stressful.',
    'Yemekten hemen sonra iş koymak enerjini düşürdü.': 'Putting work right after a meal drained your energy.',
    'Odak görevleri 12:00 öncesinde ekstra puan verir.': 'Focus tasks give extra points before 12:00.',
    'Spordan hemen sonra duş alırsan bonus kazanırsın.': 'Shower right after a workout for a bonus.',
    'Akşam kahvesi stresini artırdı.': 'The evening coffee raised your stress.',
    '{n} görev ön koşulu (🔒) sağlanmadığı için yapılamadı. O kartları enerjin yüksek ya da stresin düşükken koy.': '{n} tasks failed their requirement (🔒). Place those cards when your energy is high or stress is low.',
    'Günü sıfır enerjiyle bitirdin; yarın da yorgun başlayacaksın.': 'You ended the day with zero energy; you’ll start tomorrow tired too.',
    '{d} boş zaman bıraktın. Daha fazla puan için daha çok görev ekleyebilirsin.': 'You left {d} of free time. Add more tasks for more points.',
    'Neredeyse kusursuz! Daha yüksek skor için görevlerin sırasıyla oynayabilirsin.': 'Almost perfect! Play with the task order for a higher score.',
    // Gün sonu
    'Gün boyunca enerji ve stres': 'Energy and stress through the day', '{d} Bitti!': '{d} Done!', 'Canın Kalmadı': 'Out of Hearts',
    '{n} puan': '{n} points', 'Yeni rozet': 'New badge', 'Hedefler': 'Goals', 'Gece Raporu': 'Night Report', 'KRİZ': 'CRISIS',
    'Ana görev tamamlandı!': 'Main mission complete!', 'Ana görevin süresi doldu': 'Main mission time ran out',
    'Ana görev bu hafta zaten tamam.': 'The main mission is already done this week.', 'Ana görev bu hafta kaçtı.': 'The main mission was missed this week.',
    'Canın kalmadı!': 'Out of hearts!', 'Bu hafta kurtarılamadı.': 'This week couldn’t be saved.',
    'Bu hafta kurtarılamadı. Geri sarıp bu günü yeniden deneyebilirsin.': 'This week couldn’t be saved. You can rewind and try this day again.',
    'Yapılacaklar': 'To-dos', 'Yapılacak kaçtı:': 'Missed to-do:', 'İlk kaçırma bu hafta için': 'This week’s first miss is just a',
    'uyarı': 'warning', ': bir daha kaçarsa can gider!': ': miss another and you lose a heart!',
    'Yarın sabah · {d}': 'Tomorrow morning · {d}', 'Haftanın sonu': 'End of the week',
    '22:00’de yattın: ekstra dinlendin.': 'In bed at 22:00: extra rest.', '23:00’te yattın: biraz ekstra dinlendin.': 'In bed at 23:00: a little extra rest.',
    'Gece yarısı yattın: ekstra dinlenme yok.': 'Bed at midnight: no extra rest.', 'seni bekliyor.': 'awaits you.',
    'Hafta burada bitiyor.': 'The week ends here.', 'Bu günü bitirince haftanın karnesi açılacak!': 'Finish this day to open the week’s report card!',
    'Puan dökümü, grafik ve ipuçları': 'Score breakdown, chart and tips', 'Puan Dökümü': 'Score Breakdown',
    'Görev ve olay puanları': 'Task and event points', 'Toplam': 'Total', '{n} görev': '{n} tasks', '{n} başarısız': '{n} failed',
    '{n} iptal': '{n} canceled', '{n} olay': '{n} events', '{d} boş': '{d} free', 'Enerji ve Stres': 'Energy and Stress',
    'Değerlendirme': 'Review', 'Bu günü baştan oynat (haftada sınırlı)': 'Replay this day (limited per week)',
    'Geri Sar ({n})': 'Rewind ({n})', 'Haftayı Bitir 💀': 'Finish Week 💀', 'Haftayı Bitir 🏁': 'Finish Week 🏁', 'Sonraki Gün ▶': 'Next Day ▶',
    'Geri sardık ⏪ ({n} hak kaldı). Bu sefer daha iyisi!': 'Rewound ⏪ ({n} left). Let’s do better this time!',
    // Giriş sayfası ve ekranlar
    '{x} (kilitli)': '{x} (locked)', 'Devam Et': 'Continue', 'Oyna': 'Play', 'Yeni bir hafta başlat': 'Start a new week', 'İlk haftana başla': 'Start your first week',
    'Planla, dengele, haftayı kurtar!': 'Plan, balance, save the week!', 'Yeni Hafta': 'New Week', 'Koleksiyon': 'Collection', 'Nasıl Oynanır': 'How to Play',
    'Yıldızların': 'Your stars', 'Rozetler': 'Badges', 'Kurtarılan hafta': 'Weeks saved', 'En iyi hafta puanı': 'Best week score',
    '10 karakter · 7 gün · 78 sürpriz olay': '10 characters · 7 days · 78 surprise events',
    'Mevcut hafta silinecek. Emin misin?': 'Your current week will be lost. Are you sure?',
    'Nasıl Oynanır?': 'How to Play', '1. Görevini öğren': '1. Learn your mission',
    'Her karakterin bir haftalık ana görevi var. Süresi dolmadan bitir!': 'Every character has a main mission for the week. Finish it in time!',
    '2. Günü planla': '2. Plan the day', 'Elindeki kartların hepsi sığmaz: neyi yapıp neyi erteleyeceğini seç.': 'Your cards won’t all fit: choose what to do and what to skip.',
    '3. Dengeyi koru': '3. Keep the balance', 'İş, sağlık, sosyal ve ev her gece azalır. Biri sıfırlanırsa kriz!': 'Work, health, social and home drop every night. If one hits zero: crisis!',
    '4. Haftayı kurtar': '4. Save the week', 'Krizler, kaçan işler ve görev kaybı can götürür. Can biterse hafta biter.': 'Crises, missed to-dos and a failed mission cost hearts. No hearts, no week.',
    'son saatinden önce bitmeli': 'must be done before their deadline', 'enerji/stres yetmezse kart yapılamaz': 'cards fail without enough energy / low enough stress',
    'Geri sarma': 'Rewind', 'haftada sınırlı': 'limited per week', 'Enerji ve stres ertesi güne geçer': 'Energy and stress carry over to the next day',
    'Detaylı kurallar için oyunda': 'For the full rules, use the', 'butonuna bakabilirsin.': 'button in the game.', 'Anladım 👍': 'Got it 👍',
    'hafta içi': 'weekdays', 'Pzt–Cmt': 'Mon–Sat', 'Seç ▶': 'Pick ▶', 'Açık': 'Unlocked', '{n} 🌟 ile aç': 'Unlock for {n} 🌟',
    'Bu karakterle hafta bitirdin': 'You finished a week with this character', 'Özel kartlar': 'Special cards', 'Kilit açıldı!': 'Unlocked!',
    'Geri': 'Back', 'Karakterini Seç': 'Choose Your Character', 'Bunu al': 'Take this', 'Haftalık Yetenek': 'Weekly Perk',
    'Zorluk': 'Difficulty', 'Yetenek': 'Perk', 'bu hafta hangi yeteneği yanına alsın?': '— which perk comes along this week?',
    'Karakterler': 'Characters', 'Kartlar': 'Cards', 'Yetenekler': 'Perks', 'Olaylar': 'Events',
    'Açtığın kartlar her karakterin destesine eklenir.': 'Cards you unlock are added to every character’s deck.', 'Destende': 'In your deck',
    'Genel olaylar': 'General events', 'Karakter olayları': 'Character events', 'Gün olayları': 'Day events', 'Nadir olaylar': 'Rare events', 'Çok nadir': 'Very rare',
    'Keşfedilen olaylar:': 'Events discovered:', '. Bir olayla karşılaşıp seçim yapınca buraya eklenir.': '. They are added here once you meet one and make a choice.',
    'Menü': 'Menu', '{x} haftaya böyle başlıyor': '{x} starts the week like this', 'Dünden devreden durumun': 'Carried over from yesterday',
    'Bugün sabit programın yok, gün tamamen senin!': 'No fixed schedule today, the day is all yours!', 'Planlamaya Başla ✏️': 'Start Planning ✏️',
    'Sonraki görev ×{n}': 'Next task ×{n}', 'Sonraki görev iptal': 'Next task canceled', 'Etkisi yok': 'No effect',
    '{x} olayı': '{x} event', 'Nadir olay!': 'Rare event!', 'Sürpriz!': 'Surprise!',
    'Ses efektleri': 'Sound effects', 'Kart, puan, olay ve yıldız sesleri': 'Card, score, event and star sounds',
    'Müzik': 'Music', 'Hafif, sakin bir arka plan müziği': 'Soft, calm background music',
    'Planlama tahmini': 'Planning forecast', 'Plan yaparken tahmini puanı, enerjiyi ve stresi gösterir': 'Shows the estimated score, energy and stress while planning',
    'Gün akış hızı': 'Day speed', 'Simülasyon sırasında “Hız” butonuyla da değiştirebilirsin': 'You can also change it with the “Speed” button during the day',
    'Yavaş': 'Slow', 'Hızlı': 'Fast', 'Çok hızlı': 'Very fast', 'Eğitimi tekrar oyna': 'Replay tutorial',
    'Eğitim, yeni haftanın ilk gününde başlayacak': 'The tutorial will start on the first day of your next week',
    'Gün bitene kadar bekle ya da “Sonuca Atla”ya bas': 'Wait for the day to end or press “Skip to result”',
    '{n} yıldız daha lazım': 'You need {n} more stars',
    // Hafta karnesi
    'Can kaybı': 'Heart lost', '{x} haftayı kurtardı!': '{x} saved the week!', 'Canların tükendi': 'You ran out of hearts',
    '{x}, {d} günü pes etti. Bu hafta kurtarılamadı.': '{x} gave up on {d}. This week couldn’t be saved.',
    'Ana görev süresinde bitmedi': 'The main mission wasn’t finished in time', 'Canların yetti ama': 'You had hearts to spare, but',
    'tamamlanamadı ({p}).': 'wasn’t completed ({p}).', 'Hafta Kurtarıldı!': 'Week Saved!', 'Hafta Kaybedildi': 'Week Lost', 'Görev Kaçtı': 'Mission Missed',
    'Ana Menü': 'Main Menu', 'Başka karakter': 'Other character', 'Tekrar Dene': 'Try Again', 'haftalık puan': 'week score',
    'Yeni hafta rekoru!': 'New week record!', '{n}/21 hedef yıldızı': '{n}/21 goal stars', 'bonus': 'bonus',
    'Canını götürenler': 'What cost you hearts', 'Bir dahaki sefere': 'Next time', 'Gün Gün': 'Day by Day',
    'Yaşam dengesindeki “→” tahmini 25’in altına inen alana o gün öncelik ver.': 'Prioritize any life area whose “→” forecast falls below 25 that day.',
    'Yapılacakları çizelgedeki kırmızı çizgiden önce bitir; ilk kaçırma sadece uyarıdır.': 'Finish to-dos before the red line on the schedule; the first miss is only a warning.',
    'Stres 100’e yaklaşınca meditasyon, spor ya da boş zaman ekle.': 'When stress nears 100, add meditation, a workout or free time.',
    'Görev kartlarını sabah ve dinçken yap: verim düşükse daha az ilerleme sayılır.': 'Do mission cards in the morning while fresh: low efficiency means less progress.',
    // Eğitim
    'Eğitimi geç': 'Skip tutorial', 'İleri ▶': 'Next ▶',
    // Genel ayırıcılar (en sonda): parçaları ayrı ayrı çevir
    '{a}\n{b}': '{a}\n{b}', '{a} · {b}': '{a} · {b}', '{a}, {b}': '{a}, {b}',
  });

  // ---------- Kurallar penceresi ----------
  const rules = document.querySelector('#rules .rules-card');
  if (rules) {
    rules.setAttribute('data-i18n-skip', '');
    rules.innerHTML = `
      <button class="close-btn" data-close aria-label="Close">✕</button>
      <h2 class="rules-title">Rules</h2>
      <section class="rule-sec goal-sec">
        <h3>Goal: Save the week</h3>
        <p>Every character has a <b>weekly main mission</b> (for example “prepare for the exam by Friday”). Finish it in time and get through the week without running out of hearts, and <b>the week is saved</b>.</p>
        <div class="tips-grid">
          <div class="tip bad"><span>💥</span><div><b>Crisis: −1 ❤️</b>If one life-balance area hits zero</div></div>
          <div class="tip bad"><span>📌</span><div><b>Missed to-do: −1 ❤️</b>The first miss in a week is a warning, later ones cost hearts</div></div>
          <div class="tip bad"><span>😵</span><div><b>Burnout: −1 ❤️</b>If stress reaches 100</div></div>
          <div class="tip bad"><span>⏳</span><div><b>Mission missed: −2 ❤️</b>If the main mission isn’t done in time</div></div>
        </div>
      </section>
      <section class="rule-sec">
        <h3>Life balance</h3>
        <p><b>💼 Work, 💚 Health, 👫 Social, 🏠 Home</b> drop every night. Cards fill their own area; work done while tired and stressed counts for less.
          An area below 25 slows you down the next morning (less energy or more stress).</p>
      </section>
      <section class="rule-sec">
        <h3>To-dos</h3>
        <p>Each day brings 1–2 to-dos (a bill, a parcel, medicine and so on). The card is always in your hand and <b>you choose when</b>; the <b>red dashed line</b> on the schedule marks the deadline.
          If it <b>isn’t finished</b> before the deadline (finishes late, fails, or gets canceled by an event):</p>
        <div class="end-bonus">
          <span class="eb bad">That day <b>−25 ⭐</b></span>
          <span class="eb bad">Its life area that night <b>−20</b></span>
          <span class="eb">First miss of the week <b>warning</b></span>
          <span class="eb bad">Every miss after that <b>−1 ❤️</b></span>
        </div>
        <p class="rule-hint" style="margin-top:8px">🔒 <b>Locked blocks</b> are your character’s or the day’s <b>fixed schedule</b>: set times that happen on their own, can’t be moved and carry no penalty.</p>
      </section>
      <section class="rule-sec">
        <h3>The basic rule</h3>
        <p>Every task takes <b>time</b>, gives <b>⭐ points</b> and changes your <b>⚡ energy</b> and <b>😰 stress</b>.
          Every 30 minutes you leave free lets you rest a little.</p>
      </section>
      <section class="rule-sec">
        <h3>Your efficiency</h3>
        <p class="rule-hint">The points you get from a task depend on your energy and stress at that moment.</p>
        <div class="scale">
          <span class="scale-label">⚡ Energy</span>
          <div class="scale-bar">
            <span class="seg bad" style="flex:30">50%</span>
            <span class="seg mid" style="flex:30">80%</span>
            <span class="seg good" style="flex:40">Full points</span>
          </div>
          <div class="scale-ticks"><span>0</span><span style="left:30%">30</span><span style="left:60%">60</span><span style="left:100%">100</span></div>
        </div>
        <div class="scale">
          <span class="scale-label">😰 Stress</span>
          <div class="scale-bar">
            <span class="seg good" style="flex:50">Full points</span>
            <span class="seg mid" style="flex:30">85%</span>
            <span class="seg bad" style="flex:20">60%</span>
          </div>
          <div class="scale-ticks"><span>0</span><span style="left:50%">50</span><span style="left:80%">80</span><span style="left:100%">100</span></div>
        </div>
        <p class="rule-warn">⛔ If your energy runs out (≤ 5) or stress maxes out (≥ 95), tasks <b>fail</b>.</p>
      </section>
      <section class="rule-sec">
        <h3>Smart ordering</h3>
        <div class="tips-grid">
          <div class="tip good"><span>🌅</span><div><b>Focus in the morning</b>Focus tasks ×1.2 before 12:00</div></div>
          <div class="tip good"><span>🍽️</span><div><b>Eat on time</b>Lunch 12–14, dinner 18–21: +10 ⭐</div></div>
          <div class="tip good"><span>🚿</span><div><b>Shower after a workout</b>+5 ⭐ and an extra stress drop</div></div>
          <div class="tip bad"><span>😪</span><div><b>Work right after a meal</b>Energy −5</div></div>
          <div class="tip bad"><span>🔁</span><div><b>3 tasks of the same type in a row</b>Points ×0.7</div></div>
          <div class="tip bad"><span>🌙</span><div><b>Work after 22:00</b>Points ×0.8, more stress</div></div>
        </div>
      </section>
      <section class="rule-sec">
        <h3>The week</h3>
        <div class="tips-grid">
          <div class="tip"><span>🃏</span><div><b>They won’t all fit</b>You draw 10 cards each morning; choose which to do. You can redraw once.</div></div>
          <div class="tip"><span>🔒</span><div><b>Requirements</b>Some cards need enough energy or low stress, or they fail.</div></div>
          <div class="tip"><span>🔁</span><div><b>Days carry over</b>However you end the day, you start the next morning close to it.</div></div>
          <div class="tip"><span>🛏️</span><div><b>Go to bed early</b>22:00 → tomorrow +20 ⚡ −10 😰 · 23:00 → +10 ⚡ −5 😰</div></div>
          <div class="tip"><span>⏪</span><div><b>Limited rewinds</b>Replaying a day uses one of your weekly rewinds.</div></div>
          <div class="tip"><span>🎯</span><div><b>3 goals = 3 stars</b>Stars unlock new characters, cards and perks.</div></div>
        </div>
      </section>
      <section class="rule-sec">
        <h3>End-of-day bonuses</h3>
        <div class="end-bonus">
          <span class="eb good">😌 Finish calm <b>+40</b></span>
          <span class="eb good">🔋 Keep some energy <b>+20</b></span>
          <span class="eb good">🌈 5+ different types <b>+30</b></span>
          <span class="eb bad">🍽️ Not eating at all <b>−40</b></span>
        </div>
      </section>
      <button class="btn primary big rules-ok" data-close>Got it 👍</button>`;
  }
})(window);
