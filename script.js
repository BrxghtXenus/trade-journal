(function () {
  'use strict';

  const STORAGE_KEY = 'tradeJournal';
  var calYear, calMonth;
  var _confirmCallback = null;
  var _filterTimer = null;
  var _countUpAnims = [];
  var _chartAnimId = null;

  function getToday() { return new Date(); }

  function getTodayStr() {
    var d = getToday();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function pad(n) { return String(n).padStart(2, '0'); }

  function getDaysInMonth(year, month) { return new Date(year, month + 1, 0).getDate(); }

  function formatCurrency(value) {
    if (value > 0) return '+$' + value.toFixed(2);
    if (value < 0) return '-$' + Math.abs(value).toFixed(2);
    return '$0.00';
  }

  /* ─── TOAST ─── */

  function showToast(message, type) {
    var container = document.getElementById('toast-container');
    if (!container) return;
    var toast = document.createElement('div');
    toast.className = 'toast ' + (type || 'info');
    var icons = {
      success: '<svg viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
      error: '<svg viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
      info: '<svg viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
    };
    var iconEl = document.createElement('span');
    iconEl.className = 'toast-icon';
    iconEl.innerHTML = icons[type] || icons.info;
    var msgEl = document.createElement('span');
    msgEl.className = 'toast-message';
    msgEl.textContent = message;
    var closeEl = document.createElement('button');
    closeEl.className = 'toast-close';
    closeEl.innerHTML = '&times;';
    closeEl.addEventListener('click', function () { removeToast(toast); });
    toast.appendChild(iconEl);
    toast.appendChild(msgEl);
    toast.appendChild(closeEl);
    container.appendChild(toast);
    setTimeout(function () { removeToast(toast); }, 2600);
  }

  function removeToast(toast) {
    if (toast.classList.contains('exiting')) return;
    toast.classList.add('exiting');
    setTimeout(function () { toast.remove(); }, 260);
  }

  /* ─── INPUT SHAKE ─── */

  function shakeInput(el) {
    if (!el) return;
    el.classList.add('error');
    el.focus();
    setTimeout(function () { el.classList.remove('error'); }, 500);
  }

  /* ─── DRAWER ─── */

  function openDrawer() {
    document.getElementById('drawer-overlay').classList.remove('hidden');
    document.getElementById('btn-hamburger').classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    document.getElementById('drawer-overlay').classList.add('hidden');
    document.getElementById('btn-hamburger').classList.remove('active');
    document.body.style.overflow = '';
  }

  /* ─── BOTTOM SHEET ─── */

  function openTradeSheet() {
    document.getElementById('sheet-overlay').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    setTimeout(function () { document.getElementById('pair').focus(); }, 350);
  }

  function closeTradeSheet() {
    document.getElementById('sheet-overlay').classList.add('hidden');
    document.body.style.overflow = '';
  }

  /* ─── MODAL ─── */

  function openModal() {
    document.getElementById('modal-overlay').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    document.getElementById('modal-overlay').classList.add('hidden');
    document.getElementById('modal-body').innerHTML = '';
    document.getElementById('trade-modal').classList.remove('hidden');
    document.getElementById('confirm-modal').classList.add('hidden');
    document.body.style.overflow = '';
    _confirmCallback = null;
  }

  function openTradeModal(trades, dateStr) {
    var body = document.getElementById('modal-body');
    var title = document.getElementById('modal-title');
    var parts = dateStr.split('-');
    var monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    var displayDate = monthNames[parseInt(parts[1], 10) - 1] + ' ' + parseInt(parts[2], 10) + ', ' + parts[0];
    title.textContent = 'Trades';
    body.innerHTML = '<div class="modal-date-label">' + displayDate + '</div>';
    trades.forEach(function (e) {
      var dirLabel = e.direction === 'BUY' ? 'buy' : 'sell';
      var dirText = e.direction === 'BUY' ? 'Long' : 'Short';
      var profitCls = 'zero';
      var profitText = '0%';
      if (e.profit > 0) { profitCls = 'positive'; profitText = '+' + e.profit.toFixed(2) + '%'; }
      else if (e.profit < 0) { profitCls = 'negative'; profitText = e.profit.toFixed(2) + '%'; }
      var div = document.createElement('div');
      div.className = 'modal-trade';
      div.innerHTML =
        '<div class="modal-trade-header">' +
          '<span class="modal-trade-pair">' + e.pair + '</span>' +
          '<span class="modal-trade-direction ' + dirLabel + '">' + dirText + '</span>' +
          '<span class="modal-trade-profit ' + profitCls + '">' + profitText + '</span>' +
        '</div>' +
        '<div class="modal-trade-details">' +
          '<div class="modal-trade-detail"><span class="modal-trade-detail-label">Entry</span><span class="modal-trade-detail-value">' + (e.entry != null ? e.entry.toFixed(2) : '\u2014') + '</span></div>' +
          '<div class="modal-trade-detail"><span class="modal-trade-detail-label">TP</span><span class="modal-trade-detail-value">' + (e.tp != null ? e.tp.toFixed(2) : '\u2014') + '</span></div>' +
          '<div class="modal-trade-detail"><span class="modal-trade-detail-label">SL</span><span class="modal-trade-detail-value">' + (e.sl != null ? e.sl.toFixed(2) : '\u2014') + '</span></div>' +
          '<div class="modal-trade-detail"><span class="modal-trade-detail-label">RR</span><span class="modal-trade-detail-value">' + (e.rr != null ? e.rr.toFixed(2) : '\u2014') + '</span></div>' +
          '<div class="modal-trade-detail"><span class="modal-trade-detail-label">Emotion</span><span class="modal-trade-detail-value">' + (e.emotion || '\u2014') + '</span></div>' +
        '</div>' +
        (e.note ? '<div class="modal-trade-note">' + e.note + '</div>' : '') +
        (e.image ? '<div class="modal-trade-image"><img src="' + e.image + '" alt="screenshot"></div>' : '') +
        '<button class="modal-trade-delete" data-timestamp="' + e.timestamp + '" data-date="' + dateStr + '">Delete</button>';
      body.appendChild(div);
    });
    body.querySelectorAll('.modal-trade-delete').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var ts = parseInt(this.dataset.timestamp);
        var date = this.dataset.date;
        showConfirm('Delete this trade?', function () {
          var j = getJournal();
          if (j[date]) {
            j[date] = j[date].filter(function (x) { return x.timestamp !== ts; });
            if (j[date].length === 0) delete j[date];
            setJournal(j);
            closeModal();
            renderAll();
            showToast('Trade deleted', 'error');
          }
        });
      });
    });
    document.getElementById('confirm-modal').classList.add('hidden');
    document.getElementById('trade-modal').classList.remove('hidden');
    openModal();
  }

  function showConfirm(message, onConfirm) {
    document.getElementById('confirm-message').textContent = message;
    document.getElementById('trade-modal').classList.add('hidden');
    document.getElementById('confirm-modal').classList.remove('hidden');
    _confirmCallback = onConfirm;
    openModal();
  }

  /* ─── DATA ─── */

  function getMonthKey(year, month) { return year + '-' + pad(month + 1); }

  function getJournal() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
    catch (e) { return {}; }
  }

  function setJournal(data) { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }

  function getAllTrades() {
    var journal = getJournal();
    var all = [];
    Object.keys(journal).forEach(function (date) {
      journal[date].forEach(function (entry) {
        all.push({ date: date, entry: entry });
      });
    });
    all.sort(function (a, b) {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return (b.entry.timestamp || 0) - (a.entry.timestamp || 0);
    });
    return all;
  }

  function getMonthData(year, month) {
    var journal = getJournal();
    var prefix = getMonthKey(year, month);
    var daysInMonth = getDaysInMonth(year, month);
    var results = [];
    for (var day = 1; day <= daysInMonth; day++) {
      var dateStr = prefix + '-' + pad(day);
      var trades = journal[dateStr] || [];
      var net = trades.reduce(function (sum, t) { return sum + t.profit; }, 0);
      results.push({ day: day, net: net, hasTrades: trades.length > 0 });
    }
    return results;
  }

  function calculateStats(trades) {
    var total = trades.length;
    var wins = trades.filter(function (t) { return t.profit > 0; }).length;
    var losses = trades.filter(function (t) { return t.profit < 0; }).length;
    var winRate = total > 0 ? (wins / total) * 100 : 0;
    var avgRR = total > 0 ? trades.reduce(function (sum, t) { return sum + t.rr; }, 0) / total : 0;
    var net = trades.reduce(function (sum, t) { return sum + t.profit; }, 0);
    var totalWins = trades.filter(function (t) { return t.profit > 0; }).reduce(function (s, t) { return s + t.profit; }, 0);
    var totalLosses = Math.abs(trades.filter(function (t) { return t.profit < 0; }).reduce(function (s, t) { return s + t.profit; }, 0));
    var profitFactor = totalLosses > 0 ? totalWins / totalLosses : (totalWins > 0 ? Infinity : 0);
    return { total: total, wins: wins, losses: losses, winRate: winRate, avgRR: avgRR, net: net, profitFactor: profitFactor };
  }

  /* ─── COUNT-UP ANIMATION ─── */

  function animateCountUp(el, target, suffix, duration) {
    if (!el) return;
    if (target === Infinity) { el.textContent = '\u221E'; return; }
    duration = duration || 800;
    var startTime = performance.now();
    var startVal = 0;

    function tick(time) {
      var elapsed = time - startTime;
      var progress = Math.min(elapsed / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var current = Math.round(startVal + (target - startVal) * eased);
      el.textContent = current + (suffix || '');
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = target + (suffix || '');
    }

    requestAnimationFrame(tick);
  }

  function animateCountUpFloat(el, target, prefix, suffix, decimals, duration) {
    if (!el) return;
    if (target === Infinity) { el.textContent = '\u221E'; return; }
    duration = duration || 800;
    decimals = decimals || 2;
    prefix = prefix || '';
    suffix = suffix || '';
    var startTime = performance.now();
    var startVal = 0;

    function tick(time) {
      var elapsed = time - startTime;
      var progress = Math.min(elapsed / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var current = startVal + (target - startVal) * eased;
      el.textContent = prefix + current.toFixed(decimals) + suffix;
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = prefix + target.toFixed(decimals) + suffix;
    }

    requestAnimationFrame(tick);
  }

  function animateSummaryCards(stats) {
    var winRateEl = document.getElementById('s-winrate');
    var netProfitEl = document.getElementById('s-netprofit');
    var profitFactorEl = document.getElementById('s-profitfactor');
    var winRateSub = document.getElementById('s-winrate-sub');
    var netProfitSub = document.getElementById('s-netprofit-sub');
    var profitFactorSub = document.getElementById('s-profitfactor-sub');

    // Animate win rate
    if (stats.total > 0) {
      animateCountUpFloat(winRateEl, stats.winRate, '', '%', 1);
    } else {
      winRateEl.textContent = '0%';
    }

    // Animate net profit
    if (stats.total > 0) {
      var net = stats.net;
      var prefix = net >= 0 ? '+$' : '-$';
      animateCountUpFloat(netProfitEl, Math.abs(net), prefix, '', 2);
    } else {
      netProfitEl.textContent = '$0.00';
    }

    // Animate profit factor
    if (stats.total > 0) {
      var pf = stats.profitFactor === Infinity ? '\u221E' : stats.profitFactor;
      if (pf === '\u221E') { profitFactorEl.textContent = '\u221E'; }
      else { animateCountUpFloat(profitFactorEl, pf, '', '', 2); }
    } else {
      profitFactorEl.textContent = '0.00';
    }

    winRateSub.textContent = stats.total + ' total trades';
    var netText = stats.net > 0 ? 'Profitable' : (stats.net < 0 ? 'Unprofitable' : 'Breakeven');
    netProfitSub.textContent = netText;
    var pfDesc = stats.profitFactor > 1.5 ? 'Healthy' : (stats.profitFactor > 0 ? 'Low' : 'N/A');
    profitFactorSub.textContent = pfDesc;
  }

  /* ─── EQUITY CURVE CHART WITH DRAW ANIMATION ─── */

  function renderEquityChart() {
    var canvas = document.getElementById('equity-canvas');
    if (!canvas) return;
    var journal = getJournal();
    var allDates = Object.keys(journal).sort();
    if (allDates.length === 0) { drawEmptyChart(canvas); return; }

    var data = [];
    var cum = 0;
    allDates.forEach(function (date) {
      journal[date].forEach(function (t) {
        cum += t.profit;
        data.push({ date: date, value: cum });
      });
    });
    if (data.length < 2) { drawEmptyChart(canvas); return; }

    var ctx = canvas.getContext('2d');
    var dpr = window.devicePixelRatio || 1;
    var rect = canvas.parentElement.getBoundingClientRect();
    var w = rect.width;
    var h = 220;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.scale(dpr, dpr);

    var padX = 40, padY = 20;
    var chartW = w - padX * 2 - 10;
    var chartH = h - padY * 2;
    var values = data.map(function (d) { return d.value; });
    var minVal = Math.min(0, Math.min.apply(null, values));
    var maxVal = Math.max(0, Math.max.apply(null, values));
    var range = maxVal - minVal || 1;

    // Cancel previous animation
    if (_chartAnimId) { cancelAnimationFrame(_chartAnimId); _chartAnimId = null; }

    function drawGrid() {
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = '#F0F0F0';
      ctx.lineWidth = 1;
      for (var i = 0; i <= 4; i++) {
        var y = padY + (chartH / 4) * i;
        ctx.beginPath();
        ctx.moveTo(padX + 5, y);
        ctx.lineTo(w - padX, y);
        ctx.stroke();
        var val = maxVal - (range / 4) * i;
        ctx.fillStyle = '#9CA3AF';
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(val.toFixed(1) + '%', padX, y + 4);
      }
    }

    drawGrid();
    var stepX = chartW / (data.length - 1);
    var duration = 1000;
    var startTime = performance.now();

    function animateLine(time) {
      var elapsed = time - startTime;
      var progress = Math.min(elapsed / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var visibleCount = Math.max(2, Math.round(eased * data.length));

      drawGrid();

      // Draw line up to visibleCount
      ctx.beginPath();
      ctx.strokeStyle = '#3B82F6';
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      for (var i = 0; i < visibleCount; i++) {
        var x = padX + 10 + stepX * i;
        var y = padY + chartH - ((data[i].value - minVal) / range) * chartH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Gradient fill
      if (visibleCount > 0) {
        var lastIdx = visibleCount - 1;
        var lx = padX + 10 + stepX * lastIdx;
        var ly = padY + chartH - ((data[lastIdx].value - minVal) / range) * chartH;
        ctx.lineTo(lx, padY + chartH);
        ctx.lineTo(padX + 10, padY + chartH);
        ctx.closePath();
        var grad = ctx.createLinearGradient(0, padY, 0, padY + chartH);
        grad.addColorStop(0, 'rgba(59, 130, 246, 0.08)');
        grad.addColorStop(1, 'rgba(59, 130, 246, 0.01)');
        ctx.fillStyle = grad;
        ctx.fill();
      }

      if (progress < 1) { _chartAnimId = requestAnimationFrame(animateLine); }
      else { _chartAnimId = null; }
    }

    _chartAnimId = requestAnimationFrame(animateLine);
  }

  function drawEmptyChart(canvas) {
    var ctx = canvas.getContext('2d');
    var dpr = window.devicePixelRatio || 1;
    var rect = canvas.parentElement.getBoundingClientRect();
    var w = Math.max(rect.width, 100);
    var h = 220;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#9CA3AF';
    ctx.font = '14px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    var text = 'Add trades to see your equity curve';
    var maxW = w - 32;
    if (ctx.measureText(text).width <= maxW) {
      ctx.fillText(text, w / 2, h / 2);
    } else {
      var words = text.split(' ');
      var lines = [];
      var cur = '';
      for (var i = 0; i < words.length; i++) {
        var test = cur ? cur + ' ' + words[i] : words[i];
        if (ctx.measureText(test).width <= maxW) { cur = test; }
        else { if (cur) lines.push(cur); cur = words[i]; }
      }
      if (cur) lines.push(cur);
      var lineH = 20;
      var startY = h / 2 - ((lines.length - 1) * lineH) / 2;
      for (var j = 0; j < lines.length; j++) {
        ctx.fillText(lines[j], w / 2, startY + j * lineH);
      }
    }
  }

  /* ─── WIN RATE CHART ─── */

  function renderWinRateChart() {
    var canvas = document.getElementById('equity-canvas');
    if (!canvas) return;
    var allTrades = getAllTrades();
    var allEntries = allTrades.map(function (i) { return i.entry; });
    var stats = calculateStats(allEntries);
    var ctx = canvas.getContext('2d');
    var dpr = window.devicePixelRatio || 1;
    var rect = canvas.parentElement.getBoundingClientRect();
    var w = rect.width;
    var h = 220;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    if (stats.total === 0) {
      ctx.fillStyle = '#9CA3AF';
      ctx.font = '14px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No trades yet', w / 2, h / 2);
      return;
    }

    var wr = stats.winRate;
    var cx = w / 2, cy = h / 2;

    // Progress bar background
    var barW = Math.min(w - 80, 300), barH = 16, barX = (w - barW) / 2, barY = cy + 10;
    ctx.fillStyle = '#F0F0F0';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW, barH, 8);
    ctx.fill();

    // Progress bar fill
    var fillW = Math.max(barW * (wr / 100), barH);
    ctx.fillStyle = wr > 50 ? '#10B981' : (wr > 25 ? '#3B82F6' : '#EF4444');
    ctx.beginPath();
    ctx.roundRect(barX, barY, fillW, barH, 8);
    ctx.fill();

    // Win rate number
    ctx.fillStyle = '#1A1A2E';
    ctx.font = 'bold 48px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(wr.toFixed(1) + '%', cx, cy - 24);

    // Wins / Losses
    ctx.fillStyle = '#6B7280';
    ctx.font = '14px Inter, sans-serif';
    ctx.textBaseline = 'top';
    var totalW = barX + fillW + 12;
    ctx.fillText('Wins: ' + stats.wins + '  Losses: ' + stats.losses, cx, barY + barH + 14);
  }

  /* ─── DONUT CHART ─── */

  function renderDonut(stats) {
    var canvas = document.getElementById('donut-canvas');
    if (!canvas) return;
    animateDonut(canvas, stats.winRate, stats.wins, stats.losses);
  }

  function animateDonut(canvas, targetWinRate, wins, losses) {
    var ctx = canvas.getContext('2d');
    var dpr = window.devicePixelRatio || 1;
    var size = 160;
    var radius = 56;
    var thickness = 14;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    ctx.scale(dpr, dpr);
    var targetAngle = (targetWinRate / 100) * Math.PI * 2;
    var duration = 700;
    var startTime = performance.now();

    function draw(angle) {
      var cx = size / 2, cy = size / 2;
      ctx.clearRect(0, 0, size, size);

      // Background ring
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.strokeStyle = '#E5E7EB';
      ctx.lineWidth = thickness;
      ctx.stroke();

      // Loss segment
      ctx.beginPath();
      ctx.arc(cx, cy, radius, -Math.PI / 2 + angle, -Math.PI / 2 + Math.PI * 2);
      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = thickness;
      ctx.stroke();

      // Win segment
      ctx.beginPath();
      ctx.arc(cx, cy, radius, -Math.PI / 2, -Math.PI / 2 + angle);
      ctx.strokeStyle = '#3B82F6';
      ctx.lineWidth = thickness;
      ctx.stroke();

      // Center text
      var pct = Math.round((angle / (Math.PI * 2)) * 100);
      ctx.fillStyle = '#1A1A2E';
      ctx.font = 'bold 26px Inter, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(pct + '%', cx, cy - 4);
      ctx.fillStyle = '#6B7280';
      ctx.font = '10px Inter, -apple-system, sans-serif';
      ctx.fillText('Win Rate', cx, cy + 18);
    }

    function animate(time) {
      var elapsed = time - startTime;
      var progress = Math.min(elapsed / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      draw(targetAngle * eased);
      if (progress < 1) requestAnimationFrame(animate);
    }

    if (targetWinRate === 0) { draw(0); return; }
    requestAnimationFrame(animate);
  }

  /* ─── SUMMARY CARDS & DASHBOARD ─── */

  function renderSummaryCards(allTrades) {
    var stats = calculateStats(allTrades);
    animateSummaryCards(stats);
  }

  /* ─── RECENT TRADES (CARDS) ─── */

  function renderRecentTrades(allTrades) {
    var list = document.getElementById('recent-trades');
    if (!list) return;
    list.innerHTML = '';
    var recent = allTrades.slice(0, 10);
    if (recent.length === 0) {
      list.innerHTML = '<div class="trades-empty">No trades yet</div>';
      return;
    }
    recent.forEach(function (item, idx) {
      var e = item.entry;
      var dirClass = e.direction === 'BUY' ? 'buy' : 'sell';
      var dirText = e.direction === 'BUY' ? 'Long' : 'Short';
      var plClass = e.profit > 0 ? 'positive' : (e.profit < 0 ? 'negative' : 'zero');
      var plText = e.profit > 0 ? '+' + e.profit.toFixed(2) + '%' : (e.profit < 0 ? e.profit.toFixed(2) + '%' : '0%');
      var parts = item.date.split('-');
      var monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      var displayDate = monthNames[parseInt(parts[1], 10) - 1] + ' ' + parseInt(parts[2], 10);

      var card = document.createElement('div');
      card.className = 'trade-card';
      card.style.animationDelay = (idx * 0.05) + 's';
      card.innerHTML =
        '<div class="trade-card-main">' +
          '<div class="trade-card-top">' +
            '<div class="trade-card-pair">' +
              '<span class="pair-name">' + e.pair + '</span>' +
              '<span class="direction-badge ' + dirClass + '">' + dirText + '</span>' +
            '</div>' +
            '<span class="trade-card-date">' + displayDate + '</span>' +
          '</div>' +
          '<div class="trade-card-details">' +
            '<div class="detail"><span class="detail-label">Entry</span><span class="detail-value">' + (e.entry != null ? e.entry.toFixed(2) : '\u2014') + '</span></div>' +
            '<div class="detail"><span class="detail-label">TP</span><span class="detail-value">' + (e.tp != null ? e.tp.toFixed(2) : '\u2014') + '</span></div>' +
            '<div class="detail"><span class="detail-label">SL</span><span class="detail-value">' + (e.sl != null ? e.sl.toFixed(2) : '\u2014') + '</span></div>' +
            '<div class="detail"><span class="detail-label">RR</span><span class="detail-value">' + (e.rr != null ? e.rr.toFixed(2) : '\u2014') + '</span></div>' +
          '</div>' +
          '<div class="trade-card-bottom">' +
            '<span class="trade-card-profit ' + plClass + '">' + plText + '</span>' +
            '<span class="trade-card-emotion">' + (e.emotion || '') + '</span>' +
          '</div>' +
          (e.image ? '<div class="trade-img-thumb"><img src="' + e.image + '" alt="screenshot"></div>' : '') +
        '</div>';
      list.appendChild(card);
    });
  }

  /* ─── MONTHLY CALENDAR ─── */

  function renderCalendar(year, month) {
    var data = getMonthData(year, month);
    var daysInMonth = getDaysInMonth(year, month);
    var firstDay = new Date(year, month, 1).getDay();
    var startOffset = firstDay === 0 ? 6 : firstDay - 1;
    var now = getToday();
    var isCurrentMonth = now.getFullYear() === year && now.getMonth() === month;
    var todayDate = now.getDate();
    var monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    document.getElementById('cal-label').textContent = monthNames[month] + ' ' + year;
    var dayHeaders = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    var dataMap = {};
    data.forEach(function (d) { dataMap[d.day] = d; });
    var grid = document.getElementById('cal-grid');
    grid.innerHTML = '';
    var header = document.createElement('div');
    header.className = 'cal-header-row';
    dayHeaders.forEach(function (d) {
      var cell = document.createElement('div');
      cell.className = 'cal-header-cell';
      cell.textContent = d;
      header.appendChild(cell);
    });
    grid.appendChild(header);
    var day = 1;
    var totalCells = startOffset + daysInMonth;
    var numWeeks = Math.ceil(totalCells / 7);
    for (var w = 0; w < numWeeks; w++) {
      var week = document.createElement('div');
      week.className = 'cal-week';
      for (var d = 0; d < 7; d++) {
        var cell = document.createElement('div');
        if ((w === 0 && d < startOffset) || day > daysInMonth) {
          cell.className = 'cal-day empty';
        } else {
          var dd = dataMap[day];
          cell.className = 'cal-day';
          if (isCurrentMonth && day === todayDate) cell.classList.add('today');
          if (dd && dd.hasTrades) {
            cell.classList.add('has-trades');
            (function (dStr) {
              cell.addEventListener('click', function () {
                var journal = getJournal();
                var trades = journal[dStr] || [];
                if (trades.length > 0) openTradeModal(trades, dStr);
              });
            })(getMonthKey(year, month) + '-' + pad(day));
          }
          var dayNum = document.createElement('span');
          dayNum.className = 'cal-day-num';
          dayNum.textContent = day;
          cell.appendChild(dayNum);
          if (dd && dd.hasTrades) {
            var dot = document.createElement('span');
            dot.className = 'cal-day-dot';
            if (dd.net > 0) dot.classList.add('dot-green');
            else if (dd.net < 0) dot.classList.add('dot-red');
            else dot.classList.add('dot-zero');
            cell.appendChild(dot);
            var res = document.createElement('span');
            res.className = 'cal-day-result';
            if (dd.net > 0) { res.textContent = '+' + dd.net.toFixed(1) + '%'; res.dataset.color = 'green'; }
            else if (dd.net < 0) { res.textContent = dd.net.toFixed(1) + '%'; res.dataset.color = 'red'; }
            else { res.textContent = '0%'; res.dataset.color = 'zero'; }
            cell.appendChild(res);
          }
          day++;
        }
        week.appendChild(cell);
      }
      grid.appendChild(week);
    }
  }

  /* ─── AUTO-CALC RR & PROFIT ─── */

  function updateBadge(el, text, isPositive) {
    if (!el) return;
    if (text) {
      el.textContent = text;
      el.className = 'field-badge show' + (isPositive === true ? ' positive' : isPositive === false ? ' negative' : '');
    } else {
      el.textContent = '';
      el.className = 'field-badge';
    }
  }

  function setDirection(dir) {
    document.querySelectorAll('.toggle-btn').forEach(function (b) {
      b.classList.toggle('active', b.dataset.value === dir);
    });
  }

  function setupAutoCalc() {
    var entry = document.getElementById('entry');
    var tp = document.getElementById('tp');
    var sl = document.getElementById('sl');
    var profit = document.getElementById('profit');
    var tpBadge = document.getElementById('tp-badge');
    var slBadge = document.getElementById('sl-badge');

    function calc() {
      var entryVal = parseFloat(entry.value);
      var tpVal = parseFloat(tp.value);
      var slVal = parseFloat(sl.value);
      var rrHint = document.getElementById('rr-hint');
      rrHint.textContent = '';
      rrHint.className = 'field-hint';
      updateBadge(tpBadge);
      updateBadge(slBadge);
      if (isNaN(entryVal) || entryVal <= 0 || isNaN(tpVal) || tpVal <= 0 || isNaN(slVal) || slVal <= 0) return;
      var isBuy;
      if (tpVal > entryVal && slVal < entryVal) { isBuy = true; }
      else if (tpVal < entryVal && slVal > entryVal) { isBuy = false; }
      else { rrHint.textContent = 'Invalid: TP/SL must be on opposite sides of Entry'; rrHint.className = 'field-hint has-value'; return; }
      setDirection(isBuy ? 'BUY' : 'SELL');
      var riskAmt = isBuy ? entryVal - slVal : slVal - entryVal;
      var rewardAmt = isBuy ? tpVal - entryVal : entryVal - tpVal;
      if (riskAmt <= 0 || rewardAmt <= 0) { rrHint.textContent = 'Risk or reward is zero'; rrHint.className = 'field-hint has-value'; return; }
      var rr = Math.round((rewardAmt / riskAmt) * 100) / 100;
      rrHint.textContent = 'R:R ' + rr.toFixed(2);
      rrHint.className = 'field-hint has-value';
      var tpPct = isBuy ? ((tpVal - entryVal) / entryVal * 100) : ((entryVal - tpVal) / entryVal * 100);
      var slPct = isBuy ? ((slVal - entryVal) / entryVal * 100) : ((entryVal - slVal) / entryVal * 100);
      updateBadge(tpBadge, (tpPct >= 0 ? '+' : '') + tpPct.toFixed(1) + '%', tpPct >= 0);
      updateBadge(slBadge, slPct.toFixed(1) + '%', slPct >= 0);
      if (!profit.value || profit.value === '') { profit.value = tpPct >= 0 ? '+' + tpPct.toFixed(2) : tpPct.toFixed(2); }
    }

    entry.addEventListener('input', calc);
    tp.addEventListener('input', calc);
    sl.addEventListener('input', calc);
    document.querySelectorAll('.toggle-btn').forEach(function (btn) {
      btn.addEventListener('click', function () { setTimeout(calc, 10); });
    });
  }

  /* ─── FORM ─── */

  function resetForm() {
    document.getElementById('pair').value = '';
    document.getElementById('entry').value = '';
    document.getElementById('tp').value = '';
    document.getElementById('sl').value = '';
    document.getElementById('profit').value = '';
    document.getElementById('emotion').value = '\u{1F600}';
    document.getElementById('notes').value = '';
    document.getElementById('rr-hint').textContent = '';
    document.getElementById('rr-hint').className = 'field-hint';
    updateBadge(document.getElementById('tp-badge'));
    updateBadge(document.getElementById('sl-badge'));
    document.querySelectorAll('.toggle-btn').forEach(function (b) { b.classList.remove('active'); });
    document.querySelector('.toggle-btn[data-value="BUY"]').classList.add('active');
    var imgInput = document.getElementById('trade-image');
    imgInput.value = '';
    delete imgInput.dataset.base64;
    document.getElementById('upload-preview').classList.add('hidden');
  }

  function handleSave(e) {
    e.preventDefault();
    var pair = document.getElementById('pair').value;
    var direction = document.querySelector('.toggle-btn.active');
    var entryPrice = parseFloat(document.getElementById('entry').value);
    var tp = parseFloat(document.getElementById('tp').value);
    var sl = parseFloat(document.getElementById('sl').value);
    var profit = parseFloat(document.getElementById('profit').value);
    var emotion = document.getElementById('emotion').value;
    var note = document.getElementById('notes').value.trim();
    if (!pair) { shakeInput(document.getElementById('pair')); return; }
    if (!direction) { document.querySelector('.toggle-btn[data-value="BUY"]').classList.add('active'); direction = document.querySelector('.toggle-btn.active'); }
    if (isNaN(entryPrice) || entryPrice <= 0) { shakeInput(document.getElementById('entry')); return; }
    if (isNaN(tp) || tp <= 0) { shakeInput(document.getElementById('tp')); return; }
    if (isNaN(sl) || sl <= 0) { shakeInput(document.getElementById('sl')); return; }
    if (isNaN(profit)) { shakeInput(document.getElementById('profit')); return; }
    var dir = direction.dataset.value;
    var riskAmt = dir === 'SELL' ? sl - entryPrice : entryPrice - sl;
    var rewardAmt = dir === 'SELL' ? entryPrice - tp : tp - entryPrice;
    var rr = (riskAmt > 0 && rewardAmt >= 0) ? Math.round((rewardAmt / riskAmt) * 100) / 100 : 0;
    var imgInput = document.getElementById('trade-image');
    var imgData = imgInput && imgInput.files && imgInput.files[0] ? imgInput.dataset.base64 : '';
    var entry = {
      pair: pair, direction: dir, entry: Math.round(entryPrice * 100) / 100,
      tp: Math.round(tp * 100) / 100, sl: Math.round(sl * 100) / 100,
      rr: rr, profit: Math.round(profit * 100) / 100,
      emotion: emotion, note: note, timestamp: Date.now(),
      image: imgData || ''
    };
    var journal = getJournal();
    var todayStr = getTodayStr();
    if (!journal[todayStr]) journal[todayStr] = [];
    journal[todayStr].push(entry);
    setJournal(journal);
    renderAll();
    resetForm();
    closeTradeSheet();
    showToast('Trade saved', 'success');
  }

  /* ─── SEARCH / FILTER ─── */

  function renderHistory(searchTerm, dirFilter, resultFilter) {
    searchTerm = (searchTerm || '').toLowerCase().trim();
    dirFilter = dirFilter || 'all';
    resultFilter = resultFilter || 'all';
    var journal = getJournal();
    var list = document.getElementById('history-list');
    list.innerHTML = '';
    var allEntries = [];
    Object.keys(journal).forEach(function (date) {
      journal[date].forEach(function (entry) {
        allEntries.push({ date: date, entry: entry });
      });
    });
    allEntries = allEntries.filter(function (item) {
      var e = item.entry;
      if (searchTerm && !e.pair.toLowerCase().includes(searchTerm)) return false;
      if (dirFilter !== 'all' && e.direction !== dirFilter) return false;
      if (resultFilter === 'win' && e.profit <= 0) return false;
      if (resultFilter === 'loss' && e.profit >= 0) return false;
      if (resultFilter === 'breakeven' && e.profit !== 0) return false;
      return true;
    });
    if (allEntries.length === 0) {
      list.innerHTML = '<div class="history-empty">No trades matched</div>';
      return;
    }
    allEntries.sort(function (a, b) {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return (b.entry.timestamp || 0) - (a.entry.timestamp || 0);
    });
    var monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    allEntries.forEach(function (item, index) {
      var parts = item.date.split('-');
      var displayDate = monthNames[parseInt(parts[1], 10) - 1] + ' ' + parseInt(parts[2], 10) + ', ' + parts[0];
      var e = item.entry;
      var div = document.createElement('div');
      div.className = 'history-entry';
      div.style.animationDelay = (index * 0.04) + 's';

      // Swipe delete button
      var swipeBtn = document.createElement('button');
      swipeBtn.className = 'history-entry-swipe';
      swipeBtn.textContent = 'Delete';
      swipeBtn.addEventListener('click', function () { deleteHistoryEntry(item.date, e.timestamp, div); });

      var mainDiv = document.createElement('div');
      mainDiv.className = 'history-entry-main';

      var header = document.createElement('div');
      header.className = 'history-header';
      header.innerHTML = '<span class="history-date">' + displayDate + '</span>';
      var delBtn = document.createElement('button');
      delBtn.className = 'history-delete';
      delBtn.textContent = 'Delete';
      delBtn.addEventListener('click', function () { deleteHistoryEntry(item.date, e.timestamp, div); });
      header.appendChild(delBtn);
      mainDiv.appendChild(header);

      var body = document.createElement('div');
      body.className = 'history-body';
      var dirLabel = e.direction === 'BUY' ? 'buy' : 'sell';
      var dirText = e.direction === 'BUY' ? 'Long' : 'Short';
      var profitVal = '', profitCls = '';
      if (e.profit > 0) { profitVal = '+' + e.profit.toFixed(2) + '%'; profitCls = 'green'; }
      else if (e.profit < 0) { profitVal = e.profit.toFixed(2) + '%'; profitCls = 'red'; }
      else { profitVal = '0%'; }
      var fields = [
        { label: 'Pair', value: e.pair, cls: '' },
        { label: 'Direction', value: '<span class="history-direction ' + dirLabel + '">' + dirText + '</span>', cls: '', html: true },
        { label: 'Entry', value: e.entry != null ? e.entry.toFixed(2) : '\u2014', cls: '' },
        { label: 'TP', value: e.tp != null ? e.tp.toFixed(2) : '\u2014', cls: '' },
        { label: 'SL', value: e.sl != null ? e.sl.toFixed(2) : '\u2014', cls: '' },
        { label: 'RR', value: e.rr != null ? e.rr.toFixed(2) : '\u2014', cls: '' },
        { label: 'Emotion', value: e.emotion || '\u2014', cls: '' },
        { label: 'Profit', value: profitVal, cls: profitCls }
      ];
      fields.forEach(function (f) {
        var fd = document.createElement('div');
        fd.className = 'history-field';
        var fl = document.createElement('span');
        fl.className = 'history-field-label';
        fl.textContent = f.label;
        fd.appendChild(fl);
        var fv = document.createElement('span');
        fv.className = 'history-field-value' + (f.cls ? ' ' + f.cls : '');
        if (f.html) fv.innerHTML = f.value;
        else fv.textContent = f.value;
        fd.appendChild(fv);
        body.appendChild(fd);
      });
      mainDiv.appendChild(body);
      if (e.note) {
        var noteDiv = document.createElement('div');
        noteDiv.className = 'history-notes';
        noteDiv.textContent = e.note;
        mainDiv.appendChild(noteDiv);
      }
      if (e.image) {
        var imgDiv = document.createElement('div');
        imgDiv.className = 'trade-img-thumb';
        imgDiv.innerHTML = '<img src="' + e.image + '" alt="screenshot">';
        mainDiv.appendChild(imgDiv);
      }
      div.appendChild(swipeBtn);
      div.appendChild(mainDiv);
      list.appendChild(div);

      setupSwipe(div, mainDiv);
    });
  }

  function deleteHistoryEntry(date, timestamp, el) {
    showConfirm('Delete this trade?', function () {
      var j = getJournal();
      if (j[date]) {
        j[date] = j[date].filter(function (x) { return x.timestamp !== timestamp; });
        if (j[date].length === 0) delete j[date];
        setJournal(j);
        el.remove();
        renderAll();
        var search = document.getElementById('history-search');
        var dir = document.getElementById('filter-direction');
        var res = document.getElementById('filter-result');
        renderHistory(search.value, dir.value, res.value);
        showToast('Trade deleted', 'error');
      }
    });
  }

  /* ─── SWIPE GESTURE ─── */

  function setupSwipe(container, mainEl) {
    var startX = 0, currentX = 0;
    var isDragging = false;
    var isRevealed = false;

    function onStart(e) {
      var touch = e.touches ? e.touches[0] : e;
      startX = touch.clientX;
      currentX = startX;
      isDragging = true;
    }

    function onMove(e) {
      if (!isDragging) return;
      var touch = e.touches ? e.touches[0] : e;
      currentX = touch.clientX;
      var delta = currentX - startX;
      if (delta < 0) {
        var translate = Math.max(delta, -80);
        mainEl.style.transform = 'translateX(' + translate + 'px)';
        mainEl.style.transition = 'none';
      }
    }

    function onEnd() {
      if (!isDragging) return;
      isDragging = false;
      var delta = currentX - startX;
      mainEl.style.transition = 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)';
      if (delta < -50) {
        mainEl.style.transform = 'translateX(-80px)';
        isRevealed = true;
      } else {
        mainEl.style.transform = 'translateX(0)';
        isRevealed = false;
      }
    }

    container.addEventListener('touchstart', onStart, { passive: true });
    container.addEventListener('touchmove', onMove, { passive: true });
    container.addEventListener('touchend', onEnd);
    // Mouse fallback
    container.addEventListener('mousedown', onStart);
    container.addEventListener('mousemove', onMove);
    container.addEventListener('mouseup', onEnd);
    container.addEventListener('mouseleave', onEnd);
  }

  function setupHistoryFilters() {
    var search = document.getElementById('history-search');
    var dirFilter = document.getElementById('filter-direction');
    var resultFilter = document.getElementById('filter-result');
    function onFilterChange() {
      if (_filterTimer) clearTimeout(_filterTimer);
      _filterTimer = setTimeout(function () { renderHistory(search.value, dirFilter.value, resultFilter.value); }, 150);
    }
    if (search) search.addEventListener('input', onFilterChange);
    if (dirFilter) dirFilter.addEventListener('change', onFilterChange);
    if (resultFilter) resultFilter.addEventListener('change', onFilterChange);
  }

  var _scrollPos = {};

  /* ─── NAVIGATION ─── */

  function switchView(view) {
    // Save scroll for current view
    var prevView = document.querySelector('.view.active');
    if (prevView) _scrollPos[prevView.id] = document.getElementById('main-content').scrollTop;

    document.querySelectorAll('.view').forEach(function (v) {
      v.classList.remove('active');
      v.classList.remove('view-enter');
    });

    var targetMap = {
      'dashboard': 'view-dashboard',
      'history': 'view-history',
      'analytics': 'view-analytics',
      'settings': 'view-settings',
      'calendar-view': 'calendar-panel'
    };

    var targetId = targetMap[view];
    if (targetId) {
      var el = document.getElementById(targetId);
      if (el) {
        el.classList.add('active');
        void el.offsetHeight;
        el.classList.add('view-enter');
      }
    }

    // Restore scroll for target view
    if (targetId && _scrollPos[targetId] != null) {
      document.getElementById('main-content').scrollTop = _scrollPos[targetId];
    }

    // Bottom nav active state
    document.querySelectorAll('.nav-item').forEach(function (b) { b.classList.remove('active'); });
    document.querySelectorAll('.nav-item[data-view="' + view + '"]').forEach(function (b) { b.classList.add('active'); });

    closeDrawer();

    // Render on switch
    if (view === 'history') {
      renderHistory(
        document.getElementById('history-search').value,
        document.getElementById('filter-direction').value,
        document.getElementById('filter-result').value
      );
    }
    if (view === 'calendar-view') {
      renderCalendar(calYear, calMonth);
    }
    if (view === 'analytics') {
      var allTrades = getAllTrades();
      var allEntries = allTrades.map(function (i) { return i.entry; });
      var stats = calculateStats(allEntries);
      document.getElementById('a-winrate').textContent = stats.total > 0 ? stats.winRate.toFixed(1) + '%' : '0%';
      document.getElementById('a-trades').textContent = stats.total;
      document.getElementById('a-wins-count').textContent = stats.wins;
      document.getElementById('a-losses-count').textContent = stats.losses;
      document.getElementById('a-wr').textContent = stats.total > 0 ? stats.winRate.toFixed(1) + '%' : '0%';
      document.getElementById('a-avg-rr').textContent = stats.total > 0 ? stats.avgRR.toFixed(2) : '0';
      var netText = stats.total > 0 ? formatCurrency(stats.net) : '$0.00';
      document.getElementById('a-net').textContent = netText;
      renderDonut(stats);
    }
  }

  /* ─── RENDER ALL ─── */

  function renderAll() {
    var allTrades = getAllTrades();
    var allEntries = allTrades.map(function (i) { return i.entry; });
    renderSummaryCards(allEntries);
    renderRecentTrades(allTrades);
    var activeChart = document.querySelector('.card-tab.active');
    if (activeChart && activeChart.dataset.chart === 'winrate') renderWinRateChart();
    else renderEquityChart();
    renderCalendar(calYear, calMonth);
    // Update analytics if visible
    var analyticsView = document.getElementById('view-analytics');
    if (analyticsView && analyticsView.classList.contains('active')) {
      var stats = calculateStats(allEntries);
      document.getElementById('a-winrate').textContent = stats.total > 0 ? stats.winRate.toFixed(1) + '%' : '0%';
      document.getElementById('a-trades').textContent = stats.total;
      document.getElementById('a-wins-count').textContent = stats.wins;
      document.getElementById('a-losses-count').textContent = stats.losses;
      document.getElementById('a-wr').textContent = stats.total > 0 ? stats.winRate.toFixed(1) + '%' : '0%';
      document.getElementById('a-avg-rr').textContent = stats.total > 0 ? stats.avgRR.toFixed(2) : '0';
      var netText = stats.total > 0 ? formatCurrency(stats.net) : '$0.00';
      document.getElementById('a-net').textContent = netText;
      renderDonut(stats);
    }
  }

  /* ─── INIT ─── */

  function init() {
    var now = getToday();
    calYear = now.getFullYear();
    calMonth = now.getMonth();

    // Form
    document.getElementById('journal-form').addEventListener('submit', handleSave);

    // Toggle buttons
    document.querySelectorAll('.toggle-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.toggle-btn').forEach(function (b) { b.classList.remove('active'); });
        this.classList.add('active');
      });
    });

    // Bottom nav
    document.querySelectorAll('.nav-item').forEach(function (btn) {
      btn.addEventListener('click', function () {
        switchView(this.dataset.view);
      });
    });

    // FAB (add trade)
    document.getElementById('btn-add-trade').addEventListener('click', function () {
      openTradeSheet();
    });

    // Bottom sheet close
    document.getElementById('journal-close').addEventListener('click', closeTradeSheet);
    document.getElementById('sheet-overlay').addEventListener('click', function (e) {
      if (e.target === this) closeTradeSheet();
    });

    // Image upload
    document.getElementById('trade-image').addEventListener('change', function () {
      var file = this.files[0];
      if (!file) return;
      if (file.size > 500 * 1024) {
        showToast('Image too large (max 500KB)', 'error');
        this.value = '';
        return;
      }
      var reader = new FileReader();
      reader.onload = function (e) {
        var dataUrl = e.target.result;
        document.getElementById('trade-image').dataset.base64 = dataUrl;
        var preview = document.getElementById('upload-preview');
        var img = document.getElementById('upload-img');
        img.src = dataUrl;
        preview.classList.remove('hidden');
      };
      reader.readAsDataURL(file);
    });
    document.getElementById('upload-remove').addEventListener('click', function () {
      var input = document.getElementById('trade-image');
      input.value = '';
      delete input.dataset.base64;
      document.getElementById('upload-preview').classList.add('hidden');
    });

    // Drawer
    document.getElementById('btn-hamburger').addEventListener('click', function () {
      var overlay = document.getElementById('drawer-overlay');
      if (overlay.classList.contains('hidden')) openDrawer();
      else closeDrawer();
    });
    document.getElementById('drawer-backdrop').addEventListener('click', closeDrawer);
    document.querySelectorAll('.drawer-item').forEach(function (btn) {
      btn.addEventListener('click', function () {
        switchView(this.dataset.view);
      });
    });

    // View All button
    document.getElementById('btn-view-all').addEventListener('click', function () {
      switchView('history');
    });

    // Calendar nav
    document.getElementById('cal-prev').addEventListener('click', function () {
      calMonth--;
      if (calMonth < 0) { calMonth = 11; calYear--; }
      renderCalendar(calYear, calMonth);
    });
    document.getElementById('cal-next').addEventListener('click', function () {
      calMonth++;
      if (calMonth > 11) { calMonth = 0; calYear++; }
      renderCalendar(calYear, calMonth);
    });

    // Card tabs
    document.querySelectorAll('.card-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        document.querySelectorAll('.card-tab').forEach(function (t) { t.classList.remove('active'); });
        this.classList.add('active');
        if (this.dataset.chart === 'winrate') renderWinRateChart();
        else renderEquityChart();
      });
    });

    // Modal
    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.getElementById('confirm-cancel').addEventListener('click', closeModal);
    document.getElementById('confirm-ok').addEventListener('click', function () {
      if (_confirmCallback) _confirmCallback();
      closeModal();
    });
    document.getElementById('modal-overlay').addEventListener('click', function (e) {
      if (e.target === this) closeModal();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        var sheet = document.getElementById('sheet-overlay');
        if (sheet && !sheet.classList.contains('hidden')) { closeTradeSheet(); return; }
        var drawer = document.getElementById('drawer-overlay');
        if (drawer && !drawer.classList.contains('hidden')) { closeDrawer(); return; }
        closeModal();
      }
    });

    // Settings
    document.getElementById('btn-export').addEventListener('click', function () {
      var journal = getJournal();
      var csv = 'Date,Pair,Direction,Entry,TP,SL,RR,Profit,Emotion,Notes\n';
      Object.keys(journal).forEach(function (date) {
        journal[date].forEach(function (t) {
          csv += date + ',' + t.pair + ',' + t.direction + ',' + (t.entry || '') + ',' + (t.tp || '') + ',' + (t.sl || '') + ',' + (t.rr || '') + ',' + (t.profit || '') + ',' + (t.emotion || '') + ',"' + (t.note || '') + '"\n';
        });
      });
      var blob = new Blob([csv], { type: 'text/csv' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'trade-journal-export.csv';
      a.click();
      URL.revokeObjectURL(url);
      showToast('CSV exported', 'success');
    });

    document.getElementById('btn-reset').addEventListener('click', function () {
      showConfirm('Delete ALL trading data? This cannot be undone.', function () {
        localStorage.removeItem(STORAGE_KEY);
        closeModal();
        renderAll();
        if (document.getElementById('view-history').classList.contains('active')) {
          renderHistory('', 'all', 'all');
        }
        showToast('All data reset', 'info');
      });
    });

    setupAutoCalc();
    setupHistoryFilters();

    // Default to dashboard
    switchView('dashboard');
    renderAll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
