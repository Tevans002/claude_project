// complexity/ui.js  (rendering only; later parts extend it with (function(U){...})(UI))
var UI = (function () {
  var NS = 'http://www.w3.org/2000/svg';

  // Create an SVG element, set attributes, optionally append to parent
  function el(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    if (parent) parent.appendChild(e);
    return e;
  }

  // Region labels per world: t = text, x/y = position, s = small style
  var LABELS = {
    neq: [ { t: 'P',           x: 160, y: 138 },
           { t: 'NP',          x: 150, y: 85 },
           { t: 'NP-Complete', x: 360, y: 110 },
           { t: 'NP-hard',     x: 500, y: 110 } ],
    eq:  [ { t: 'P = NP = NP-Complete', x: 220, y: 118 },
           { t: 'NP-hard',              x: 470, y: 90 } ]
  };

  function geo(g) { return { cx: g.cx, cy: g.cy, rx: g.rx, ry: g.ry }; }

  function region(svg, key, cls, g, extra) {
    var a = geo(g);
    a['class'] = 'region ' + cls;
    a['data-r'] = key;
    Object.keys(extra || {}).forEach(function (k) { a[k] = extra[k]; });
    return el('ellipse', a, svg);
  }

  // Draws regions, labels and dots for world 'neq' (P ≠ NP) or 'eq' (P = NP)
  function drawEuler(world) {
    var g = RT.worlds[world], svg = document.getElementById('euler');
    svg.innerHTML = '';
    svg.setAttribute('data-world', world);

    // NP-Complete = NP ∩ NP-hard: draw the NP-hard shape clipped to NP
    var defs = el('defs', {}, svg);
    var clip = el('clipPath', { id: 'clip-np' }, defs);
    var ce = geo(g.np); ce.id = 'clip-np-e';
    el('ellipse', ce, clip);

    region(svg, 'nph', 'region-nph', g.nph);
    region(svg, 'np',  'region-np',  g.np);
    region(svg, 'p',   'region-p',   g.p);
    region(svg, 'npc', 'region-npc', g.nph, { 'clip-path': 'url(#clip-np)' });

    LABELS[world].forEach(function (L) {
      var t = el('text', { 'class': 'rlabel', x: L.x, y: L.y, 'text-anchor': 'middle' }, svg);
      t.textContent = L.t;
    });

    Object.keys(RT.dots).forEach(function (id) {
      var d = RT.dots[id], pos = d[world];
      var c = el('circle', { 'class': 'dot', 'data-id': id, cx: pos.x, cy: pos.y, r: 8 }, svg);
      el('title', {}, c).textContent = d.label + ': ' + d.desc;
      var t = el('text', { 'class': 'dotlabel', x: pos.x + 12, y: pos.y + 4 }, svg);
      t.textContent = d.label;
    });
  }

  return { el: el, drawEuler: drawEuler };
})();

