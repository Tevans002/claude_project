// Interaction logic. Uses engine.js for rules and ui.js for rendering.

const PICK_STUDENT_LINE = 3;
const IF_UNMATCHED_LINE = 4;
const ADD_LINE = 5;
const ELSE_LINE = 6;
const WHILE_LINE = 2;
const PREFERS_LINE = 7;
const REMOVE_LINE = 8;
const ELSE_PREFERS_LINE = 10;
const DO_NOTHING_LINE = 11;
const ADD_AFTER_REMOVE_LINE = 9;
const RETURN_LINE = 12;

let preferredHospital = null;
let state = createState();
let currentH = null;
let currentS = null;
let step = "while";   // while -> pickStudent -> unmatched -> (next stage)
let firstClick = true;

function setLog(message, isError) {
  const log = document.getElementById("log");
  log.textContent = message;
  log.className = isError ? "error" : "";
}

function highlightRow(tableId, name) {
  document.querySelectorAll("#" + tableId + " tr").forEach(function (row) {
    row.classList.toggle("current", row.dataset.name === name);
  });
}

// ---- Step 1: While (click a hospital) ----
function onHospitalClick(h) {
  if (step === "done") {
    setLog("The algorithm has finished and returned M.", true);
    return;
  }
  if (step !== "while") {
    setLog("Not yet. Finish the highlighted line first.", true);
    return;
  }
  const firstH = Object.keys(HOSPITAL_PREFS)[0];
  if (firstClick && h !== firstH) {
    setLog("For this first step, start with " + firstH + ".", true);
    return;
  }
  if (!eligibleHospitals(state).includes(h)) {
    if (state.hospitalPartner[h] !== null) {
      setLog(h + " is already matched to " + state.hospitalPartner[h] +
             ", so it doesn't satisfy the While condition.", true);
    } else {
      setLog(h + " has already proposed to every student.", true);
    }
    return;
  }
  currentH = h;
  firstClick = false;
  step = "pickStudent";
  highlightRow("hospital-table", h);
  renderPseudocode(PICK_STUDENT_LINE);
  setLog("h = " + h + ". Click the first student on " + h +
         "'s list that " + h + " has not yet proposed to.", false);
}

// ---- Step 2: pick the student (click a cell in h's row) ----
function onPrefCellClick(cell) {
  if (step !== "pickStudent") {
    setLog("Not yet. Finish the highlighted line first.", true);
    return;
  }
  const rowName = cell.parentElement.dataset.name;
  const s = cell.dataset.item;
  if (rowName !== currentH) {
    setLog("That's " + rowName + "'s list. You're working with " + currentH + ".", true);
    return;
  }
  const list = HOSPITAL_PREFS[currentH];
  const correct = nextStudent(state, currentH);
  if (s !== correct) {
    if (list.indexOf(s) < state.proposedCount[currentH]) {
      setLog(currentH + " has already proposed to " + s +
             ". Look for the first student it has NOT proposed to.", true);
    } else {
      setLog(s + " is on " + currentH + "'s list, but " + correct +
             " comes first and hasn't been proposed to yet.", true);
    }
    return;
  }
  currentS = s;
  step = "unmatched";
  cell.classList.add("proposing");
  highlightRow("student-table", s);
  renderPseudocode(IF_UNMATCHED_LINE);
  document.getElementById("yesno-question").textContent = "Is " + s + " unmatched?";
  document.getElementById("yesno").classList.remove("hidden");
  setLog("s = " + s + ". Is " + s + " currently in M? Answer Yes or No.", false);
}

// ---- Step 3: Yes/No (is s unmatched?) ----
function onYesNo(answeredYes) {
  if (step !== "unmatched") return;
  const partner = state.studentPartner[currentS];
  const isFree = partner === null;
  if (answeredYes !== isFree) {
    if (isFree) {
      setLog(currentS + " is not in M yet, so s IS unmatched. The answer is Yes.", true);
    } else {
      setLog(currentS + " is currently matched to " + partner + ", so the answer is No.", true);
    }
    return;
  }
  document.getElementById("yesno").classList.add("hidden");

  if (isFree) {
    step = "auto"; // clicks are paused while the step plays
    renderPseudocode(ADD_LINE);
    const h = currentH, s = currentS;
    applyProposal(state, h); // engine does the Add
    refreshDisplay();
    setLog("Correct. " + s + " is unmatched, so (" + h + ", " + s +
           ") is added to M. Click the next free hospital.", false);
    setTimeout(returnToWhile, 900); // red box returns to the While line
  } else {
    step = "prefers";
    renderPseudocode(PREFERS_LINE);
    setLog("Correct. " + currentS + " is matched to " + partner +
           ", so we take the Else branch. In " + currentS + "'s row, click the hospital " +
           currentS + " prefers: h = " + currentH + " or h\u2032 = " + partner + ".", false);
  }
}

