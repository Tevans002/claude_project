// Algorithm logic only. No DOM code in this file.

function createState() {
  const state = { studentPartner: {}, hospitalPartner: {}, proposedCount: {} };
  for (const h in HOSPITAL_PREFS) {
    state.hospitalPartner[h] = null;
    state.proposedCount[h] = 0;
  }
  for (const s in STUDENT_PREFS) state.studentPartner[s] = null;
  return state;
}

// Hospitals that satisfy the While condition
function eligibleHospitals(state) {
  return Object.keys(HOSPITAL_PREFS).filter(function (h) {
    return state.hospitalPartner[h] === null &&
           state.proposedCount[h] < HOSPITAL_PREFS[h].length;
  });
}

// First student on h's list that h has not yet proposed to
function nextStudent(state, h) {
  return HOSPITAL_PREFS[h][state.proposedCount[h]];
}

// Does student s rank hospital a above hospital b?
function studentPrefers(s, a, b) {
  const list = STUDENT_PREFS[s];
  return list.indexOf(a) < list.indexOf(b);
}

// Current M as a list of [h, s] pairs
function currentMatching(state) {
  return Object.keys(state.hospitalPartner)
    .filter(function (h) { return state.hospitalPartner[h] !== null; })
    .map(function (h) { return [h, state.hospitalPartner[h]]; });
}

// Runs one full pass of the loop body for hospital h.
// Returns what happened so the UI can explain it.
function applyProposal(state, h) {
  const s = nextStudent(state, h);
  state.proposedCount[h]++;
  const current = state.studentPartner[s];

  if (current === null) {
    state.studentPartner[s] = h;
    state.hospitalPartner[h] = s;
    return { h: h, s: s, outcome: "added", displaced: null };
  }
  if (studentPrefers(s, h, current)) {
    state.hospitalPartner[current] = null;   // remove (h', s)
    state.studentPartner[s] = h;             // add (h, s)
    state.hospitalPartner[h] = s;
    return { h: h, s: s, outcome: "replaced", displaced: current };
  }
  return { h: h, s: s, outcome: "rejected", displaced: current };
}

// Console test helper: runs the whole algorithm and prints each step
function runFullAlgorithm(startHospital) {
  const state = createState();
  let first = startHospital;
  while (eligibleHospitals(state).length > 0) {
    const h = first || eligibleHospitals(state)[0];
    first = null;
    const r = applyProposal(state, h);
    console.log(r.h + " -> " + r.s + ": " + r.outcome +
      (r.displaced ? " (other: " + r.displaced + ")" : "") +
      "  M = " + JSON.stringify(currentMatching(state)));
  }
  return currentMatching(state);
}