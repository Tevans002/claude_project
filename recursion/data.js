// data.js: hand-verified recurrence-tree problems. Defines global PROBLEMS.
// Choice: {t, ok:true} or {t, why}. hint = equation part keys to red-box
// on a wrong pick: 'a' (branching), 'b' (subproblem), 'f' (work per node).
var PROBLEMS = [];
var RT = {
  R: function (t) { return { t: t, ok: true }; },
  W: function (t, why) { return { t: t, why: why }; }
};

(function (R, W) {
  PROBLEMS.push({
    id: 'p1',
    name: '2T(n/3) + n³',
    eq: [{ t: 'T(n) = ' }, { k: 'a', t: '2' }, { k: 'b', t: 'T(n/3)' },
         { t: ' + ' }, { k: 'f', t: 'n³' }, { t: ',  T(1) = 1' }],
    levels: [
      { nodes: 1,
        node: { hint: ['f'], choices: [
          R('n³'),
          W('n', 'The work per node is the non-recursive part: n³, not n.'),
          W('2n³', 'The 2 counts calls. It does not multiply one node\'s work.'),
          W('T(n/3)', 'T(n/3) is a child call. The node holds only its own work, n³.')] },
        total: { hint: ['a', 'f'], choices: [
          R('n³'),
          W('2n³', 'Level 0 has only 1 node: 1 × n³ = n³.'),
          W('n³/27', 'That is a level-1 node. Level 0 is the full size n.')] },
        next: { hint: ['a'], choices: [
          R('2'),
          W('3', '3 is the size divisor in n/3. The number of calls is the 2 in front.'),
          W('1', 'Each node makes 2 recursive calls: 2T(n/3).'),
          W('6', '6 = 2 × 3 mixes calls with size. Count only calls: 2.')] } },
      { nodes: 2,
        node: { hint: ['b', 'f'], choices: [
          R('(n/3)³ = n³/27'),
          W('n³/3', 'Cube the whole size: (n/3)³ = n³/3³ = n³/27.'),
          W('2n³/27', 'That is the level total. One node is (n/3)³.'),
          W('n³', 'Each child has size n/3, so its work is (n/3)³.')] },
        total: { hint: ['a', 'f'], choices: [
          R('2n³/27'),
          W('n³/27', 'That is one node. Level 1 has 2 nodes: 2 × n³/27.'),
          W('2n³/3', 'The 3 is cubed too: 2 × n³/27.'),
          W('n³/54', 'Multiply by the node count, do not divide: 2 × n³/27.')] },
        next: { hint: ['a'], choices: [
          R('4'),
          W('2', 'Each of the 2 nodes makes 2 calls: 2 × 2 = 4.'),
          W('3', 'Node count multiplies by 2 each level: 1, 2, 4.'),
          W('9', '9 is the size divisor (n/9). The node count is 2² = 4.')] } },
      { nodes: 4,
        node: { hint: ['b', 'f'], choices: [
          R('(n/9)³ = n³/729'),
          W('(n/6)³ = n³/216', 'Sizes divide by 3 again: (n/3)/3 = n/9, not n/6.'),
          W('n³/81', '(n/9)³ = n³/9³ = n³/729. 81 is 9², not 9³.'),
          W('4n³/729', 'That is the level total. One node is (n/9)³.')] },
        total: { hint: ['a', 'f'], choices: [
          R('4n³/729'),
          W('n³/729', 'That is one node. Level 2 has 4 nodes.'),
          W('2n³/729', 'Level 2 has 4 nodes, not 2.'),
          W('4n³/81', '9³ = 729, so 4 × n³/729.')] } }
    ],
    quiz: [
      { q: 'What is the work per level in terms of level ℓ?', hint: ['a', 'b', 'f'],
        choices: [
          R('(2/27)^ℓ · n³'),
          W('2^ℓ · n³', 'The node size shrinks too: each node is (n/3^ℓ)³.'),
          W('(2/3)^ℓ · n³', 'The size divisor is cubed: 3³ = 27.'),
          W('(1/27)^ℓ · n³', 'That is one node. Multiply by 2^ℓ nodes.')] },
      { q: 'Is the work per level:', hint: ['a', 'f'],
        choices: [
          R('decreasing (work is dominated by root)'),
          W('increasing (work is dominated by leaves)', 'Ratio 2/27 < 1, so each level does less work.'),
          W('the same (work is the same at every level)', 'Same work needs ratio exactly 1. Here it is 2/27.')] },
      { q: 'What is the total number of levels in the tree?', hint: ['b'],
        choices: [
          R('log₃(n)'),
          W('log₂(n)', 'The base is the size divisor (3), not the number of calls (2).'),
          W('log₃(2)', 'The argument is n: size shrinks from n down to 1.'),
          W('n/3', 'Size divides by 3 each level, so the level count is logarithmic.')] },
      { q: 'What is the closed form of T(n)?', hint: ['f'],
        choices: [
          R('Θ(n³)'),
          W('Θ(n³ log n)', 'That holds when every level is equal. Here levels decrease, so the root wins.'),
          W('Θ(n^(log₃2))', 'That is the leaf-dominated answer. Here the root dominates.'),
          W('Θ(n log n)', 'The root alone does n³ work, so T(n) is at least n³.')] }
    ]
  });
})(RT.R, RT.W);

