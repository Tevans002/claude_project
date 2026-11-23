// complexity/data.js  (STUB: real data arrives in Stage 2)
// Data format: R(text) = correct choice, W(text, why) = wrong choice.
function R(text) { return { text: text, ok: true }; }
function W(text, why) { return { text: text, ok: false, why: why }; }

var RT = {
  problems: [],
  dots: {},
  worlds: {},
  checks: [],                // Stage 2: example problems (Clique, Sorting, Halting...)

  selfCheck: function () {
    var errs = [];
    function check(cond, msg) { if (!cond) errs.push(msg); }

    // Encoding: fails if the file is read as something other than UTF-8
    check('\u2264' === '≤' && '≤'.length === 1, 'UTF-8 problem: ≤ did not load correctly');
    check('Θ³ℓ≠⊂'.length === 5, 'UTF-8 problem: Θ ³ ℓ ≠ ⊂ did not load correctly');

    // Helpers
    var r = R('x'), w = W('y', 'because');
    check(r.ok === true && r.text === 'x', 'R() shape');
    check(w.ok === false && w.why === 'because', 'W() shape');

    RT.checks.forEach(function (f) { f(check); });
    var msg = errs.length
      ? 'FAIL:\n - ' + errs.join('\n - ')
      : 'OK (' + RT.problems.length + ' problems)';
    console.log(msg);
    return msg;
  }
};

