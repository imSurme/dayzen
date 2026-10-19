// Ekranlar: ana menü, nasıl oynanır, karakter & yetenek seçimi, koleksiyon, gün tanıtımı, olay penceresi, hafta karnesi.
(function (root) {
  'use strict';
  const OG = root.OG;
  const $ = (s) => document.querySelector(s);
  const scr = (OG.screens = {});
  const camp = () => OG.campaign;
  const signed = (v) => (v > 0 ? `+${v}` : `${v}`);

  scr.show = function (html, cls = '') {
    const card = $('#screenCard');
    card.className = `screen-card ${cls}`;
    card.innerHTML = html;
    $('#screen').classList.remove('hidden');
    card.scrollTop = 0;
    return card;
  };
  scr.hide = () => $('#screen').classList.add('hidden');
  const on = (card, sel, fn) => card.querySelectorAll(sel).forEach((el) => el.addEventListener('click', () => fn(el)));

  const SHORT = OG.SCENARIOS.map((s) => s.short);
  function daysLabel(days) {
    if (days.length === 5 && days.every((d, i) => d === i)) return 'hafta içi';
    if (days.length === 6 && days.every((d, i) => d === i)) return 'Pzt–Cmt';
    return days.map((d) => SHORT[d]).join(', ');
  }

  // ---------- Giriş sayfası (ana menü) ----------
  scr.hideTitle = () => $('#title').classList.add('hidden');
  scr.menu = function () {
    const p = camp().profile;
    const w = camp().week;
    const badgeCount = Object.keys(p.badges).length;
    scr.hide();
    // Tepedeki karakterler: açılmamış olanlar kilitli
    $('#titleCrowd').innerHTML = OG.CHARACTERS.map((ch, i) => {
      const owned = p.chars.includes(ch.id);
      return `<span class="ts-char ${owned ? '' : 'locked'}" style="--i:${i}" title="${ch.name}${owned ? '' : ' (kilitli)'}">${ch.icon}</span>`;
    }).join('');
    const ch = w && OG.CHAR_MAP[w.charId];
    const play = w
      ? `<button class="btn primary big ts-play" data-act="continue">▶ Devam Et<small>${ch.icon} ${ch.name} · ${OG.SCENARIOS[w.day].day} · ${'❤️'.repeat(w.hearts)}</small></button>`
      : `<button class="btn primary big ts-play" data-act="new">▶ Oyna<small>${p.weeksDone ? 'Yeni bir hafta başlat' : 'İlk haftana başla'}</small></button>`;
    const content = $('#titleContent');
    content.innerHTML = `
      ${langSwitch('ts-lang')}
      <div class="ts-logo">${OG.LOGO_SVG}</div>
      <h1 class="ts-title" data-i18n-skip>Day<b>zen</b></h1>
      <p class="ts-tagline">Planla, dengele, haftayı kurtar!</p>
      <div class="ts-buttons">
        ${play}
        ${w ? '<button class="btn ts-new" data-act="new">🆕 Yeni Hafta</button>' : ''}
        <div class="ts-row">
          <button class="btn" data-act="collection">🎒 Koleksiyon</button>
          <button class="btn" data-act="howto">❓ Nasıl Oynanır</button>
          <button class="btn" data-act="settings" aria-label="Ayarlar">⚙️</button>
        </div>
      </div>
      <div class="ts-stats">
        <span title="Yıldızların">🌟 <b>${p.stars}</b></span>
        <span title="Rozetler">🏅 <b>${badgeCount}/${OG.BADGES.length}</b></span>
        <span title="Kurtarılan hafta">🦸 <b>${p.weeksSaved || 0}</b></span>
        <span title="En iyi hafta puanı">🏆 <b>${p.bestWeek || '–'}</b></span>
      </div>
      <p class="ts-foot">10 karakter · 7 gün · 78 sürpriz olay</p>`;
    $('#title').classList.remove('hidden');

    on(content, '[data-act="continue"]', () => { scr.hideTitle(); OG.ui.fitTimeline(); });
    on(content, '[data-act="new"]', (b) => {
      if (camp().week && !b.dataset.confirm) {
        b.dataset.confirm = '1';
        b.classList.add('danger');
        b.textContent = '⚠️ Mevcut hafta silinecek. Emin misin?';
        return;
      }
      scr.charSelect();
    });
    on(content, '[data-act="collection"]', () => scr.collection('chars'));
    on(content, '[data-act="howto"]', () => scr.howTo());
    on(content, '[data-act="settings"]', () => scr.settings('menu'));
    bindLang(content);
  };

  // Dil seçici (TR | EN): seçilince sayfa o dilde yeniden yüklenir
  function langSwitch(cls) {
    return `<div class="seg lang-seg ${cls}" role="group" aria-label="Dil / Language" data-i18n-skip>
      ${[['tr', 'Türkçe'], ['en', 'English']].map(([id, n]) => `<button data-lang="${id}" class="${OG.lang === id ? 'active' : ''}" lang="${id}">${n}</button>`).join('')}
    </div>`;
  }
  function bindLang(card) {
    on(card, '[data-lang]', (b) => OG.setLang(b.dataset.lang));
  }

  // ---------- Nasıl oynanır ----------
  scr.howTo = function () {
    const card = scr.show(`
      <div class="howto">
        <h2 class="screen-title">Nasıl Oynanır?</h2>
        <div class="intro-steps four">
          <div class="istep"><span class="istep-icon">🎯</span><b>1. Görevini öğren</b><span>Her karakterin bir haftalık ana görevi var. Süresi dolmadan bitir!</span></div>
          <div class="istep"><span class="istep-icon">🃏</span><b>2. Günü planla</b><span>Elindeki kartların hepsi sığmaz: neyi yapıp neyi erteleyeceğini seç.</span></div>
          <div class="istep"><span class="istep-icon">⚖️</span><b>3. Dengeyi koru</b><span>İş, sağlık, sosyal ve ev her gece azalır. Biri sıfırlanırsa kriz!</span></div>
          <div class="istep"><span class="istep-icon">❤️</span><b>4. Haftayı kurtar</b><span>Krizler, kaçan işler ve görev kaybı can götürür. Can biterse hafta biter.</span></div>
        </div>
        <div class="intro-res">
          <span><b>📌 Yapılacaklar</b> son saatinden önce bitmeli</span>
          <span><b>🔒 Ön koşul</b> enerji/stres yetmezse kart yapılamaz</span>
          <span><b>⏪ Geri sarma</b> haftada sınırlı</span>
          <span><b>🔁</b> Enerji ve stres ertesi güne geçer</span>
        </div>
        <p class="intro-more">Detaylı kurallar için oyunda <b>📖</b> butonuna bakabilirsin.</p>
        <button class="btn primary big" data-act="back">Anladım 👍</button>
      </div>`, 'mid');
    on(card, '[data-act="back"]', () => scr.menu());
  };

  // ---------- Karakter seçimi ----------
  function charCard(ch, mode) {
    const p = camp().profile;
    const owned = p.chars.includes(ch.id);
    const fixed = ch.fixed.map((f) => {
      const t = OG.TASK_MAP[f.taskId];
      return `${t.icon} ${t.name} · ${OG.fmtSlot(f.slot)} <small>(${daysLabel(f.days)})</small>`;
    }).join('<br>');
    const special = ch.cards.map((id) => `${OG.TASK_MAP[id].icon} ${OG.TASK_MAP[id].name}`).join(' · ');
    const done = p.charsDone.includes(ch.id);
    let action;
    if (owned) action = mode === 'pick' ? `<button class="btn primary small" data-pick="${ch.id}">Seç ▶</button>` : '<span class="owned">✔ Açık</span>';
    else action = `<button class="btn small" data-buy="${ch.id}" ${p.stars < ch.cost ? 'disabled' : ''}>🔓 ${ch.cost} 🌟 ile aç</button>`;
    return `
      <div class="char-card ${owned ? '' : 'locked'}">
        <div class="char-top">
          <span class="char-icon">${ch.icon}</span>
          <div><b class="char-name">${ch.name}${done ? ' <span class="done-mark" title="Bu karakterle hafta bitirdin">🏁</span>' : ''}</b><div class="char-desc">${ch.desc}</div></div>
        </div>
        <div class="char-stats"><span>⚡ ${ch.energy}</span><span>😰 ${ch.stress}</span></div>
        <div class="char-trait"><b>✨ ${ch.trait.name}</b> ${ch.trait.desc}</div>
        <div class="char-line"><b>🔒 Sabit program</b><span>${fixed}</span></div>
        <div class="char-line"><b>🃏 Özel kartlar</b><span>${special}</span></div>
        <div class="char-mission">${OG.MISSIONS[ch.id].icon} <b>${OG.MISSIONS[ch.id].name}</b><span>${OG.MISSIONS[ch.id].desc}</span></div>
        <div class="char-action">${action}</div>
      </div>`;
  }

  function bindBuy(card, type, rerender) {
    on(card, '[data-buy]', (b) => {
      const res = camp().buy(type, b.dataset.buy);
      if (!res.ok) { OG.sfx('error'); OG.ui.toast(res.reason, 'bad'); return; }
      OG.sfx('unlock');
      OG.ui.toast('🔓 Kilit açıldı!');
      OG.ui.updateWallet();
      rerender();
    });
  }

  scr.charSelect = function () {
    const p = camp().profile;
    const card = scr.show(`
      <div class="screen-head">
        <button class="btn small" data-act="back">← Geri</button>
        <h2>Karakterini Seç</h2>
        <span class="pill">🌟 ${p.stars}</span>
      </div>
      <div class="char-grid">${OG.CHARACTERS.map((ch) => charCard(ch, 'pick')).join('')}</div>`, 'wide');
    on(card, '[data-act="back"]', () => scr.menu());
    on(card, '[data-pick]', (b) => scr.perkSelect(b.dataset.pick));
    bindBuy(card, 'char', scr.charSelect);
  };

  // ---------- Yetenek seçimi ----------
  function perkCard(pk, mode) {
    const p = camp().profile;
    const owned = p.perks.includes(pk.id);
    let action;
    if (owned) action = mode === 'pick' ? `<button class="btn primary small" data-perk="${pk.id}">Bunu al</button>` : '<span class="owned">✔ Açık</span>';
    else action = `<button class="btn small" data-buy="${pk.id}" ${p.stars < pk.cost ? 'disabled' : ''}>🔓 ${pk.cost} 🌟</button>`;
    return `<div class="perk-card ${owned ? '' : 'locked'}"><span class="perk-icon">${pk.icon}</span><div class="perk-text"><b>${pk.name}</b><span>${pk.desc}</span></div>${action}</div>`;
  }

  scr.perkSelect = function (charId) {
    const diff = OG.DIFFICULTIES[OG.prefs.difficulty] ? OG.prefs.difficulty : 'normal';
    const p = camp().profile;
    const ch = OG.CHAR_MAP[charId];
    const card = scr.show(`
      <div class="screen-head">
        <button class="btn small" data-act="back">← Geri</button>
        <h2>Haftalık Yetenek</h2>
        <span class="pill">🌟 ${p.stars}</span>
      </div>
      <h3 class="sub-title">Zorluk</h3>
      <div class="diff-list">${Object.values(OG.DIFFICULTIES).map((d) => `
        <button class="diff-card ${d.id === diff ? 'active' : ''}" data-diff="${d.id}">
          <span class="diff-icon">${d.icon}</span><b>${d.name}</b><small>${d.desc}</small>
        </button>`).join('')}</div>
      <h3 class="sub-title">Yetenek</h3>
      <p class="screen-sub">${ch.icon} <b>${ch.name}</b> bu hafta hangi yeteneği yanına alsın?</p>
      <div class="perk-list">${OG.PERKS.map((pk) => perkCard(pk, 'pick')).join('')}</div>`, 'mid');
    on(card, '[data-diff]', (b) => {
      OG.prefs.difficulty = b.dataset.diff;
      OG.savePrefs();
      card.querySelectorAll('[data-diff]').forEach((x) => x.classList.toggle('active', x === b));
    });
    on(card, '[data-act="back"]', () => scr.charSelect());
    on(card, '[data-perk]', (b) => {
      camp().startWeek(charId, b.dataset.perk, OG.DIFFICULTIES[OG.prefs.difficulty] ? OG.prefs.difficulty : 'normal');
      scr.hide();
      scr.hideTitle();
      OG.ui.loadDay();
      scr.dayIntro();
    });
    bindBuy(card, 'perk', () => scr.perkSelect(charId));
  };

  // ---------- Koleksiyon ----------
  scr.collection = function (tab = 'chars') {
    const p = camp().profile;
    const tabs = [['chars', 'Karakterler'], ['cards', 'Kartlar'], ['perks', 'Yetenekler'], ['events', 'Olaylar'], ['badges', 'Rozetler']];
    let content = '';
    if (tab === 'chars') content = `<div class="char-grid">${OG.CHARACTERS.map((ch) => charCard(ch, 'view')).join('')}</div>`;
    if (tab === 'perks') content = `<div class="perk-list">${OG.PERKS.map((pk) => perkCard(pk, 'view')).join('')}</div>`;
    if (tab === 'cards') {
      content = `<p class="screen-sub">Açtığın kartlar her karakterin destesine eklenir.</p><div class="shop-grid">${OG.TASKS.filter((t) => t.kind === 'unlock').map((t) => {
        const owned = p.cards.includes(t.id);
        return `<div class="shop-item ${owned ? '' : 'locked'}">
          <div class="card" style="--cat:${OG.CATEGORIES[t.cat].color}">${OG.ui.cardHTML(t, t.max)}</div>
          ${owned ? '<span class="owned">✔ Destende</span>' : `<button class="btn small" data-buy="${t.id}" ${p.stars < t.cost ? 'disabled' : ''}>🔓 ${t.cost} 🌟</button>`}
        </div>`;
      }).join('')}</div>`;
    }
    if (tab === 'events') {
      const seen = new Set(p.seenEvents);
      const item = (e, hint) => (seen.has(e.id)
        ? `<div class="ev-item seen ${e.rare ? 'rare' : ''}" title="${e.text}"><span class="ev-icon">${e.icon}</span><b>${e.title}</b></div>`
        : `<div class="ev-item"><span class="ev-icon">❓</span><b>???</b>${hint ? `<small>${hint}</small>` : ''}</div>`);
      const groups = [
        ['Genel olaylar', OG.EVENTS.filter((e) => !e.chars && !e.days && !e.rare), () => ''],
        ['Karakter olayları', OG.EVENTS.filter((e) => e.chars), (e) => `${OG.CHAR_MAP[e.chars[0]].icon} ${OG.CHAR_MAP[e.chars[0]].name}`],
        ['Gün olayları', OG.EVENTS.filter((e) => e.days), (e) => `${OG.SCENARIOS[e.days[0]].icon} ${OG.SCENARIOS[e.days[0]].day}`],
        ['Nadir olaylar', OG.EVENTS.filter((e) => e.rare), () => 'Çok nadir'],
      ];
      const found = OG.EVENTS.filter((e) => seen.has(e.id)).length;
      content = `<p class="screen-sub">Keşfedilen olaylar: <b>${found}/${OG.EVENTS.length}</b>. Bir olayla karşılaşıp seçim yapınca buraya eklenir.</p>
        ${groups.map(([title, list, hint]) => `<h3 class="ev-group">${title} <small>${list.filter((e) => seen.has(e.id)).length}/${list.length}</small></h3>
        <div class="ev-grid">${list.map((e) => item(e, hint(e))).join('')}</div>`).join('')}`;
    }
    if (tab === 'badges') {
      content = `<div class="badge-grid">${OG.BADGES.map((b) => `
        <div class="badge-item ${p.badges[b.id] ? 'earned' : ''}">
          <span class="badge-icon">${p.badges[b.id] ? b.icon : '🔒'}</span>
          <b>${b.name}</b><span>${b.desc}</span>
        </div>`).join('')}</div>`;
    }
    const card = scr.show(`
      <div class="screen-head">
        <button class="btn small" data-act="back">← Menü</button>
        <h2>Koleksiyon</h2>
        <span class="pill">🌟 ${p.stars}</span>
      </div>
      <div class="tabs">${tabs.map(([id, name]) => `<button class="tab ${id === tab ? 'active' : ''}" data-tab="${id}">${name}</button>`).join('')}</div>
      ${content}`, 'wide');
    on(card, '[data-act="back"]', () => scr.menu());
    on(card, '[data-tab]', (b) => scr.collection(b.dataset.tab));
    bindBuy(card, tab === 'chars' ? 'char' : tab === 'perks' ? 'perk' : 'card', () => scr.collection(tab));
  };

  // ---------- Gün tanıtımı ----------
  scr.dayIntro = function () {
    const w = camp().week;
    const cur = w.current;
    const sc = OG.SCENARIOS[w.day];
    const ch = OG.CHAR_MAP[w.charId];
    const pk = OG.PERK_MAP[w.perkId];
    const dots = OG.SCENARIOS.map((s, i) => {
      const d = w.days[i];
      const cls = i < w.day ? 'done' : i === w.day ? 'now' : '';
      return `<div class="dday ${cls}"><b>${s.short}</b><span>${d ? '★'.repeat(d.stars) + '☆'.repeat(3 - d.stars) : s.icon}</span></div>`;
    }).join('');
    const fixed = cur.fixed.map((f) => {
      const t = OG.TASK_MAP[f.taskId];
      return `<li>${t.icon} <b>${OG.fmtSlot(f.slot)}–${OG.fmtSlot(f.slot + t.dur)}</b> ${t.name}</li>`;
    }).join('');
    const goals = camp().goals().map((g) => `<li>${g.icon} ${g.text}</li>`).join('');
    const carry = w.day === 0 ? `${ch.name} haftaya böyle başlıyor` : 'Dünden devreden durumun';
    const ms = camp().mission();
    const chores = cur.chores.map((c) => `<li>📌 ${OG.TASK_MAP[c.taskId].icon} ${OG.TASK_MAP[c.taskId].name} · <b>${OG.until(c.deadline)}</b></li>`).join('');
    const low = (cur.low || []).map((l) => `<li class="warn-line">⚠️ ${l.text}</li>`).join('');
    const card = scr.show(`
      <div class="day-intro">
        <div class="week-dots">${dots}</div>
        <div class="di-icon">${sc.icon}</div>
        <div class="di-day">${sc.day} · ${OG.t(`${w.day + 1}. gün`, `Day ${w.day + 1}`)}</div>
        <h2 class="di-title">${sc.name}</h2>
        <p class="di-desc">${sc.desc}</p>
        <div class="di-start">
          <span class="di-stat energy">⚡ <b>${cur.startEnergy}</b></span>
          <span class="di-stat stress">😰 <b>${cur.startStress}</b></span>
          <small>${carry}</small>
        </div>
        <div class="di-mission">
          <span class="ms-icon">${ms.icon}</span>
          <div><b>${ms.name}</b> · ${ms.desc}<br><small>${w.mission.status === 'done' ? '✅ Tamamlandı' : w.mission.status === 'failed' ? '❌ Süresi doldu' : `${w.mission.progress}/${ms.goal} ${ms.unit} · ${OG.byDay(ms.deadline)}`}</small></div>
          <span class="di-hearts" title="Canların">${'❤️'.repeat(w.hearts)}${'🖤'.repeat(Math.max(0, w.maxHearts - w.hearts))}</span>
        </div>
        ${low ? `<ul class="di-list di-low">${low}</ul>` : ''}
        <div class="di-cols">
          <div class="res-box"><h3>Hedefler</h3><ul class="di-list">${goals}${chores}</ul></div>
          <div class="res-box"><h3>Sabit Program</h3><ul class="di-list">${fixed || '<li>Bugün sabit programın yok, gün tamamen senin!</li>'}</ul></div>
        </div>
        <p class="di-perk">${ch.icon} ${ch.name} · ${pk.icon} ${pk.name}</p>
        <button class="btn primary big" data-act="go">Planlamaya Başla ✏️</button>
      </div>`, 'mid');
    on(card, '[data-act="go"]', () => {
      scr.hide();
      if (!camp().profile.tutorialDone && OG.tutorial) OG.tutorial.start();
    });
  };

  // ---------- Sürpriz olay ----------
  function fxChips(fx) {
    const out = [];
    if (fx.energy) out.push(`<span class="st ${fx.energy > 0 ? 'pos' : 'neg'}">⚡${signed(fx.energy)}</span>`);
    if (fx.stress) out.push(`<span class="st ${fx.stress < 0 ? 'pos' : 'neg'}">😰${signed(fx.stress)}</span>`);
    if (fx.points) out.push(`<span class="st ${fx.points > 0 ? 'pts' : 'neg'}">⭐${signed(fx.points)}</span>`);
    if (fx.nextMult) out.push(`<span class="st ${fx.nextMult > 1 ? 'pos' : 'neg'}">Sonraki görev ×${fx.nextMult}</span>`);
    if (fx.cancelNext) out.push('<span class="st neg">Sonraki görev iptal</span>');
    return out.length ? out.join('') : '<span class="st">Etkisi yok</span>';
  }

  function eventTag(def) {
    if (def.chars) {
      const ch = OG.CHAR_MAP[def.chars[0]];
      return `<div class="event-tag">${ch.icon} ${ch.name} olayı</div>`;
    }
    if (def.days) {
      const sc = OG.SCENARIOS[def.days[0]];
      return `<div class="event-tag">${sc.icon} ${sc.day} olayı</div>`;
    }
    return '';
  }

  scr.askEvent = function (step) {
    return new Promise((resolve) => {
      const def = OG.EVENT_MAP[step.eventId];
      const card = scr.show(`
        <div class="event-pop ${def.rare ? 'rare' : ''}">
          <div class="event-time">⏰ ${OG.fmtSlot(step.slot)} · ${def.rare ? '✨ Nadir olay!' : 'Sürpriz!'}</div>
          ${eventTag(def)}
          <div class="event-icon">${def.icon}</div>
          <h2>${def.title}</h2>
          <p>${def.text}</p>
          <div class="event-options">
            ${def.options.map((o, i) => `<button class="event-opt" data-opt="${i}"><b>${o.label}</b><span class="fx">${fxChips(o.fx)}</span></button>`).join('')}
          </div>
        </div>`, 'event');
      OG.sfx(def.rare ? 'rare' : 'event');
      on(card, '[data-opt]', (b) => {
        scr.hide();
        resolve(Number(b.dataset.opt));
      });
    });
  };

  // ---------- Ayarlar ----------
  scr.settings = function (from = 'board') {
    const P = OG.prefs;
    const row = (key, icon, name, desc) => `
      <label class="set-row">
        <span class="set-icon">${icon}</span>
        <span class="set-text"><b>${name}</b><small>${desc}</small></span>
        <input type="checkbox" data-pref="${key}" ${P[key] ? 'checked' : ''}>
        <span class="switch" aria-hidden="true"></span>
      </label>`;
    const card = scr.show(`
      <div class="screen-head">
        <button class="btn small" data-act="back">← Geri</button>
        <h2>Ayarlar</h2>
        <span class="head-spacer"></span>
      </div>
      <div class="set-list">
        ${row('sfx', '🔊', 'Ses efektleri', 'Kart, puan, olay ve yıldız sesleri')}
        ${row('music', '🎵', 'Müzik', 'Hafif, sakin bir arka plan müziği')}
        ${row('forecast', '🔮', 'Planlama tahmini', 'Plan yaparken tahmini puanı, enerjiyi ve stresi gösterir')}
        <div class="set-row speed-row">
          <span class="set-icon">🌐</span>
          <span class="set-text" data-i18n-skip><b>Dil / Language</b><small>Türkçe · English</small></span>
          ${langSwitch('')}
        </div>
        <div class="set-row speed-row">
          <span class="set-icon">⏱️</span>
          <span class="set-text"><b>Gün akış hızı</b><small>Simülasyon sırasında “Hız” butonuyla da değiştirebilirsin</small></span>
          <div class="seg" role="group" aria-label="Gün akış hızı">
            ${[[0.5, '🐢 Yavaş'], [1, 'Normal'], [2, 'Hızlı'], [4, '🚀 Çok hızlı']].map(([v, n]) => `<button data-speed="${v}" class="${(P.speed || 1) === v ? 'active' : ''}">${n}</button>`).join('')}
          </div>
        </div>
      </div>
      <div class="set-actions">
        <button class="btn" data-act="tutorial">🎓 Eğitimi tekrar oyna</button>
      </div>`, 'mid');
    card.querySelectorAll('[data-pref]').forEach((inp) => inp.addEventListener('change', () => {
      P[inp.dataset.pref] = inp.checked;
      OG.savePrefs();
      if (inp.dataset.pref === 'music') { if (inp.checked) OG.music.start(); else OG.music.stop(); }
      if (inp.dataset.pref === 'sfx' && inp.checked) OG.sfx('place');
      if (inp.dataset.pref === 'forecast') OG.ui.render();
    }));
    bindLang(card);
    on(card, '[data-speed]', (b) => {
      P.speed = Number(b.dataset.speed);
      OG.savePrefs();
      card.querySelectorAll('[data-speed]').forEach((x) => x.classList.toggle('active', x === b));
    });
    on(card, '[data-act="back"]', () => (from === 'menu' ? scr.menu() : scr.hide()));
    on(card, '[data-act="tutorial"]', () => {
      camp().profile.tutorialDone = false;
      camp().saveProfile();
      if (camp().week) {
        scr.hide();
        OG.tutorial.start();
      } else {
        OG.ui.toast('Eğitim, yeni haftanın ilk gününde başlayacak');
        scr.menu();
      }
    });
  };

  // ---------- Hafta karnesi ----------
  scr.weekResult = function (s) {
    const ch = OG.CHAR_MAP[s.charId];
    const pk = OG.PERK_MAP[s.perkId];
    const max = Math.max(...s.days.map((d) => d.total), 1);
    const bars = s.days.map((d, i) => `
      <div class="wbar">
        <span class="wbar-val">${d.total}</span>
        <div class="wbar-col"><div class="wbar-fill grade-${d.grade}" style="height:${Math.round((d.total / max) * 100)}%"></div></div>
        <span class="wbar-stars">${'★'.repeat(d.stars)}${'☆'.repeat(3 - d.stars)}</span>
        <b>${SHORT[i]}${d.heartLoss ? ' <span class="wbar-loss" title="Can kaybı">💔</span>' : ''}</b>
      </div>`).join('');
    const outcome = s.saved ? 'saved' : s.lost ? 'lost' : 'failed';
    const ms = OG.MISSIONS[s.charId];
    const hearts = `${'❤️'.repeat(s.hearts)}${'🖤'.repeat(Math.max(0, s.maxHearts - s.hearts))}`;
    const lastDay = OG.SCENARIOS[s.days.length - 1].day;
    // Canını hangi gün neyin götürdüğü
    const reasonRows = s.days.map((d, i) => (d.reasons && d.reasons.length
      ? `<li><b>${SHORT[i]}</b><span>${d.reasons.join(' · ')}</span></li>` : '')).join('');
    const allReasons = s.days.flatMap((d) => d.reasons || []).join(' ');
    const advice = [];
    if (/krizi/.test(allReasons)) advice.push('Yaşam dengesindeki “→” tahmini 25’in altına inen alana o gün öncelik ver.');
    if (/Yapılacak/.test(allReasons)) advice.push('Yapılacakları çizelgedeki kırmızı çizgiden önce bitir; ilk kaçırma sadece uyarıdır.');
    if (/Tükenmişlik/.test(allReasons)) advice.push('Stres 100’e yaklaşınca meditasyon, spor ya da boş zaman ekle.');
    if (!s.missionDone) advice.push(`${ms.icon} Görev kartlarını sabah ve dinçken yap: verim düşükse daha az ilerleme sayılır.`);

    let hero;
    if (outcome === 'saved') {
      hero = `
        <div class="medal grade-${s.grade}"><span>${s.grade}</span></div>
        <div class="res-title">🎉 ${ch.icon} ${ch.name} haftayı kurtardı!</div>`;
    } else if (outcome === 'lost') {
      hero = `
        <div class="defeat-icon">💔</div>
        <div class="res-title">Canların tükendi</div>
        <p class="defeat-sub">${ch.icon} ${ch.name}, ${lastDay} günü pes etti. Bu hafta kurtarılamadı.</p>`;
    } else {
      hero = `
        <div class="defeat-icon amber">⌛</div>
        <div class="res-title">Ana görev süresinde bitmedi</div>
        <p class="defeat-sub">Canların yetti ama <b>${ms.name}</b> tamamlanamadı (${s.mission.progress}/${s.missionGoal}).</p>`;
    }
    const ribbon = { saved: '🎉 Hafta Kurtarıldı!', lost: '💀 Hafta Kaybedildi', failed: '⏳ Görev Kaçtı' }[outcome];
    const actions = outcome === 'saved'
      ? `<button class="btn" data-act="collection">🎒 Koleksiyon</button>
         <button class="btn" data-act="menu">🏠 Ana Menü</button>
         <button class="btn primary" data-act="new">🆕 Yeni Hafta</button>`
      : `<button class="btn" data-act="menu">🏠 Ana Menü</button>
         <button class="btn" data-act="new">🎭 Başka karakter</button>
         <button class="btn primary" data-act="again">🔁 ${ch.icon} Tekrar Dene</button>`;

    const card = scr.show(`
      <div class="week-result">
        <div class="result-ribbon">${ribbon}</div>
        <div class="res-hero">
          ${hero}
          <div class="res-score"><span id="weekCount">0</span> haftalık puan</div>
          ${s.newBest ? '<div class="new-best">🏆 Yeni hafta rekoru!</div>' : ''}
          <div class="week-verdict ${outcome}">
            ${ms.icon} ${ms.name}: <b>${s.mission.progress}/${s.missionGoal}</b> ${s.missionDone ? '✅' : '❌'}
            · ${hearts}
            · ${OG.DIFFICULTIES[s.difficulty].icon} ${OG.DIFFICULTIES[s.difficulty].name}
          </div>
          <div class="wallet-gain">🎯 ${s.stars}/21 hedef yıldızı${s.bonus ? ` · +${s.bonus} 🌟 bonus` : ''}</div>
          ${s.badges.length ? `<div class="new-badges">🏅 Yeni rozet: ${s.badges.map(OG.badgeChip).join(' ')}</div>` : ''}
        </div>
        ${outcome !== 'saved' && (reasonRows || advice.length) ? `
          <section class="res-box reasons-box">
            ${reasonRows ? `<h3>Canını götürenler</h3><ul class="reason-list">${reasonRows}</ul>` : ''}
            ${advice.length ? `<h3>Bir dahaki sefere</h3><ul class="advice-list">${advice.map((x) => `<li>${x}</li>`).join('')}</ul>` : ''}
          </section>` : ''}
        <section class="res-box"><h3>Gün Gün</h3><div class="wbars">${bars}</div></section>
        <p class="screen-sub center">${OG.t(`Toplam <b>🌟 ${camp().profile.stars}</b> yıldızın var. Koleksiyondan yeni karakter, kart ve yetenek açabilirsin!`, `You have <b>🌟 ${camp().profile.stars}</b> stars in total. Unlock new characters, cards and perks in the Collection!`)}</p>
        <div class="res-actions">${actions}</div>
      </div>`, `mid result-like wr-${outcome}`);
    OG.countUp(card.querySelector('#weekCount'), s.total, 1500);
    OG.sfx(s.saved ? 'fanfare' : 'sad');
    if (s.saved) setTimeout(OG.confetti, 500);
    // Hafta karnesinden sonraki ekranlar giriş sayfasının üstünde açılır
    on(card, '[data-act="collection"]', () => { scr.menu(); scr.collection('chars'); });
    on(card, '[data-act="menu"]', () => scr.menu());
    on(card, '[data-act="new"]', () => { scr.menu(); scr.charSelect(); });
    on(card, '[data-act="again"]', () => {
      camp().startWeek(s.charId, s.perkId, s.difficulty);
      scr.hide();
      scr.hideTitle();
      OG.ui.loadDay();
      scr.dayIntro();
    });
  };
})(window);
