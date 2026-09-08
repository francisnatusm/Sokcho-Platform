/**
 * International Navigator content for KDU Sokcho students & residents.
 * Curated from official portals; optional Bright Data refresh can append live notes.
 */
export const NAVIGATOR_SECTIONS = ["visa", "services", "campus", "culture", "language"];

export const NAVIGATOR_CONTENT = {
  visa: {
    title: "Visa & Immigration",
    summary: "Stay legal in Korea — D-2 visa, ARC, and Gangwon immigration help.",
    content: [
      {
        title: "D-2 Student Visa Overview",
        body: "Most degree-seeking international students at Kyungdong University (KDU) hold a D-2 student visa. Keep your passport valid, admission/enrollment certificate, and proof of finances ready for entry, extensions, and school reporting. Part-time work usually requires a separate work permission after you receive your ARC.",
        tips: [
          "Never let your visa expire — start extension paperwork 1–2 months early.",
          "Report address changes to immigration within the required period.",
          "Ask KDU International Student Office for invitation/confirmation letters.",
        ],
        link: "https://www.hikorea.go.kr",
      },
      {
        title: "ARC (Alien Registration Card)",
        body: "Apply for your Alien Registration Card (Residence Card) within 90 days of arrival. You typically need your passport, visa, photo, proof of residence in Sokcho, and a school enrollment certificate. Carry your ARC (or a digital copy if accepted) when traveling inside Korea.",
        tips: [
          "Book an appointment on Hi Korea before visiting the office when possible.",
          "Keep a photo of both sides of your ARC on your phone.",
          "Renew before expiry — processing can take time during peak seasons.",
        ],
        link: "https://www.hikorea.go.kr",
      },
      {
        title: "Hi Korea — Official Immigration Portal",
        body: "Hi Korea is the main online portal for appointments, ARC status, extensions, and immigration forms. Use English mode if available, and prepare scanned documents before you start an application.",
        link: "https://www.hikorea.go.kr",
        phone: "1345",
        hours: "Foreigner information center (voice): daily support hours vary by language",
      },
      {
        title: "Gangwon / Sokcho Immigration Help",
        body: "Sokcho does not always have a full walk-in immigration office for every service. Many students use Hi Korea online first, then visit the regional immigration office that serves Gangwon when an in-person visit is required. Confirm the correct office on Hi Korea before traveling.",
        tips: [
          "Call 1345 for English guidance on which office handles your case.",
          "Bring passport + ARC + school letter + application printouts.",
          "Arrive early on weekdays; offices are typically closed weekends/holidays.",
        ],
        phone: "1345",
        link: "https://www.hikorea.go.kr",
      },
      {
        title: "Common First-Time Mistakes",
        body: "Missing the 90-day ARC deadline, working without permission, forgetting to update your address after moving dorms, and waiting until the last week to extend a visa are the most common problems for new students.",
        tips: [
          "Put ARC and visa expiry dates in your phone calendar with 60-day reminders.",
          "Ask ISO before starting any paid job or internship.",
        ],
      },
    ],
  },

  services: {
    title: "Essential Services",
    summary: "Hospitals, banks, emergencies, and daily errands near Sokcho / KDU.",
    content: [
      {
        title: "Emergency Numbers",
        body: "Memorize these numbers. 1345 is the dedicated foreigner helpline for immigration and living guidance in multiple languages.",
        tips: [
          "112 — Police",
          "119 — Fire / Ambulance",
          "1345 — Foreigner Helpline (immigration & living info)",
          "1330 — Korea Travel Hotline (tourism / English help)",
        ],
      },
      {
        title: "Sokcho Medical Center",
        body: "Main general hospital serving Sokcho with emergency care. Tell reception you need English support if available. Bring ARC/passport and cash or a Korean card.",
        address: "Dongmyeong-dong area, Sokcho-si, Gangwon",
        phone: "033-630-6000",
        hours: "ER: 24 hours · Clinics: weekday daytime (confirm locally)",
        link: "https://www.google.com/maps/search/Sokcho+Medical+Center",
      },
      {
        title: "Pharmacies & Clinics",
        body: "Neighborhood clinics (의원) and pharmacies (약국) are common downtown and near campus areas. Pharmacies often close earlier than convenience stores — check Naver Map hours before you go.",
        tips: [
          "Say: 감기약 주세요 (Please give me cold medicine).",
          "Bring a translation of symptoms on Papago if needed.",
        ],
      },
      {
        title: "Banks & ATMs",
        body: "KB Kookmin, Shinhan, Woori, and Nonghyup branches in Jungang-dong / downtown Sokcho commonly serve students. Foreign cards usually work at many ATMs, but account opening typically requires passport + ARC.",
        tips: [
          "Open a bank account after you receive your ARC.",
          "Ask the teller for a student-friendly account and mobile banking app setup.",
          "Keep a small cash float — some markets still prefer cash.",
        ],
        link: "https://www.google.com/maps/search/banks+in+Sokcho",
      },
      {
        title: "Post Office & Mobile SIM",
        body: "Korea Post (우체국) handles mail and some banking services. For a Korean phone number, major carriers (SKT, KT, LG U+) and downtown mobile shops can set up prepaid or postpaid plans — bring passport/ARC.",
        tips: [
          "Airport SIMs work for short stays; long-term students usually switch to a local plan.",
          "Register your address consistently across bank, school, and phone records.",
        ],
      },
      {
        title: "Police & Safety",
        body: "For theft, lost items, or emergencies call 112. Keep digital copies of passport and ARC. Late-night walking is generally safer in central Sokcho than in many large cities, but stay aware near beaches and quiet streets.",
        phone: "112",
      },
    ],
  },

  campus: {
    title: "KDU Campus Info",
    summary: "Sokcho campus life — ISO, calendar, registration, and scholarships.",
    content: [
      {
        title: "Kyungdong University — Sokcho Campus",
        body: "KDU Sokcho is the home base for many international students in the Smart Computing and related programs. Campus services include library access, student support desks, and international student advising.",
        phone: "033-738-1200",
        link: "https://www.kduniv.ac.kr/eng/",
        tips: [
          "Bookmark the English site and the Korean portal your department uses.",
          "Confirm which office handles visas vs. academic advising — they may differ.",
        ],
      },
      {
        title: "International Student Office (ISO)",
        body: "Go to ISO for enrollment certificates, visa support letters, orientation, scholarship questions, and insurance guidance. Introduce yourself early in the semester so they know how to reach you.",
        phone: "033-631-2000",
        hours: "Typically weekdays 09:00–17:00 (confirm each semester)",
        tips: [
          "Bring your student ID and passport copy to appointments.",
          "Ask for WhatsApp/KakaoTalk or email channels used by your cohort.",
        ],
        link: "https://www.kduniv.ac.kr/eng/",
      },
      {
        title: "Academic Calendar",
        body: "Spring semester usually runs March–June and Fall September–December, with shorter intensive or make-up periods depending on the program. Always verify exact start, exam, and holiday dates on the official KDU notice board each term.",
        tips: [
          "National holidays can move class days — check weekly notices.",
          "Plan ARC/visa trips outside midterm and final weeks.",
        ],
        link: "https://www.kduniv.ac.kr/",
      },
      {
        title: "Course Registration & Tuition",
        body: "Registration and add/drop windows open before each semester on the KDU student portal. Tuition payment deadlines are strict; late payment can block registration or visa documents.",
        tips: [
          "Screenshot confirmation pages after you register.",
          "Ask seniors which professors offer English-friendly materials.",
        ],
      },
      {
        title: "Scholarships & Campus Jobs",
        body: "Merit, attendance, and international-student scholarships may be available through ISO or your department. On-campus assistant roles are limited — check Opportunities on this platform and ISO notice boards.",
        link: "/opportunities",
      },
    ],
  },

  culture: {
    title: "Cultural Guide",
    summary: "Everyday Sokcho living tips — etiquette, transport, money, and seasons.",
    content: [
      {
        title: "Etiquette Basics",
        body: "Use two hands when giving or receiving items from elders or staff. Remove shoes when entering homes and some traditional restaurants. A small bow or nod is a polite greeting. Tipping is not expected in most places.",
        tips: [
          "Say 죄송합니다 when you bump someone; 감사합니다 for thanks.",
          "Keep voices lower on buses and in cafés during study hours.",
        ],
      },
      {
        title: "Getting Around Sokcho",
        body: "City buses connect downtown, the beach, Abai Village, and routes toward Seoraksan. KakaoMap and Naver Map are the most reliable apps for real-time bus routes and walking directions. Taxis are available but cost more than buses.",
        tips: [
          "Save your dorm and campus pins in KakaoMap offline if possible.",
          "Intercity buses/trains connect Sokcho to Seoul and Gangneung — book busy weekends early.",
        ],
        link: "https://map.kakao.com",
      },
      {
        title: "Food & Markets",
        body: "Try dakgangjeong, raw fish (hoe), squid, and market snacks downtown. Convenience stores (CU, GS25, 7-Eleven) are open late. Card payment is widely accepted, but small stalls may prefer cash.",
        tips: [
          "Ask: 덜 맵게 해주세요 (Please make it less spicy).",
          "Check Tourism Map on this platform for restaurant pins near you.",
        ],
        link: "/tourism-map",
      },
      {
        title: "Weather & What to Pack",
        body: "Sokcho has cool summers by the coast, colorful autumn foliage at Seoraksan, cold snowy winters, and windy spring days. Check City Pulse weather before day trips.",
        tips: [
          "Winter: heavy coat, gloves, indoor heating slippers.",
          "Summer: light layers + rain jacket for sudden showers.",
        ],
        link: "/city-pulse",
      },
      {
        title: "Opening a Bank Account & Getting Paid",
        body: "After receiving your ARC, visit a bank with passport + ARC + phone number. Employers and campus offices usually pay via Korean bank transfer. Never share OTP codes from banking SMS.",
      },
    ],
  },

  language: {
    title: "Language Resources",
    summary:
      "Korean & English paths for Sokcho students — KIIP on campus, TOPIK, IELTS prep, and daily phrases.",
    content: [
      {
        title: "KIIP on KDU Sokcho Campus",
        body: "The Korea Immigration & Integration Program (KIIP / 사회통합프로그램) is a Ministry of Justice Korean + Korea-living course with stage evaluations. In Sokcho it is not run by KDU’s ISO directly — Sokcho Family Center (속초시가족센터) operates KIIP classes in the Early Childhood Education Building (유아교육관), 2nd floor, on the Kyungdong University Sokcho campus. Completing stages (up to stage 5) can help with residence-status changes and naturalization scoring. Another Sokcho operator is the Sokcho Marine Industrial Complex Council (for many foreign workers).",
        address: "KIIP classroom (MOJ 2025–27 list): 경동대 속초캠퍼스 유아교육관 2층 · 도리원길 5",
        phone: "033-637-2680",
        tips: [
          "Apply via the Social Integration Information Network (사회통합정보망 / socinet.go.kr) — not only by walking into campus.",
          "Call 속초시가족센터 (033-637-2680) to confirm this semester’s classroom — HQ is also listed at 청초호반로 201, while KIIP classes have been on the KDU campus.",
          "Ask ISO or classmates which stage is open; seats fill by level (0–5).",
          "Bring ARC, passport, and phone number when registering.",
          "Also in Sokcho: 속초해양산업단지협의회 KIIP (농공단지1길 4) · 033-635-8891.",
        ],
        link: "https://www.socinet.go.kr",
      },
      {
        title: "TOPIK — Official Korean Test",
        body: "TOPIK (Test of Proficiency in Korean) is the main official Korean exam for university admission, scholarships, and some visa/job paths. Sokcho does not host a regular TOPIK site; most KDU students register for a session in Seoul (or another designated city) and travel for the test day. KDU Global’s KAP program prepares students for Korean-medium study and expects TOPIK (or an equivalent KDU assessment) for progression — check your track with ISO.",
        tips: [
          "Register early on the official TOPIK site — Seoul seats sell out.",
          "Plan overnight travel if your test is Saturday morning in Seoul.",
          "Keep score reports for scholarships (e.g. TOPIK 3+ often unlocks stronger awards).",
        ],
        link: "https://www.topik.go.kr",
      },
      {
        title: "IELTS — Prep at KDU, Exam in Major Cities",
        body: "KDU Global runs an English Language for Academic Purposes (EAP) track with IELTS Academic strategy classes and mock tests. Official IELTS sittings in Korea are normally in Seoul, Incheon, Daejeon, Daegu, Busan (British Council / IDP) — not a standing public test centre on the Sokcho campus. Some terms, ISO or IEC may share campus-related prep schedules or group registration tips; always confirm the real exam city and date on the official IELTS booking site.",
        tips: [
          "English-medium Smart Computing / hotel / business tracks often look for IELTS 5.5+ (check your year’s admissions rules).",
          "Higher IELTS bands can raise tuition scholarships at KDU Global.",
          "Book Seoul computer IELTS if you need flexible dates; paper dates are fewer.",
        ],
        link: "https://global.kduniv.ac.kr/global/index.php?pCode=1621296571",
      },
      {
        title: "KDU Korean & English Language Support",
        body: "Ask the International Student Office / International Education Center about semester Korean tutoring, conversation partners, KAP (Korean for Academic Purposes), and EAP (English for Academic Purposes). Even basic Korean helps with clinics, delivery apps, and part-time jobs.",
        phone: "033-631-2000",
        link: "https://www.kduniv.ac.kr/eng/",
        tips: [
          "KAP: Korean for campus life; placement by level after an assessment.",
          "EAP: intensive English + IELTS prep toward English-medium degrees.",
        ],
      },
      {
        title: "Recommended Apps",
        body: "Papago (translate), Naver Dictionary, and flashcard apps work well for daily study. KakaoTalk is essential for class group chats and local shops.",
        tips: [
          "Translate menus with Papago camera mode.",
          "Save key phrases offline before hiking Seoraksan (spotty signal).",
        ],
      },
      {
        title: "Survival Phrases",
        body: "안녕하세요 — Hello · 감사합니다 — Thank you · 얼마예요? — How much is it? · 화장실 어디예요? — Where is the bathroom? · 영어로 괜찮아요? — Is English OK? · 도와주세요 — Please help me · 길을 잃었어요 — I'm lost.",
        tips: [
          "Speak slowly; many locals appreciate the effort even if English follows.",
        ],
      },
      {
        title: "Clinic & Pharmacy Phrases",
        body: "머리가 아파요 — I have a headache · 열이 나요 — I have a fever · 배가 아파요 — My stomach hurts · 알레르기가 있어요 — I have an allergy · 처방전 필요해요 — I need a prescription.",
      },
      {
        title: "Campus Phrases",
        body: "수업이 어디예요? — Where is the class? · 지각했어요 — I'm late · 과제 제출했어요 — I submitted the assignment · 교수님, 질문 있어요 — Professor, I have a question.",
      },
    ],
  },
};

export function getStaticNavigatorSection(section) {
  return (
    NAVIGATOR_CONTENT[section] || {
      title: section,
      summary: "",
      content: [],
    }
  );
}
