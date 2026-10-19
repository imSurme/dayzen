// Sürpriz olaylar. Her gün havuzdan 2–3 olay seçilir (campaign.js → pickEvents).
// fx: energy, stress, points, nextMult (sonraki görev puan çarpanı), cancelNext (sonraki serbest görev iptal)
// cond: sıradaki göreve göre olayın gerçekleşip gerçekleşmeyeceği
// chars: yalnız bu karakterlerde çıkar · days: yalnız bu günlerde (0 = Pazartesi) · rare: nadir olay
(function (root) {
  'use strict';
  const OG = root.OG;
  const nextOutdoor = (t) => t && t.outdoor;
  const nextWork = (t) => t && t.cat === 'is';
  const opt = (label, fx = {}) => ({ label, fx });

  const GENERAL = [
    { id: 'patron', icon: '📞', title: 'Acil telefon!', text: 'Acil bir iş çıktı, hemen ilgilenmen isteniyor.',
      options: [opt('Hemen hallet', { points: 25, stress: 15, energy: -10 }), opt('Kibarca ertele', { stress: 5 })] },
    { id: 'yagmur', icon: '🌧️', title: 'Yağmur başladı!', text: 'Sıradaki dış mekân aktiviten sırılsıklam olabilir.', cond: nextOutdoor,
      options: [opt('Yağmurda devam', { stress: 10, nextMult: 1.2 }), opt('İptal et, evde kal', { cancelNext: true, energy: 10 })] },
    { id: 'kahvedavet', icon: '☕', title: 'Kahve daveti', text: 'Bir arkadaşın kısa bir kahveye çağırıyor.',
      options: [opt('Git', { stress: -10, energy: 5, nextMult: 0.9 }), opt('Kibarca reddet', { stress: 5 })] },
    { id: 'kedi', icon: '🐱', title: 'Yavru kedi!', text: 'Yolda sevimli bir kedi sana bakıyor.',
      options: [opt('Sev', { stress: -12, points: 5 }), opt('Yoluna devam et')] },
    { id: 'otobus', icon: '🚌', title: 'Otobüsü kaçırdın', text: 'Bir sonraki 20 dakika sonra geliyor.',
      options: [opt('Taksi tut', { points: -10 }), opt('Yürüyerek git', { energy: -10, stress: -5 })] },
    { id: 'fikir', icon: '💡', title: 'Parlak fikir!', text: 'Sıradaki işin için aklına harika bir fikir geldi.', cond: nextWork,
      options: [opt('Hemen uygula', { nextMult: 1.5, energy: -5 }), opt('Not al, sonra bakarsın', { points: 5 })] },
    { id: 'bildirim', icon: '📱', title: 'Bildirim yağmuru', text: 'Telefonun durmadan titriyor.',
      options: [opt('Sessize al', { nextMult: 1.2, stress: 5 }), opt('Hepsine bak', { stress: -5, nextMult: 0.8 })] },
    { id: 'paket', icon: '🎁', title: 'Sürpriz paket', text: 'Kapıda senin için bir paket var!',
      options: [opt('Hemen aç', { stress: -10 }), opt('Akşama sakla', { points: 10 })] },
    { id: 'basagrisi', icon: '🤕', title: 'Baş ağrısı', text: 'Başın zonklamaya başladı.',
      options: [opt('İlaç iç, devam et', { energy: 5, stress: 5 }), opt('Biraz uzan', { cancelNext: true, energy: 20, stress: -10 })] },
    { id: 'anne', icon: '👵', title: 'Annen arıyor', text: 'Uzun zamandır doğru dürüst konuşmadınız.',
      options: [opt('Uzun uzun konuş', { stress: -15, energy: -5, nextMult: 0.9 }), opt('Sonra ararım', { stress: 8 })] },
    { id: 'motivasyon', icon: '🔥', title: 'Motivasyon patlaması', text: 'Kendini durdurulamaz hissediyorsun!',
      options: [opt('Sonuna kadar kullan', { nextMult: 1.3, energy: -5 }), opt('Sakin kal', { energy: 10 })] },
    { id: 'bilgisayar', icon: '🖥️', title: 'Bilgisayar dondu!', text: 'Tam çalışacakken ekran kilitlendi.', cond: nextWork,
      options: [opt('Uğraşıp düzelt', { energy: -10, stress: 12 }), opt('Mola ver', { cancelNext: true, stress: -10 })] },
    { id: 'komsu', icon: '🔨', title: 'Komşu tadilatı', text: 'Yan daireden durmadan matkap sesi geliyor.',
      options: [opt('Kulaklığı tak', { stress: 5 }), opt('Kafeye kaç', { energy: -5, nextMult: 1.15 })] },
    { id: 'eskiarkadas', icon: '💌', title: 'Eski bir dost yazdı', text: 'Yıllardır görüşmediğin bir arkadaşından mesaj var.',
      options: [opt('Uzun uzun yazış', { stress: -10, nextMult: 0.85 }), opt('Kısa bir kalp at', { stress: -3 })] },
    { id: 'cuzdan', icon: '👛', title: 'Yerde cüzdan!', text: 'Kaldırımda dolu bir cüzdan buldun.',
      options: [opt('Sahibini bul', { energy: -10, points: 20, stress: -5 }), opt('Karakola bırak', { energy: -5, points: 10 })] },
    { id: 'elektrik', icon: '🔌', title: 'Elektrikler kesildi!', text: 'Mahallede elektrik yok, ne zaman geleceği belirsiz.',
      options: [opt('Mum yak, dinlen', { energy: 10, nextMult: 0.8 }), opt('Kafeye taşın', { energy: -10, stress: 5 })] },
    { id: 'dokuldu', icon: '🫗', title: 'Kahveni döktün!', text: 'Bütün kahve üstüne başına geldi.',
      options: [opt('Gülüp geç', { stress: 5 }), opt('Üstünü değiştir', { energy: -5, stress: -5, nextMult: 0.9 })] },
    { id: 'diziOnerisi', icon: '🎬', title: 'Dizi önerisi', text: 'Arkadaşın “bunu mutlaka izlemelisin” dedi.',
      options: [opt('Bir bölüm izle', { stress: -10, energy: 5, nextMult: 0.85 }), opt('Listeye ekle')] },
    { id: 'ovgu', icon: '👏', title: 'İltifat!', text: 'Biri yaptığın bir şey için seni içtenlikle övdü.',
      options: [opt('Teşekkür et', { stress: -10, points: 5 }), opt('Utanıp kaç', { stress: -3 })] },
    { id: 'sicak', icon: '🥵', title: 'Kavurucu sıcak', text: 'Hava bugün dayanılmaz derecede sıcak.',
      options: [opt('Dondurma ye', { energy: 5, stress: -5, points: -5 }), opt('Sabret', { energy: -10 })] },
    { id: 'anahtar', icon: '🔑', title: 'Anahtarlar nerede?', text: 'Anahtarlarını evde unuttuğunu fark ettin.',
      options: [opt('Geri dönüp al', { energy: -10, stress: 5 }), opt('Akşam düşünürüm', { stress: 12 })] },
    { id: 'fatura', icon: '🧾', title: 'Fatura geldi', text: 'Beklediğinden yüksek bir fatura kapıda.',
      options: [opt('Hemen öde', { stress: -5, points: -5 }), opt('Sonra bakarım', { stress: 10 })] },
    { id: 'bilet', icon: '🎟️', title: 'Konser bileti kazandın!', text: 'Bir çekilişten bu akşama konser bileti çıktı.',
      options: [opt('Sevinçle git', { stress: -15, energy: -5 }), opt('Arkadaşına hediye et', { points: 15 })] },
    { id: 'gunesli', icon: '🌞', title: 'Harika bir hava', text: 'Güneş tam kıvamında, rüzgâr serin.',
      options: [opt('Kısa bir yürüyüş', { energy: -5, stress: -12 }), opt('Pencereyi aç yeter', { stress: -4 })] },
    { id: 'eposta', icon: '📨', title: 'Gelen kutusu patladı', text: 'Bir anda onlarca e-posta düştü.', cond: nextWork,
      options: [opt('Hepsini temizle', { energy: -8, points: 10, stress: 5 }), opt('Görmezden gel', { stress: 8 })] },
    { id: 'esneme', icon: '🥱', title: 'Esneme krizi', text: 'Gözlerin kendiliğinden kapanıyor.',
      options: [opt('Kahve iç', { energy: 10, stress: 5 }), opt('10 dk göz dinlendir', { energy: 8, nextMult: 0.9 })] },
    { id: 'sarki', icon: '🎵', title: 'En sevdiğin şarkı!', text: 'Radyoda en sevdiğin şarkı çalmaya başladı.',
      options: [opt('Sesini aç, dans et', { stress: -10, energy: -3 }), opt('Mırıldan', { stress: -4 })] },
    { id: 'pasta', icon: '🍰', title: 'Komşudan pasta', text: 'Komşun kapına ev yapımı bir pasta getirdi.',
      options: [opt('Hemen ye', { energy: 10, nextMult: 0.9 }), opt('Akşama sakla', { points: 5 })] },
  ];

  // Karaktere özel olaylar (her karaktere 3 tane)
  const CHARACTER = [
    { id: 'quiz', chars: ['ogrenci'], icon: '📝', title: 'Sürpriz quiz!', text: 'Hoca derste habersiz bir quiz yaptı.',
      options: [opt('Elinden geleni yap', { points: 20, stress: 15, energy: -5 }), opt('Kâğıdı boş ver', { stress: -5, points: -10 })] },
    { id: 'grupodev', chars: ['ogrenci'], icon: '👥', title: 'Grup ödevi krizi', text: 'Grup arkadaşın kendi kısmını hiç yapmamış.',
      options: [opt('Onun yerine yap', { energy: -15, points: 25, stress: 10 }), opt('Hocaya söyle', { stress: 5, points: 5 })] },
    { id: 'burs', chars: ['ogrenci'], icon: '🎉', title: 'Burs maili!', text: 'Başvurduğun burs onaylandı!',
      options: [opt('Kutla', { stress: -20, nextMult: 0.9 }), opt('Sakin kal, devam et', { points: 15 })] },

    { id: 'prod', chars: ['yazilimci'], icon: '🚒', title: 'Production çöktü!', text: 'Canlı sistem çalışmıyor, herkes sana bakıyor.',
      options: [opt('Hemen müdahale et', { points: 30, stress: 20, energy: -15 }), opt('Nöbetçiye bırak', { stress: 10 })] },
    { id: 'review', chars: ['yazilimci'], icon: '🔍', title: 'Code review isteği', text: 'Bir ekip arkadaşın büyük bir değişiklik gönderdi.',
      options: [opt('Detaylı incele', { points: 15, energy: -8 }), opt('“LGTM” yaz geç', { points: 5, stress: 5 })] },
    { id: 'cozum', chars: ['yazilimci'], icon: '🧩', title: 'Çözümü buldun!', text: 'Saatlerdir uğraştığın hatanın çözümü aklına geldi.', cond: nextWork,
      options: [opt('Hemen dene', { nextMult: 1.5, energy: -5 }), opt('Not al', { points: 5, stress: -5 })] },

    { id: 'ates', chars: ['ebeveyn'], icon: '🤒', title: 'Okuldan arama', text: 'Çocuğunun ateşi çıkmış, seni arıyorlar.',
      options: [opt('Hemen git', { cancelNext: true, stress: 10, energy: -10 }), opt('Eşini ara', { stress: 15 })] },
    { id: 'cocukresim', chars: ['ebeveyn'], icon: '🖼️', title: 'Bir resim hediye!', text: 'Çocuğun senin için bir resim çizmiş.',
      options: [opt('Buzdolabına as', { stress: -15, points: 5 }), opt('“Çok güzel” de, devam et', { stress: -5 })] },
    { id: 'veligrup', chars: ['ebeveyn'], icon: '📣', title: 'Veli grubu alarmda', text: 'Velilerin mesaj grubunda 87 okunmamış mesaj var.',
      options: [opt('Hepsini oku', { stress: 10, points: 5 }), opt('Sessize al', { stress: -5, points: -5 })] },

    { id: 'sessizsinif', chars: ['ogretmen'], icon: '🤫', title: 'Sınıf bugün melek gibi', text: 'Öğrenciler alışılmadık derecede sessiz ve dikkatli.',
      options: [opt('Ekstra konu anlat', { points: 15, energy: -8 }), opt('Biraz sohbet et', { stress: -10 })] },
    { id: 'zorsoru', chars: ['ogretmen'], icon: '🙋', title: 'Çok zor bir soru', text: 'Bir öğrenci cevabını bilmediğin bir soru sordu.',
      options: [opt('Birlikte araştıralım', { points: 15, energy: -5, stress: 5 }), opt('Haftaya cevaplarım', { stress: 5 })] },
    { id: 'eskiogrenci', chars: ['ogretmen'], icon: '💐', title: 'Eski öğrencinden mesaj', text: 'Seni hiç unutmadığını ve teşekkür ettiğini yazmış.',
      options: [opt('Uzun bir cevap yaz', { stress: -15, energy: -3 }), opt('Kısa bir teşekkür', { stress: -6 })] },

    { id: 'acil', chars: ['doktor'], icon: '🚨', title: 'Acil hasta!', text: 'Acil servisten seni çağırıyorlar.',
      options: [opt('Hemen müdahale et', { points: 35, energy: -15, stress: 15 }), opt('Asistana devret', { stress: 8 })] },
    { id: 'nobetdegis', chars: ['doktor'], icon: '🌙', title: 'Nöbet değişimi', text: 'Bir meslektaşın nöbetini seninle değiştirmek istiyor.',
      options: [opt('Kabul et', { points: 15, energy: -10 }), opt('Reddet', { stress: 5 })] },
    { id: 'hastatesekkur', chars: ['doktor'], icon: '🎁', title: 'Hastandan teşekkür', text: 'İyileşen bir hastan sana bir kart bırakmış.',
      options: [opt('Duygulan', { stress: -15 }), opt('İşine dön', { points: 10 })] },

    { id: 'ilhamperisi', chars: ['sanatci'], icon: '✨', title: 'İlham perisi uğradı', text: 'Kafanda müthiş bir kompozisyon belirdi.', cond: nextWork,
      options: [opt('Anı yakala', { nextMult: 1.6, energy: -10 }), opt('Eskiz defterine not', { points: 8 })] },
    { id: 'galeri', chars: ['sanatci'], icon: '🏛️', title: 'Galeriden telefon', text: 'Bir galeri eserlerini sergilemek istiyor!',
      options: [opt('Hemen görüş', { points: 30, stress: 10, nextMult: 0.9 }), opt('Yarın geri dön', { stress: 5, points: 10 })] },
    { id: 'tikanma', chars: ['sanatci'], icon: '🧱', title: 'Yaratıcı tıkanma', text: 'Boş tuvale bakıyorsun, hiçbir şey gelmiyor.',
      options: [opt('Zorla devam et', { stress: 12, nextMult: 1.1 }), opt('Yürüyüşe çık', { energy: -5, stress: -10, nextMult: 0.9 })] },

    { id: 'burkulma', chars: ['sporcu'], icon: '🦵', title: 'Hafif burkulma', text: 'Isınırken bileğini hafifçe burktun.',
      options: [opt('Buz koy, dinlen', { cancelNext: true, energy: 10 }), opt('Bantla, devam et', { stress: 10, nextMult: 0.9 })] },
    { id: 'rekor', chars: ['sporcu'], icon: '🏅', title: 'Kişisel rekor!', text: 'Antrenmanda kendi rekorunu kırdın!',
      options: [opt('Herkesle paylaş', { stress: -10, points: 15 }), opt('Sessizce sevin', { stress: -5, energy: 5 })] },
    { id: 'koc', chars: ['sporcu'], icon: '📋', title: 'Koçtan ek program', text: 'Koçun bugüne ekstra bir set ekledi.',
      options: [opt('Ekstra seti yap', { points: 20, energy: -15 }), opt('Toparlanmayı seç', { energy: 10, points: -5 })] },

    { id: 'elestirmen', chars: ['asci'], icon: '🧐', title: 'Gurme eleştirmen!', text: 'Ünlü bir yemek eleştirmeni restorana geldi.',
      options: [opt('Özel tabak hazırla', { points: 30, stress: 15, energy: -10 }), opt('Normal servis', { stress: 5 })] },
    { id: 'malzeme', chars: ['asci'], icon: '🥕', title: 'Malzeme bitti!', text: 'Menünün yıldız malzemesi tükendi.',
      options: [opt('Doğaçlama tarif', { points: 15, stress: 10 }), opt('Markete koş', { energy: -12 })] },
    { id: 'alev', chars: ['asci'], icon: '🧯', title: 'Tava alev aldı!', text: 'Ocakta bir anda alevler yükseldi.',
      options: [opt('Soğukkanlı söndür', { points: 10, stress: 10 }), opt('Yardım çağır', { stress: 5, points: -5 })] },

    { id: 'viral', chars: ['yayinci'], icon: '📈', title: 'Klibin viral oldu!', text: 'Dünkü yayından bir an milyonlarca izlendi.',
      options: [opt('Hemen yayın aç', { points: 30, energy: -15, stress: 5 }), opt('Tadını çıkar', { stress: -15 })] },
    { id: 'trol', chars: ['yayinci'], icon: '👺', title: 'Trol yorumlar', text: 'Yorumlar kötü niyetli mesajlarla doldu.',
      options: [opt('Tek tek cevap ver', { stress: 15, points: 5 }), opt('Engelle, geç', { stress: -5 })] },
    { id: 'sponsor', chars: ['yayinci'], icon: '💸', title: 'Sponsor teklifi', text: 'Bir marka kanalına sponsor olmak istiyor.',
      options: [opt('Kabul et', { points: 25, stress: 10 }), opt('Bana uygun değil', { stress: -5, points: 5 })] },

    { id: 'yatirimilgi', chars: ['girisimci'], icon: '💰', title: 'Yatırımcı ilgisi!', text: 'Bir melek yatırımcı hemen konuşmak istiyor.',
      options: [opt('Hemen sunum yap', { points: 35, stress: 20, energy: -10 }), opt('Toplantı ayarla', { points: 10, stress: 5 })] },
    { id: 'rakip', chars: ['girisimci'], icon: '🦈', title: 'Rakip hamlesi', text: 'Bir rakip neredeyse aynı ürünü duyurdu.',
      options: [opt('Acil strateji toplantısı', { points: 15, stress: 15, energy: -5 }), opt('Odağını koru', { stress: 5, nextMult: 1.2 })] },
    { id: 'istifa', chars: ['girisimci'], icon: '📤', title: 'İstifa mektubu', text: 'En iyi çalışanın ayrılmak istediğini söyledi.',
      options: [opt('İkna etmeye çalış', { energy: -10, stress: 10, points: 10 }), opt('Yeni ilan aç', { stress: 8, points: 5 })] },
  ];

  // Haftanın gününe özel olaylar (her güne 2 tane)
  const DAY = [
    { id: 'sendrom', days: [0], icon: '😩', title: 'Pazartesi sendromu', text: 'Hafta sonundan sonra vücudun direniyor.',
      options: [opt('Kahveyle savaş', { energy: 10, stress: 5 }), opt('Yavaş başla', { nextMult: 0.8, stress: -10 })] },
    { id: 'haftalikliste', days: [0], icon: '🎯', title: 'Haftalık hedef listesi', text: 'Bu hafta neler yapacağını yazmak için iyi bir an.',
      options: [opt('Detaylı plan yap', { points: 15, energy: -5 }), opt('Akışına bırak', { stress: -5 })] },
    { id: 'ekis', days: [1], icon: '📎', title: 'Ek iş yüklendi', text: 'Masana bir dosya daha bırakıldı.',
      options: [opt('Üstlen', { points: 25, stress: 15 }), opt('Kibarca hayır de', { stress: 5, points: -5 })] },
    { id: 'uzayan', days: [1], icon: '⏳', title: 'Toplantı uzadı', text: 'Yarım saatlik toplantı bitmek bilmiyor.',
      options: [opt('Sabırla otur', { energy: -10, points: 10 }), opt('Kibarca çık', { stress: 8 })] },
    { id: 'sondakika', days: [2], icon: '✏️', title: 'Son dakika değişikliği!', text: 'Teslimden önce her şeyin değişmesi istendi.',
      options: [opt('Hızla düzelt', { points: 20, stress: 15, energy: -10 }), opt('İtiraz et', { stress: 10, points: 5 })] },
    { id: 'destek', days: [2], icon: '🤝', title: 'Yardım teklifi', text: 'Bir arkadaşın teslim için yardım etmek istiyor.',
      options: [opt('Kabul et', { stress: -15, points: 5 }), opt('Kendim hallederim', { points: 15, stress: 5 })] },
    { id: 'hediyelazim', days: [3], icon: '🛍️', title: 'Parti için hediye!', text: 'Akşamki doğum günü için hâlâ hediye almadın.',
      options: [opt('Özenle seç', { energy: -8, stress: -5, points: 10 }), opt('Hediye çeki al', { points: -5, stress: -3 })] },
    { id: 'kiyafet', days: [3], icon: '👗', title: 'Ne giyeceğim?', text: 'Partiye giyecek hiçbir şeyin yok gibi.',
      options: [opt('Yeni bir şey al', { points: -10, stress: -10 }), opt('Klasiklere güven', { stress: 3 })] },
    { id: 'cumaacil', days: [4], icon: '😤', title: 'Cuma akşamı acil iş!', text: 'Tam hafta biterken acil bir iş geldi.',
      options: [opt('Yap ve bitir', { points: 25, stress: 15, energy: -10 }), opt('Pazartesiye bırak', { stress: 8 })] },
    { id: 'erkencikis', days: [4], icon: '🏃', title: 'Erken çıkış fırsatı', text: 'Bugün biraz erken çıkabileceğin söylendi.',
      options: [opt('Değerlendir', { stress: -15, energy: 10, points: -5 }), opt('Mesaiyi tamamla', { points: 10 })] },
    { id: 'piknik', days: [5], icon: '🧺', title: 'Piknik daveti!', text: 'Arkadaşların parka pikniğe gidiyor.',
      options: [opt('Katıl', { cancelNext: true, stress: -20, points: 10 }), opt('Planına sadık kal', { stress: 5 })] },
    { id: 'yatak', days: [5], icon: '🛌', title: 'Yataktan çıkamıyorsun', text: 'Cumartesi sabahı yorgan çok sıcak.',
      options: [opt('Biraz daha uyu', { energy: 15, nextMult: 0.8 }), opt('Kalk, güne başla', { stress: 5, nextMult: 1.1 })] },
    { id: 'uzunkahvalti', days: [6], icon: '🥞', title: 'Uzayan kahvaltı', text: 'Pazar kahvaltısı bitmek bilmiyor.',
      options: [opt('Keyfini çıkar', { stress: -15, energy: 5, nextMult: 0.9 }), opt('Kalkıp işine dön', { points: 5 })] },
    { id: 'kaygi', days: [6], icon: '😬', title: 'Pazartesi kaygısı', text: 'Yarın yeni hafta başlıyor diye içini bir sıkıntı bastı.',
      options: [opt('Yarını planla', { points: 10, stress: 5 }), opt('Şimdiyi yaşa', { stress: -10 })] },
  ];

  // Nadir olaylar: düşük ihtimalle çıkar
  const RARE = [
    { id: 'piyango', rare: true, icon: '🍀', title: 'Piyango tuttu!', text: 'Aldığın küçük biletten ikramiye çıktı!',
      options: [opt('Herkese tatlı ısmarla', { stress: -20, points: 20 }), opt('Sessizce biriktir', { points: 40 })] },
    { id: 'ufo', rare: true, icon: '🛸', title: 'Tuhaf bir ışık', text: 'Gökyüzünde açıklayamadığın bir ışık süzülüyor...',
      options: [opt('Fotoğrafını çek', { points: 15, stress: -5 }), opt('Gözlerini ovuştur', { energy: 5 })] },
    { id: 'unlu', rare: true, icon: '🌟', title: 'Ünlü biriyle karşılaştın!', text: 'Sevdiğin bir ünlü tam yanından geçiyor.',
      options: [opt('Fotoğraf iste', { stress: -15, points: 15 }), opt('Rahatsız etme', { stress: -5 })] },
    { id: 'gokkusagi', rare: true, icon: '🌈', title: 'Çift gökkuşağı!', text: 'Gökyüzünde iki gökkuşağı birden belirdi.',
      options: [opt('Durup izle', { stress: -20, energy: 10 }), opt('Fotoğrafını çek', { points: 10 })] },
    { id: 'zaman', rare: true, icon: '⌛', title: 'Bir saat kazandın!', text: 'Saatinin bir saat ileride olduğunu fark ettin.',
      options: [opt('Dinlen', { energy: 20, stress: -10 }), opt('Değerlendir', { nextMult: 1.5 })] },
    { id: 'kopek', rare: true, icon: '🐕', title: 'Kayıp köpek', text: 'Tasmalı, sevimli ama kaybolmuş bir köpek buldun.',
      options: [opt('Sahibine ulaştır', { energy: -10, points: 30, stress: -10 }), opt('Barınağı ara', { points: 10 })] },
  ];

  OG.EVENTS = [...GENERAL, ...CHARACTER, ...DAY, ...RARE];
  OG.EVENT_MAP = Object.fromEntries(OG.EVENTS.map((e) => [e.id, e]));
})(typeof window !== 'undefined' ? window : globalThis);
