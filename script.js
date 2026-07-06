(function () {
  'use strict';

  const STORAGE_KEY = 'tradeJournal';
  var calYear, calMonth;

  function getToday() {
    return new Date();
  }

  function getTodayStr() {
    const d = getToday();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }

  function formatCurrency(value) {
    if (value > 0) return '\u25B2 +' + value.toFixed(2) + '%';
    if (value < 0) return '\u25BC ' + value.toFixed(2) + '%';
    return '0%';
  }

  /* ─── TOAST SYSTEM ─── */

  function showToast(message, type) {
    var container = document.getElementById('toast-container');
    if (!container) return;

    var toast = document.createElement('div');
    toast.className = 'toast ' + (type || 'info');

    var icons = {
      success: '<svg viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
      error: '<svg viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
      info: '<svg viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
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

  /* ─── MODAL SYSTEM ─── */

  var _confirmCallback = null;

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
      var dirText = e.direction === 'BUY' ? 'Buy' : 'Sell';

      var profitCls = 'zero';
      var profitText = '0%';
      if (e.profit > 0) { profitCls = 'positive'; profitText = '\u25B2 +' + e.profit.toFixed(2) + '%'; }
      else if (e.profit < 0) { profitCls = 'negative'; profitText = '\u25BC ' + e.profit.toFixed(2) + '%'; }

      var div = document.createElement('div');
      div.className = 'modal-trade';
      div.innerHTML =
        '<div class="modal-trade-header">' +
          '<span class="modal-trade-pair">' + e.pair + '</span>' +
          '<span class="modal-trade-direction ' + dirLabel + '">' + dirText + '</span>' +
          '<span class="modal-trade-profit ' + profitCls + '">' + profitText + '</span>' +
        '</div>' +
        '<div class="modal-trade-details">' +
          '<div class="modal-trade-detail"><span class="modal-trade-detail-label">Entry</span><span class="modal-trade-detail-value">' + (e.entry != null ? e.entry.toFixed(2) : '—') + '</span></div>' +
          '<div class="modal-trade-detail"><span class="modal-trade-detail-label">TP</span><span class="modal-trade-detail-value">' + (e.tp != null ? e.tp.toFixed(2) : '—') + '</span></div>' +
          '<div class="modal-trade-detail"><span class="modal-trade-detail-label">SL</span><span class="modal-trade-detail-value">' + (e.sl != null ? e.sl.toFixed(2) : '—') + '</span></div>' +
          '<div class="modal-trade-detail"><span class="modal-trade-detail-label">RR</span><span class="modal-trade-detail-value">' + (e.rr != null ? e.rr.toFixed(2) : '—') + '</span></div>' +
          '<div class="modal-trade-detail"><span class="modal-trade-detail-label">Emotion</span><span class="modal-trade-detail-value">' + (e.emotion || '—') + '</span></div>' +
        '</div>' +
        (e.note ? '<div class="modal-trade-note">' + e.note + '</div>' : '') +
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
            renderHistory();
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

  function getMonthKey(year, month) {
    return year + '-' + pad(month + 1);
  }

  function getJournal() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch (e) {
      return {};
    }
  }

  function setJournal(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function getTodayTrades() {
    const journal = getJournal();
    return journal[getTodayStr()] || [];
  }

  function getMonthData(year, month) {
    const journal = getJournal();
    const prefix = getMonthKey(year, month);
    const daysInMonth = getDaysInMonth(year, month);
    const results = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = prefix + '-' + pad(day);
      const trades = journal[dateStr] || [];
      const net = trades.reduce(function (sum, t) {
        return sum + t.profit;
      }, 0);
      results.push({
        day: day,
        net: net,
        hasTrades: trades.length > 0
      });
    }

    return results;
  }

  function calculateStats(trades) {
    var total = trades.length;
    var wins = trades.filter(function (t) { return t.profit > 0; }).length;
    var losses = trades.filter(function (t) { return t.profit < 0; }).length;
    var winRate = total > 0 ? (wins / total) * 100 : 0;
    var avgRR = total > 0
      ? trades.reduce(function (sum, t) { return sum + t.rr; }, 0) / total
      : 0;
    var net = trades.reduce(function (sum, t) { return sum + t.profit; }, 0);

    return { total: total, wins: wins, losses: losses, winRate: winRate, avgRR: avgRR, net: net };
  }

  /* ─── DONUT CHART ─── */

  function renderDonut(stats) {
    var canvas = document.getElementById('winrate-canvas');
    if (!canvas) return;

    document.getElementById('win-count').textContent = stats.wins;
    document.getElementById('loss-count').textContent = stats.losses;

    animateDonut(canvas, stats.winRate);
  }

  function animateDonut(canvas, targetWinRate) {
    var ctx = canvas.getContext('2d');
    var dpr = window.devicePixelRatio || 1;
    var size = 140;
    var radius = 48;
    var thickness = 12;

    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    ctx.scale(dpr, dpr);

    var targetAngle = (targetWinRate / 100) * Math.PI * 2;
    var duration = 700;
    var startTime = performance.now();

    function draw(angle) {
      var cx = size / 2;
      var cy = size / 2;

      ctx.clearRect(0, 0, size, size);

      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.strokeStyle = '#2A3A4A';
      ctx.lineWidth = thickness;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, radius, -Math.PI / 2 + angle, -Math.PI / 2 + Math.PI * 2);
      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = thickness;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, radius, -Math.PI / 2, -Math.PI / 2 + angle);
      ctx.strokeStyle = '#22C55E';
      ctx.lineWidth = thickness;
      ctx.stroke();

      var pct = Math.round((angle / (Math.PI * 2)) * 100);
      ctx.fillStyle = '#F8FAFC';
      ctx.font = 'bold 26px Inter, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(pct + '%', cx, cy - 5);

      ctx.fillStyle = '#94A3B8';
      ctx.font = '9px Inter, -apple-system, sans-serif';
      ctx.fillText('Win Rate', cx, cy + 16);
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

  /* ─── SUMMARY ─── */

  function renderSummary(stats) {
    document.getElementById('total-trades').textContent = stats.total;
    document.getElementById('wins').textContent = stats.wins;
    document.getElementById('losses').textContent = stats.losses;

    var wrEl = document.getElementById('winrate');
    wrEl.textContent = stats.total > 0 ? stats.winRate.toFixed(1) + '%' : '0%';

    document.getElementById('avg-rr').textContent = stats.total > 0 ? stats.avgRR.toFixed(2) : '0';

    var netEl = document.getElementById('net');
    netEl.textContent = stats.total > 0 ? formatCurrency(stats.net) : '0%';
    netEl.className = 'stat-value';
    if (stats.net > 0) netEl.classList.add('green');
    else if (stats.net < 0) netEl.classList.add('red');
  }

  /* ─── MONTHLY CALENDAR ─── */

  function renderMonthlyTable(year, month) {
    var data = getMonthData(year, month);
    var daysInMonth = getDaysInMonth(year, month);
    var firstDay = new Date(year, month, 1).getDay();
    var startOffset = firstDay === 0 ? 6 : firstDay - 1;

    var now = getToday();
    var isCurrentMonth = now.getFullYear() === year && now.getMonth() === month;
    var todayDate = now.getDate();

    var monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    var label = document.getElementById('month-label');
    label.textContent = '\u2014 ' + monthNames[month] + ' ' + year;

    var dayHeaders = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

    var dataMap = {};
    data.forEach(function (d) { dataMap[d.day] = d; });

    var grid = document.getElementById('calendar-grid');
    grid.innerHTML = '';

    var header = document.createElement('div');
    header.className = 'cal-header';
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

          if (isCurrentMonth && day === todayDate) {
            cell.classList.add('today');
          }

          if (dd && dd.hasTrades) {
            if (dd.net > 0) cell.classList.add('has-profit');
            else if (dd.net < 0) cell.classList.add('has-loss');
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
            var res = document.createElement('span');
            res.className = 'cal-day-result';
            if (dd.net > 0) {
              res.textContent = '\u25B2 +' + dd.net.toFixed(2) + '%';
              res.dataset.color = 'green';
            } else if (dd.net < 0) {
              res.textContent = '\u25BC ' + dd.net.toFixed(2) + '%';
              res.dataset.color = 'red';
            } else {
              res.textContent = '0%';
              res.dataset.color = 'zero';
            }
            cell.appendChild(res);
          }

          day++;
        }

        week.appendChild(cell);
      }

      grid.appendChild(week);
    }
  }

  /* ─── RENDER MINI KPI ─── */

  function renderMiniKPI(stats) {
    var totalEl = document.getElementById('kpi-total');
    var winsEl = document.getElementById('kpi-wins');
    var lossesEl = document.getElementById('kpi-losses');
    var netEl = document.getElementById('kpi-net');

    if (!totalEl) return;

    totalEl.textContent = stats.total;
    winsEl.textContent = stats.wins;
    lossesEl.textContent = stats.losses;

    var netText = stats.total > 0 ? formatCurrency(stats.net) : '0%';
    netEl.innerHTML = '<span class="kpi-value">' + netText + '</span>';
    var valEl = netEl.querySelector('.kpi-value');
    valEl.className = 'kpi-value';
    if (stats.net > 0) valEl.classList.add('win');
    else if (stats.net < 0) valEl.classList.add('loss');
  }

  /* ─── RENDER ALL ─── */

  function renderAll() {
    var todayTrades = getTodayTrades();
    var stats = calculateStats(todayTrades);
    var now = getToday();

    renderMiniKPI(stats);
    renderDonut(stats);
    renderSummary(stats);
    renderMonthlyTable(calYear, calMonth);
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
      var dirEl = document.querySelector('.toggle-btn.active');
      var isBuy = dirEl && dirEl.dataset.value === 'BUY';

      var rrHint = document.getElementById('rr-hint');

      rrHint.textContent = '';
      rrHint.className = 'field-hint';
      updateBadge(tpBadge);
      updateBadge(slBadge);

      if (isNaN(entryVal) || entryVal <= 0 || isNaN(tpVal) || tpVal <= 0 || isNaN(slVal) || slVal <= 0) return;

      var riskAmt, rewardAmt;
      if (isBuy) {
        riskAmt = entryVal - slVal;
        rewardAmt = tpVal - entryVal;
      } else {
        riskAmt = slVal - entryVal;
        rewardAmt = entryVal - tpVal;
      }

      if (riskAmt <= 0 || rewardAmt <= 0) {
        rrHint.textContent = 'Invalid TP/SL for ' + (isBuy ? 'BUY' : 'SELL');
        rrHint.className = 'field-hint has-value';
        return;
      }

      var rr = Math.round((rewardAmt / riskAmt) * 100) / 100;
      rrHint.textContent = 'R:R ' + rr.toFixed(2);
      rrHint.className = 'field-hint has-value';

      var tpPct = isBuy ? ((tpVal - entryVal) / entryVal * 100) : ((entryVal - tpVal) / entryVal * 100);
      var slPct = isBuy ? ((slVal - entryVal) / entryVal * 100) : ((entryVal - slVal) / entryVal * 100);

      updateBadge(tpBadge, (tpPct >= 0 ? '+' : '') + tpPct.toFixed(1) + '%', tpPct >= 0);
      updateBadge(slBadge, slPct.toFixed(1) + '%', slPct >= 0);

      if (!profit.value || profit.value === '') {
        profit.value = tpPct >= 0 ? '+' + tpPct.toFixed(2) : tpPct.toFixed(2);
      }
    }

    entry.addEventListener('input', calc);
    tp.addEventListener('input', calc);
    sl.addEventListener('input', calc);

    document.querySelectorAll('.toggle-btn').forEach(function (btn) {
      btn.addEventListener('click', function () { setTimeout(calc, 10); });
    });
  }

  /* ─── SEARCH / FILTER ─── */

  var _filterTimer = null;

  function setupHistoryFilters() {
    var search = document.getElementById('history-search');
    var dirFilter = document.getElementById('filter-direction');
    var resultFilter = document.getElementById('filter-result');

    function onFilterChange() {
      if (_filterTimer) clearTimeout(_filterTimer);
      _filterTimer = setTimeout(function () {
        renderHistory(search.value, dirFilter.value, resultFilter.value);
      }, 150);
    }

    if (search) { search.addEventListener('input', onFilterChange); }
    if (dirFilter) { dirFilter.addEventListener('change', onFilterChange); }
    if (resultFilter) { resultFilter.addEventListener('change', onFilterChange); }
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
    document.querySelectorAll('.toggle-btn').forEach(function (b) {
      b.classList.remove('active');
    });
    document.querySelector('.toggle-btn[data-value="BUY"]').classList.add('active');
    document.getElementById('pair').focus();
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

    if (!pair) {
      shakeInput(document.getElementById('pair'));
      return;
    }

    if (!direction) {
      document.querySelector('.toggle-btn[data-value="BUY"]').classList.add('active');
      direction = document.querySelector('.toggle-btn.active');
    }

    if (isNaN(entryPrice) || entryPrice <= 0) {
      shakeInput(document.getElementById('entry'));
      return;
    }

    if (isNaN(tp) || tp <= 0) {
      shakeInput(document.getElementById('tp'));
      return;
    }

    if (isNaN(sl) || sl <= 0) {
      shakeInput(document.getElementById('sl'));
      return;
    }

    if (isNaN(profit)) {
      shakeInput(document.getElementById('profit'));
      return;
    }

    var dir = direction.dataset.value;
    var riskAmt = dir === 'SELL' ? sl - entryPrice : entryPrice - sl;
    var rewardAmt = dir === 'SELL' ? entryPrice - tp : tp - entryPrice;
    var rr = (riskAmt > 0 && rewardAmt >= 0) ? Math.round((rewardAmt / riskAmt) * 100) / 100 : 0;

    var entry = {
      pair: pair,
      direction: dir,
      entry: Math.round(entryPrice * 100) / 100,
      tp: Math.round(tp * 100) / 100,
      sl: Math.round(sl * 100) / 100,
      rr: rr,
      profit: Math.round(profit * 100) / 100,
      emotion: emotion,
      note: note,
      timestamp: Date.now()
      // Note: old format used risk/rr/profit; `rr` kept for avgRR calc compatibility
    };

    var journal = getJournal();
    var todayStr = getTodayStr();
    if (!journal[todayStr]) {
      journal[todayStr] = [];
    }
    journal[todayStr].push(entry);
    setJournal(journal);

    renderAll();
    resetForm();

    showToast('Trade saved', 'success');
  }

  /* ─── HISTORY ─── */

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
      var empty = document.createElement('div');
      empty.className = 'history-empty';
      empty.innerHTML = '<span class="history-empty-icon">\uD83D\uDCCB</span>No trades matched';
      list.appendChild(empty);
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

      var header = document.createElement('div');
      header.className = 'history-header';
      header.innerHTML = '<span class="history-date">' + displayDate + '</span>';

      var delBtn = document.createElement('button');
      delBtn.className = 'history-delete';
      delBtn.textContent = 'Delete';
      delBtn.addEventListener('click', function () {
        showConfirm('Delete this trade?', function () {
          var j = getJournal();
          if (j[item.date]) {
            j[item.date] = j[item.date].filter(function (x) {
              return x.timestamp !== e.timestamp;
            });
            if (j[item.date].length === 0) {
              delete j[item.date];
            }
            setJournal(j);
            renderHistory(
              document.getElementById('history-search').value,
              document.getElementById('filter-direction').value,
              document.getElementById('filter-result').value
            );
            renderAll();
            showToast('Trade deleted', 'error');
          }
        });
      });
      header.appendChild(delBtn);
      div.appendChild(header);

      var body = document.createElement('div');
      body.className = 'history-body';

      var dirLabel = e.direction === 'BUY' ? 'buy' : 'sell';
      var dirText = e.direction === 'BUY' ? 'Buy' : 'Sell';

      var fields = [
        { label: 'Pair', value: e.pair, cls: '' },
        { label: 'Direction', value: '<span class="history-direction ' + dirLabel + '">' + dirText + '</span>', cls: '', html: true },
        { label: 'Entry', value: e.entry != null ? e.entry.toFixed(2) : '\u2014', cls: '' },
        { label: 'TP', value: e.tp != null ? e.tp.toFixed(2) : '\u2014', cls: '' },
        { label: 'SL', value: e.sl != null ? e.sl.toFixed(2) : '\u2014', cls: '' },
        { label: 'RR', value: e.rr != null ? e.rr.toFixed(2) : '\u2014', cls: '' },
        { label: 'Emotion', value: e.emotion || '\u2014', cls: '' },
        { label: 'Profit', value: '', cls: '', raw: true },
      ];

      // Profit field with color
      var profitVal = '';
      var profitCls = '';
      if (e.profit > 0) {
        profitVal = '\u25B2 +' + e.profit.toFixed(2) + '%';
        profitCls = 'green';
      } else if (e.profit < 0) {
        profitVal = '\u25BC ' + e.profit.toFixed(2) + '%';
        profitCls = 'red';
      } else {
        profitVal = '0%';
      }
      fields[7].value = profitVal;
      fields[7].cls = profitCls;

      fields.forEach(function (f) {
        var fd = document.createElement('div');
        fd.className = 'history-field';
        var fl = document.createElement('span');
        fl.className = 'history-field-label';
        fl.textContent = f.label;
        fd.appendChild(fl);
        var fv = document.createElement('span');
        fv.className = 'history-field-value' + (f.cls ? ' ' + f.cls : '');
        if (f.html) {
          fv.innerHTML = f.value;
        } else {
          fv.textContent = f.value;
        }
        fd.appendChild(fv);
        body.appendChild(fd);
      });

      div.appendChild(body);

      if (e.note) {
        var noteDiv = document.createElement('div');
        noteDiv.className = 'history-notes';
        noteDiv.textContent = e.note;
        div.appendChild(noteDiv);
      }

      list.appendChild(div);
    });
  }

  /* ─── INIT ─── */

  function switchView(view) {
    document.getElementById('journal-section').classList.toggle('hidden', view !== 'journal');
    document.getElementById('history-section').classList.toggle('hidden', view !== 'history');
    if (view === 'history') {
      renderHistory(
        document.getElementById('history-search').value,
        document.getElementById('filter-direction').value,
        document.getElementById('filter-result').value
      );
    }
  }

  function init() {
    var now = getToday();
    calYear = now.getFullYear();
    calMonth = now.getMonth();

    var dateStr = now.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    document.getElementById('today-date').textContent = dateStr;

    document.getElementById('journal-form').addEventListener('submit', handleSave);

    document.querySelectorAll('.toggle-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.toggle-btn').forEach(function (b) {
          b.classList.remove('active');
        });
        this.classList.add('active');
      });
    });

    /* ─── TAB HANDLERS (top + mobile) ─── */

    function makeTabHandler(tab) {
      return function () {
        document.querySelectorAll('.tab, .mobile-tab').forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');
        switchView(tab.dataset.view);
      };
    }

    document.querySelectorAll('.tab, .mobile-tab').forEach(function (tab) {
      tab.addEventListener('click', makeTabHandler(tab));
    });

    /* ─── ROTATING TEXT ─── */

    var phrases = [
      'Stay Disciplined',
      'Keep Journaling',
      'Track Everything',
      'Trust the Process',
      'Stay Consistent',
      'Review & Improve',
      'Master Your Mindset'
    ];
    var phraseIndex = 0;
    var rotEl = document.getElementById('rotating-text');

    if (rotEl) {
      setInterval(function () {
        phraseIndex = (phraseIndex + 1) % phrases.length;
        rotEl.style.opacity = '0';
        rotEl.style.transform = 'translateY(-4px)';
        setTimeout(function () {
          rotEl.textContent = phrases[phraseIndex];
          rotEl.style.opacity = '1';
          rotEl.style.transform = 'translateY(0)';
        }, 450);
      }, 3000);
    }

    /* ─── STATS COLLAPSE ─── */

    var kpiToggle = document.getElementById('kpi-toggle');
    var statsCollapse = document.getElementById('stats-collapse');

    if (kpiToggle && statsCollapse) {
      kpiToggle.addEventListener('click', function () {
        var isOpen = statsCollapse.classList.toggle('open');
        kpiToggle.textContent = isOpen ? 'Hide' : 'Details';
        kpiToggle.classList.toggle('active', isOpen);
      });
    }

    /* ─── CALENDAR NAV ─── */

    document.getElementById('cal-prev').addEventListener('click', function () {
      calMonth--;
      if (calMonth < 0) { calMonth = 11; calYear--; }
      renderMonthlyTable(calYear, calMonth);
    });

    document.getElementById('cal-next').addEventListener('click', function () {
      calMonth++;
      if (calMonth > 11) { calMonth = 0; calYear++; }
      renderMonthlyTable(calYear, calMonth);
    });

    /* ─── AUTO-CALC + FILTERS ─── */

    setupAutoCalc();
    setupHistoryFilters();

    /* ─── MODAL ─── */

    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.getElementById('confirm-cancel').addEventListener('click', closeModal);
    document.getElementById('confirm-ok').addEventListener('click', function () {
      if (_confirmCallback) { _confirmCallback(); }
      closeModal();
    });

    document.getElementById('modal-overlay').addEventListener('click', function (e) {
      if (e.target === this) closeModal();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeModal();
    });

    renderAll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