// ---- Stage 4a: collapse morph ----
(function (U) {
  var token = 0;                                   // bumping it cancels a running morph
  function lerp(a, b, t) { return a + (b - a) * t; }
  function ease(t) { return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

  function ellipseJob(e, a, b) {
    return function (t) {
      ['cx', 'cy', 'rx', 'ry'].forEach(function (k) { e.setAttribute(k, lerp(a[k], b[k], t)); });
    };
  }
  function pointJob(e, a, b, dx, dy) {
    var ax = e.tagName === 'text' ? 'x' : 'cx', ay = e.tagName === 'text' ? 'y' : 'cy';
    return function (t) {
      e.setAttribute(ax, lerp(a.x, b.x, t) + dx);
      e.setAttribute(ay, lerp(a.y, b.y, t) + dy);
    };
  }

  U.stopMorph = function () { token++; };

  // Animates the current diagram to world `to` ('neq' or 'eq'), then calls done().
  U.morph = function (to, done, ms) {
    var svg = document.getElementById('euler');
    var from = svg.getAttribute('data-world');
    if (!from) { U.drawEuler(to); if (done) done(); return; }
    if (from === to) { if (done) done(); return; }

    var A = RT.worlds[from], B = RT.worlds[to], my = ++token, jobs = [];
    ms = ms || 1000;

    var regions = svg.querySelectorAll('.region');
    [].forEach.call(regions, function (e) {
      var k = e.getAttribute('data-r');
      if (k === 'npc') k = 'nph';                  // the overlay uses the NP-hard shape
      e.style.transition = 'none';
      jobs.push(ellipseJob(e, A[k], B[k]));
    });
    jobs.push(ellipseJob(svg.querySelector('#clip-np-e'), A.np, B.np));

    var dots = svg.querySelectorAll('.dot'), dls = svg.querySelectorAll('.dotlabel');
    [].forEach.call(dots, function (e, i) {
      var d = RT.dots[e.getAttribute('data-id')];
      jobs.push(pointJob(e, d[from], d[to], 0, 0));
      jobs.push(pointJob(dls[i], d[from], d[to], 12, 4));
    });
    [].forEach.call(svg.querySelectorAll('.rlabel'), function (e) { e.style.opacity = 0; });

    var probe = regions[0], t0 = null;
    function frame(now) {
      if (my !== token || !svg.contains(probe)) return;   // cancelled or redrawn
      if (t0 === null) t0 = now;
      var t = Math.min(1, (now - t0) / ms), k = ease(t);
      jobs.forEach(function (j) { j(k); });
      if (t < 1) requestAnimationFrame(frame);
      else { U.drawEuler(to); if (done) done(); }         // redraw = final labels, clean state
    }
    requestAnimationFrame(frame);
  };
})(UI);

// ---- Stage 4b: pulse and marks ----
(function (U) {
  function svg() { return document.getElementById('euler'); }
  function reg(key) { return svg().querySelector('.region[data-r="' + key + '"]'); }
  function dot(id)  { return svg().querySelector('.dot[data-id="' + id + '"]'); }
  var DOT_STATES = ['active', 'right', 'wrong'];

  // Pulses a region twice (~2s) and then removes the class. Calling it again restarts it.
  U.pulse = function (key) {
    var e = reg(key);
    if (!e) return;
    clearTimeout(e._pt);
    e.classList.remove('pulse');
    void e.getBoundingClientRect();                 // force reflow so the animation restarts
    e.classList.add('pulse');
    e._pt = setTimeout(function () { e.classList.remove('pulse'); }, 2100);
  };

  // Red dashed box on a region (the hint for a wrong answer)
  U.markRegion = function (key, on) {
    var e = reg(key);
    if (e) e.classList[on === false ? 'remove' : 'add']('active');
  };

  // state: 'active' (red ring), 'right' (green), 'wrong' (red), or null to clear
  U.markDot = function (id, state) {
    var e = dot(id);
    if (!e) return;
    DOT_STATES.forEach(function (s) { e.classList.remove(s); });
    if (state && DOT_STATES.indexOf(state) >= 0) e.classList.add(state);
  };

  U.clearMarks = function () {
    [].forEach.call(svg().querySelectorAll('.region'), function (e) {
      clearTimeout(e._pt);
      e.classList.remove('pulse');
      e.classList.remove('active');
    });
    [].forEach.call(svg().querySelectorAll('.dot'), function (e) {
      DOT_STATES.forEach(function (s) { e.classList.remove(s); });
    });
  };
})(UI);

// ---- Stage 5a: reduction view (static) ----
(function (U) {
  function div(cls, parent, text) {
    var e = document.createElement('div');
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    parent.appendChild(e);
    return e;
  }

  // 'euler' shows the SVG diagram, 'reduce' shows the cards
  U.showView = function (view) {
    document.getElementById('euler').classList.toggle('hidden', view === 'reduce');
    document.getElementById('reduce').classList.toggle('hidden', view !== 'reduce');
  };

  function card(row, side, id, hard) {
    var d = id ? RT.dots[id] : null;
    var c = div('rcard' + (hard ? ' hard' : ''), row);
    c.setAttribute('data-c', side);
    div('', c).innerHTML = '<strong>' + side.toUpperCase() + '</strong>';
    div('', c, d ? d.label : '?');
    div('', c).innerHTML = '<small></small>';
    c.lastChild.firstChild.textContent = hard ? 'NP-hard (given)' : d ? d.desc : 'you choose';
    return c;
  }

  // Cards stay A (left) and B (right); only the arrow flips for "from B to A"
  U.drawReduce = function (p) {
    var r = p.reduce, host = document.getElementById('reduce');
    host.innerHTML = '';
    host.setAttribute('data-arrow', r.arrow);

    var from = r.arrow.charAt(0), to = r.arrow.charAt(1);
    div('', host, 'Polynomial reduction from ' + from + ' to ' + to + ':  ' + from + ' ≤ ' + to);

    var row = div('rrow', host);
    card(row, 'a', r.a, r.hardAt === 'a');
    var track = div('rtrack' + (r.arrow === 'BA' ? ' rev' : ''), row);
    div('rpulse', track);
    card(row, 'b', r.b, r.hardAt === 'b');
  };
})(UI);

// ---- Stage 5b: hardness pulse ----
(function (U) {
  var timer = null;

  // Cancels a running pulse without calling done (Reset uses this)
  U.stopPulse = function () {
    clearTimeout(timer);
    timer = null;
    var p = document.querySelector('#reduce .rpulse');
    if (p) p.classList.remove('go', 'blockedback');
  };

  // Hardness starts at problem.reduce.hardAt. If that is the tail of the arrow it travels
  // to the head and the head card inherits it. If it is the head, the pulse is blocked.
  // done(reached) is called after ~1.25s.
  U.pulseReduce = function (p, done) {
    var r = p.reduce, host = document.getElementById('reduce');
    var pulse = host.querySelector('.rpulse');
    if (!pulse) return;
    U.stopPulse();
    var go = r.hardAt === r.arrow.charAt(0).toLowerCase();
    void pulse.offsetWidth;                         // reflow so the animation restarts
    pulse.classList.add(go ? 'go' : 'blockedback');
    timer = setTimeout(function () {
      timer = null;
      pulse.classList.remove('go', 'blockedback');
      if (go) {
        var c = host.querySelector('.rcard[data-c="' + r.concl + '"]');
        if (c) {
          c.classList.add('hard');
          c.querySelector('small').textContent = 'NP-hard (inherited)';
        }
      }
      if (done) done(go);
    }, 1250);
  };
})(UI);