/**
 * Shared survey option codes — keep UI labels translated, store codes in Firestore.
 */
export function opt(code, label) {
  return { value: code, label };
}

export function buildPulseQuestions(t) {
  return [
    { id: "useful", text: t("fb.pulse.useful"), type: "stars" },
    {
      id: "clear",
      text: t("fb.pulse.clear"),
      type: "options",
      options: [
        opt("yes", t("common.yes")),
        opt("somewhat", t("common.somewhat")),
        opt("no", t("common.no")),
      ],
    },
    { id: "comments", text: t("fb.pulse.comments"), type: "text" },
  ];
}

export function buildJobsQuestions(t) {
  return [
    {
      id: "relevant",
      text: t("fb.jobs.relevant"),
      type: "options",
      options: [opt("yes", t("common.yes")), opt("no", t("common.no"))],
    },
    { id: "ease", text: t("fb.jobs.ease"), type: "stars" },
    {
      id: "looking",
      text: t("fb.jobs.looking"),
      type: "options",
      options: [
        opt("parttime", t("fb.jobs.opt.parttime")),
        opt("fulltime", t("fb.jobs.opt.fulltime")),
        opt("other", t("fb.jobs.opt.other")),
      ],
    },
  ];
}

export function buildMapQuestions(t) {
  return [
    { id: "helpful", text: t("fb.map.helpful"), type: "stars" },
    {
      id: "found",
      text: t("fb.map.found"),
      type: "options",
      options: [opt("yes", t("common.yes")), opt("no", t("common.no"))],
    },
    {
      id: "category",
      text: t("fb.map.category"),
      type: "options",
      options: [
        opt("attraction", t("fb.map.opt.attraction")),
        opt("restaurant", t("fb.map.opt.restaurant")),
        opt("hotel", t("fb.map.opt.hotel")),
        opt("hospital", t("fb.map.opt.hospital")),
        opt("bank", t("fb.map.opt.bank")),
        opt("government", t("fb.map.opt.government")),
      ],
    },
  ];
}

export function buildNavQuestions(t) {
  return [
    {
      id: "found",
      text: t("fb.nav.found"),
      type: "options",
      options: [
        opt("yes", t("common.yes")),
        opt("partially", t("common.partially")),
        opt("no", t("common.no")),
      ],
    },
    { id: "clear", text: t("fb.nav.clear"), type: "stars" },
    { id: "missing", text: t("fb.nav.missing"), type: "text" },
  ];
}

export function buildChatQuestions(t) {
  return [
    { id: "helpful", text: t("fb.chat.helpful"), type: "stars" },
    {
      id: "needed",
      text: t("fb.chat.needed"),
      type: "options",
      options: [opt("yes", t("common.yes")), opt("no", t("common.no"))],
    },
    { id: "comments", text: t("fb.chat.comments"), type: "text" },
  ];
}
