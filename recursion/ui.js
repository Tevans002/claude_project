// ui.js: rendering only. No game state and no click handlers (game.js does those).
// st = { levels: [{shown, node, total}, ...], target: {level, field: 'node'|'total'} }
var UI = (function () {
  var $ = function (id) { return document.getElementById(id); };
  var SVG = 'http://www.w3.org/2000/svg';
  var last = null;                      // {p, st}, kept for redraw on resize

  function short(t) { var s = String(t).split(' = '); return s[s.length - 1]; }

  function renderEq(p) {
    $('eq').innerHTML = p.eq.map(function (e) {
      return e.k ? '<span class="eq-part" data-k="' + e.k + '">' + e.t + '</span>'
                 : '<span>' + e.t + '</span>';
    }).join('');
  }

  // Red-box the equation parts whose keys are in the list. hint([]) clears.
  function hint(keys) {
    var parts = $('eq').querySelectorAll('.eq-part');
    for (var i = 0; i < parts.length; i++) {
      parts[i].classList.toggle('active', keys.indexOf(parts[i].dataset.k) >= 0);
    }
  }

  function renderTree(p, st, animLevel) {
    last = { p: p, st: st };
    var t = st.target || {}, html = '';
    st.levels.forEach(function (L, i) {
      if (!L || !L.shown) return;
      var n = p.levels[i].nodes, compact = n > 8, nodes = '';
      for (var j = 0; j < n; j++) {
        var cls = 'node' + (compact ? ' compact' : '') + (L.node ? '' : ' empty') +
                  (t.level === i && t.field === 'node' && j === 0 ? ' target' : '');
        nodes += '<span class="' + cls + '" data-level="' + i + '" data-i="' + j + '">' +
                 (L.node ? short(L.node) : '?') + '</span>';
      }
      var tcls = 'level-total' + (L.total ? ' filled' : '') +
                 (t.level === i && t.field === 'total' ? ' target' : '');
      html += '<div class="level-row"><span class="level-label">ℓ = ' + i + '</span>' +
              '<div class="nodes' + (compact ? ' compact' : '') + '">' + nodes + '</div>' +
              '<span class="' + tcls + '" data-level="' + i + '">' + (L.total || '?') +
              '</span></div>';
    });
    $('rows').innerHTML = html;
    drawEdges(animLevel);
  }

  // Redraws every edge. Only edges into animLevel animate; the rest are static.
  function drawEdges(animLevel) {
    var svg = $('edges');
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    if (!last) return;
    var box = svg.getBoundingClientRect(), p = last.p;
    for (var i = 1; i < p.levels.length; i++) {
      var L = last.st.levels[i];
      if (!L || !L.shown) continue;
      var a = p.levels[i].nodes / p.levels[i - 1].nodes;
      var pars = $('rows').querySelectorAll('.node[data-level="' + (i - 1) + '"]');
      var kids = $('rows').querySelectorAll('.node[data-level="' + i + '"]');
      for (var j = 0; j < kids.length; j++) {
        line(svg, box, pars[Math.floor(j / a)], kids[j], i === animLevel);
      }
    }
  }

  function line(svg, box, par, kid, anim) {
    if (!par || !kid) return;
    var r1 = par.getBoundingClientRect(), r2 = kid.getBoundingClientRect();
    var l = document.createElementNS(SVG, 'line');
    l.setAttribute('x1', r1.left + r1.width / 2 - box.left);
    l.setAttribute('y1', r1.bottom - box.top);
    l.setAttribute('x2', r2.left + r2.width / 2 - box.left);
    l.setAttribute('y2', r2.top - box.top);
    l.setAttribute('pathLength', 1);
    l.setAttribute('class', anim ? 'edge' : 'edge static');
    svg.appendChild(l);
  }

  window.addEventListener('resize', function () { drawEdges(-1); });

  return { renderEq: renderEq, hint: hint, renderTree: renderTree, drawEdges: drawEdges };
})();

// ui.js part 2: prompt, choices, log, quiz. Rendering only; game.js handles clicks.
(function (U) {
  var $ = function (id) { return document.getElementById(id); };

  function order(n) {                       // shuffled indices 0..n-1
    var a = [];
    for (var i = 0; i < n; i++) a.push(i);
    for (var j = n - 1; j > 0; j--) {
      var k = Math.floor(Math.random() * (j + 1)), t = a[j]; a[j] = a[k]; a[k] = t;
    }
    return a;
  }

  function buttons(choices, extra) {
    return order(choices.length).map(function (i) {
      return '<button class="quiz-btn" data-i="' + i + '"' + (extra || '') + '>' +
             choices[i].t + '</button>';
    }).join('');
  }

  // Marks button i inside root. A right answer disables that group.
  function mark(root, i, ok) {
    var b = root.querySelector('.quiz-btn[data-i="' + i + '"]');
    if (!b) return;
    b.classList.add(ok ? 'right' : 'wrong');
    if (ok) root.querySelectorAll('.quiz-btn').forEach(function (x) { x.disabled = true; });
  }

  U.prompt = function (text) { $('prompt').textContent = text || ''; };
  U.choices = function (choices) { $('choices').innerHTML = choices ? buttons(choices) : ''; };
  U.markChoice = function (i, ok) { mark($('choices'), i, ok); };

  U.log = function (msg, isErr) {
    $('log').textContent = msg || '';
    $('log').classList.toggle('error', !!isErr);
  };

  U.renderQuiz = function (p) {
    $('quiz').innerHTML = '<h2>Quiz: ' + p.name + '</h2>' + p.quiz.map(function (q, qi) {
      return '<div class="quiz-q" data-q="' + qi + '">' +
             '<div class="quiz-text">' + (qi + 1) + '. ' + q.q + '</div>' +
             '<div class="quiz-opts">' + buttons(q.choices, ' data-q="' + qi + '"') + '</div>' +
             '<div class="quiz-why"></div></div>';
    }).join('');
  };
  function qEl(qi) { return $('quiz').querySelector('.quiz-q[data-q="' + qi + '"]'); }
  U.markQuiz = function (qi, i, ok) { mark(qEl(qi), i, ok); };
  U.quizWhy = function (qi, msg, isErr) {
    var w = qEl(qi).querySelector('.quiz-why');
    w.textContent = msg || '';
    w.classList.toggle('error', !!isErr);
  };
  U.showQuiz = function (on) { $('quiz').classList.toggle('hidden', !on); };
})(UI);