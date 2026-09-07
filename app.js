/* Persona Homepage: the app.
 *
 * One file, no framework. The state is small enough to hold in one object and
 * the render is cheap enough to do whole: every change rewrites the grid, which
 * removes a whole class of bug that a partial update would have introduced for
 * no gain at this size.
 */
(function () {
  'use strict';

  var KEY = 'persona-home-v2';
  /* The cache envelope the spec names. A stored layout written by an older
     shape is discarded rather than half-read, because a layout that half-loads
     is worse than one that does not: the page comes up looking almost right
     and the part that is wrong is the part nobody checks. */
  var SCHEMA = 2;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var el = function (tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) { n.className = cls; }
    if (html != null) { n.innerHTML = html; }
    return n;
  };
  var esc = function (s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c];
    });
  };

  /* ------------------------------------------------------------- state */
  var S = {
    persona: 'contributor',
    cells: null,
    dirty: false,
    app: 'all',
    presets: [],
    onboarded: false,
    toured: false,
    named: false,
    booting: true
  };

  function load() {
    try {
      var env = JSON.parse(localStorage.getItem(KEY) || 'null');
      var raw = env && env.schemaVersion === SCHEMA ? env.data : null;
      if (raw && raw.cells) {
        S.persona = raw.persona || 'contributor';
        S.cells = raw.cells;
        S.presets = raw.presets || [];
        S.onboarded = !!raw.onboarded;
        S.toured = !!raw.toured;
        S.named = !!raw.named;
      }
    } catch (e) { /* a broken cache is the same as no cache */ }
    if (!S.cells) { S.cells = clone(PRESETS[S.persona]); }
  }
  function save() {
    syncNamed();
    try {
      localStorage.setItem(KEY, JSON.stringify({
        schemaVersion: SCHEMA,
        data: {
          persona: S.persona, cells: S.cells, presets: S.presets,
          onboarded: S.onboarded, toured: S.toured, named: S.named
        }
      }));
    } catch (e) { /* private window: the page still works, it just forgets */ }
  }

  function clone(x) { return JSON.parse(JSON.stringify(x)); }

  /* -------------------------------------------------------- small parts */
  function icon(d) { return '<svg viewBox="0 0 24 24">' + d + '</svg>'; }
  var I = {
    warn: '<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17.2v.1"/>',
    slider: '<path d="M4 7h10M18 7h2M4 12h4M12 12h8M4 17h12M20 17h0"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="17" r="2"/>',
    info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8h.01"/>',
    dots: '<circle cx="12" cy="5" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="12" cy="19" r="1.4"/>',
    chev: '<path d="M7 10l5 5 5-5"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
    down: '<path d="M12 4v11M8 11l4 4 4-4"/><path d="M5 19h14"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    badge: '<path d="M12 3l2.2 1.6 2.7-.2.9 2.6 2.2 1.6-1 2.5 1 2.5-2.2 1.6-.9 2.6-2.7-.2L12 21l-2.2-1.6-2.7.2-.9-2.6L4 15.4l1-2.5-1-2.5 2.2-1.6.9-2.6 2.7.2z"/><path d="M9.4 12.2l1.9 1.9 3.4-3.6"/>',
    trend: '<path d="M4 16l4.5-5 3.5 3 7-8"/><path d="M15 6h4v4"/>',
    bolt: '<path d="M13 3L5 14h6l-1 7 8-11h-6z"/>',
    bell: '<path d="M6 9a6 6 0 1112 0c0 5 2 6 2 6H4s2-1 2-6z"/><path d="M10.5 21h3"/>',
    dollar: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v10M14.5 9.5c0-1-1.1-1.6-2.5-1.6s-2.5.6-2.5 1.7c0 2.4 5 1.4 5 3.8 0 1.1-1.1 1.7-2.5 1.7s-2.5-.6-2.5-1.6"/>',
    table: '<rect x="4" y="5" width="16" height="14" rx="2"/><path d="M4 10h16M9 10v9"/>',
    heart: '<path d="M12 20s-7-4.4-7-9.2A3.8 3.8 0 0112 8a3.8 3.8 0 017 2.8C19 15.6 12 20 12 20z"/>',
    grid: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
    lock: '<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 018 0v3"/>',
    calendar: '<rect x="4" y="6" width="16" height="14" rx="2"/><path d="M4 11h16M9 4v4M15 4v4"/>'
  };

  /* ------------------------------------------------------------- scope
     Effective scope resolves widget > page > default, which is the order the
     spec commits to. The interesting case is the third: when the page names a
     dimension the widget does not accept, the widget falls back to its own
     dimension AND says so, rather than quietly showing numbers for a scope
     nobody asked for. */
  function dimsFor(id) { return WIDGET_DIMS[id] || ['account', 'division']; }

  function pageScope() {
    return S.persona === 'leader'
      ? { k: 'division', v: 'Platform Engineering' }
      : { k: 'account', v: 'acct-atlas-prod' };
  }

  function effectiveScope(id, cell) {
    if (cell && cell.scope) {
      return { k: cell.scope.k, v: cell.scope.v, src: 'widget' };
    }
    var p = pageScope();
    if (dimsFor(id).indexOf(p.k) < 0) {
      var d = dimsFor(id)[0];
      return { k: d, v: SCOPE_DEFAULTS[d], src: 'default', warn: p.k };
    }
    return { k: p.k, v: p.v, src: 'page' };
  }

  function label(k) { return k.charAt(0).toUpperCase() + k.slice(1); }

  function scopeLine(sc) {
    var cls = 'card-scope' + (sc.warn ? ' warn' : '') + (sc.src === 'widget' ? ' pinned' : '');
    var tag = sc.warn
      ? '<em title="This widget cannot be scoped by ' + esc(sc.warn) + '">' +
        'page scope not applied</em>'
      : sc.src === 'widget' ? '<em>widget scope</em>' : '';
    return '<div class="' + cls + '">' +
      icon(sc.warn ? I.warn : I.slider).replace('<svg', '<svg class="i"') +
      '<span>' + esc(label(sc.k)) + ': ' + esc(sc.v) + '</span>' + tag + '</div>';
  }

  function currentScopeText() {
    var p = pageScope();
    return label(p.k) + ': ' + p.v;
  }

  /* --------------------------------------------------------- charts */
  function lineChart(vals, opts) {
    opts = opts || {};
    var w = 520, h = 190, pad = { l: 34, r: 8, t: 10, b: 26 };
    var min = Math.min.apply(null, vals) - 2, max = Math.max.apply(null, vals) + 2;
    var span = (max - min) || 1;
    var iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
    var pts = vals.map(function (v, i) {
      return [pad.l + (i / (vals.length - 1)) * iw, pad.t + ih - ((v - min) / span) * ih];
    });
    var line = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' ');
    var area = line + ' L' + pts[pts.length - 1][0].toFixed(1) + ' ' + (pad.t + ih) +
      ' L' + pts[0][0].toFixed(1) + ' ' + (pad.t + ih) + ' Z';
    var g = '';
    [0, .5, 1].forEach(function (f) {
      var y = pad.t + ih * f, v = Math.round(max - span * f);
      g += '<line x1="' + pad.l + '" y1="' + y + '" x2="' + (w - pad.r) + '" y2="' + y +
        '" stroke="#E7ECF0" stroke-width="1"/>' +
        '<text x="' + (pad.l - 8) + '" y="' + (y + 4) + '" text-anchor="end" font-size="10" fill="#8496A3" stroke="none">' + v + '</text>';
    });
    return '<svg class="chart" viewBox="0 0 ' + w + ' ' + h + '" aria-hidden="true">' + g +
      '<path d="' + area + '" fill="' + (opts.fill || 'rgba(0,112,168,.10)') + '" stroke="none"/>' +
      '<path d="' + line + '" stroke="' + (opts.stroke || '#0070A8') + '" stroke-width="2.2"/>' +
      pts.map(function (p) { return '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="2.6" fill="#0070A8" stroke="#fff" stroke-width="1.4"/>'; }).join('') +
      '</svg>';
  }

  function barChart(labels, vals) {
    var w = 520, h = 170, pad = { l: 40, r: 8, t: 10, b: 26 };
    var max = Math.max.apply(null, vals) * 1.12;
    var iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
    var bw = iw / vals.length * .62, gap = iw / vals.length;
    var g = '';
    [0, .5, 1].forEach(function (f) {
      var y = pad.t + ih * f, v = Math.round((max - max * f) / 100) / 10;
      g += '<line x1="' + pad.l + '" y1="' + y + '" x2="' + (w - pad.r) + '" y2="' + y + '" stroke="#E7ECF0"/>' +
        '<text x="' + (pad.l - 8) + '" y="' + (y + 4) + '" text-anchor="end" font-size="10" fill="#8496A3" stroke="none">$' + v + 'K</text>';
    });
    vals.forEach(function (v, i) {
      var bh = (v / max) * ih, x = pad.l + i * gap + (gap - bw) / 2, y = pad.t + ih - bh;
      g += '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + bw.toFixed(1) +
        '" height="' + bh.toFixed(1) + '" rx="3" fill="#4FA3C7" stroke="none"/>' +
        '<text x="' + (x + bw / 2).toFixed(1) + '" y="' + (h - 8) + '" text-anchor="middle" font-size="10" fill="#8496A3" stroke="none">' + labels[i] + '</text>';
    });
    return '<svg class="chart" viewBox="0 0 ' + w + ' ' + h + '" aria-hidden="true">' + g + '</svg>';
  }

  function stackBar(rows) {
    var w = 520, h = 26, x = 0, total = rows.reduce(function (a, r) { return a + r.v; }, 0);
    var g = rows.map(function (r) {
      var bw = (r.v / total) * w, seg = '<rect x="' + x.toFixed(1) + '" y="0" width="' + Math.max(bw - 2, 1).toFixed(1) +
        '" height="' + h + '" rx="4" fill="' + r.c + '" stroke="none"/>';
      x += bw; return seg;
    }).join('');
    var legend = rows.map(function (r) {
      return '<span class="kv"><span><i style="display:inline-block;width:9px;height:9px;border-radius:2px;background:' +
        r.c + ';margin-right:7px"></i>' + esc(r.k) + '</span><b>' + r.v + '%</b></span>';
    }).join('');
    return '<svg class="chart" viewBox="0 0 ' + w + ' ' + h + '" style="height:26px" aria-hidden="true">' + g + '</svg>' +
      '<div class="kvs">' + legend + '</div>';
  }

  /* ------------------------------------------------------ the widgets */
  function money(n) { return n >= 1000 ? '$' + (n / 1000).toFixed(1) + 'K' : '$' + n; }

  var R = {
    maturity: function () {
      var d = S.persona === 'leader' ? D.gradeLeader : D.grade;
      return {
        cls: 'navy', badge: 'gold', bi: I.badge, star: true,
        title: S.persona === 'leader' ? 'Division maturity' : 'Maturity score',
        /* The letter alone. A sparkline beside it was a second reading of the
           same number at a size nobody can read a trend off, and the trend has
           its own widget, at a size where the trend is the point. */
        body: '<div class="grade-row"><div class="grade">' + d.letter + '</div></div>' +
          '<p class="sub">' + d.score + '/100 · threshold ' + d.threshold +
          ' · last refresh ' + d.refreshed + '</p>'
      };
    },
    score: function () {
      var d = S.persona === 'leader' ? D.gradeLeader : D.grade;
      return { badge: '', bi: I.badge, title: 'Score', body: '<div class="bignum-row"><span class="bignum">' + d.score + '</span><span>/100</span></div><p class="sub">Bare number presentation.</p>' };
    },
    delta7: function () {
      return { bi: I.trend, title: '7-day delta', body: '<div class="bignum-row"><span class="bignum" style="color:#3E9B57">+2</span></div><p class="sub">Score change over the trailing week.</p>' };
    },
    trend: function () {
      return {
        bi: I.trend, title: 'Maturity score trend',
        body: '<div class="seg" role="group" aria-label="Range">' +
          '<button>Daily</button><button>Weekly</button><button class="is-on">Monthly</button></div>' +
          lineChart(D.trend90) + '<p class="sub">Trailing 90 days.</p>'
      };
    },
    breakdown: function () {
      return { bi: I.grid, title: 'Job breakdown', body: stackBar(D.breakdown) + '<p class="sub">Split by job category in the current scope.</p>' };
    },
    governance: function () {
      var d = S.persona === 'leader' ? D.governanceLeader : D.governance;
      return {
        cls: 'gold', badge: 'plain', bi: I.bolt, title: 'Governance automation',
        body: '<div class="bignum-row"><span class="bignum">' + d.automated.toLocaleString() +
          '</span><span>' + (S.persona === 'leader' ? 'actions · ' : 'automated · ') + d.window + '</span></div>' +
          '<div class="kvs"><span class="kv"><span>Scheduled</span><b>' + d.scheduled + '</b></span>' +
          '<span class="kv"><span>In progress</span><b>' + d.inprogress + '</b></span>' +
          '<span class="kv"><span>Resources deleted</span><b>' + d.deleted + '</b></span></div>'
      };
    },
    pipeline: function () {
      return {
        bi: I.bolt, title: 'Pipeline events',
        body: '<div class="kvs">' + D.pipeline.map(function (r) {
          return '<span class="kv"><span>' + esc(r[0]) + '</span><b style="color:' +
            (r[1] === 'blocked' ? '#CF3B31' : '#3E9B57') + '">' + r[1] + '</b></span>';
        }).join('') + '</div>'
      };
    },
    change: function () {
      return {
        bi: I.lock, title: 'Change status',
        body: '<div class="bignum-row"><span class="bignum" style="font-size:26px">' + D.change.state +
          '</span></div><p class="sub">Ends ' + D.change.until + ' · next window ' + D.change.next +
          '</p><div class="kvs"><span class="kv"><span>Requests this division</span><b>' + D.change.requests + '</b></span></div>'
      };
    },
    campaigns: function () {
      return {
        bi: I.table, title: 'Automated campaigns',
        body: table(['Name', 'Category', 'Status'], D.campaigns.map(function (r) {
          return [esc(r[0]), catPill(r[1]), esc(r[2])];
        }), D.campaigns.length + ' campaigns')
      };
    },
    remediations: function () {
      return { bi: I.bolt, title: 'Remediations', body: '<div class="bignum-row"><span class="bignum">' + D.remediations.open + '</span><span>open</span></div><p class="sub">' + D.remediations.overdue + ' overdue.</p>' };
    },
    cost: function () {
      var d = S.persona === 'leader' ? D.costLeader : D.cost;
      return {
        badge: 'green', bi: I.dollar, title: 'Cloud cost',
        body: '<div class="split"><div class="tiles">' +
          tile('Current month', money(d.month), '/mo') +
          tile('6-month average', money(d.avg6), '') +
          tile('Month over month', '<span class="delta ' + (d.mom < 0 ? 'down' : 'up') + '">' +
            (d.mom < 0 ? '↓' : '↑') + Math.abs(d.mom) + '%</span>', money(Math.abs(d.delta))) +
          tile('Potential savings', money(d.savings), '') +
          '</div><div><p class="sub" style="margin:0 0 2px;font-weight:700">Monthly totals · 6M</p>' +
          barChart(d.months, d.totals) + '</div></div>'
      };
    },
    costsvc: function () {
      return { badge: 'green', bi: I.dollar, title: 'Cost by service', body: stackBar(D.costsvc) };
    },
    notices: function () {
      var n = D.notices[S.notice || 0];
      return {
        badge: 'red', bi: I.bell, title: 'Recent notices',
        body: '<div class="notice' + (n.sev === 'warning' ? ' warn' : '') + '" style="border-left-color:' +
          (n.sev === 'warning' ? '#E4922B' : '#CF3B31') + '">' +
          '<div class="notice-head"><span class="sev' + (n.sev === 'warning' ? ' warn' : '') + '">' + n.sev +
          '</span><span class="notice-title">' + esc(n.t) + '</span><span class="notice-when">' + n.w + '</span></div>' +
          '<p>' + esc(n.d) + '</p><a href="#" data-noop>More info →</a></div>' +
          '<div class="dots">' + D.notices.map(function (_, i) {
            return '<i class="' + (i === (S.notice || 0) ? 'is-on' : '') + '"></i>';
          }).join('') + '</div>' +
          '<p class="foot-note">2 critical · 3 warning · showing ' + ((S.notice || 0) + 1) + ' of ' + D.notices.length + '.</p>'
      };
    },
    health: function () {
      return {
        bi: I.heart, title: 'Service health',
        body: '<div class="bignum-row"><span class="bignum" style="font-size:26px">Nominal</span></div>' +
          '<p class="sub">Green ' + D.health.green + ' · amber ' + D.health.amber + ' · red ' + D.health.red +
          '<br>Last check ' + D.health.checked + '.</p>'
      };
    },
    jobs: function () {
      return {
        bi: I.table, title: 'Jobs',
        body: '<div class="filters">' + ['Category', 'Criticality', 'Status'].map(function (f) {
          return '<div class="select">' + f + icon(I.chev) + '</div>';
        }).join('') + '</div>' +
          table(['Name', 'Category', 'Due date', 'Criticality'], D.jobs.map(function (r) {
            return [esc(r[0]), catPill(r[1]), esc(r[2]), '<span class="tag ' + r[3].toLowerCase() + '">' + r[3] + '</span>'];
          }), D.jobs.length + ' jobs', true)
      };
    },
    jobsopen: function () {
      return { bi: I.table, title: 'Jobs open', body: '<div class="bignum-row"><span class="bignum">' + D.jobs.length + '</span><span>open in scope</span></div>' };
    },
    burndown: function () {
      return { bi: I.trend, title: 'Job burndown', body: lineChart(D.burndown, { stroke: '#3E9B57', fill: 'rgba(62,155,87,.10)' }) + '<p class="sub">Open jobs over twelve weeks.</p>' };
    },
    upcoming: function () {
      return {
        bi: I.calendar, title: 'Upcoming requirements',
        body: table(['Requirement', 'Due', 'Days'], D.upcoming.map(function (r) {
          return [esc(r[0]), esc(r[1]), '<b>' + r[2] + '</b>'];
        }), D.upcoming.length + ' upcoming')
      };
    },
    rollup: function () {
      return {
        bi: I.grid, title: 'Divisional rollup',
        body: table(['Subdivision', 'Score', '7-day', 'Open jobs', 'Cost (MoM)', 'Requirements'],
          D.rollup.map(function (r) {
            return [esc(r[0]), '<b>' + esc(r[1]) + '</b>',
              '<span style="color:' + (String(r[2]).indexOf('−') === 0 ? '#CF3B31' : '#3E9B57') + '">' + r[2] + '</span>',
              r[3], esc(r[4]), r[5] + ' upcoming'];
          }), '4 subdivisions')
      };
    },
    apps: function () {
      return {
        bi: I.grid, title: 'Applications in scope',
        body: table(['Application', 'Score', 'Open jobs', 'Cost', 'MoM'], D.apps.map(function (r) {
          return ['<b>' + esc(r[0]) + '</b>', esc(r[1]), r[2], esc(r[3]), esc(r[4])];
        }), D.apps.length + ' applications')
      };
    },
    accounts: function () {
      return {
        bi: I.grid, title: 'Accounts',
        body: table(['Account', 'Application', 'Env', 'Owner', 'Jobs'], D.accounts.map(function (r) {
          return ['<b>' + esc(r[0]) + '</b>', esc(r[1]), esc(r[2]), esc(r[3]), r[4]];
        }), D.accounts.length + ' accounts')
      };
    },
    topres: function () {
      return {
        bi: I.table, title: 'Top resources by jobs',
        body: table(['Resource', 'Jobs'], D.topres.map(function (r) { return [esc(r[0]), '<b>' + r[1] + '</b>']; }), '8 resources')
      };
    },
    appdetails: function () {
      return {
        bi: I.grid, title: 'Application details',
        body: '<div class="kvs">' + D.appdetails.map(function (r) {
          return '<span class="kv"><span>' + esc(r[0]) + '</span><b>' + esc(r[1]) + '</b></span>';
        }).join('') + '</div>'
      };
    },
    section: function () { return { bi: I.grid, title: 'Section title', body: '<p class="sub">An editable heading for a named section.</p>' }; },
    smartstack: function () { return { bi: I.grid, title: 'Smart stack', body: '<p class="sub">Rotates by time of day.</p>' }; }
  };

  function tile(k, v, em) {
    return '<div class="tile"><span>' + k + '</span><b>' + v + '</b>' + (em ? '<em>' + em + '</em>' : '') + '</div>';
  }
  function catPill(c) {
    var m = { 'S&G': 'sg', 'Cost': 'cost', 'Resiliency': 'res' };
    return '<span class="pill ' + (m[c] || 'sg') + '">' + esc(c) + '</span>';
  }
  function table(head, rows, count, exportable) {
    return '<div class="tablewrap"><table><thead><tr>' +
      head.map(function (h) { return '<th>' + h + '</th>'; }).join('') +
      '</tr></thead><tbody>' + rows.map(function (r) {
        return '<tr>' + r.map(function (c) { return '<td>' + c + '</td>'; }).join('') + '</tr>';
      }).join('') + '</tbody></table></div>' +
      '<div class="tablefoot"><span class="count">' + count + '</span>' +
      (exportable !== false ? '<button class="export" data-noop>' + icon(I.down) + 'Export</button>' : '') + '</div>';
  }

  /* ---------------------------------------------------------- render */
  function render() {
    $('#personaName').textContent = S.persona === 'leader' ? 'Leader' : 'Contributor';
    renderScope();
    renderGrid();
    $('#notInDefault').textContent = 'Not in the default, available from the picker: ' +
      NOT_IN_DEFAULT.join(', ') + '.';
  }

  function renderScope() {
    var box = $('#scopeChips');
    box.innerHTML = SCOPE[S.persona].map(function (c) {
      return '<span class="chip">' + icon(I.slider).replace('<svg', '<svg class="i"') +
        '<span class="k">' + c.k + '</span><b>' + esc(c.v) + '</b></span>';
    }).join('');
  }

  function renderGrid() {
    var grid = $('#grid');
    grid.innerHTML = '';
    S.cells.forEach(function (cell, ci) {
      var wrap = el('div', 'cell' + (cell.size > 1 ? ' w' + cell.size : ''));
      wrap.dataset.i = ci;
      wrap.draggable = false;

      if (cell.w.length > 1) {
        var tabs = el('div', 'stack-tabs');
        cell.w.forEach(function (id, ti) {
          /* The widget's name alone. The ordinal in front of it was numbering
             tabs the reader can already see and count, and it read as a step in
             a sequence rather than as a choice between two things. */
          var b = el('button', 'stack-tab' + (ti === (cell.on || 0) ? ' is-on' : ''),
            esc(WIDGETS[id].name));
          b.onclick = function () { cell.on = ti; renderGrid(); };
          tabs.appendChild(b);
        });
        wrap.appendChild(tabs);
      }

      var id = cell.w[cell.on || 0];
      var spec = (R[id] || function () {
        return { bi: I.grid, title: WIDGETS[id] ? WIDGETS[id].name : id, body: '<p class="sub">Mock widget.</p>' };
      })();

      var card = el('div', 'card' + (spec.cls ? ' ' + spec.cls : '') +
        (cell.w.length > 1 ? ' instack' : '') + (S.booting ? ' loading' : ''));
      card.innerHTML =
        '<div class="grip" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span><span></span></div>' +
        '<div class="card-top">' +
        '<span class="badge ' + (spec.badge || '') + '">' + icon(spec.bi) + '</span>' +
        '<h3 class="card-title">' + esc(spec.title) + '</h3>' +
        (spec.star ? '<svg class="star" viewBox="0 0 24 24"><path d="M12 2l2.6 6.3 6.8.5-5.2 4.4 1.6 6.6L12 16.3 6.2 19.8l1.6-6.6L2.6 8.8l6.8-.5z"/></svg>' : '') +
        '<button class="infobtn" aria-label="Widget options">' +
        icon(I.info).replace('<svg', '<svg class="info"') + '</button>' +
        '</div>' + scopeLine(effectiveScope(id, cell)) + spec.body +
        '<a class="seemore" href="#" data-noop>see all &rarr;</a>' +
        '<span class="rz e" data-rz="e"></span>' +
        '<span class="rz s" data-rz="s"></span>' +
        '<span class="rz se" data-rz="se"></span>';

      /* In edit mode the info icon is the action menu, which is what the real
         one does: one affordance per widget instead of a second control that
         only exists while you are editing. */
      $('.infobtn', card).onclick = function (e) {
        e.stopPropagation();
        if (!document.body.classList.contains('editing')) {
          toast('Turn on Edit layout to change this widget');
          return;
        }
        openWidgetMenu(e.currentTarget, ci);
      };
      wrap.appendChild(card);
      if (cell.h) { card.style.minHeight = cell.h + 'px'; }
      wireDrag(wrap, ci);
      wireResize(wrap, cell);
      grid.appendChild(wrap);
    });

    var add = el('div', 'addtile', '<div>' + icon(I.plus) + '<span>Add widget</span></div>');
    add.onclick = openDrawer;
    grid.appendChild(add);
  }

  /* ------------------------------------------------------------ drag */
  var dragFrom = null;
  function wireDrag(node, i) {
    var grip = $('.grip', node);
    grip.onmousedown = function () { node.draggable = true; };
    node.addEventListener('dragstart', function (e) {
      dragFrom = i; node.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      try { e.dataTransfer.setData('text/plain', String(i)); } catch (err) { /* Safari */ }
    });
    node.addEventListener('dragend', function () {
      node.draggable = false; node.classList.remove('dragging');
      [].forEach.call(document.querySelectorAll('.cell'), function (c) { c.classList.remove('dropbefore'); });
    });
    node.addEventListener('dragover', function (e) {
      if (dragFrom === null || dragFrom === i) { return; }
      e.preventDefault(); node.classList.add('dropbefore');
    });
    node.addEventListener('dragleave', function () { node.classList.remove('dropbefore'); });
    node.addEventListener('drop', function (e) {
      e.preventDefault();
      if (dragFrom === null || dragFrom === i) { return; }
      mark();
      var moved = S.cells.splice(dragFrom, 1)[0];
      S.cells.splice(i, 0, moved);
      dragFrom = null; S.dirty = true; save(); renderGrid();
    });
  }

  /* ------------------------------------------------------------ menus */
  function closeMenu() { $('#menu').hidden = true; }
  document.addEventListener('click', closeMenu);

  function openMenuAt(node, html, wire) {
    var m = $('#menu');
    m.innerHTML = html; m.hidden = false;
    var r = node.getBoundingClientRect();
    m.style.top = (window.scrollY + r.bottom + 6) + 'px';
    m.style.left = Math.min(window.scrollX + r.left - 200, window.innerWidth - 260) + 'px';
    m.onclick = function (e) { e.stopPropagation(); };
    if (wire) { wire(m); }
  }

  function openWidgetMenu(node, ci) {
    var cell = S.cells[ci];
    var sizes = [[1, 'Small'], [2, 'Medium'], [3, 'Large (full width)']];
    openMenuAt(node,
      '<button data-a="expand">Expand</button>' +
      '<button data-a="scope">Scope this widget</button>' +
      '<button data-a="replace">Replace widget</button>' +
      '<button data-a="delete">Delete widget</button>' +
      '<button data-a="move">Move</button>' +
      '<div class="sep"></div>' +
      '<button data-a="merge">Merge with next stack</button>' +
      (cell.w.length > 1 ? '<button data-a="unstack">Unstack this widget</button>' : '') +
      '<div class="lbl">Size</div>' +
      sizes.map(function (s) {
        return '<button data-a="size" data-v="' + s[0] + '">' + s[1] +
          (cell.size === s[0] ? icon(I.check).replace('<svg', '<svg class="ck"') : '') + '</button>';
      }).join(''),
      function (m) {
        m.querySelectorAll('button').forEach(function (b) {
          b.onclick = function () {
            var a = b.dataset.a;
            if (a === 'scope') { openScopeMenu(node, ci); return; }
            mark();
            if (a === 'size') { cell.size = Number(b.dataset.v); }
            else if (a === 'delete') { S.cells.splice(ci, 1); }
            else if (a === 'expand') { cell.size = 3; }
            else if (a === 'unstack') {
              var id = cell.w.splice(cell.on || 0, 1)[0];
              cell.on = 0;
              S.cells.splice(ci + 1, 0, { w: [id], size: 1 });
            } else if (a === 'merge') {
              var nxt = S.cells[ci + 1];
              if (nxt) { cell.w = cell.w.concat(nxt.w); S.cells.splice(ci + 1, 1); }
            } else if (a === 'replace') { openDrawer(ci); }
            else if (a === 'move') { toast('Drag the grip to move a widget'); }
            S.dirty = true; save(); closeMenu(); renderGrid();
          };
        });
      });
  }


  /* The one-level-down scope picker. Deliberately a short list rather than a
     search: a widget pinned to something the page cannot reach is a card whose
     numbers nobody can trace back, and the way to keep that from happening is
     to not offer it. */
  function openScopeMenu(node, ci) {
    var cell = S.cells[ci];
    var id = cell.w[cell.on || 0];
    var cur = effectiveScope(id, cell);
    var html = '';
    dimsFor(id).forEach(function (d) {
      html += '<div class="lbl">' + esc(label(d)) + '</div>';
      SCOPE_CHOICES[d].forEach(function (v) {
        html += '<button data-k="' + d + '" data-v="' + esc(v) + '">' + esc(v) +
          (cur.src === 'widget' && cur.k === d && cur.v === v
            ? icon(I.check).replace('<svg', '<svg class="ck"') : '') + '</button>';
      });
    });
    html += '<div class="sep"></div>' +
      '<button data-k="">Follow the page scope</button>';
    openMenuAt(node, html, function (m) {
      m.querySelectorAll('button').forEach(function (b) {
        b.onclick = function () {
          mark();
          if (b.dataset.k) { cell.scope = { k: b.dataset.k, v: b.dataset.v }; }
          else { delete cell.scope; }
          S.dirty = true;
          closeMenu(); renderGrid(); save();
        };
      });
    });
  }

  /* The spec creates a named layout the first time you change anything, so what
     you are editing has somewhere to be saved to before you think to ask for
     one. */
  function nameOnFirstEdit() {
    if (S.named) { return; }
    S.named = 'My ' + (S.persona === 'leader' ? 'Leader' : 'Contributor') + ' view';
    S.presets.push({ name: S.named, cells: clone(S.cells), persona: S.persona });
    toast('Saved as \u201c' + S.named + '\u201d');
  }

  /* The auto-named layout is not a snapshot, it is where your edits live from
     the first one onwards. Keeping it in step here rather than at each mutation
     is the difference between one rule and eight chances to forget it. */
  function syncNamed() {
    if (!S.named) { return; }
    for (var i = 0; i < S.presets.length; i++) {
      if (S.presets[i].name === S.named) { S.presets[i].cells = clone(S.cells); return; }
    }
  }

  /* ----------------------------------------------------------- drawer */
  var replaceAt = null;
  function openDrawer(ci) {
    replaceAt = (typeof ci === 'number') ? ci : null;
    $('#drawer').hidden = false; $('#scrim').hidden = false;
    $('#drawerSearch').value = '';
    renderDrawer('');
    $('#drawerSearch').focus();
  }
  function closeDrawer() { $('#drawer').hidden = true; $('#scrim').hidden = true; replaceAt = null; }

  function inLayout(id) {
    return S.cells.some(function (c) { return c.w.indexOf(id) > -1; });
  }
  function renderDrawer(q) {
    q = (q || '').toLowerCase();
    var box = $('#drawerBody'); box.innerHTML = '';
    CATEGORIES.forEach(function (pair) {
      var hits = pair[1].filter(function (w) {
        return !q || w[1].toLowerCase().indexOf(q) > -1 || w[2].toLowerCase().indexOf(q) > -1;
      });
      if (!hits.length) { return; }
      box.appendChild(el('p', 'cat', pair[0]));
      hits.forEach(function (w) {
        var row = el('div', 'wrow' + (inLayout(w[0]) ? ' on' : ''),
          '<span><b>' + esc(w[1]) + '</b><small>' + esc(w[2]) + '</small></span><span class="add">+</span>');
        row.onclick = function () {
          mark();
          if (replaceAt != null) {
            S.cells[replaceAt].w[S.cells[replaceAt].on || 0] = w[0];
          } else {
            S.cells.push({ w: [w[0]], size: 1 });
          }
          S.dirty = true; save(); closeDrawer(); renderGrid();
          toast(esc(w[1]) + ' added');
        };
        box.appendChild(row);
      });
    });
    if (!box.children.length) { box.appendChild(el('p', 'cat', 'Nothing matches “' + esc(q) + '”')); }
  }

  /* ------------------------------------------------------------ toast */
  var toastTimer = null;
  function toast(msg) {
    var t = $('#toast'); t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.hidden = true; }, 2200);
  }

  /* -------------------------------------------------------- onboarding */
  function renderOnboard() {
    /* Two rows, matching the two dimensions the page scopes by. An application
       row was here and came out with the third selector: an account already
       implies the application that owns it, so asking about both is asking the
       same question twice and giving the reader two chances to answer it
       inconsistently. */
    var rows = [
      ['Accounts (3)', 'detected from your groups', ['acct-atlas-prod', 'acct-atlas-qa', 'acct-beacon-prod']],
      ['Divisions (0)', 'none found; add one for the wider layout', []]
    ];
    var box = $('#obRows');
    box.onclick = function (e) {
      var x = e.target.closest('.ob-chip button');
      if (x) { x.parentNode.remove(); return; }
      var add = e.target.closest('.ob-add');
      if (!add) { return; }
      var row = add.closest('.ob-row');
      var div = row === box.lastElementChild;
      var v = div ? 'Platform Engineering' : 'acct-cinder-prod';
      if (row.querySelector('.ob-chip')) { v = div ? 'Identity Services' : 'acct-delta-prod'; }
      var chip = document.createElement('span');
      chip.className = 'ob-chip';
      chip.innerHTML = esc(v) + '<button aria-label="Remove">\u00d7</button>';
      add.parentNode.insertBefore(chip, add);
    };
    box.innerHTML = rows.map(function (r) {
      return '<div class="ob-row"><span class="k">' + r[0] + '<em>' + r[1] + '</em></span>' +
        '<div class="ob-chips">' + r[2].map(function (v) {
          return '<span class="ob-chip">' + esc(v) + '<button aria-label="Remove">×</button></span>';
        }).join('') + '<button class="ob-add">+ add</button></div></div>';
    }).join('');
  }


  /* ------------------------------------------------------------- history
     Cmd/Ctrl+Z. Every edit pushes the layout it replaced, which is cheap at
     this size and means undo cannot disagree with what is on screen: it does
     not replay an action, it restores a state. */
  var HIST = [];
  function mark() {
    HIST.push(clone(S.cells));
    if (HIST.length > 40) { HIST.shift(); }
    nameOnFirstEdit();
  }

  function undo() {
    if (!HIST.length) { toast('Nothing to undo'); return; }
    S.cells = HIST.pop(); S.dirty = true; save(); renderGrid();
    toast('Undone');
  }

  /* -------------------------------------------------------------- resize
     Right edge for width, bottom edge for height, corner for both. Width snaps
     to the three column sizes because the grid has three columns and a card
     between two of them is a card in the wrong place. */
  function wireResize(node, cell) {
    var cols = node.parentNode ? node.parentNode.getBoundingClientRect().width : 900;
    [].forEach.call(node.querySelectorAll('.rz'), function (h) {
      h.addEventListener('mousedown', function (e) {
        e.preventDefault(); e.stopPropagation();
        var kind = h.dataset.rz;
        var start = { x: e.clientX, y: e.clientY };
        var card = node.querySelector('.card');
        var h0 = card.getBoundingClientRect().height;
        var w0 = cell.size;
        var grid = $('#grid').getBoundingClientRect().width;
        var col = grid / 3;
        h.classList.add('on'); node.classList.add('resizing');
        mark();

        function move(ev) {
          if (kind !== 's') {
            var d = Math.round((ev.clientX - start.x) / col);
            var n = Math.min(3, Math.max(1, w0 + d));
            if (n !== cell.size) {
              cell.size = n;
              node.className = 'cell w' + n + ' resizing';
              if (n === 1) { node.className = 'cell resizing'; }
            }
          }
          if (kind !== 'e') {
            var nh = Math.max(148, h0 + (ev.clientY - start.y));
            cell.h = Math.round(nh);
            card.style.minHeight = cell.h + 'px';
          }
        }
        function up() {
          document.removeEventListener('mousemove', move);
          document.removeEventListener('mouseup', up);
          h.classList.remove('on'); node.classList.remove('resizing');
          S.dirty = true; save(); renderGrid();
        }
        document.addEventListener('mousemove', move);
        document.addEventListener('mouseup', up);
      });
    });
  }

  /* ---------------------------------------------------------------- tour
     Five steps, once, remembered. Each step names a real element and the hole
     is cut from that element's own box, so the tour cannot drift out of step
     with a layout it does not control. */
  var TOUR = [
    ['#scopeChips', 'Confirm your scope',
     'What you are responsible for, not what your title says. The layout follows from this.'],
    ['#editBtn', 'Reshape it any time',
     'Edit layout adds a grip to every widget, an action menu on each, and drag handles on the right and bottom edges.'],
    ['#grid .addtile, #grid', 'Add what is missing',
     'Twenty-four widgets under six headings, searchable. Everything in the picker already exists somewhere in the product.'],
    ['#shareBtn', 'Save a named preset',
     'Your layout is yours. Save it under a name and the preset you started from is still there to go back to.'],
    ['#personaBtn', 'Switch how you are reading',
     'Contributor is one account. Leader is a division. Switching with unsaved edits asks you to name them first.']
  ];
  var tourI = 0;
  function tourShow(i) {
    tourI = i;
    var step = TOUR[i];
    var target = null;
    step[0].split(',').some(function (sel) {
      target = document.querySelector(sel.trim()); return !!target;
    });
    var r = target ? target.getBoundingClientRect() : { top: 120, left: 120, width: 200, height: 40 };
    var pad = 8;
    var hole = $('#tourHole');
    hole.style.top = (r.top - pad) + 'px';
    hole.style.left = (r.left - pad) + 'px';
    hole.style.width = (r.width + pad * 2) + 'px';
    hole.style.height = (r.height + pad * 2) + 'px';

    var tip = $('#tourTip');
    var below = r.bottom + 18;
    if (below + 190 > window.innerHeight) { below = Math.max(20, r.top - 210); }
    tip.style.top = below + 'px';
    tip.style.left = Math.min(Math.max(16, r.left), window.innerWidth - 340) + 'px';

    $('#tourStep').textContent = 'Step ' + (i + 1) + ' of ' + TOUR.length;
    $('#tourTitle').textContent = step[1];
    $('#tourBody').textContent = step[2];
    $('#tourBack').disabled = i === 0;
    $('#tourNext').textContent = i === TOUR.length - 1 ? 'Done' : 'Next';
    $('#tourList').innerHTML = '<b>Tour contents</b>' + TOUR.map(function (t, j) {
      return '<li class="' + (j === i ? 'is-on' : '') + '">' + (j + 1) + '. ' + esc(t[1]) + '</li>';
    }).join('');
  }
  function tourStart() { $('#tour').hidden = false; tourShow(0); }
  function tourEnd() {
    $('#tour').hidden = true; S.toured = true; save();
  }

  /* ------------------------------------------------------------ wiring */
  function init() {
    load();
    render();

    $('#editBtn').onclick = function () {
      var on = document.body.classList.toggle('editing');
      this.classList.toggle('is-on', on);
      $('span', this).textContent = on ? 'Done editing' : 'Edit layout';
      if (!on) { save(); toast('Layout saved'); }
    };

    $('#shareBtn').onclick = function (e) {
      e.stopPropagation();
      openMenuAt(this,
        '<button data-a="tpl">Apply a template<small>Start from a curated layout</small></button>' +
        '<button data-a="save">Save layout<small>Persist your changes so they survive a refresh</small></button>' +
        '<button data-a="preset">Save current as preset<small>Name this layout so you can load it later</small></button>' +
        '<div class="sep"></div>' +
        '<button data-a="link">Copy a link<small>Recipient sees the same dashboard</small></button>',
        function (m) {
          m.querySelectorAll('button').forEach(function (b) {
            b.onclick = function () {
              closeMenu();
              if (b.dataset.a === 'link') { toast('Layout link copied to clipboard'); }
              else if (b.dataset.a === 'preset') {
                S.presets.push({ name: S.persona === 'leader' ? 'Leader, ' + new Date().toLocaleDateString() : 'Contributor, ' + new Date().toLocaleDateString(), n: S.cells.length });
                save(); toast('Saved as a named preset');
              } else if (b.dataset.a === 'save') { save(); toast('Layout saved'); }
              else { openTemplates(b); }
            };
          });
        });
    };

    $('#personaBtn').onclick = function (e) {
      e.stopPropagation();
      openMenuAt(this,
        '<button data-p="contributor">Contributor<small>One account</small></button>' +
        '<button data-p="leader">Leader<small>A division, or all of them</small></button>',
        function (m) {
          m.querySelectorAll('button').forEach(function (b) {
            b.onclick = function () {
              closeMenu();
              var p = b.dataset.p;
              if (p === S.persona) { return; }
              if (S.dirty) { pendingPersona = p; $('#saveAs').hidden = false; return; }
              switchTo(p);
            };
          });
        });
    };

    $('#settingsBtn').onclick = function () { $('#onboard').hidden = false; renderOnboard(); };
    $('#railSettings').onclick = function () { $('#onboard').hidden = false; renderOnboard(); };

    $('#drawerClose').onclick = closeDrawer;
    $('#scrim').onclick = closeDrawer;
    $('#drawerSearch').oninput = function () { renderDrawer(this.value); };

    /* The persona is read off the scope you confirmed, not off a job title.
       Confirming a division is what makes you a Leader, which is the whole
       point of showing you the detected scope before anything saves: the thing
       you are correcting is the thing that decides the page. */
    $('#obConfirm').onclick = function () {
      var hasDivision = !!$('#obRows .ob-row:last-child .ob-chip');
      var p = hasDivision ? 'leader' : 'contributor';
      if (p !== S.persona) { S.persona = p; S.cells = clone(PRESETS[p]); }
      S.onboarded = true; save(); render(); $('#onboard').hidden = true;
      if (!S.toured) { setTimeout(tourStart, 300); }
    };
    $('#obManual').onclick = function () { S.onboarded = true; save(); $('#onboard').hidden = true; };

    $('#saCancel').onclick = function () { $('#saveAs').hidden = true; pendingPersona = null; };
    $('#saDiscard').onclick = function () { $('#saveAs').hidden = true; switchTo(pendingPersona); };
    $('#saSave').onclick = function () {
      S.presets.push({ name: $('#saName').value || 'Untitled', n: S.cells.length,
        cells: clone(S.cells) });
      $('#saveAs').hidden = true; switchTo(pendingPersona);
      toast('Saved. You can load it from Share.');
    };

    document.addEventListener('click', function (e) {
      var a = e.target.closest('[data-noop]');
      if (a) { e.preventDefault(); toast('Demo build: this link is not wired up'); }
    });

    /* the notices carousel advances on its own, like the real one */
    setInterval(function () {
      if (!inLayout('notices') || document.body.classList.contains('editing')) { return; }
      S.notice = ((S.notice || 0) + 1) % D.notices.length;
      renderGrid();
    }, 6000);

    document.addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault(); undo();
      }
    });

    $('#tourNext').onclick = function () {
      if (tourI === TOUR.length - 1) { tourEnd(); } else { tourShow(tourI + 1); }
    };
    $('#tourBack').onclick = function () { tourShow(Math.max(0, tourI - 1)); };
    $('#tourSkip').onclick = tourEnd;
    window.addEventListener('resize', function () {
      if (!$('#tour').hidden) { tourShow(tourI); }
    });

    /* Skeletons first, then each widget as its data resolves, top of the page
       first. The real one streams because it talks to eight endpoints; this one
       fakes the timing, and says so in the README. */
    setTimeout(function () {
      S.booting = false; renderGrid();
      if (S.onboarded && !S.toured) { setTimeout(tourStart, 350); }
    }, 620);

    if (!S.onboarded) { $('#onboard').hidden = false; renderOnboard(); }
  }

  function openTemplates(node) {
    var mine = TEMPLATES.filter(function (t) { return t.for === S.persona; });
    openMenuAt(node, '<div class="lbl">Curated templates</div>' +
      mine.map(function (t, i) {
        return '<button data-t="' + i + '">' + esc(t.name) +
          '<small>' + t.keep.length + ' widgets</small></button>';
      }).join('') +
      (S.presets.length ? '<div class="sep"></div><div class="lbl">Your presets</div>' +
        S.presets.map(function (pr, i) {
          return '<button data-p="' + i + '">' + esc(pr.name) +
            '<small>' + pr.n + ' widgets</small></button>';
        }).join('') : ''),
      function (m) {
        m.querySelectorAll('button').forEach(function (b) {
          b.onclick = function () {
            closeMenu(); mark();
            if (b.dataset.t != null) {
              var t = mine[Number(b.dataset.t)];
              S.cells = t.keep.map(function (id) { return { w: [id], size: 1 }; });
              toast('Applied ' + t.name);
            } else {
              var pr = S.presets[Number(b.dataset.p)];
              if (pr.cells) { S.cells = clone(pr.cells); }
              toast('Loaded ' + pr.name);
            }
            S.dirty = true; save(); renderGrid();
          };
        });
      });
  }

  var pendingPersona = null;
  function switchTo(p) {
    S.persona = p; S.cells = clone(PRESETS[p]); S.dirty = false; S.app = 'all';
    pendingPersona = null; save(); render();
    $('#savedList').innerHTML = '';
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();