// ---- Stage 2a: geometry, example problems, statements (a)-(d) ----
(function (T) {
  // Ellipses in a 600x400 viewBox. NP-Complete is not stored: it is NP ∩ NP-hard.
  T.worlds = {
    neq: { p:   { cx: 160, cy: 200, rx: 90,  ry: 80 },      // P ≠ NP
           np:  { cx: 250, cy: 200, rx: 190, ry: 150 },
           nph: { cx: 430, cy: 200, rx: 150, ry: 130 } },
    eq:  { p:   { cx: 220, cy: 200, rx: 150, ry: 110 },     // P = NP (P = NP = NP-C)
           np:  { cx: 220, cy: 200, rx: 150, ry: 110 },
           nph: { cx: 300, cy: 200, rx: 270, ry: 180 } }
  };
  // Regions a dot of each kind lies in (order: p, np, nph, npc)
  T.kindRegions = {
    neq: { p: ['p','np'], npc: ['np','nph','npc'], nph: ['nph'] },
    eq:  { npc: ['p','np','nph','npc'], nph: ['nph'] }
  };
  function dot(label, desc, neq, eq) { return { label: label, desc: desc, neq: neq, eq: eq }; }
  T.dots = {
    sorting: dot('Sorting', 'Is this list sorted?',
      { x: 130, y: 170, kind: 'p' },   { x: 140, y: 165, kind: 'npc' }),
    spath:   dot('Shortest Path', 'Is there a path of length ≤ k?',
      { x: 190, y: 235, kind: 'p' },   { x: 140, y: 235, kind: 'npc' }),
    clique:  dot('Clique', 'Is there a clique of size ≥ k?',
      { x: 340, y: 150, kind: 'npc' }, { x: 230, y: 140, kind: 'npc' }),
    vcover:  dot('Vertex Cover', 'Is there a vertex cover of size ≤ k?',
      { x: 350, y: 215, kind: 'npc' }, { x: 250, y: 200, kind: 'npc' }),
    indset:  dot('Independent Set', 'Is there an independent set of size ≥ k?',
      { x: 385, y: 170, kind: 'npc' }, { x: 230, y: 255, kind: 'npc' }),
    sat:     dot('SAT', 'Is the formula satisfiable?',
      { x: 330, y: 255, kind: 'npc' }, { x: 310, y: 170, kind: 'npc' }),
    halt:    dot('Halting', 'Does program M halt on input x? (outside the course, example only)',
      { x: 500, y: 200, kind: 'nph' }, { x: 480, y: 200, kind: 'nph' })
  };

  function within(e, x, y, tol) {
    var dx = (x - e.cx) / e.rx, dy = (y - e.cy) / e.ry;
    return dx * dx + dy * dy <= 1 + tol;
  }
  T.regionsOf = function (world, x, y) {
    var w = T.worlds[world], r = [];
    var p = within(w.p, x, y, 0), np = within(w.np, x, y, 0), nph = within(w.nph, x, y, 0);
    if (p) r.push('p');
    if (np) r.push('np');
    if (nph) r.push('nph');
    if (np && nph) r.push('npc');
    return r;
  };

  // Builds one choice per dot: ids in okIds are R, the rest W. {n} = dot label.
  T.pickDots = function (okIds, def, over) {
    var out = {};
    Object.keys(T.dots).forEach(function (id) {
      var n = T.dots[id].label;
      out[id] = okIds.indexOf(id) >= 0 ? R(n) : W(n, (over && over[id]) || def.replace('{n}', n));
    });
    return out;
  };

  // Hand-copied from the exam; problems whose id appears here are checked against it
  T.examKey = { a: false, b: true, c: false, d: true };

  var NPC = ['clique', 'vcover', 'indset', 'sat'];
  T.problems.push(
    { id: 'a', world: 'neq', answer: false, view: 'euler',
      parts: ['Every problem ', { k: 'in NP is also in P' }, '.'],
      tf: [W('True', 'Under P ≠ NP, some NP problems have no poly-time algorithm. "Every" is a universal claim, so one counterexample breaks it. Check the direction: NP inside P.'),
           R('False')],
      proof: { type: 'dot', needs: { in: ['np'], out: ['p'] },
        prompt: 'Click a problem that is in NP but NOT in P.',
        picks: T.pickDots(NPC, '{n} does not work here.', {
          sorting: 'Sorting is in P, so it fits the claim. You need an NP problem outside P.',
          spath:   'Shortest Path is in P, so it fits the claim. You need an NP problem outside P.',
          halt:    'Halting is not in NP, so it says nothing about a claim on NP.' }) },
      explain: 'Under P ≠ NP, Clique (like SAT) is in NP but has no poly-time algorithm, so it is in NP but not in P. One counterexample kills "every".' },

    { id: 'b', world: 'neq', answer: true, view: 'euler',
      parts: ['Every problem ', { k: 'in P is also in NP' }, '.'],
      tf: [R('True'),
           W('False', 'A poly-time solver is also a poly-time verifier (solve it and ignore the certificate), so P ⊆ NP. Check the direction: P inside NP.')],
      proof: { type: 'region', target: 'p',
        prompt: 'Click the P region, then see where it sits relative to NP.',
        picks: {
          p:   R('P'),
          np:  W('NP', 'NP is the larger set. Click P and look at where it sits.'),
          nph: W('NP-hard', 'NP-hard is not what the statement is about. Click P.'),
          npc: W('NP-Complete', 'NP-Complete is not what the statement is about. Click P.') } },
      explain: 'P sits entirely inside NP: a solver is also a verifier. This holds whether or not P = NP.' },

    { id: 'c', world: 'neq', answer: false, view: 'euler',
      parts: ['NP is the set of problems that ', { k: 'cannot be solved' }, ' in polynomial time.'],
      tf: [W('True', 'NP means "verifiable in poly time", not "unsolvable". P ⊆ NP, so many NP problems CAN be solved in poly time.'),
           R('False')],
      proof: { type: 'dot', needs: { in: ['np', 'p'], out: [] },
        prompt: 'Click a problem that is in NP and CAN be solved in poly time.',
        picks: T.pickDots(['sorting', 'spath'], 'Under P ≠ NP, {n} has no poly-time algorithm, so it fits the claim. You need one that does.', {
          halt: 'Halting is not in NP (and no algorithm solves it at all).' }) },
      explain: 'Sorting is in P, so it is in NP, yet it is solved in poly time. NP ≠ "hard problems"; NP = verifiable in poly time.' },

    { id: 'd', world: 'neq', answer: true, view: 'euler',
      parts: ['If A is ', { k: 'NP-Complete' }, ', then A is in NP.'],
      tf: [R('True'),
           W('False', 'By definition NP-Complete = NP-hard AND in NP. Membership in NP is half of the definition.')],
      proof: { type: 'region', target: 'npc',
        prompt: 'Click the NP-Complete region, then see whether it sits inside NP.',
        picks: {
          npc: R('NP-Complete'),
          p:   W('P', 'P is inside NP but is not NP-hard. NP-Complete = NP ∩ NP-hard.'),
          np:  W('NP', 'That is all of NP. NP-Complete is only the part of NP that is also NP-hard.'),
          nph: W('NP-hard', 'NP-hard extends past NP (e.g. Halting). NP-Complete is only the overlap with NP.') } },
      explain: 'NP-Complete is the overlap of NP-hard and NP, so it lies inside NP by definition.' }
  );

  // ---- checks ----
  T.checks.push(function (check) {
    function ring(e, f) {
      for (var i = 0; i < 72; i++) {
        var a = i * Math.PI / 36;
        if (!f(e.cx + e.rx * Math.cos(a), e.cy + e.ry * Math.sin(a))) return false;
      }
      return true;
    }
    ['neq', 'eq'].forEach(function (w) {
      var g = T.worlds[w];
      ['p', 'np', 'nph'].forEach(function (k) {
        var e = g[k];
        check(e.cx - e.rx >= 0 && e.cx + e.rx <= 600 && e.cy - e.ry >= 0 && e.cy + e.ry <= 400,
          w + '.' + k + ' leaves the 600x400 viewBox');
      });
      check(ring(g.p, function (x, y) { return within(g.np, x, y, 1e-9); }), w + ': P is not inside NP');
      Object.keys(T.dots).forEach(function (id) {
        var d = T.dots[id][w];
        check(T.regionsOf(w, d.x, d.y).join() === T.kindRegions[w][d.kind].join(),
          'dot ' + id + ' (' + w + ') is not in the regions its kind says');
      });
    });
    check(ring(T.worlds.neq.p, function (x, y) { return !within(T.worlds.neq.nph, x, y, 0); }),
      'neq: P overlaps NP-hard');
    check(ring(T.worlds.eq.np, function (x, y) { return within(T.worlds.eq.nph, x, y, 1e-9); }),
      'eq: NP is not inside NP-hard');

    var regionKeys = ['p', 'np', 'nph', 'npc'].sort().join();
    T.problems.forEach(function (p) {
      var id = 'problem ' + p.id + ': ';
      if (T.examKey.hasOwnProperty(p.id)) check(p.answer === T.examKey[p.id], id + 'answer differs from the exam key');
      check(p.parts.filter(function (x) { return typeof x !== 'string'; }).length === 1, id + 'needs exactly one deciding phrase');
      check(p.tf.length === 2 && p.tf[0].text === 'True' && p.tf[1].text === 'False', id + 'T/F must be authored in fixed order True, False');
      check(p.tf.filter(function (c) { return c.ok; }).length === 1 && p.tf[p.answer ? 0 : 1].ok, id + 'tf needs exactly one R, matching the answer');
      var pr = p.proof, keys = Object.keys(pr.picks);
      keys.forEach(function (k) { check(pr.picks[k].ok || pr.picks[k].why, id + 'pick ' + k + ' is a W without a why'); });
      if (pr.type === 'dot') {
        check(!p.answer, id + 'dot proofs are for False statements');
        check(keys.slice().sort().join() === Object.keys(T.dots).sort().join(), id + 'picks must cover every dot');
        Object.keys(T.dots).forEach(function (d) {
          var rg = T.regionsOf(p.world, T.dots[d][p.world].x, T.dots[d][p.world].y);
          var want = pr.needs.in.every(function (r) { return rg.indexOf(r) >= 0; }) &&
                     !pr.needs.out.some(function (r) { return rg.indexOf(r) >= 0; });
          check(pr.picks[d].ok === want, id + 'dot ' + d + ' R/W disagrees with the geometry');
        });
      } else if (pr.type === 'region') {
        var rs = keys.filter(function (k) { return pr.picks[k].ok; });
        check(p.answer, id + 'region proofs are for True statements');
        check(keys.slice().sort().join() === regionKeys, id + 'picks must cover p, np, nph, npc');
        keys.forEach(function (k) {
          check(pr.picks[k].ok === (T.regionSig(p.world, k) === T.regionSig(p.world, pr.target)),
            id + 'region ' + k + ' R/W disagrees with the geometry');
        });
        check(pr.picks[pr.target].ok, id + 'the target region must be an R');
      }
    });
  });
})(RT);