function renderM(skipH) {
  const box = document.getElementById("m-box");
  const pairs = currentMatching(state).filter(function (p) {
    return p[0] !== skipH;   // lets us show M with one pair already removed
  });
  if (pairs.length === 0) {
    box.innerHTML = '<span class="placeholder">M is empty</span>';
    return;
  }
  box.innerHTML = pairs.map(function (p) {
    return '<span class="chip">(' + p[0] + ", " + p[1] + ")</span>";
  }).join("");
}

function refreshDisplay() {
  renderM();
  document.querySelectorAll("#hospital-table tr[data-name]").forEach(function (row) {
    const h = row.dataset.name;
    const partner = state.hospitalPartner[h];
    row.querySelector(".status").textContent = partner ? "matched to " + partner : "free";
    row.querySelectorAll(".pref-cell").forEach(function (cell, i) {
      cell.classList.remove("proposing");
      cell.classList.toggle("proposed", i < state.proposedCount[h]);
    });
  });
  document.querySelectorAll("#student-table tr[data-name]").forEach(function (row) {
    const partner = state.studentPartner[row.dataset.name];
    row.querySelector(".status").textContent = partner ? "matched to " + partner : "free";
  });
  highlightRow("hospital-table", null);
  highlightRow("student-table", null);
}

function returnToWhile() {
  step = "while";
  currentH = null;
  currentS = null;
  renderPseudocode(WHILE_LINE);
}

function onStudentCellClick(cell) {
  if (step !== "prefers") {
    setLog("Not yet. Finish the highlighted line first.", true);
    return;
  }
  const rowName = cell.parentElement.dataset.name;
  const picked = cell.dataset.item;
  const partner = state.studentPartner[currentS];   // this is h'

  if (rowName !== currentS) {
    setLog("That's " + rowName + "'s list. The student in question is " + currentS + ".", true);
    return;
  }
  if (picked !== currentH && picked !== partner) {
    setLog(picked + " isn't one of the two hospitals being compared. " +
           "Compare h = " + currentH + " with h\u2032 = " + partner + ".", true);
    return;
  }
  const preferred = studentPrefers(currentS, currentH, partner) ? currentH : partner;
  const other = (preferred === currentH) ? partner : currentH;
  if (picked !== preferred) {
    setLog(currentS + " ranks " + preferred + " above " + other +
           ", so " + preferred + " is the preferred hospital.", true);
    return;
  }

  preferredHospital = preferred;
  step = "auto";   // clicks paused while the step plays
  finishProposal(preferred, partner);
}

function finishProposal(preferred, partner) {
  const h = currentH, s = currentS;

  if (preferred === h) {
    // Remove (h', s), pause, then Add (h, s)
    renderPseudocode(REMOVE_LINE);
    renderM(partner);   // M shown without the removed pair
    setLog("Remove (" + partner + ", " + s + ") from M. " + partner + " is free again.", false);
    setTimeout(function () {
      applyProposal(state, h);   // engine performs the swap
      renderPseudocode(ADD_AFTER_REMOVE_LINE);
      refreshDisplay();
      setLog("Add (" + h + ", " + s + ") to M. Click the next free hospital.", false);
      setTimeout(returnToWhile, 1000);
    }, 1000);
  } else {
    // s prefers h', so nothing changes except h's proposal count
    renderPseudocode(DO_NOTHING_LINE);
    applyProposal(state, h);
    refreshDisplay();
    setLog(s + " prefers " + partner + ", so " + s + " rejects " + h +
           " and M is unchanged. Click the next free hospital.", false);
    setTimeout(returnToWhile, 1000);
  }
}