(function (R, W) {
  PROBLEMS.push({
    id: 'p2',
    name: '4T(n/2) + n',
    eq: [{ t: 'T(n) = ' }, { k: 'a', t: '4' }, { k: 'b', t: 'T(n/2)' },
         { t: ' + ' }, { k: 'f', t: 'n' }, { t: ',  T(1) = 1' }],
    levels: [
      { nodes: 1,
        node: { hint: ['f'], choices: [
          R('n'),
          W('4n', 'The 4 counts calls. It does not multiply one node\'s work.'),
          W('n²', 'The work per node is the non-recursive part: n.'),
          W('T(n/2)', 'T(n/2) is a child call. The node holds only its own work, n.')] },
        total: { hint: ['a', 'f'], choices: [
          R('n'),
          W('4n', 'Level 0 has only 1 node: 1 × n = n.'),
          W('n/2', 'That is a level-1 node. Level 0 is the full size n.')] },
        next: { hint: ['a'], choices: [
          R('4'),
          W('2', '2 is the size divisor in n/2. The number of calls is the 4 in front.'),
          W('1', 'Each node makes 4 recursive calls: 4T(n/2).'),
          W('8', '8 = 4 × 2 mixes calls with size. Count only calls: 4.')] } },
      { nodes: 4,
        node: { hint: ['b', 'f'], choices: [
          R('n/2'),
          W('n/4', 'That is level 2. A level-1 node has size n/2.'),
          W('2n', 'That is the level total. One node is n/2.'),
          W('n', 'Each child has size n/2, so its work is n/2.')] },
        total: { hint: ['a', 'f'], choices: [
          R('2n'),
          W('n/2', 'That is one node. Level 1 has 4 nodes: 4 × n/2.'),
          W('n', '4 × n/2 = 2n, not n.'),
          W('4n', 'Each node is n/2, not n: 4 × n/2 = 2n.')] },
        next: { hint: ['a'], choices: [
          R('16'),
          W('8', 'Each of the 4 nodes makes 4 calls: 4 × 4 = 16.'),
          W('4', 'Node count multiplies by 4 each level: 1, 4, 16.'),
          W('6', 'Multiply, don\'t add: 4 × 4 = 16.')] } },
      { nodes: 16,
        node: { hint: ['b', 'f'], choices: [
          R('n/4'),
          W('n/8', 'Sizes divide by 2 again: (n/2)/2 = n/4.'),
          W('n/16', '16 is the node count. The size is n/2² = n/4.'),
          W('4n', 'That is the level total. One node is n/4.')] },
        total: { hint: ['a', 'f'], choices: [
          R('4n'),
          W('n/4', 'That is one node. Level 2 has 16 nodes.'),
          W('n', '16 × n/4 = 4n, not n.'),
          W('8n', '16 × n/4 = 4n.')] } }
    ],
    quiz: [
      { q: 'What is the work per level in terms of level ℓ?', hint: ['a', 'b', 'f'],
        choices: [
          R('2^ℓ · n'),
          W('4^ℓ · n', 'Node size shrinks too: 4^ℓ nodes × n/2^ℓ each.'),
          W('(1/2)^ℓ · n', 'That is one node. Multiply by 4^ℓ nodes.'),
          W('n', 'Totals were n, 2n, 4n, so they grow by 2 each level.')] },
      { q: 'Is the work per level:', hint: ['a', 'b'],
        choices: [
          R('increasing (work is dominated by leaves)'),
          W('decreasing (work is dominated by root)', 'Ratio 4/2 = 2 > 1, so each level does more work.'),
          W('the same (work is the same at every level)', 'Same work needs ratio exactly 1. Here it is 2.')] },
      { q: 'What is the total number of levels in the tree?', hint: ['b'],
        choices: [
          R('log₂(n)'),
          W('log₄(n)', 'The base is the size divisor (2), not the number of calls (4).'),
          W('log₂(4)', 'The argument is n: size shrinks from n down to 1.'),
          W('n/2', 'Size halves each level, so the level count is logarithmic.')] },
      { q: 'What is the closed form of T(n)?', hint: ['a', 'b'],
        choices: [
          R('Θ(n²)'),
          W('Θ(n)', 'That is only the root. Levels grow, so the leaves dominate.'),
          W('Θ(n log n)', 'That holds when every level is equal. Here levels increase.'),
          W('Θ(n⁴)', 'Leaves = 4^(log₂n) = n^(log₂4) = n², not n⁴.')] }
    ]
  });
})(RT.R, RT.W);