// ---- Stage 2b: statements (e)-(h) ----
(function (T) {
  T.examKey.e = false; T.examKey.f = true; T.examKey.g = false; T.examKey.h = true;

  var NPC = ['clique', 'vcover', 'indset', 'sat'];
  T.problems.push(
    { id: 'e', world: 'neq', answer: false, view: 'euler',
      parts: ['If A is NP-Complete, then A ', { k: 'is in P' }, '.'],
      tf: [W('True', 'Under P ≠ NP, no NP-Complete problem has a poly-time algorithm. If one did, every NP problem would, and P would equal NP. Check the phrase: "is in P".'),
           R('False')],
      proof: { type: 'dot', needs: { in: ['npc'], out: ['p'] },
        prompt: 'Click a problem that is NP-Complete but NOT in P.',
        picks: T.pickDots(NPC, '{n} does not work here.', {
          sorting: 'Sorting is in P, but it is not NP-Complete. You need an NP-Complete problem.',
          spath:   'Shortest Path is in P, but it is not NP-Complete. You need an NP-Complete problem.',
          halt:    'Halting is NP-hard but not in NP, so it is not NP-Complete.' }) },
      explain: 'SAT is NP-Complete. If SAT were in P, every NP problem would be, so P = NP. Under P ≠ NP, every NP-Complete problem is outside P.' },

    { id: 'f', world: 'neq', answer: true, view: 'euler',
      parts: ['If A is in NP, there is a ', { k: 'poly-time verifier' }, ' for yes instances.'],
      tf: [R('True'),
           W('False', 'This is the definition of NP: a yes instance has a certificate that can be checked in poly time. Check the phrase: "poly-time verifier".')],
      proof: { type: 'region', target: 'np',
        prompt: 'Click the region whose problems ALL have poly-time verifiers.',
        picks: {
          np:  R('NP'),
          p:   W('P', 'P problems do have verifiers, but P is only part of NP. The statement covers every problem in NP, so click the whole NP region.'),
          nph: W('NP-hard', 'NP-hard problems need not have verifiers (Halting has none).'),
          npc: W('NP-Complete', 'NP-Complete is only part of NP. The statement covers every problem in NP, so click the whole NP region.') } },
      explain: 'NP is defined as the problems whose yes instances can be verified in poly time given a certificate.' },

    { id: 'g', world: 'neq', answer: false, view: 'reduce',
      parts: ['If there is a polynomial reduction ', { k: 'from A to B' }, ', and B is NP-hard, then A is NP-hard.'],
      reduce: { a: null, b: 'sat', arrow: 'AB', hardAt: 'b', concl: 'a' },   // a: the user picks it
      tf: [W('True', 'A reduction from A to B says B is at least as hard as A. Hardness flows from A to B, not backwards. Check the phrase: "from A to B".'),
           R('False')],
      proof: { type: 'dot', needs: { in: ['np'], out: ['nph'] },
        prompt: 'B = SAT is NP-hard. Click an A that reduces to B but is NOT NP-hard.',
        picks: T.pickDots(['sorting', 'spath'], '{n} is NP-hard, so A = {n} fits the claim. You need an A that is NOT NP-hard.', {
          halt: 'Halting does not reduce to SAT (SAT is in NP, and Halting is undecidable), so there is no valid reduction from it.' }) },
      explain: 'Sorting → SAT is a valid reduction (every NP problem reduces to SAT), but Sorting is easy. The arrow carries hardness from A to B, never from B back to A.' },

    { id: 'h', world: 'neq', answer: true, view: 'reduce',
      parts: ['If there is a polynomial reduction ', { k: 'from NP-hard A to B' }, ', then B is NP-hard.'],
      reduce: { a: 'sat', b: 'indset', arrow: 'AB', hardAt: 'a', concl: 'b' },
      tf: [R('True'),
           W('False', 'If B had a poly-time algorithm, you could solve A by reducing to B. A is NP-hard, so B must be at least as hard. Check the phrase: "from NP-hard A to B".')],
      proof: { type: 'card', target: 'b',
        prompt: 'A = SAT is NP-hard, and SAT → Independent Set is a reduction. Click the problem the hardness pulse reaches.',
        picks: {
          b: R('B (Independent Set)'),
          a: W('A (SAT)', 'A was NP-hard by assumption. Click the problem that newly inherits hardness.') } },
      explain: 'Hardness travels along the arrow, from the hard problem A to B. A fast solver for B would give a fast solver for A.' }
  );

  // ---- checks ----
  T.checks.push(function (check) {
    'abcdefgh'.split('').forEach(function (c) {
      check(T.problems.some(function (p) { return p.id === c; }), 'statement ' + c + ' is missing');
    });
    T.problems.forEach(function (p) {
      var id = 'problem ' + p.id + ': ';
      check(['dot', 'region', 'card'].indexOf(p.proof.type) >= 0, id + 'unknown proof type');
      check(p.view === 'euler' || p.view === 'reduce', id + 'unknown view');
      check(typeof p.explain === 'string' && p.explain.length > 0, id + 'missing explain');
      check(typeof p.proof.prompt === 'string' && p.proof.prompt.length > 0, id + 'missing proof prompt');
      check(p.view === 'reduce' ? !!p.reduce : !p.reduce, id + 'reduce data must exist exactly when view is "reduce"');

      if (p.view === 'reduce' && p.reduce) {
        var r = p.reduce;
        var okShape = /^(AB|BA)$/.test(r.arrow) && /^[ab]$/.test(r.hardAt) && /^[ab]$/.test(r.concl) && r.hardAt !== r.concl;
        check(okShape, id + 'bad reduce data (arrow, hardAt, concl)');
        if (okShape) {
          var tail = r.arrow.charAt(0).toLowerCase(), head = r.arrow.charAt(1).toLowerCase();
          check(p.answer === (r.hardAt === tail && r.concl === head), id + 'answer disagrees with the arrow direction');
        }
        ['a', 'b'].forEach(function (s) { if (r[s]) check(!!T.dots[r[s]], id + 'reduce.' + s + ' is not a dot'); });
        if (p.proof.type === 'dot') check(r[r.concl] === null && !!r[r.hardAt], id + 'a dot proof means the user picks the conclusion side (null), and the hard side must be set');
        if (p.proof.type === 'card') check(!!r.a && !!r.b, id + 'a card proof needs both A and B set');
      }
      if (p.proof.type === 'card') {
        var ks = Object.keys(p.proof.picks), rs = ks.filter(function (k) { return p.proof.picks[k].ok; });
        check(p.answer, id + 'card proofs are for True statements');
        check(ks.slice().sort().join() === 'a,b', id + 'card picks must be a and b');
        check(rs.length === 1 && rs[0] === p.proof.target, id + 'the one R must be the target card');
      }
    });
  });
})(RT);

