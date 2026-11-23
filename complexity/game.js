// complexity/game.js  (state machine; later parts extend it with (function(G){...})(Game))
var Game = (function () {
  var S = {
    p: null,        // current problem (an entry of RT.problems)
    step: 'tf',     // 'tf' -> 'proof' -> 'done'
    busy: false,    // true while clicks must be ignored (pauses, morph)
    timer: null,    // the one pending setTimeout
    tries: 0,       // wrong clicks on the current problem
    choices: []     // the list currently rendered in #choices
  };

  function $(id) { return document.getElementById(id); }

  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  // #log text; isErr adds the red .error style
  function say(msg, isErr) {
    var l = $('log');
    l.textContent = msg || '';
    l.className = isErr ? 'error' : '';
  }

  // Renders list into #choices. fixed = authored order; otherwise shuffled.
  // data-i is always the index in `list`, so the click handler never depends on position.
  function renderChoices(list, fixed) {
    var host = $('choices'), order = list.map(function (_, i) { return i; });
    if (!fixed) shuffle(order);
    host.innerHTML = '';
    order.forEach(function (i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip clickable';
      b.setAttribute('data-i', i);
      b.textContent = list[i].text;
      host.appendChild(b);
    });
    S.choices = list;
  }

  // Sticky bar: the assumption line, then the statement with its deciding phrase boxed
  function renderStatement(p) {
    var bar = $('statement');
    bar.innerHTML = '';
    bar.setAttribute('data-world', p.world);
    var a = document.createElement('div'), st = document.createElement('strong');
    st.textContent = 'True or False. Assume ' + (p.world === 'eq' ? 'P = NP' : 'P ≠ NP') + '.';
    a.appendChild(st);
    var s = document.createElement('div');
    p.parts.forEach(function (x) {
      if (typeof x === 'string') { s.appendChild(document.createTextNode(x)); return; }
      var sp = document.createElement('span');
      sp.className = 'eq-part';
      sp.textContent = x.k;
      s.appendChild(sp);
    });
    bar.appendChild(a);
    bar.appendChild(s);
  }

  // Makes the SVG show `world`. Plays the collapse morph if the diagram is in the other world.
  function showWorld(world) {
    var cur = $('euler').getAttribute('data-world');
    if (!cur) { UI.drawEuler(world); return; }
    UI.drawEuler(cur);                       // clean redraw (also clears marks)
    if (cur === world) return;
    S.busy = true;                           // clicks blocked until the morph ends
    UI.morph(world, function () { S.busy = false; });
  }

  // p is a problem object or an id such as 'a' or 'h2'
  function load(p) {
    if (typeof p === 'string') {
      var id = p;
      p = RT.problems.filter(function (x) { return x.id === id; })[0];
      if (!p) throw new Error('unknown problem ' + id);
    }
    clearTimeout(S.timer);
    S.timer = null;
    S.busy = false;
    UI.stopMorph();
    UI.stopPulse();

    S.p = p;
    S.step = 'tf';
    S.tries = 0;

    renderStatement(p);
    $('prompt').textContent = 'Step 1: is the statement True or False?';
    say('');
    renderChoices(p.tf, true);               // T/F stays in authored order

    if (p.view === 'reduce') {
      UI.showView('reduce');
      UI.drawReduce(p);
    } else {
      UI.showView('euler');
      showWorld(p.world);
    }
  }

  return { state: S, load: load, say: say, renderChoices: renderChoices };
})();

