// All practice problems. Add new ones to this list.
const PROBLEMS = [
  {
    name: "Problem 1",
    hospitalPrefs: {
      H1: ["S1", "S2", "S3"],
      H2: ["S1", "S2", "S3"],
      H3: ["S2", "S3", "S1"]
    },
    studentPrefs: {
      S1: ["H3", "H2", "H1"],
      S2: ["H1", "H2", "H3"],
      S3: ["H1", "H2", "H3"]
    },
    quiz: [
      { text: "(H1,S2), (H2,S1), (H3,S3)", correct: true,
        explanation: "This is exactly the M you built." },
      { text: "(H1,S2), (H2,S3), (H3,S1)", correct: false,
        explanation: "This matching is stable, but it's the student-proposing result. In the hospital-proposing algorithm, H2 gets S1 (its 1st choice) and H3 gets S3, so the hospitals do better." },
      { text: "(H1,S1), (H2,S2), (H3,S3)", correct: false,
        explanation: "This matching is unstable. (H2, S1) is a blocking pair: H2 prefers S1 to S2, and S1 prefers H2 to H1." },
      { text: "(H1,S2), (H2,S1)", correct: false,
        explanation: "This is incomplete. H3 is unmatched, and the While loop doesn't stop until every hospital is matched (or has proposed to everyone)." }
    ]
  },

  {
  name: "Problem 2",
  hospitalPrefs: {
    H1: ["S2", "S1", "S3"],
    H2: ["S2", "S3", "S1"],
    H3: ["S1", "S3", "S2"]
  },
  studentPrefs: {
    S1: ["H1", "H3", "H2"],
    S2: ["H2", "H1", "H3"],
    S3: ["H1", "H2", "H3"]
  },
  quiz: [
    { text: "(H1,S1), (H2,S2), (H3,S3)", correct: true,
      explanation: "This is exactly the M you built. It is also the only stable matching for these lists." },
    { text: "(H1,S2), (H2,S3), (H3,S1)", correct: false,
      explanation: "This is what you get if S2 never switches. S2 would rather have H2 than H1, and H2 would rather have S2 than S3, so (H2, S2) is a blocking pair." },
    { text: "(H1,S3), (H2,S2), (H3,S1)", correct: false,
      explanation: "This matching is unstable. (H1, S1) is a blocking pair: H1 prefers S1 to S3, and S1 prefers H1 to H3." },
    { text: "(H1,S1), (H2,S2)", correct: false,
      explanation: "This is incomplete. H3 is unmatched, and the loop doesn't stop until every hospital is matched or has proposed to everyone." }
  ]
},

{
  name: "Problem 3",
  hospitalPrefs: {
    H1: ["S1", "S3", "S2"],
    H2: ["S1", "S2", "S3"],
    H3: ["S3", "S2", "S1"]
  },
  studentPrefs: {
    S1: ["H3", "H2", "H1"],
    S2: ["H1", "H2", "H3"],
    S3: ["H2", "H1", "H3"]
  },
  quiz: [
    { text: "(H1,S3), (H2,S1), (H3,S2)", correct: true,
      explanation: "This is exactly the M you built." },
    { text: "(H1,S2), (H2,S3), (H3,S1)", correct: false,
      explanation: "This matching is stable, but it's the student-proposing result. Every student gets their 1st choice, while every hospital gets its 3rd." },
    { text: "(H1,S2), (H2,S1), (H3,S3)", correct: false,
      explanation: "This matching is unstable. (H1, S3) is a blocking pair: H1 prefers S3 to S2, and S3 prefers H1 to H3." },
    { text: "(H1,S3), (H2,S1)", correct: false,
      explanation: "This is incomplete. H3 is unmatched, and the loop doesn't stop until every hospital is matched or has proposed to everyone." }
  ]
}
];

// The current problem. Step 3 will switch these when you load a new problem.
let currentProblem = 0;
let HOSPITAL_PREFS = PROBLEMS[0].hospitalPrefs;
let STUDENT_PREFS = PROBLEMS[0].studentPrefs;
let QUIZ_OPTIONS = PROBLEMS[0].quiz;