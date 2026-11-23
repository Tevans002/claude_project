// game.js: interaction state machine. Uses PROBLEMS (data.js) and UI (ui.js).
var Game = (function () {
  var PAUSE = 1000;
  var S = { idx: 0, p: null, st: null, level: 0, phase: '', busy: false, timer: null };
  var api = { state: S };

  var PROMPTS = {
    node:  function (i) { return 'Level ' + i + ': what work does ONE node do?'; },
    total: function (i) { return 'Level ' + i + ': what is the total work at this level?'; },
    next:  function (i) { return 'How many nodes are at level ' + (i + 1) + '?'; }
  };

  // Current choice set, or undefined outside the tree phase.
  function set() { var L = S.p.levels[S.level]; return L && L[S.phase]; }

  function later(fn) {
    S.busy = true;
    S.timer = setTimeout(function () { S.busy = false; fn(); }, PAUSE);
  }

  function ask(phase) {
    S.phase = phase;
    S.st.target = phase === 'next' ? null : { level: S.level, field: phase };
    UI.renderTree(S.p, S.st, -1);
    UI.prompt(PROMPTS[phase](S.level));
    UI.choices(set().choices);
    UI.hint([]);
  }

  function advance(t) {
    var i = S.level, L = S.st.levels[i];
    if (S.phase === 'next') {                 // grow the tree, animate new edges
      S.level = i + 1;
      S.st.levels[i + 1] = { shown: true };
      S.st.target = { level: i + 1, field: 'node' };
      UI.renderTree(S.p, S.st, i + 1);
      return later(function () { ask('node'); });
    }
    L[S.phase] = t;                           // fills all siblings / the total box
    S.st.target = null;
    UI.renderTree(S.p, S.st, -1);
    if (S.phase === 'node') return later(function () { ask('total'); });
    if (i < S.p.levels.length - 1) return later(function () { ask('next'); });
    later(finishTree);
  }

  function finishTree() {
    S.phase = 'quiz';
    UI.prompt('Tree complete! Answer the quiz below.');
    UI.choices(null);
    UI.hint([]);
    UI.log('');
    if (api.startQuiz) api.startQuiz(S.p);
  }

  function onChoice(e) {
    var b = e.target.closest('.quiz-btn');
    if (!b || b.disabled || S.busy || !set()) return;
    var c = set().choices[b.dataset.i];
    UI.markChoice(b.dataset.i, !!c.ok);
    if (!c.ok) { UI.log(c.why, true); UI.hint(set().hint || []); return; }
    UI.log('Correct!');
    UI.hint([]);
    advance(c.t);
  }

  function load(idx) {
    clearTimeout(S.timer);
    S.idx = idx % PROBLEMS.length;
    S.p = PROBLEMS[S.idx];
    S.st = { levels: [{ shown: true }], target: null };
    S.level = 0;
    S.busy = false;
    UI.renderEq(S.p);
    UI.showQuiz(false);
    UI.log('');
    ask('node');
  }

  document.getElementById('choices').addEventListener('click', onChoice);
  document.getElementById('resetBtn').addEventListener('click', function () { load(S.idx); });
  document.getElementById('newBtn').addEventListener('click', function () { load(S.idx + 1); });

  api.load = load;
  load(0);
  return api;
})();

// game.js part 2: quiz. Uses Game.state; click delegation on #quiz.
(function (G) {
  var Q = { solved: 0, firstTry: 0, missed: [] };

  G.startQuiz = function (p) {
    Q = { solved: 0, firstTry: 0, missed: [] };
    UI.renderQuiz(p);
    UI.showQuiz(true);
    document.getElementById('quiz').scrollIntoView({ behavior: 'smooth' });
  };

  document.getElementById('quiz').addEventListener('click', function (e) {
    var S = G.state, b = e.target.closest('.quiz-btn');
    if (!b || b.disabled || S.phase !== 'quiz') return;
    var qi = Number(b.dataset.q), q = S.p.quiz[qi], c = q.choices[b.dataset.i];
    UI.markQuiz(qi, b.dataset.i, !!c.ok);

    if (!c.ok) {
      Q.missed[qi] = true;
      UI.quizWhy(qi, c.why, true);
      UI.hint(q.hint || []);
      return;
    }
    UI.quizWhy(qi, 'Correct!');
    UI.hint([]);
    Q.solved++;
    if (!Q.missed[qi]) Q.firstTry++;

    if (Q.solved === S.p.quiz.length) {
      S.phase = 'done';
      UI.prompt('Quiz complete!');
      UI.log('All ' + Q.solved + ' correct. First try: ' + Q.firstTry + '/' +
             Q.solved + '. Press "New problem" for a different case.');
    }
  });
})(Game);