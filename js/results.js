// Gün sonu ekranı: madalya, hedef yıldızları, puan dökümü, grafik, ertesi sabah, rozetler.
(function (root) {
  'use strict';
  const OG = root.OG;
  const C = OG.CONFIG;

  const starRow = (n) => Array.from({ length: 3 }, (_, i) => `<span class="star ${i < n ? 'on' : ''}">★</span>`).join('');
  OG.starRow = starRow;
  OG.badgeChip = (id) => {
    const b = OG.BADGES.find((x) => x.id === id);
    return `<span class="badge-chip" title="${b.desc}">${b.icon} ${b.name}</span>`;
  };

  function chartSvg(samples, bedSlot) {
    const W = 520, H = 190, L = 32, R = 12, T = 12, B = 26;
    const iw = W - L - R, ih = H - T - B;
    const x = (s) => (L + (s / C.SLOTS) * iw).toFixed(1);
    const y = (v) => (T + (1 - v / 100) * ih).toFixed(1);
    const line = (key) => samples.map((p) => `${x(p.slot)},${y(p[key])}`).join(' ');
    let grid = '';
    if (bedSlot < C.SLOTS) {
      grid += `<rect class="sleep-band" x="${x(bedSlot)}" y="${T}" width="${(x(C.SLOTS) - x(bedSlot)).toFixed(1)}" height="${ih}"/>`;
      grid += `<text x="${((Number(x(bedSlot)) + Number(x(C.SLOTS))) / 2).toFixed(1)}" y="${T + 14}" text-anchor="middle">😴</text>`;
    }
    for (const v of [0, 50, 100]) {
      grid += `<line class="grid" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/>`;
      grid += `<text x="${L - 8}" y="${Number(y(v)) + 4}" text-anchor="end">${v}</text>`;
    }
    for (let s = 0; s <= C.SLOTS; s += 8) {
      grid += `<text x="${x(s)}" y="${H - 6}" text-anchor="middle">${OG.fmtSlot(s)}</text>`;
    }
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Gün boyunca enerji ve stres">
      ${grid}
      <polyline class="ln-energy" points="${line('energy')}"/>
      <polyline class="ln-stress" points="${line('stress')}"/>
    </svg>`;
  }

  OG.countUp = function (el, to, ms) {
    const t0 = performance.now();
    const tick = () => {
      const p = Math.min(1, (performance.now() - t0) / ms);
      el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) setTimeout(tick, 16);
    };
    tick();
  };

  OG.confetti = function () {
    if (root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const cv = document.querySelector('#confetti');
    const ctx = cv.getContext('2d');
    cv.width = innerWidth;
    cv.height = innerHeight;
    cv.classList.add('on');
    const colors = ['#ffc83d', '#6c8cff', '#3ccf8e', '#ff6fb5', '#2ec4f0', '#ff7a3d'];
    const parts = Array.from({ length: 170 }, () => ({
      x: innerWidth / 2 + (Math.random() - 0.5) * 240,
      y: innerHeight * 0.32,
      vx: (Math.random() - 0.5) * 16,
      vy: -Math.random() * 15 - 4,
      r: 6 + Math.random() * 6,
      c: colors[Math.floor(Math.random() * colors.length)],
      rot: Math.random() * 6,
      vr: (Math.random() - 0.5) * 0.35,
    }));
    const t0 = performance.now();
    const tick = () => {
      ctx.clearRect(0, 0, cv.width, cv.height);
      for (const p of parts) {
        p.vy += 0.35;
        p.vx *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2);
        ctx.restore();
      }
      if (performance.now() - t0 < 3200) setTimeout(tick, 16);
      else { ctx.clearRect(0, 0, cv.width, cv.height); cv.classList.remove('on'); }
    };
    tick();
  };

  OG.showDayResult = function (r, ev) {
    const w = OG.campaign.week;
    const sc = OG.SCENARIOS[w.day];
    const bonusRows = r.bonuses
      .map((b) => `<tr class="${b.value > 0 ? 'pos' : 'neg'}"><td>${b.label}</td><td>${b.value > 0 ? '+' : ''}${b.value}</td></tr>`)
      .join('');
    const goals = ev.goals
      .map((g) => `<li class="${g.done ? 'good' : 'bad'}"><span>${g.done ? '★' : '✖'}</span><span>${g.icon} ${g.text}</span></li>`)
      .join('');
    const tips = r.tips.slice(0, 6).map((t) => `<li class="${t.type}"><span>${t.text}</span></li>`).join('');
    const bedText = r.bedSlot === 28 ? '22:00’de yattın: ekstra dinlendin.' : r.bedSlot === 30 ? '23:00’te yattın: biraz ekstra dinlendin.' : 'Gece yarısı yattın: ekstra dinlenme yok.';
    const nextDay = ev.isLast ? null : OG.SCENARIOS[w.day + 1];
    const n = ev.night;
    const m = OG.campaign.mission();

    // Gece raporu: yaşam dengesi
    const meterRows = OG.METERS.map((mt) => {
      const crisis = n.crises.includes(mt.id);
      const after = n.meters[mt.id];
      return `<div class="nr-meter ${crisis ? 'crisis' : after < OG.METER_LOW ? 'warn' : ''}">
        <span>${mt.icon} ${mt.name}</span>
        <span class="nr-delta">+${n.gains[mt.id]} −${n.decay}</span>
        <b>${n.before[mt.id]} → ${crisis ? '💥 KRİZ' : after}</b>
      </div>`;
    }).join('');
    const choreRows = (r.chores || []).map((c) => {
      const t = OG.TASK_MAP[c.taskId];
      return `<li class="${c.done ? 'good' : 'bad'}"><span>${c.done ? '✔' : '✖'}</span><span>${t.icon} ${t.name} · ${OG.until(c.deadline)}</span></li>`;
    }).join('');
    const strikeText = n.choreMiss.length
      ? (n.choreHearts ? `Yapılacak kaçtı: <b>−${n.choreHearts} ❤️</b>` : 'İlk kaçırma bu hafta için <b>uyarı</b>: bir daha kaçarsa can gider!')
      : '';
    let missionText;
    if (n.justDone) missionText = `🎉 <b>Ana görev tamamlandı!</b> +5 🌟`;
    else if (n.justFailed) missionText = `❌ <b>Ana görevin süresi doldu</b> (${n.mission.progress}/${n.missionGoal}) · −2 ❤️`;
    else if (n.mission.status === 'active') missionText = `+${n.missionGain} ${m.unit} → <b>${n.mission.progress}/${n.missionGoal}</b> · ${OG.byDay(m.deadline)}`;
    else missionText = n.mission.status === 'done' ? '✅ Ana görev bu hafta zaten tamam.' : '❌ Ana görev bu hafta kaçtı.';
    const reasons = OG.ui.heartReasons(n);
    const heartsLine = `${'❤️'.repeat(n.hearts)}${'🖤'.repeat(Math.max(0, w.maxHearts - n.hearts))}${n.heartLoss ? ` <span class="nr-loss">−${n.heartLoss}: ${reasons.join(', ')}</span>` : ''}`;

    const body = document.querySelector('#resultBody');
    body.innerHTML = `
      <div class="result-ribbon">${n.weekLost ? '💀 Canın Kalmadı' : `${sc.day} Bitti!`}</div>
      <div class="res-hero compact">
        <div class="medal grade-${r.grade}"><span>${r.grade}</span></div>
        <div class="res-hero-text">
          <div class="star-row">${starRow(ev.stars)}</div>
          <div class="res-title">${r.title}</div>
          <div class="res-score"><span id="countUp">0</span> puan · <b class="wallet-inline">+${ev.stars} 🌟</b></div>
        </div>
      </div>
      ${ev.badges.length ? `<div class="new-badges">🏅 Yeni rozet: ${ev.badges.map(OG.badgeChip).join(' ')}</div>` : ''}
      <div class="res-grid">
        <section class="res-box">
          <h3>Hedefler</h3>
          <ul class="goal-list">${goals}</ul>
        </section>
        <section class="res-box night-box">
          <h3>Gece Raporu</h3>
          <div class="nr-meters">${meterRows}</div>
          <p class="nr-line">${m.icon} ${missionText}</p>
          <p class="nr-line nr-hearts">${heartsLine}</p>
        </section>
      </div>
      ${n.weekLost ? `<div class="lost-banner">💀 <b>Canın kalmadı!</b> Bu hafta kurtarılamadı. ${w.rewinds > 0 ? 'Geri sarıp bu günü yeniden deneyebilirsin.' : ''}</div>` : ''}
      <div class="res-grid">
        ${choreRows ? `<section class="res-box"><h3>Yapılacaklar</h3><ul class="goal-list">${choreRows}</ul>${strikeText ? `<p class="res-muted">${strikeText}</p>` : ''}</section>` : ''}
        <section class="res-box next-box">
          <h3>${nextDay ? `Yarın sabah · ${nextDay.day}` : 'Haftanın sonu'}</h3>
          ${nextDay ? `
            <div class="next-stats"><span class="di-stat energy">⚡ <b>${ev.next.energy}</b></span><span class="di-stat stress">😰 <b>${ev.next.stress}</b></span></div>
            <p class="res-muted">${bedText}</p>
            ${ev.low.map((l) => `<p class="res-muted warn-line">⚠️ ${l.text}</p>`).join('')}
            <p class="next-teaser">${nextDay.icon} <b>${nextDay.name}</b> seni bekliyor.</p>`
          : `<p class="res-muted">${n.weekLost ? 'Hafta burada bitiyor.' : 'Bu günü bitirince haftanın karnesi açılacak!'}</p>`}
        </section>
      </div>
      <details class="res-details">
        <summary>Puan dökümü, grafik ve ipuçları</summary>
        <div class="res-grid">
          <section class="res-box">
            <h3>Puan Dökümü</h3>
            <table class="breakdown">
              <tr><td>Görev ve olay puanları</td><td>${r.taskScore}</td></tr>
              ${bonusRows}
              <tr class="total"><td>Toplam</td><td>${r.total}</td></tr>
            </table>
            <div class="res-stats">
              <span>✔ ${r.stats.completed} görev</span>
              ${r.stats.failed ? `<span>✖ ${r.stats.failed} başarısız</span>` : ''}
              ${r.stats.canceled ? `<span>🚫 ${r.stats.canceled} iptal</span>` : ''}
              <span>🎲 ${r.stats.events} olay</span>
              <span>☁️ ${OG.fmtDur(r.stats.idleSlots)} boş</span>
            </div>
          </section>
          <section class="res-box">
            <h3>Enerji ve Stres</h3>
            ${chartSvg(r.samples, r.bedSlot)}
            <div class="legend"><span><i style="background:#f2a900"></i>Enerji</span><span><i style="background:#ef4868"></i>Stres</span></div>
          </section>
        </div>
        <section class="res-box tips-box">
          <h3>Değerlendirme</h3>
          <ul class="tips">${tips}</ul>
        </section>
      </details>
      <div class="res-actions">
        <button class="btn" id="retryBtn" ${w.rewinds > 0 ? '' : 'disabled'} title="Bu günü baştan oynat (haftada sınırlı)">⏪ Geri Sar (${w.rewinds})</button>
        <button class="btn primary" id="nextBtn">${n.weekLost ? 'Haftayı Bitir 💀' : ev.isLast ? 'Haftayı Bitir 🏁' : 'Sonraki Gün ▶'}</button>
      </div>`;

    body.classList.toggle('day-lost', n.weekLost);
    const modal = document.querySelector('#resultModal');
    modal.classList.remove('hidden');
    body.scrollTop = 0;
    OG.countUp(body.querySelector('#countUp'), r.total, 1300);
    if (ev.stars === 3 || r.grade === 'S') setTimeout(OG.confetti, 500);
    for (let i = 0; i < ev.stars; i++) setTimeout(() => OG.sfx('star', i), 520 + i * 200);
    if (ev.stars === 3) setTimeout(() => OG.sfx('fanfare'), 1200);
    if (ev.stars === 0 || n.heartLoss) setTimeout(() => OG.sfx('sad'), 400);

    body.querySelector('#retryBtn').addEventListener('click', () => {
      if (!OG.campaign.useRewind()) return;
      modal.classList.add('hidden');
      OG.ui.updateWallet();
      OG.ui.endSimulation();
      OG.ui.say(`Geri sardık ⏪ (${OG.campaign.week.rewinds} hak kaldı). Bu sefer daha iyisi!`);
    });
    body.querySelector('#nextBtn').addEventListener('click', () => {
      modal.classList.add('hidden');
      const summary = OG.campaign.commitDay(r, ev);
      OG.ui.endSimulation();
      OG.ui.updateWallet();
      if (summary) {
        OG.screens.weekResult(summary);
      } else {
        OG.ui.loadDay();
      }
    });
  };
})(window);