// ---- Stage 2c: reworded traps, P ≠ NP ----
(function (T) {
  var NPC = ['clique', 'vcover', 'indset', 'sat'];
  T.problems.push(
    { id: 'd2', world: 'neq', answer: false, view: 'euler',
      parts: ['If A is ', { k: 'in NP' }, ', then A is NP-Complete.'],
      tf: [W('True', 'Being in NP is only half of NP-Complete; the other half is NP-hard. Many NP problems (all of P) are not NP-hard. Check the direction: "in NP" is the condition here, not the conclusion.'),
           R('False')],
      proof: { type: 'dot', needs: { in: ['np'], out: ['npc'] },
        prompt: 'Click a problem that is in NP but NOT NP-Complete.',
        picks: T.pickDots(['sorting', 'spath'], '{n} is NP-Complete, so it fits the claim. You need an NP problem that is NOT NP-Complete.', {
          halt: 'Halting is not in NP, so the claim says nothing about it.' }) },
      explain: 'NP-Complete implies in NP (statement d), but not the reverse. Sorting is in NP (it is in P) and is not NP-hard unless P = NP.' },

    { id: 'e2', world: 'neq', answer: false, view: 'euler',
      parts: ['If A is NP-hard, then A ', { k: 'is in NP' }, '.'],
      tf: [W('True', 'NP-hard only means "at least as hard as everything in NP". It does not require membership in NP. Check the phrase: "is in NP".'),
           R('False')],
      proof: { type: 'dot', needs: { in: ['nph'], out: ['np'] },
        prompt: 'Click a problem that is NP-hard but NOT in NP.',
        picks: T.pickDots(['halt'], '{n} is NP-hard, but it IS in NP, so it fits the claim.', {
          sorting: 'Sorting is in NP and is not NP-hard. You need an NP-hard problem outside NP.',
          spath:   'Shortest Path is in NP and is not NP-hard. You need an NP-hard problem outside NP.' }) },
      explain: 'NP-Complete = NP-hard AND in NP. Drop the second half and you get Halting: SAT reduces to it, so it is NP-hard, but it is not in NP.' },

    { id: 'f2', world: 'neq', answer: false, view: 'euler',
      parts: ['If A is in NP, there is a ', { k: 'poly-time algorithm that solves A' }, '.'],
      tf: [W('True', 'NP promises a poly-time VERIFIER, not a poly-time SOLVER. Check the phrase: "algorithm that solves A".'),
           R('False')],
      proof: { type: 'dot', needs: { in: ['np'], out: ['p'] },
        prompt: 'Click a problem that is in NP but has NO poly-time algorithm.',
        picks: T.pickDots(NPC, '{n} does not work here.', {
          sorting: 'Sorting is in P, so it has a poly-time algorithm and fits the claim.',
          spath:   'Shortest Path is in P, so it has a poly-time algorithm and fits the claim.',
          halt:    'Halting is not in NP, so it says nothing about a claim on NP.' }) },
      explain: 'Verifier vs solver. Under P ≠ NP, Clique has a poly-time verifier (check the clique) but no poly-time solver.' },

    { id: 'c2', world: 'neq', answer: false, view: 'euler',
      parts: ['NP stands for ', { k: '"non-polynomial"' }, ', so no problem in NP can be solved in polynomial time.'],
      tf: [W('True', 'NP stands for NONDETERMINISTIC polynomial time (equivalently, poly-time verifiable). P ⊆ NP, so many NP problems are solved in poly time.'),
           R('False')],
      proof: { type: 'dot', needs: { in: ['np', 'p'], out: [] },
        prompt: 'Click a problem that is in NP and CAN be solved in poly time.',
        picks: T.pickDots(['sorting', 'spath'], 'Under P ≠ NP, {n} has no poly-time algorithm, so it fits the claim. You need one that does.', {
          halt: 'Halting is not in NP (and no algorithm solves it at all).' }) },
      explain: 'The N is "nondeterministic", not "non". Sorting is in NP and is solved in poly time.' },

    { id: 'g2', world: 'neq', answer: false, view: 'reduce',
      parts: ['If there is a polynomial reduction ', { k: 'from B to A' }, ', and A is NP-hard, then B is NP-hard.'],
      reduce: { a: 'sat', b: null, arrow: 'BA', hardAt: 'a', concl: 'b' },   // b: the user picks it
      tf: [W('True', 'A reduction from B to A says A is at least as hard as B. The NP-hard problem is at the arrowhead, and hardness does not flow backwards. Check the phrase: "from B to A".'),
           R('False')],
      proof: { type: 'dot', needs: { in: ['np'], out: ['nph'] },
        prompt: 'A = SAT is NP-hard. Click a B that reduces to A but is NOT NP-hard.',
        picks: T.pickDots(['sorting', 'spath'], '{n} is NP-hard, so B = {n} fits the claim. You need a B that is NOT NP-hard.', {
          halt: 'Halting does not reduce to SAT (SAT is in NP, and Halting is undecidable), so there is no valid reduction from it.' }) },
      explain: 'Sorting → SAT is a valid reduction, yet Sorting is easy. Same trap as (g) with the letters swapped: find which end of the arrow is the hard one.' },

    { id: 'h2', world: 'neq', answer: true, view: 'reduce',
      parts: ['If there is a polynomial reduction ', { k: 'from B to A' }, ', and B is NP-hard, then A is NP-hard.'],
      reduce: { a: 'indset', b: 'sat', arrow: 'BA', hardAt: 'b', concl: 'a' },
      tf: [R('True'),
           W('False', 'The NP-hard problem B is at the tail of the arrow, so hardness travels to A. If A had a poly-time algorithm, B would too. Check the phrase: "from B to A".')],
      proof: { type: 'card', target: 'a',
        prompt: 'B = SAT is NP-hard, and SAT → Independent Set (from B to A) is a reduction. Click the problem the hardness pulse reaches.',
        picks: {
          a: R('A (Independent Set)'),
          b: W('B (SAT)', 'B was NP-hard by assumption. Click the problem that newly inherits hardness.') } },
      explain: 'Same as (h) with the letters swapped: hardness travels from the tail of the arrow to the head.' }
  );

  T.checks.push(function (check) {
    var seen = {};
    T.problems.forEach(function (p) { check(!seen[p.id], 'duplicate problem id ' + p.id); seen[p.id] = true; });
  });
})(RT);

