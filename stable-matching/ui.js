// Display code only. Algorithm logic will go in engine.js later.

const PSEUDOCODE = [
  { text: "Gale-Shapley(preference lists for n hospitals and n students)", indent: 0 },
  { text: "Let M be an empty matching", indent: 1 },
  { text: "While some hospital h is unmatched and hasn't proposed to every student:", indent: 1 },
  { text: "Let s be the first student on h's list to whom h has not yet proposed", indent: 2 },
  { text: "If s is unmatched:", indent: 2 },
  { text: "Add (h, s) to M", indent: 3 },
  { text: "Else s is matched to h\u2032:", indent: 2 },
  { text: "If s prefers h to h\u2032:", indent: 3 },
  { text: "Remove (h\u2032, s) from M", indent: 4 },
  { text: "Add (h, s) to M", indent: 4 },
  { text: "Else s prefers h\u2032 to h:", indent: 3 },
  { text: "Do nothing", indent: 4 },
  { text: "Return M", indent: 1 }
];

const ORDINALS = ["1st", "2nd", "3rd", "4th", "5th"];

function renderPreferenceTable(tableId, prefs, kind) {
  const table = document.getElementById(tableId);
  const n = Object.values(prefs)[0].length;
  let html = "<tr><th>" + kind + "</th>";
  for (let i = 0; i < n; i++) html += "<th>" + ORDINALS[i] + "</th>";
  html += "<th>Status</th></tr>";
  for (const [name, list] of Object.entries(prefs)) {
    html += '<tr data-name="' + name + '"><td class="row-label">' + name + "</td>";
    list.forEach(function (item) {
      html += '<td class="pref-cell" data-item="' + item + '">' + item + "</td>";
    });
    html += '<td class="status">free</td></tr>';
  }
  table.innerHTML = html;
}

function renderPseudocode(activeIndex) {
  const box = document.getElementById("pseudocode");
  box.innerHTML = "";
  PSEUDOCODE.forEach(function (line, i) {
    const div = document.createElement("div");
    div.className = "line" + (i === activeIndex ? " active" : "");
    div.style.paddingLeft = (line.indent * 1.5 + 0.5) + "em";
    div.textContent = line.text;
    box.appendChild(div);
  });
}

function renderQuiz() {
  const box = document.getElementById("quiz-options");
  box.innerHTML = "";
  const order = QUIZ_OPTIONS.map(function (opt, i) { return i; });
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = order[i]; order[i] = order[j]; order[j] = tmp;
  }
  order.forEach(function (idx) {
    const btn = document.createElement("button");
    btn.className = "quiz-btn";
    btn.textContent = QUIZ_OPTIONS[idx].text;
    btn.dataset.index = idx;
    btn.disabled = true; // unlocked when the algorithm returns M
    box.appendChild(btn);
  });
}

renderPreferenceTable("hospital-table", HOSPITAL_PREFS, "Hospital");
renderPreferenceTable("student-table", STUDENT_PREFS, "Student");
renderPseudocode(2); // red box on the While line
renderQuiz();