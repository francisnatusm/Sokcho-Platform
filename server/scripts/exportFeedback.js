/**
 * Export Firestore feedback as a classic survey results table for thesis analysis.
 *
 * Main file: SURVEY_RESULTS.csv
 *   - 1 row = 1 respondent submission
 *   - columns = metadata + Q1/Q2/Q3 (label, answer, numeric score)
 *
 * Also writes:
 *   - SURVEY_RESULTS_WIDE.csv  (all instruments as separate columns)
 *   - codebook.csv / CODEBOOK.md
 *
 * Run: npm run export:feedback  (from server/)
 */
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config({
  path: "e:/Smart Computer Project/sokcho-platform/.env",
  override: true,
});
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import { initFirebaseAdmin, getDb } from "../firebase.js";
import {
  SURVEY_INSTRUMENTS,
  allQuestionColumns,
  questionKey,
} from "../data/surveyCodebook.js";

initFirebaseAdmin();

function csvEscape(value) {
  const s = value == null ? "" : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(rows) {
  return rows.map((r) => r.map(csvEscape).join(",")).join("\n");
}

function writeCsv(filePath, rows) {
  fs.writeFileSync(filePath, "\uFEFF" + toCsv(rows), "utf8");
}

function tsParts(timestamp) {
  const iso =
    timestamp?.toDate?.()?.toISOString?.() ||
    (timestamp instanceof Date
      ? timestamp.toISOString()
      : String(timestamp || ""));
  if (!iso || iso === "undefined") return { date: "", time: "", iso: "" };
  const [date, rest] = iso.split("T");
  const time = (rest || "").replace("Z", "").slice(0, 8);
  return { date: date || "", time, iso };
}

/** Convert answers to numbers for means / charts in Excel */
function toNumeric(type, code) {
  if (code === null || code === undefined || code === "") return "";
  if (type === "stars") {
    const n = Number(code);
    return Number.isFinite(n) ? n : "";
  }
  const map = {
    yes: 1,
    somewhat: 2,
    partially: 2,
    no: 0,
    job: 1,
    internship: 2,
    scholarship: 3,
    other: 4,
    tourism: 1,
    food: 2,
    health: 3,
    banking: 4,
    government: 5,
  };
  const key = String(code).toLowerCase().trim();
  if (Object.prototype.hasOwnProperty.call(map, key)) return map[key];
  const asNum = Number(code);
  return Number.isFinite(asNum) ? asNum : "";
}

function normalizeResponse(page, response, idx) {
  const instrument = SURVEY_INSTRUMENTS[page];
  const qid = response?.questionId || `q${idx + 1}`;
  const qMeta = instrument?.questions?.find((q) => q.id === qid);

  let code = response?.answerCode ?? response?.answer ?? "";
  let label = response?.answerLabel ?? response?.answer ?? "";
  let type = response?.questionType || qMeta?.type || "";
  let questionLabel =
    response?.question || qMeta?.labelEn || qMeta?.labelKo || qid;

  // Legacy: plain "Yes"/"예" without codes
  if (qMeta?.options?.length) {
    const raw = String(response?.answer ?? label ?? "").trim();
    const hit = qMeta.options.find(
      (o) =>
        o.code === String(code).toLowerCase() ||
        o.labelEn.toLowerCase() === raw.toLowerCase() ||
        o.labelKo === raw
    );
    if (hit) {
      code = hit.code;
      label = hit.labelEn;
      type = "options";
    }
  }

  if (type === "stars" || qMeta?.type === "stars") {
    const n = Number(code);
    if (Number.isFinite(n)) {
      code = n;
      label = String(n);
      type = "stars";
    }
  }

  return {
    questionId: qid,
    type,
    questionLabel,
    answerCode: code,
    answerLabel: label,
    answerNumeric: toNumeric(type || qMeta?.type, code),
  };
}

const day = new Date().toISOString().slice(0, 10);
const outDir = path.resolve(
  "e:/Smart Computer Project/sokcho-platform/exports",
  `survey-${day}`
);
fs.mkdirSync(outDir, { recursive: true });

const snap = await getDb().collection("feedback").orderBy("timestamp", "asc").get();
const questionCols = allQuestionColumns();

/* ---------- CODEBOOK ---------- */
const codebookRows = [
  [
    "column_name",
    "section",
    "question_id",
    "type",
    "scale_or_codes",
    "question_en",
    "question_ko",
    "numeric_coding",
  ],
];
for (const [page, instrument] of Object.entries(SURVEY_INSTRUMENTS)) {
  for (const q of instrument.questions) {
    let numeric = "";
    if (q.type === "stars") numeric = "1=low … 5=high";
    else if (q.type === "options" && q.options?.length) {
      numeric = q.options
        .map((o) => `${toNumeric("options", o.code)}=${o.code}`)
        .join("; ");
    } else numeric = "text (no number)";
    codebookRows.push([
      questionKey(page, q.id),
      instrument.section,
      q.id,
      q.type,
      q.scale,
      q.labelEn,
      q.labelKo,
      numeric,
    ]);
  }
}
writeCsv(path.join(outDir, "codebook.csv"), codebookRows);

const md = [
  `# Survey results — how to read the files`,
  ``,
  `## Main file for your paper: \`SURVEY_RESULTS.csv\``,
  ``,
  `| Column | Meaning |`,
  `| --- | --- |`,
  `| respondent_no | Row number (1, 2, 3…) |`,
  `| date | Response date (UTC) |`,
  `| language | UI language (en/ko) |`,
  `| section | Which part of the platform was rated |`,
  `| q1_question … q3_question | The survey question text |`,
  `| q1_answer … q3_answer | What they chose (code) |`,
  `| q1_score … q3_score | Number for charts/averages in Excel |`,
  ``,
  `**Tip:** In Excel, use PivotTable or \`AVERAGE\` on \`q1_score\` / \`q2_score\` columns to get means for your results section.`,
  ``,
  `Star scores: **1–5**. Yes/No style: **yes=1, somewhat/partially=2, no=0**.`,
  ``,
  `## Other files`,
  `- \`SURVEY_RESULTS_WIDE.csv\` — all question variables as separate columns (SPSS style)`,
  `- \`codebook.csv\` — full variable dictionary`,
  ``,
];
for (const [page, instrument] of Object.entries(SURVEY_INSTRUMENTS)) {
  md.push(`### ${instrument.section} (\`${page}\`)`);
  instrument.questions.forEach((q, i) => {
    md.push(`${i + 1}. ${q.labelEn} _(id: ${q.id}, ${q.scale})_`);
  });
  md.push(``);
}
fs.writeFileSync(path.join(outDir, "README.md"), md.join("\n"), "utf8");

/* ---------- MAIN RESULTS TABLE (classic survey layout) ---------- */
const resultsHeader = [
  "respondent_no",
  "response_id",
  "date",
  "time_utc",
  "session_id",
  "language",
  "section",
  "section_id",
  "q1_question",
  "q1_answer",
  "q1_score",
  "q2_question",
  "q2_answer",
  "q2_score",
  "q3_question",
  "q3_answer",
  "q3_score",
];
const resultsRows = [resultsHeader];

/* ---------- WIDE (SPSS) ---------- */
const wideHeader = [
  "respondent_no",
  "response_id",
  "date",
  "time_utc",
  "session_id",
  "language",
  "section",
  "section_id",
  ...questionCols.flatMap((c) => [c.column, `${c.column}_score`]),
];
const wideRows = [wideHeader];

let n = 0;
snap.forEach((doc) => {
  n += 1;
  const data = doc.data() || {};
  const page = data.page || data.instrument || "";
  const section =
    SURVEY_INSTRUMENTS[page]?.section || page || "Unknown";
  const { date, time, iso } = tsParts(data.timestamp);
  const responses = Array.isArray(data.responses) ? data.responses : [];

  const normalized = responses.map((r, idx) =>
    normalizeResponse(page, r, idx)
  );

  // Pad to 3 question slots (each instrument has ≤3 items)
  while (normalized.length < 3) {
    normalized.push({
      questionId: "",
      type: "",
      questionLabel: "",
      answerCode: "",
      answerLabel: "",
      answerNumeric: "",
    });
  }

  const q = (i) => normalized[i] || {};
  resultsRows.push([
    n,
    doc.id,
    date,
    time,
    data.sessionId || "",
    data.language || "",
    section,
    page,
    q(0).questionLabel,
    q(0).answerCode,
    q(0).answerNumeric,
    q(1).questionLabel,
    q(1).answerCode,
    q(1).answerNumeric,
    q(2).questionLabel,
    q(2).answerCode,
    q(2).answerNumeric,
  ]);

  const wide = {
    respondent_no: n,
    response_id: doc.id,
    date,
    time_utc: time,
    session_id: data.sessionId || "",
    language: data.language || "",
    section,
    section_id: page,
  };
  for (const col of questionCols) {
    wide[col.column] = "";
    wide[`${col.column}_score`] = "";
  }
  for (const item of normalized) {
    if (!item.questionId) continue;
    const key = questionKey(page, item.questionId);
    if (Object.prototype.hasOwnProperty.call(wide, key)) {
      wide[key] = item.answerCode;
      wide[`${key}_score`] = item.answerNumeric;
    }
  }
  wideRows.push(wideHeader.map((h) => wide[h] ?? ""));
});

writeCsv(path.join(outDir, "SURVEY_RESULTS.csv"), resultsRows);
writeCsv(path.join(outDir, "SURVEY_RESULTS_WIDE.csv"), wideRows);

/* ---------- Quick summary counts (handy for results section) ---------- */
const summaryHeader = [
  "section",
  "question_slot",
  "question",
  "n_answers",
  "mean_score",
  "min_score",
  "max_score",
];
const summaryRows = [summaryHeader];
const buckets = new Map();

for (let i = 1; i < resultsRows.length; i++) {
  const row = resultsRows[i];
  const section = row[6];
  for (const slot of [1, 2, 3]) {
    // q1: 8,9,10 — q2: 11,12,13 — q3: 14,15,16
    const base = 5 + slot * 3;
    const question = row[base];
    const score = row[base + 2];
    if (!question || score === "" || score === undefined) continue;
    const key = `${section}||${slot}||${question}`;
    if (!buckets.has(key)) {
      buckets.set(key, { section, slot, question, scores: [] });
    }
    const num = Number(score);
    if (Number.isFinite(num)) buckets.get(key).scores.push(num);
  }
}

for (const b of buckets.values()) {
  const scores = b.scores;
  const mean =
    scores.length > 0
      ? (scores.reduce((a, c) => a + c, 0) / scores.length).toFixed(2)
      : "";
  summaryRows.push([
    b.section,
    `Q${b.slot}`,
    b.question,
    scores.length,
    mean,
    scores.length ? Math.min(...scores) : "",
    scores.length ? Math.max(...scores) : "",
  ]);
}
writeCsv(path.join(outDir, "SURVEY_SUMMARY.csv"), summaryRows);

console.log(`Survey results pack → ${outDir}`);
console.log(`  respondents (rows): ${n}`);
console.log(`  MAIN FILE: SURVEY_RESULTS.csv`);
console.log(
  `  also: SURVEY_RESULTS_WIDE.csv, SURVEY_SUMMARY.csv, codebook.csv, README.md`
);
process.exit(0);