// ---- Stage 2d: P = NP variants ----
(function (T) {
  // Answers under P = NP. Only (a) and (e) flip. (g) is excluded on purpose (trivial languages).
  T.eqKey = { a: true, b: true, c: false, d: true, e: true, f: true, h: true, e2: false };

  // Sampled membership of region r on a grid; equal strings = same shape
  T.regionSig = function (world, r) {
    var s = '';
    for (var x = 5; x < 600; x += 10)
      for (var y = 5; y < 400; y += 10)
        s += T.regionsOf(world, x, y).indexOf(r) >= 0 ? '1' : '0';
    return s;
  };

  var ALL6 = ['sorting', 'spath', 'clique', 'vcover', 'indset', 'sat'];
  // Under P = NP, P, NP and NP-Complete are one shape; only NP-hard differs
  function merged(whyNph) {
    return { p: R('P'), np: R('NP'), npc: R('NP-Complete'), nph: W('NP-hard', whyNph) };
  }
  var MERGE = 'Under P = NP, P, NP and NP-Complete are one shape. NP-hard is the bigger region around it.';

  T.problems.push(
    { id: 'a_eq', base: 'a', world: 'eq', answer: true, view: 'euler',
      parts: ['Every problem ', { k: 'in NP is also in P' }, '.'],
      tf: [R('True'),
           W('False', 'Read the assumption line. If P = NP, every NP problem has a poly-time algorithm, so NP ⊆ P.')],
      proof: { type: 'region', target: 'np',
        prompt: 'Under P = NP the P and NP regions are the same shape. Click it.',
        picks: merged('NP-hard extends past NP (Halting). The statement is only about NP and P.') },
      explain: 'P = NP means the P and NP regions coincide, so every NP problem is in P. This is one of only two statements, with (e), whose answer flips.' },

    { id: 'e_eq', base: 'e', world: 'eq', answer: true, view: 'euler',
      parts: ['If A is NP-Complete, then A ', { k: 'is in P' }, '.'],
      tf: [R('True'),
           W('False', 'Read the assumption line. NP-Complete problems are in NP, and if P = NP then NP ⊆ P, so A is in P.')],
      proof: { type: 'region', target: 'npc',
        prompt: 'Under P = NP, NP-Complete sits inside the merged P = NP shape. Click it.',
        picks: merged('NP-hard extends past NP (Halting). NP-Complete is only the overlap with NP.') },
      explain: 'Under P = NP, P, NP and NP-Complete are the same region, so NP-Complete problems like SAT have poly-time algorithms.' },

    { id: 'b_eq', base: 'b', world: 'eq', answer: true, view: 'euler',
      parts: ['Every problem ', { k: 'in P is also in NP' }, '.'],
      tf: [R('True'),
           W('False', 'A poly-time solver is also a poly-time verifier, so P ⊆ NP with or without P = NP. Check the direction: P inside NP.')],
      proof: { type: 'region', target: 'p',
        prompt: 'Click the P region. Under P = NP, see how it relates to NP.',
        picks: merged('NP-hard is not what the statement is about. Click P.') },
      explain: 'P ⊆ NP does not depend on the assumption. With P = NP they are the same set, and it is still inside NP.' },

    { id: 'c_eq', base: 'c', world: 'eq', answer: false, view: 'euler',
      parts: ['NP is the set of problems that ', { k: 'cannot be solved' }, ' in polynomial time.'],
      tf: [W('True', 'NP means "verifiable in poly time". Under P = NP every NP problem is solvable in poly time, so the claim is even further off.'),
           R('False')],
      proof: { type: 'dot', needs: { in: ['np', 'p'], out: [] },
        prompt: 'Click a problem that is in NP and CAN be solved in poly time.',
        picks: T.pickDots(ALL6, '{n} does not work here.', {
          halt: 'Halting is not in NP (and no algorithm solves it at all).' }) },
      explain: 'Under P = NP every NP problem is solvable in poly time, so any NP dot is a counterexample. NP means verifiable, not unsolvable.' },

    { id: 'e2_eq', base: 'e2', world: 'eq', answer: false, view: 'euler',
      parts: ['NP-hard problems ', { k: 'are all in NP' }, '.'],
      tf: [W('True', 'NP-hard only means "at least as hard as everything in NP". P = NP does not pull undecidable problems like Halting into NP.'),
           R('False')],
      proof: { type: 'dot', needs: { in: ['nph'], out: ['np'] },
        prompt: 'Click a problem that is NP-hard but NOT in NP.',
        picks: T.pickDots(['halt'], '{n} is in NP, so it fits the claim. You need an NP-hard problem outside NP.') },
      explain: 'Halting is NP-hard (SAT reduces to it) but not in NP. The NP-hard region sticks out past NP in both worlds.' },

    { id: 'h_eq', base: 'h', world: 'eq', answer: true, view: 'reduce',
      parts: ['If there is a polynomial reduction ', { k: 'from NP-hard A to B' }, ', then B is NP-hard.'],
      reduce: { a: 'indset', b: 'vcover', arrow: 'AB', hardAt: 'a', concl: 'b' },
      tf: [R('True'),
           W('False', 'If B had a poly-time algorithm, you could solve A by reducing to B. A is NP-hard, so B must be at least as hard. Check the phrase: "from NP-hard A to B".')],
      proof: { type: 'card', target: 'b',
        prompt: 'A = Independent Set is NP-hard, and Independent Set → Vertex Cover is a reduction. Click the problem the hardness pulse reaches.',
        picks: {
          b: R('B (Vertex Cover)'),
          a: W('A (Independent Set)', 'A was NP-hard by assumption. Click the problem that newly inherits hardness.') } },
      explain: 'Hardness travels along the arrow from A to B, and this does not depend on P vs NP.' }
  );

  // ---- checks ----
  T.checks.push(function (check) {
    ['a', 'b', 'c', 'd', 'e', 'f', 'h'].forEach(function (k) {
      check((T.eqKey[k] !== T.examKey[k]) === (k === 'a' || k === 'e'),
        'eqKey ' + k + ': only (a) and (e) flip under P = NP');
    });
    T.problems.forEach(function (p) {
      var id = 'problem ' + p.id + ': ';
      check(!p.base || p.world === 'eq', id + 'a variant with a base must be in world "eq"');
      if (p.world === 'eq') {
        check(!!p.base && T.eqKey.hasOwnProperty(p.base), id + 'P = NP problems need a base in eqKey ((g) is excluded)');
        if (T.eqKey.hasOwnProperty(p.base)) check(p.answer === T.eqKey[p.base], id + 'answer differs from the P = NP key');
      }
    });
  });
})(RT);