(function (R, W) {
  PROBLEMS.push({
    id: 'p3',
    name: '3T(n/3) + n',
    eq: [{ t: 'T(n) = ' }, { k: 'a', t: '3' }, { k: 'b', t: 'T(n/3)' },
         { t: ' + ' }, { k: 'f', t: 'n' }, { t: ',  T(1) = 1' }],
    levels: [
      { nodes: 1,
        node: { hint: ['f'], choices: [
          R('n'),
          W('3n', 'The 3 counts calls. It does not multiply one node\'s work.'),
          W('n/3', 'That is a level-1 node. The root has the full size n.'),
          W('T(n/3)', 'T(n/3) is a child call. The node holds only its own work, n.')] },
        total: { hint: ['a', 'f'], choices: [
          R('n'),
          W('3n', 'Level 0 has only 1 node: 1 × n = n.'),
          W('n/3', 'That is a level-1 node. Level 0 is the full size n.')] },
        next: { hint: ['a'], choices: [
          R('3'),
          W('1', 'Each node makes 3 recursive calls: 3T(n/3).'),
          W('9', '9 is level 2. Level 1 has 3 nodes.'),
          W('6', '6 = 3 + 3 mixes calls with size. Count only calls: 3.')] } },
      { nodes: 3,
        node: { hint: ['b', 'f'], choices: [
          R('n/3'),
          W('n/9', 'That is level 2. A level-1 node has size n/3.'),
          W('n', 'That is the level total. One node is n/3.'),
          W('3n', 'Each child has size n/3, so its work is n/3.')] },
        total: { hint: ['a', 'f'], choices: [
          R('n'),
          W('n/3', 'That is one node. Level 1 has 3 nodes: 3 × n/3.'),
          W('3n', 'Each node is n/3, not n: 3 × n/3 = n.'),
          W('n/9', 'Multiply by the node count, do not divide: 3 × n/3 = n.')] },
        next: { hint: ['a'], choices: [
          R('9'),
          W('6', 'Multiply, don\'t add: 3 × 3 = 9.'),
          W('3', 'Each of the 3 nodes makes 3 calls: 3 × 3 = 9.'),
          W('27', 'Node count multiplies by 3 each level: 1, 3, 9.')] } },
      { nodes: 9,
        node: { hint: ['b', 'f'], choices: [
          R('n/9'),
          W('n/6', 'Sizes divide by 3 again: (n/3)/3 = n/9, not n/6.'),
          W('n/27', 'n/27 is level 3. Level 2 is n/3² = n/9.'),
          W('n', 'That is the level total. One node is n/9.')] },
        total: { hint: ['a', 'f'], choices: [
          R('n'),
          W('n/9', 'That is one node. Level 2 has 9 nodes: 9 × n/9.'),
          W('9n', 'Each node is n/9, not n: 9 × n/9 = n.'),
          W('3n', '9 × n/9 = n. Totals stay n at every level.')] } }
    ],
    quiz: [
      { q: 'What is the work per level in terms of level ℓ?', hint: ['a', 'b', 'f'],
        choices: [
          R('n'),
          W('3^ℓ · n', 'Node size shrinks too: 3^ℓ nodes × n/3^ℓ each = n.'),
          W('(1/3)^ℓ · n', 'That is one node. Multiply by 3^ℓ nodes.'),
          W('n/ℓ', 'Totals were n, n, n, so they do not depend on ℓ.')] },
      { q: 'Is the work per level:', hint: ['a', 'b'],
        choices: [
          R('the same (work is the same at every level)'),
          W('increasing (work is dominated by leaves)', 'Ratio 3/3 = 1, so levels do not grow.'),
          W('decreasing (work is dominated by root)', 'Ratio 3/3 = 1, so levels do not shrink.')] },
      { q: 'What is the total number of levels in the tree?', hint: ['b'],
        choices: [
          R('log₃(n)'),
          W('log₃(3)', 'The argument is n: size shrinks from n down to 1.'),
          W('log₂(n)', 'The base is the size divisor (3).'),
          W('n/3', 'Size divides by 3 each level, so the level count is logarithmic.')] },
      { q: 'What is the closed form of T(n)?', hint: ['a', 'b', 'f'],
        choices: [
          R('Θ(n log n)'),
          W('Θ(n)', 'That is only one level. All log₃(n) levels do n work each.'),
          W('Θ(n²)', 'That needs growing levels. Here each level is exactly n.'),
          W('Θ(log n)', 'Each level does n work, not 1.')] }
    ]
  });
})(RT.R, RT.W);

