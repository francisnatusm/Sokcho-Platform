import dotenv from "dotenv";
dotenv.config({
  path: "e:/Smart Computer Project/sokcho-platform/.env",
  override: true,
});
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import { initFirebaseAdmin, getDb } from "../firebase.js";

initFirebaseAdmin();
const db = getDb();

const samples = [
  {
    page: "city-pulse",
    instrument: "city-pulse",
    surveyVersion: "1.0",
    language: "en",
    sessionId: "demo-user-1",
    platform: "sokcho-smart-city",
    responses: [
      {
        questionId: "useful",
        questionType: "stars",
        question: "How useful was today's news feed?",
        answer: 4,
        answerLabel: "4",
        answerCode: 4,
      },
      {
        questionId: "clear",
        questionType: "options",
        question: "Was the information easy to understand?",
        answer: "yes",
        answerLabel: "Yes",
        answerCode: "yes",
      },
      {
        questionId: "comments",
        questionType: "text",
        question: "Any comments?",
        answer: "Helpful weather and news",
        answerLabel: "Helpful weather and news",
        answerCode: null,
      },
    ],
    timestamp: new Date(),
  },
  {
    page: "opportunities",
    instrument: "opportunities",
    surveyVersion: "1.0",
    language: "ko",
    sessionId: "demo-user-2",
    platform: "sokcho-smart-city",
    responses: [
      {
        questionId: "relevant",
        questionType: "options",
        question: "Was this listing relevant to you?",
        answer: "yes",
        answerLabel: "예",
        answerCode: "yes",
      },
      {
        questionId: "ease",
        questionType: "stars",
        question: "How easy was it to find what you were looking for?",
        answer: 5,
        answerLabel: "5",
        answerCode: 5,
      },
      {
        questionId: "looking",
        questionType: "options",
        question: "What type of opportunity are you most looking for?",
        answer: "internship",
        answerLabel: "인턴",
        answerCode: "internship",
      },
    ],
    timestamp: new Date(),
  },
];

for (const sample of samples) {
  await db.collection("feedback").add(sample);
}
console.log(`Seeded ${samples.length} demo survey rows`);
process.exit(0);