// ---- Stage 6b: step 1 (True / False) clicks ----
(function (G) {
  var S = G.state;
  function $(id) { return document.getElementById(id); }

  G.handlers = G.handlers || {};      // one click handler per step; Stage 7 adds 'proof'

  function boxPhrase(on) {
    [].forEach.call(document.querySelectorAll('#statement .eq-part'), function (e) {
      e.classList[on ? 'add' : 'remove']('active');
    });
  }

  // Runs ~1s after a correct T/F answer. Stage 7 replaces it with the real step 2.
  G.toProof = function () {
    S.step = 'proof';
    $('prompt').textContent = 'Step 2: ' + S.p.proof.prompt;
    $('choices').innerHTML = '';
    G.say('');
    S.busy = false;
  };

  G.handlers.tf = function (i) {
    var c = S.choices[i];
    if (!c) return;
    if (!c.ok) {
      S.tries++;
      boxPhrase(true);                       // red box on the deciding phrase
      G.say(c.why, true);
      return;
    }
    boxPhrase(false);
    G.say('Correct: ' + (S.p.answer ? 'True' : 'False') + '.');
    S.busy = true;                           // clicks blocked during the pause
    S.timer = setTimeout(function () {
      S.timer = null;
      G.toProof();
    }, 1000);
  };

  // One delegated listener on the container; Reset/load() replace the buttons, not the listener
  $('choices').addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('[data-i]') : null;
    if (!b || S.busy) return;
    var h = G.handlers[S.step];
    if (h) h(parseInt(b.getAttribute('data-i'), 10));
  });
})(Game);

// ---- Stage 7a: step 2, dot proofs in the Euler view ----
(function (G) {
  var S = G.state;
  function $(id) { return document.getElementById(id); }

  function boxPhrase(on) {
    [].forEach.call(document.querySelectorAll('#statement .eq-part'), function (e) {
      e.classList[on ? 'add' : 'remove']('active');
    });
  }

  // Wrap the Stage 6b placeholder: it sets the prompt and clears #choices, we add the dots
  var prevToProof = G.toProof;
  G.toProof = function () {
    prevToProof();
    var p = S.p;
    if (p.view === 'euler' && p.proof.type === 'dot') {
      [].forEach.call(document.querySelectorAll('#euler .dot'), function (d) {
        d.classList.add('clickable');
      });
    }
  };

  G.handlers.dot = function (id) {
    var pick = S.p.proof.picks[id];
    if (!pick) return;
    UI.clearMarks();                              // drop the previous wrong dot
    if (!pick.ok) {
      S.tries++;
      UI.markDot(id, 'wrong');
      boxPhrase(true);                            // red box on the deciding phrase
      G.say(pick.why, true);
      return;
    }
    boxPhrase(false);
    UI.markDot(id, 'right');
    G.say('Correct. ' + S.p.explain);
    S.busy = true;                                // ~1s pause, clicks blocked
    S.timer = setTimeout(function () {
      S.timer = null;
      S.step = 'done';
      S.busy = false;
      G.complete();
    }, 1000);
  };

  // One delegated listener on the SVG container
  $('euler').addEventListener('click', function (e) {
    var d = e.target.closest ? e.target.closest('.dot') : null;
    if (!d || S.busy || S.step !== 'proof') return;
    if (S.p.view !== 'euler' || S.p.proof.type !== 'dot') return;
    G.handlers.dot(d.getAttribute('data-id'));
  });
})(Game);

// ---- Stage 7b: step 2, region proofs in the Euler view ----
(function (G) {
  var S = G.state;
  function $(id) { return document.getElementById(id); }

  function boxPhrase(on) {
    [].forEach.call(document.querySelectorAll('#statement .eq-part'), function (e) {
      e.classList[on ? 'add' : 'remove']('active');
    });
  }

  // Shared ending for a correct step 2: log the explanation, ~1s pause, then 'done'
  G.finish = function () {
    G.say('Correct. ' + S.p.explain);
    S.busy = true;
    S.timer = setTimeout(function () {
      S.timer = null;
      S.step = 'done';
      S.busy = false;
      G.complete();
    }, 1000);
  };

  // Wrap toProof again: make the regions clickable for region proofs
  var prevToProof = G.toProof;
  G.toProof = function () {
    prevToProof();
    if (S.p.view === 'euler' && S.p.proof.type === 'region') {
      [].forEach.call(document.querySelectorAll('#euler .region'), function (r) {
        r.classList.add('clickable');
      });
    }
  };

  G.handlers.region = function (key) {
    var pick = S.p.proof.picks[key];
    if (!pick) return;
    UI.clearMarks();
    if (!pick.ok) {
      S.tries++;
      UI.markRegion(key, true);                   // red dashed outline on the clicked region
      boxPhrase(true);                            // red box on the deciding phrase
      G.say(pick.why, true);
      return;
    }
    boxPhrase(false);
    UI.pulse(key);                                // the deciding region pulses
    G.finish();
  };

  $('euler').addEventListener('click', function (e) {
    var r = e.target.closest ? e.target.closest('.region') : null;
    if (!r || S.busy || S.step !== 'proof') return;
    if (S.p.view !== 'euler' || S.p.proof.type !== 'region') return;
    G.handlers.region(r.getAttribute('data-r'));
  });
})(Game);