// Self-check: run RT.selfCheck() in the console.
RT.selfCheck = function () {
  var bad = 0;
  function fail(id, msg) { bad++; console.log('FAIL ' + id + ': ' + msg); }
  function checkSet(id, s, keys) {
    var ok = s.choices.filter(function (c) { return c.ok; });
    if (ok.length !== 1) fail(id, ok.length + ' correct choices');
    s.choices.forEach(function (c) {
      if (!c.ok && !c.why) fail(id, 'no "why" for ' + c.t);
    });
    var texts = s.choices.map(function (c) { return c.t; });
    if (new Set(texts).size !== texts.length) fail(id, 'duplicate choice');
    (s.hint || []).forEach(function (h) {
      if (keys.indexOf(h) < 0) fail(id, 'bad hint key ' + h);
    });
    return ok[0];
  }
  PROBLEMS.forEach(function (p) {
    var keys = p.eq.filter(function (e) { return e.k; }).map(function (e) { return e.k; });
    var a = Number(p.eq.filter(function (e) { return e.k === 'a'; })[0].t);
    if (p.levels.length !== 3) fail(p.id, 'need 3 levels');
    p.levels.forEach(function (L, i) {
      var id = p.id + ' L' + i;
      if (L.nodes !== Math.pow(a, i)) fail(id, 'nodes should be ' + Math.pow(a, i));
      checkSet(id + ' node', L.node, keys);
      checkSet(id + ' total', L.total, keys);
      if (i < 2) {
        var n = L.next && checkSet(id + ' next', L.next, keys);
        if (!n || Number(n.t) !== p.levels[i + 1].nodes) fail(id, 'next mismatch');
      } else if (L.next) fail(id, 'last level should have no next');
    });
    if (p.quiz.length !== 4) fail(p.id, 'need 4 quiz questions');
    p.quiz.forEach(function (q, i) { checkSet(p.id + ' Q' + (i + 1), q, keys); });
  });
  console.log(bad ? bad + ' FAIL(s)' : 'PASS: ' + PROBLEMS.length + ' problems');
  return bad === 0;
};