// ---- Stage 8a: quiz data ----
(function (T) {
  T.quizIds = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

  // Wrong "deciding phrase" options. The correct one is read from the statement's parts.
  T.quizWrong = {
    a: [W('Every problem', 'The quantifier only tells you one counterexample is enough. The direction, NP inside P, is what decides it.'),
        W('in P is also in NP', 'That is the reversed claim, statement (b), which is true. Statement (a) says NP inside P.'),
        W('NP-Complete', 'NP-Complete does not appear in (a), so it cannot be what decides it.')],
    b: [W('Every problem', 'The quantifier is not the issue here. The direction, P inside NP, is what makes it true.'),
        W('in NP is also in P', 'That is the reversed claim, statement (a), which is false.'),
        W('Assume P ≠ NP', 'P is inside NP with or without that assumption, so it does not decide (b).')],
    c: [W('NP is the set of problems that', 'This opening names NP correctly. The error is in what the statement says NP contains.'),
        W('in polynomial time', 'NP is defined through polynomial time (checking an answer), so this part is fine.'),
        W('Assume P ≠ NP', 'Even under P ≠ NP, P is inside NP, so the assumption does not rescue this claim.')],
    d: [W('then A is in NP', 'That is the conclusion. It is true because of what NP-Complete means.'),
        W('Assume P ≠ NP', 'The statement holds with or without the assumption, so it does not decide (d).'),
        W('If A is', 'That only introduces A. The class named right after it is what decides.')],
    e: [W('NP-Complete', 'That is the given condition. What you must test is what follows from it.'),
        W('is in NP', 'That is the conclusion of statement (d), which is true. Statement (e) ends with a different class.'),
        W('then A', 'Those words only link the condition to the conclusion. The class after them decides.')],
    f: [W('poly-time algorithm that solves A', 'That is the solver wording, which would be false. NP promises a verifier, not a solver.'),
        W('If A is in NP', 'That condition only names the class. The verifier is what its definition promises.'),
        W('for yes instances', 'That is part of the definition, but it does not make the statement true or false. The verifier does.')],
    g: [W('B is NP-hard', 'That is the given. The arrow direction decides whether hardness reaches A.'),
        W('then A is NP-hard', 'That is the conclusion you test. The arrow direction decides whether it follows.'),
        W('from B to A', 'That is the reversed arrow, which would make the claim true. Statement (g) says from A to B.')],
    h: [W('then B is NP-hard', 'That is the conclusion. It follows because of where the NP-hard problem sits on the arrow.'),
        W('polynomial reduction', 'Both (g) and (h) have a reduction, so it does not separate true from false.'),
        W('Assume P ≠ NP', 'Statement (h) is true with or without the assumption, so it does not decide it.')]
  };

  function find(id) { return T.problems.filter(function (p) { return p.id === id; })[0]; }
  T.deciding = function (p) {
    return p.parts.filter(function (x) { return typeof x !== 'string'; })[0].k;
  };
  // Authored order: the correct phrase first. The quiz shuffles it.
  T.quizPhrases = function (id) {
    return [R(T.deciding(find(id)))].concat(T.quizWrong[id]);
  };

  // ---- checks ----
  T.checks.push(function (check) {
    check(T.quizIds.join('') === Object.keys(T.examKey).filter(function (k) { return k.length === 1 && k <= 'h'; }).sort().join(''),
      'quizIds must be the 8 base statements a-h');
    T.quizIds.forEach(function (id) {
      var m = 'quiz ' + id + ': ', p = find(id), w = T.quizWrong[id];
      check(!!p && p.world === 'neq', m + 'needs a base problem in world "neq"');
      if (!p) return;
      check(w && w.length === 3, m + 'needs exactly 3 wrong phrases');
      if (!w) return;
      var good = T.deciding(p), seen = {};
      seen[good] = true;
      w.forEach(function (c) {
        check(!c.ok && !!c.why, m + 'wrong phrase "' + c.text + '" must be a W with a why');
        check(c.text !== good, m + 'a wrong option equals the deciding phrase');
        check(!seen[c.text] || c.text === good, m + 'duplicate option "' + c.text + '"');
        seen[c.text] = true;
      });
      var opts = T.quizPhrases(id);
      check(opts.filter(function (c) { return c.ok; }).length === 1, m + 'needs exactly one correct phrase');
    });
  });
})(RT);