// ---- Stage 7c: step 2, proofs in the reduction view ----
(function (G) {
  var S = G.state;
  function $(id) { return document.getElementById(id); }

  function boxPhrase(on) {
    [].forEach.call(document.querySelectorAll('#statement .eq-part'), function (e) {
      e.classList[on ? 'add' : 'remove']('active');
    });
  }
  function cards() { return document.querySelectorAll('#reduce .rcard'); }
  function clearCards() {
    [].forEach.call(cards(), function (c) { c.classList.remove('active'); });
  }

  // Wrap toProof again: make cards clickable (card proofs) or list candidates (g, g2)
  var prevToProof = G.toProof;
  G.toProof = function () {
    prevToProof();
    var p = S.p;
    if (p.view !== 'reduce') return;
    if (p.proof.type === 'card') {
      [].forEach.call(cards(), function (c) { c.classList.add('clickable'); });
    } else if (p.proof.type === 'dot') {
      var picks = p.proof.picks;
      var list = Object.keys(picks).map(function (id) {
        return { id: id, text: picks[id].text, ok: picks[id].ok, why: picks[id].why };
      });
      G.renderChoices(list, false);       // a list, not a diagram, so position carries no meaning
    }
  };

  // Card proof: click the card that inherits hardness
  G.handlers.card = function (side) {
    var pick = S.p.proof.picks[side];
    if (!pick) return;
    clearCards();
    if (!pick.ok) {
      S.tries++;
      document.querySelector('#reduce .rcard[data-c="' + side + '"]').classList.add('active');
      boxPhrase(true);
      G.say(pick.why, true);
      return;
    }
    boxPhrase(false);
    UI.pulseReduce(S.p);                  // the pulse confirms the answer (it outlasts the 1s pause)
    G.finish();
  };

  // Candidate proof: the chosen problem is shown on the "?" card
  G.handlers.cand = function (c) {
    var r = S.p.reduce, d = RT.dots[c.id];
    clearCards();
    var card = document.querySelector('#reduce .rcard[data-c="' + r.concl + '"]');
    card.children[1].textContent = d.label;
    card.querySelector('small').textContent = d.desc;
    if (!c.ok) {
      S.tries++;
      card.classList.add('active');
      boxPhrase(true);
      G.say(c.why, true);
      return;
    }
    boxPhrase(false);
    UI.pulseReduce(S.p);                  // hardness starts at the other end and is blocked
    G.finish();
  };

  // #choices already routes clicks to G.handlers[S.step]; here step is 'proof'
  G.handlers.proof = function (i) {
    var c = S.choices[i];
    if (!c || !c.id) return;
    if (S.p.view === 'reduce' && S.p.proof.type === 'dot') G.handlers.cand(c);
  };

  $('reduce').addEventListener('click', function (e) {
    var c = e.target.closest ? e.target.closest('.rcard') : null;
    if (!c || S.busy || S.step !== 'proof') return;
    if (S.p.view !== 'reduce' || S.p.proof.type !== 'card') return;
    G.handlers.card(c.getAttribute('data-c'));
  });
})(Game);

