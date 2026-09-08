/**
 * Survey instrument codebook for Sokcho Smart City platform feedback.
 * Used for research export — keep question IDs stable across languages.
 */
export const SURVEY_INSTRUMENTS = {
  "city-pulse": {
    section: "City Pulse",
    description: "Perceived usefulness and clarity of Sokcho news feed",
    questions: [
      {
        id: "useful",
        type: "stars",
        scale: "1-5 Likert (1=low, 5=high)",
        labelEn: "How useful was today's news feed?",
        labelKo: "오늘의 뉴스 피드가 얼마나 유용했나요?",
      },
      {
        id: "clear",
        type: "options",
        scale: "yes | somewhat | no",
        labelEn: "Was the information easy to understand?",
        labelKo: "정보가 이해하기 쉬웠나요?",
        options: [
          { code: "yes", labelEn: "Yes", labelKo: "예" },
          { code: "somewhat", labelEn: "Somewhat", labelKo: "보통" },
          { code: "no", labelEn: "No", labelKo: "아니오" },
        ],
      },
      {
        id: "comments",
        type: "text",
        scale: "open text",
        labelEn: "Any comments?",
        labelKo: "의견이 있으신가요?",
      },
    ],
  },
  opportunities: {
    section: "Opportunities",
    description: "Job listing relevance and findability",
    questions: [
      {
        id: "relevant",
        type: "options",
        scale: "yes | no",
        labelEn: "Was this listing relevant to you?",
        labelKo: "이 공고가 관심사와 맞았나요?",
        options: [
          { code: "yes", labelEn: "Yes", labelKo: "예" },
          { code: "no", labelEn: "No", labelKo: "아니오" },
        ],
      },
      {
        id: "ease",
        type: "stars",
        scale: "1-5 Likert (1=low, 5=high)",
        labelEn: "How easy was it to find what you were looking for?",
        labelKo: "원하는 정보를 찾기 쉬웠나요?",
      },
      {
        id: "looking",
        type: "options",
        scale: "job | internship | scholarship | other",
        labelEn: "What type of opportunity are you most looking for?",
        labelKo: "가장 찾고 있는 기회 유형은?",
        options: [
          { code: "job", labelEn: "Job", labelKo: "일자리" },
          { code: "internship", labelEn: "Internship", labelKo: "인턴" },
          { code: "scholarship", labelEn: "Scholarship", labelKo: "장학금" },
          { code: "other", labelEn: "Other", labelKo: "기타" },
        ],
      },
    ],
  },
  "tourism-map": {
    section: "Tourism Map",
    description: "Map usefulness for exploring Sokcho",
    questions: [
      {
        id: "helpful",
        type: "stars",
        scale: "1-5 Likert (1=low, 5=high)",
        labelEn: "How helpful was the map for exploring Sokcho?",
        labelKo: "속초 탐색에 지도가 얼마나 도움이 되었나요?",
      },
      {
        id: "found",
        type: "options",
        scale: "yes | no",
        labelEn: "Did you find the location you were looking for?",
        labelKo: "찾던 장소를 찾으셨나요?",
        options: [
          { code: "yes", labelEn: "Yes", labelKo: "예" },
          { code: "no", labelEn: "No", labelKo: "아니오" },
        ],
      },
      {
        id: "category",
        type: "options",
        scale: "tourism | food | health | banking | government",
        labelEn: "Which category was most useful to you?",
        labelKo: "가장 유용했던 카테고리는?",
        options: [
          { code: "tourism", labelEn: "Tourism", labelKo: "관광" },
          { code: "food", labelEn: "Food", labelKo: "음식" },
          { code: "health", labelEn: "Health", labelKo: "의료" },
          { code: "banking", labelEn: "Banking", labelKo: "은행" },
          { code: "government", labelEn: "Government", labelKo: "관공서" },
        ],
      },
    ],
  },
  "international-navigator": {
    section: "International Navigator",
    description: "Guide content completeness and clarity",
    questions: [
      {
        id: "found",
        type: "options",
        scale: "yes | partially | no",
        labelEn: "Did you find the information you needed?",
        labelKo: "필요한 정보를 찾으셨나요?",
        options: [
          { code: "yes", labelEn: "Yes", labelKo: "예" },
          { code: "partially", labelEn: "Partially", labelKo: "일부" },
          { code: "no", labelEn: "No", labelKo: "아니오" },
        ],
      },
      {
        id: "clear",
        type: "stars",
        scale: "1-5 Likert (1=low, 5=high)",
        labelEn: "How clear was the content?",
        labelKo: "내용이 얼마나 명확했나요?",
      },
      {
        id: "missing",
        type: "text",
        scale: "open text",
        labelEn: "What information was missing?",
        labelKo: "빠진 정보가 있다면?",
      },
    ],
  },
  chatbot: {
    section: "Sokcho Assistant",
    description: "Chat assistant helpfulness",
    questions: [
      {
        id: "helpful",
        type: "stars",
        scale: "1-5 Likert (1=low, 5=high)",
        labelEn: "Was the assistant's answer helpful?",
        labelKo: "어시스턴트 답변이 도움이 되었나요?",
      },
      {
        id: "needed",
        type: "options",
        scale: "yes | no",
        labelEn: "Did you get the information you needed?",
        labelKo: "필요한 정보를 얻으셨나요?",
        options: [
          { code: "yes", labelEn: "Yes", labelKo: "예" },
          { code: "no", labelEn: "No", labelKo: "아니오" },
        ],
      },
      {
        id: "comments",
        type: "text",
        scale: "open text",
        labelEn: "Any comments on the assistant?",
        labelKo: "어시스턴트에 대한 의견이 있나요?",
      },
    ],
  },
};

export function questionKey(page, questionId) {
  return `${page}__${questionId}`;
}

export function allQuestionColumns() {
  const cols = [];
  for (const [page, instrument] of Object.entries(SURVEY_INSTRUMENTS)) {
    for (const q of instrument.questions) {
      cols.push({
        page,
        questionId: q.id,
        column: questionKey(page, q.id),
        type: q.type,
        scale: q.scale,
        labelEn: q.labelEn,
      });
    }
  }
  return cols;
}
