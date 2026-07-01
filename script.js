(function () {
  'use strict';

  const STORAGE_KEY = 'tradeJournal';

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
    if (value > 0) return '+' + value.toFixed(2) + '%';
    if (value < 0) return value.toFixed(2) + '%';
    return '0%';
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
    var size = 200;
    var radius = 72;
    var thickness = 16;

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
      ctx.strokeStyle = '#1E293B';
      ctx.lineWidth = thickness;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, radius, -Math.PI / 2 + angle, -Math.PI / 2 + Math.PI * 2);
      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = thickness;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, radius, -Math.PI / 2, -Math.PI / 2 + angle);
      ctx.strokeStyle = '#3B82F6';
      ctx.lineWidth = thickness;
      ctx.stroke();

      var pct = Math.round((angle / (Math.PI * 2)) * 100);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 40px Inter, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(pct + '%', cx, cy - 8);

      ctx.fillStyle = '#64748B';
      ctx.font = '11px Inter, -apple-system, sans-serif';
      ctx.fillText('Win Rate', cx, cy + 22);
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
          }

          var dayNum = document.createElement('span');
          dayNum.className = 'cal-day-num';
          dayNum.textContent = day;
          cell.appendChild(dayNum);

          if (dd && dd.hasTrades) {
            var res = document.createElement('span');
            res.className = 'cal-day-result';
            if (dd.net > 0) {
              res.textContent = '+' + dd.net.toFixed(2) + '%';
              res.dataset.color = 'green';
            } else if (dd.net < 0) {
              res.textContent = dd.net.toFixed(2) + '%';
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

  /* ─── RENDER ALL ─── */

  function renderAll() {
    var todayTrades = getTodayTrades();
    var stats = calculateStats(todayTrades);
    var now = getToday();

    renderDonut(stats);
    renderSummary(stats);
    renderMonthlyTable(now.getFullYear(), now.getMonth());
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
      document.getElementById('pair').focus();
      return;
    }

    if (!direction) {
      document.querySelector('.toggle-btn[data-value="BUY"]').classList.add('active');
      direction = document.querySelector('.toggle-btn.active');
    }

    if (isNaN(entryPrice) || entryPrice <= 0) {
      document.getElementById('entry').focus();
      return;
    }

    if (isNaN(tp) || tp <= 0) {
      document.getElementById('tp').focus();
      return;
    }

    if (isNaN(sl) || sl <= 0) {
      document.getElementById('sl').focus();
      return;
    }

    if (isNaN(profit)) {
      document.getElementById('profit').focus();
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

    var btn = document.getElementById('save-btn');
    var origText = btn.textContent;
    btn.textContent = 'Saved';
    btn.style.background = '#2563EB';
    setTimeout(function () {
      btn.textContent = origText;
      btn.style.background = '';
    }, 1200);
  }

  /* ─── HISTORY ─── */

  function renderHistory() {
    var journal = getJournal();
    var list = document.getElementById('history-list');
    list.innerHTML = '';

    var allEntries = [];
    Object.keys(journal).forEach(function (date) {
      journal[date].forEach(function (entry) {
        allEntries.push({ date: date, entry: entry });
      });
    });

    if (allEntries.length === 0) {
      var empty = document.createElement('div');
      empty.className = 'history-empty';
      empty.innerHTML = '<span class="history-empty-icon">\uD83D\uDCCB</span>No trades recorded yet';
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
        if (confirm('Delete this trade?')) {
          var j = getJournal();
          if (j[item.date]) {
            j[item.date] = j[item.date].filter(function (x) {
              return x.timestamp !== e.timestamp;
            });
            if (j[item.date].length === 0) {
              delete j[item.date];
            }
            setJournal(j);
            renderHistory();
            renderAll();
          }
        }
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
        profitVal = '+' + e.profit.toFixed(2) + '%';
        profitCls = 'green';
      } else if (e.profit < 0) {
        profitVal = e.profit.toFixed(2) + '%';
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

  function init() {
    var now = getToday();
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

    document.querySelectorAll('.tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        document.querySelectorAll('.tab').forEach(function (t) { t.classList.remove('active'); });
        this.classList.add('active');
        var view = this.dataset.view;
        document.getElementById('journal-section').classList.toggle('hidden', view !== 'journal');
        document.getElementById('history-section').classList.toggle('hidden', view !== 'history');
        if (view === 'history') renderHistory();
      });
    });

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

    renderAll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