// ---- Stage 7d: Reset, New problem, preset cycle ----
(function (G) {
  var S = G.state;
  function $(id) { return document.getElementById(id); }

  G.order = RT.problems.map(function (p) { return p.id; });   // a-h, then variants, then P = NP

  G.complete = function () {
    var n = S.tries;
    $('prompt').textContent = 'Problem complete (' +
      (n ? n + ' wrong click' + (n > 1 ? 's' : '') : 'no wrong clicks') +
      '). Click "New problem" for the next one.';
  };

  // Both buttons go through load(), which cancels the timer, morph and pulse and clears busy
  G.reset = function () { G.load(S.p); };
  G.next = function () {
    var i = G.order.indexOf(S.p.id);
    G.load(G.order[(i + 1) % G.order.length]);
  };

  // Delegated on the container. Deliberately NOT blocked by S.busy, so Reset works mid-pause.
  $('controls').addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('button') : null;
    if (!b) return;
    if (b.id === 'btn-reset') G.reset();
    else if (b.id === 'btn-new') G.next();
  });

  G.load(G.order[0]);
})(Game);

// ---- Stage 8b: quiz logic ----
(function (G) {
  var S = G.state;
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text, parent) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  }
  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function plain(p) {
    return p.parts.map(function (x) { return typeof x === 'string' ? x : x.k; }).join('');
  }

  var Q = { order: [], n: 0, step: 'off', busy: false, timer: null,
            wrong: 0, results: [], list: [], p: null, why: null };

  function say(msg, isErr) {
    Q.why.textContent = msg;
    Q.why.className = 'quiz-why' + (isErr ? ' error' : '');
  }

  // Renders one question screen. fixed = authored order; otherwise shuffled (data-i keeps the index).
  function draw(list, fixed, ask) {
    var host = $('quiz'); host.innerHTML = '';
    var q = el('div', 'quiz-q', '', host);
    el('div', '', 'Question ' + (Q.n + 1) + ' of ' + Q.order.length, q);
    el('div', 'quiz-text', 'True or False. Assume P ≠ NP. ' + plain(Q.p), q);
    el('div', '', ask, q);
    var opts = el('div', 'quiz-opts', '', q);
    var order = list.map(function (_, i) { return i; });
    if (!fixed) shuffle(order);
    order.forEach(function (i) {
      var b = el('button', 'quiz-btn', list[i].text, opts);
      b.type = 'button';
      b.setAttribute('data-i', i);
    });
    Q.why = el('div', 'quiz-why', '', q);
    Q.list = list;
  }

  function question() {
    var id = Q.order[Q.n];
    Q.p = RT.problems.filter(function (x) { return x.id === id; })[0];
    Q.wrong = 0;
    Q.step = 'tf';
    draw(Q.p.tf, true, 'Is the statement True or False?');
  }

  function summary() {
    Q.step = 'done';
    var host = $('quiz'); host.innerHTML = '';
    var q = el('div', 'quiz-q', '', host);
    var clean = Q.results.filter(function (r) { return r.wrong === 0; }).length;
    el('div', 'quiz-text', 'Quiz complete: ' + clean + ' of ' + Q.results.length + ' with no wrong clicks.', q);
    Q.results.slice().sort(function (a, b) { return a.id < b.id ? -1 : 1; }).forEach(function (r) {
      var p = RT.problems.filter(function (x) { return x.id === r.id; })[0];
      el('div', r.wrong ? 'quiz-why error' : 'quiz-why',
        '(' + r.id + ') ' + RT.deciding(p) + ': ' +
        (r.wrong ? r.wrong + ' wrong click' + (r.wrong > 1 ? 's' : '') : 'clean'), q);
    });
    [['retry', 'Retry quiz'], ['exit', 'Back to problems']].forEach(function (x) {
      var b = el('button', 'quiz-btn', x[1], q);
      b.type = 'button';
      b.setAttribute('data-act', x[0]);
    });
  }

  function pick(i) {
    var c = Q.list[i], b = $('quiz').querySelector('[data-i="' + i + '"]');
    b.disabled = true;
    if (!c.ok) {
      Q.wrong++;
      b.classList.add('wrong');
      say(c.why, true);
      return;
    }
    b.classList.add('right');
    [].forEach.call($('quiz').querySelectorAll('.quiz-opts button'), function (x) { x.disabled = true; });
    Q.busy = true;                                   // clicks blocked during the pause
    if (Q.step === 'tf') {
      say('Correct: ' + (Q.p.answer ? 'True' : 'False') + '.');
      Q.timer = setTimeout(function () {
        Q.busy = false;
        Q.step = 'phrase';
        draw(RT.quizPhrases(Q.p.id), false,
          'Correct: ' + (Q.p.answer ? 'True' : 'False') + '. Now: which phrase of the statement decides the answer?');
      }, 1000);
    } else {
      Q.results.push({ id: Q.p.id, wrong: Q.wrong });
      say('Correct. ' + Q.p.explain);
      Q.step = 'next';
      Q.timer = setTimeout(function () {
        Q.busy = false;
        var nb = el('button', 'quiz-btn', Q.n === Q.order.length - 1 ? 'See results' : 'Next question', Q.why.parentNode);
        nb.type = 'button';
        nb.setAttribute('data-act', 'next');
      }, 1000);
    }
  }

  function start() {
    clearTimeout(S.timer); S.timer = null; S.busy = false;   // stop anything the game left running
    UI.stopMorph(); UI.stopPulse();
    clearTimeout(Q.timer);
    S.step = 'quiz';                                         // no game handler uses this step
    document.querySelector('.layout').classList.add('hidden');
    $('statement').classList.add('hidden');
    $('quiz').classList.remove('hidden');
    Q.order = shuffle(RT.quizIds.slice());
    Q.n = 0; Q.results = []; Q.busy = false;
    question();
  }

  function exit() {
    clearTimeout(Q.timer);
    Q.step = 'off'; Q.busy = false;
    $('quiz').classList.add('hidden');
    document.querySelector('.layout').classList.remove('hidden');
    $('statement').classList.remove('hidden');
    G.load(S.p);                                             // back to the problem you were on
  }

  $('quiz').addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('button') : null;
    if (!b || b.disabled || Q.busy || Q.step === 'off') return;
    var act = b.getAttribute('data-act');
    if (act === 'next') {
      Q.n++;
      if (Q.n >= Q.order.length) summary(); else question();
    } else if (act === 'retry') start();
    else if (act === 'exit') exit();
    else if (b.hasAttribute('data-i') && (Q.step === 'tf' || Q.step === 'phrase')) {
      pick(parseInt(b.getAttribute('data-i'), 10));
    }
  });

  G.quiz = { state: Q, start: start, exit: exit };
})(Game);

// ---- Stage 8c: quiz entry points ----
(function (G) {
  var S = G.state;
  function $(id) { return document.getElementById(id); }
  function first() { return RT.problems.filter(function (x) { return x.id === G.order[0]; })[0]; }

  // New problem on the last preset starts the quiz instead of wrapping to (a).
  // The 7d click listener calls G.next() by name, so replacing it here is enough.
  G.next = function () {
    if (S.p.id === G.order[G.order.length - 1]) {
      S.p = first();                    // after the quiz, "Back to problems" lands on (a)
      G.quiz.start();
    } else {
      G.load(G.order[G.order.indexOf(S.p.id) + 1]);
    }
  };

  // "Take the quiz" is available at any time. Exiting returns to the problem you were on.
  $('controls').addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('button') : null;
    if (b && b.id === 'btn-quiz') G.quiz.start();
  });

  // The last preset's button says what it will do
  var prevLoad = G.load;
  function label() {
    $('btn-new').textContent =
      S.p.id === G.order[G.order.length - 1] ? 'Finish: start quiz' : 'New problem';
  }
  G.load = function (p) { prevLoad(p); label(); };
  label();
})(Game);