function onNoHospitalClick() {
  if (step === "done") return;
  if (step !== "while") {
    setLog("Not yet. Finish the highlighted line first.", true);
    return;
  }
  const open = eligibleHospitals(state);
  if (open.length > 0) {
    setLog(open[0] + " is still free and hasn't proposed to every student, " +
           "so the While condition is still true.", true);
    return;
  }
  step = "done";
  renderPseudocode(RETURN_LINE);
  setLog("Correct. Every hospital is matched, so the While condition is false " +
         "and the algorithm returns M.", false);
  unlockQuiz();
}

function unlockQuiz() {
  document.querySelector(".locked-note").textContent =
    "Which matching did the algorithm return?";
  document.querySelectorAll(".quiz-btn").forEach(function (b) { b.disabled = false; });
}

function onQuizClick(btn) {
  const opt = QUIZ_OPTIONS[btn.dataset.index];
  const fb = document.getElementById("quiz-feedback");
  if (opt.correct) {
    btn.classList.add("right");
    document.querySelectorAll(".quiz-btn").forEach(function (b) { b.disabled = true; });
    fb.textContent = "Correct! " + opt.explanation +
      " Hospital-proposing Gale-Shapley gives this same matching no matter which free hospital you pick first.";
  } else {
    btn.classList.add("wrong");
    btn.disabled = true;
    fb.textContent = "Not quite. " + opt.explanation + " Try another option.";
  }
}

function resetAll() {
  if (step === "auto") {
    setLog("Wait a moment for the current step to finish.", true);
    return;
  }
  state = createState();
  currentH = null;
  currentS = null;
  preferredHospital = null;
  step = "while";
  firstClick = true;
  document.getElementById("yesno").classList.add("hidden");
  refreshDisplay();
  renderPseudocode(WHILE_LINE);
  renderQuiz();
  document.querySelector(".locked-note").textContent =
    "Finish the walkthrough to unlock the answer choices.";
  document.getElementById("quiz-feedback").textContent = "";
  setLog("Click a free hospital to begin.", false);
}

function loadProblem(index) {
  if (step === "auto") {
    setLog("Wait a moment for the current step to finish.", true);
    return;
  }
  currentProblem = index;
  const p = PROBLEMS[index];
  HOSPITAL_PREFS = p.hospitalPrefs;
  STUDENT_PREFS = p.studentPrefs;
  QUIZ_OPTIONS = p.quiz;
  renderPreferenceTable("hospital-table", HOSPITAL_PREFS, "Hospital");
  renderPreferenceTable("student-table", STUDENT_PREFS, "Student");
  markClickable();
  document.getElementById("problem-label").textContent =
    "(" + p.name + " of " + PROBLEMS.length + ")";
  resetAll();   // clears M, state, quiz, highlights, and the log
}

function nextProblem() {
  loadProblem((currentProblem + 1) % PROBLEMS.length);
}

// ---- Wire up clicks ----
function markClickable() {
  document.querySelectorAll(
    "#hospital-table .row-label, #hospital-table .pref-cell, #student-table .pref-cell"
  ).forEach(function (cell) { cell.classList.add("clickable"); });
}
markClickable();

document.getElementById("hospital-table").addEventListener("click", function (e) {
  const cell = e.target.closest("td");
  if (!cell) return;
  if (cell.classList.contains("row-label")) onHospitalClick(cell.textContent);
  else if (cell.classList.contains("pref-cell")) onPrefCellClick(cell);
});

document.getElementById("student-table").addEventListener("click", function (e) {
  const cell = e.target.closest(".pref-cell");
  if (cell) onStudentCellClick(cell);
});

document.getElementById("btn-reset").addEventListener("click", resetAll);
document.getElementById("quiz-options").addEventListener("click", function (e) {
  const btn = e.target.closest(".quiz-btn");
  if (btn && !btn.disabled) onQuizClick(btn);
});

document.getElementById("btn-yes").addEventListener("click", function () { onYesNo(true); });
document.getElementById("btn-no").addEventListener("click", function () { onYesNo(false); });
document.getElementById("btn-done").addEventListener("click", onNoHospitalClick);
document.getElementById("btn-new").addEventListener("click", nextProblem);

loadProblem(0);