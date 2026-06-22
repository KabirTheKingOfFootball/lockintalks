export type FAQIntent =
  | "what_is_lockintalks"
  | "is_it_kid_friendly"
  | "beginner_shy"
  | "age_rules"
  | "registration_steps"
  | "required_details"
  | "payment_help"
  | "refunds"
  | "judging"
  | "cash_prizes"
  | "safety_and_trust"
  | "dashboard_help"
  | "competition_schedule"
  | "online_format"
  | "competition_types"
  | "speech_topics"
  | "parent_consent"
  | "prize_pool"
  | "account_login_help"
  | "contact_support"
  | "certificates"
  | "results"
  | "admin_publication";

export type FAQAnswer = {
  intent: FAQIntent;
  title: string;
  aliases: string[];
  keywords: string[];
  answer: string;
  followUps: string[];
};

export type FAQResult = {
  answer: string;
  title: string;
  followUps: string[];
  isFallback: boolean;
  confidence: number;
  matchedIntent?: FAQIntent;
};

export type FAQKnowledgeChunk = {
  title: string;
  text: string;
  keywords: string[];
  wordCount: number;
};

export const faqFallback = "I Can't Help With That Yet. Please Contact LockInTalks For More Assistance.";

export const faqCorpus: FAQAnswer[] = [
  {
    intent: "what_is_lockintalks",
    title: "What LockInTalks Is",
    aliases: ["what is lockintalks", "about lockintalks", "what does lockintalks do", "explain lockintalks", "is lockintalks"],
    keywords: ["platform", "public", "speaking", "competition", "online", "students", "teens", "children", "confidence", "communication", "voice"],
    answer:
      "LockInTalks is an online public speaking competition platform for young students and teenagers. It gives students a structured place to practise speaking, build confidence, join age-grouped events, and compete for recognition and cash prize opportunities.\n\nThink of it as a supportive online stage: students prepare, speak, get judged using clear criteria, and build communication confidence step by step.",
    followUps: ["Who can join?", "Can beginners join?", "How do online competitions work?"]
  },
  {
    intent: "is_it_kid_friendly",
    title: "Younger Kids And Parent Guidance",
    aliases: [
      "is lockintalks good for a 7-year-old",
      "is lockintalks good for a 7 year old",
      "is it good for a 7-year-old",
      "is it friendly for a 7 year old",
      "can younger kids join",
      "can my child join",
      "can my kid participate",
      "is it suitable for children",
      "is it suitable for kids"
    ],
    keywords: ["7", "seven", "8", "eight", "9", "nine", "year", "old", "young", "younger", "kid", "kids", "child", "children", "parent", "guardian", "suitable", "age"],
    answer:
      "LockInTalks is designed mainly for young students and teens. Younger children may be able to participate depending on the specific competition age group, with parent or guardian guidance.\n\nPlease check the age group on the competition page before registering. If you are unsure, contact lockintalks@gmail.com with the child's age and the competition name.",
    followUps: ["Is age proof required?", "Can shy students join?", "Who should I contact for help?"]
  },
  {
    intent: "beginner_shy",
    title: "Beginners And Shy Students",
    aliases: [
      "can beginners join",
      "can shy students join",
      "i am shy can i join",
      "is this good for shy kids",
      "is this good for beginners",
      "first time speaker",
      "stage fear"
    ],
    keywords: ["beginner", "beginners", "shy", "nervous", "fear", "stage", "first", "time", "new", "practice", "confidence", "improve", "learn", "scared"],
    answer:
      "Yes. LockInTalks is made for students who want to improve, not only students who already feel perfect on stage. Beginners and shy students can join suitable competitions, practise with structure, and grow confidence in a supportive environment.\n\nParents can help younger or nervous students choose the right age group and prepare calmly before the event.",
    followUps: ["How do online competitions work?", "How are winners chosen?", "Is age proof required?"]
  },
  {
    intent: "age_rules",
    title: "Age Groups And Verification",
    aliases: ["age rules", "age group", "age groups", "age proof", "age verification", "proof of age", "birth certificate", "why age proof"],
    keywords: ["age", "proof", "verification", "birth", "certificate", "fair", "category", "group", "email", "accepted", "participant"],
    answer:
      "Each competition lists its age group. Age verification may be required before participation, and accepted participants may be asked by email to submit proof of age before the competition begins.\n\nThis is not meant to scare anyone. It helps keep age categories fair, trusted, and parent-friendly.",
    followUps: ["Can younger kids join?", "What details are required?", "How do online competitions work?"]
  },
  {
    intent: "registration_steps",
    title: "Registration Steps",
    aliases: ["how to register", "registration steps", "join competition", "sign up for competition", "register for a competition", "how can i join"],
    keywords: ["register", "registration", "signup", "sign", "login", "participant", "competition", "join", "account", "form", "guardian"],
    answer:
      "To register, log in or create an account, choose a live competition, enter the participant details, and continue to payment. The dashboard then helps you track your registration and upcoming event information.\n\nIf you click Register while logged out, LockInTalks should ask you to log in or create an account first, then return you to that competition flow.",
    followUps: ["What details are required?", "How do payments work?", "What appears in the dashboard?"]
  },
  {
    intent: "required_details",
    title: "Details Needed For Registration",
    aliases: ["what details are required", "what information do i need", "city country age", "why city country", "participant details"],
    keywords: ["details", "required", "information", "age", "city", "country", "nation", "guardian", "email", "student", "name", "form"],
    answer:
      "Registration asks for the student's name, age, city, country or nation, guardian name, and guardian email. These details help LockInTalks manage age groups, contact families if needed, and keep the competition process organized.\n\nUse a valid email because important updates, age-proof requests, and competition help may be sent there.",
    followUps: ["Is age proof required?", "How do I register?", "Who should I contact for help?"]
  },
  {
    intent: "payment_help",
    title: "Payments",
    aliases: ["how do payments work", "payment help", "razorpay", "upi payment", "payment pending", "payment failed", "what if payment fails"],
    keywords: ["payment", "pay", "razorpay", "upi", "card", "wallet", "netbanking", "checkout", "failed", "pending", "verify", "verified", "transaction"],
    answer:
      "Payments use Razorpay Checkout for UPI, cards, netbanking, and wallets. LockInTalks treats a payment as confirmed only after secure server-side verification.\n\nIf a payment is pending, please do not pay again immediately. Wait a short time and contact lockintalks@gmail.com if it does not update.",
    followUps: ["What if payment fails?", "Do competitions have cash prizes?", "Who should I contact for help?"]
  },
  {
    intent: "refunds",
    title: "Refunds And Cancellations",
    aliases: ["refund policy", "refund", "cancel payment", "money back", "can i cancel", "payment refund"],
    keywords: ["refund", "cancel", "cancellation", "money", "back", "return", "policy"],
    answer:
      "LockInTalks has a Cancellation and Refund Policy page for beta payment review. Refund requests should be sent to lockintalks@gmail.com with the participant name, account email, competition name, and payment details.\n\nRefund eligibility can depend on event timing, payment status, and whether the competition service has already begun.",
    followUps: ["Who should I contact for help?", "How do payments work?"]
  },
  {
    intent: "judging",
    title: "Judging And Winners",
    aliases: ["how are winners chosen", "judging criteria", "how will i be judged", "what are judges looking for", "how participants will be judged"],
    keywords: ["judge", "judging", "criteria", "winner", "winners", "score", "scoring", "clarity", "confidence", "creativity", "structure", "stage", "presence", "time"],
    answer:
      "Winners are chosen using the judging criteria listed on the competition page. Criteria may include confidence, clarity, creativity, speech structure, stage presence, and time management.\n\nThe exact criteria can vary by competition, so always read the competition detail page before preparing.",
    followUps: ["Do competitions have cash prizes?", "Can beginners join?", "Where is the schedule?"]
  },
  {
    intent: "cash_prizes",
    title: "Cash Prizes",
    aliases: ["cash prizes", "do competitions have prizes", "winner prize", "cash awards", "prize money", "cash reward"],
    keywords: ["cash", "prize", "prizes", "award", "awards", "reward", "money", "winner", "top", "performer", "performers"],
    answer:
      "Every LockInTalks competition includes cash prize opportunities. Exact prize details are shown on the competition page when published by the admin team, so families can review reward information before registering.\n\nFamilies should rely on the live competition page for official prize details, not unverified numbers shared elsewhere.",
    followUps: ["How are winners chosen?", "How do payments work?", "Which competitions are live?"]
  },
  {
    intent: "safety_and_trust",
    title: "Safety And Parent Trust",
    aliases: ["is it safe", "parent trust", "is lockintalks safe", "school friendly", "is this legit", "is this trustworthy"],
    keywords: ["safe", "safety", "trust", "trusted", "parent", "guardian", "school", "secure", "email", "fair", "legit", "scam"],
    answer:
      "LockInTalks is designed to keep registration, categories, and competition communication clear for students and parents. It uses secure accounts, guardian email details, age verification when needed, and server-verified payments.\n\nFor any support question, parents can contact lockintalks@gmail.com directly.",
    followUps: ["Is age proof required?", "Who should I contact for help?", "Can shy students join?"]
  },
  {
    intent: "dashboard_help",
    title: "Dashboard",
    aliases: ["dashboard", "where is my registration", "payment history", "certificates section", "where can i see my competition"],
    keywords: ["dashboard", "account", "registration", "payment", "history", "certificate", "certificates", "event", "profile", "upcoming"],
    answer:
      "The dashboard shows your registered competitions, payment history, upcoming-event guidance, and certificate status. After login, normal users are sent to the dashboard automatically.\n\nIf something looks missing after payment or registration, refresh once and contact lockintalks@gmail.com with your account email if it still does not appear.",
    followUps: ["How do I register?", "Do students get certificates?", "Who should I contact for help?"]
  },
  {
    intent: "competition_schedule",
    title: "Competition Date And Time",
    aliases: ["competition time", "competition date", "timezone", "schedule", "deadline", "when is the competition", "what time is the competition"],
    keywords: ["date", "time", "timezone", "ist", "schedule", "deadline", "countdown", "upcoming", "live", "closed", "starts", "start"],
    answer:
      "Each competition page shows the competition date, time, timezone, countdown, and registration deadline when available. IST is used by default unless another timezone is listed.\n\nA competition may be shown as upcoming, live, or closed depending on its schedule and visibility settings.",
    followUps: ["How do online competitions work?", "How are winners chosen?", "Which competitions are live?"]
  },
  {
    intent: "online_format",
    title: "How Online Competitions Work",
    aliases: ["how do online competitions work", "is it online", "online competition", "where does the competition happen", "do i travel"],
    keywords: ["online", "zoom", "meet", "video", "remote", "travel", "home", "round", "rounds", "speak", "submit", "live"],
    answer:
      "LockInTalks competitions are managed online. Students register through the website, follow the competition instructions, participate according to the listed schedule, and track updates through their account.\n\nSpecific joining links, round format, or submission instructions may depend on the competition and will be shared through the event details or support communication.",
    followUps: ["Where is the schedule?", "Can shy students join?", "What details are required?"]
  },
  {
    intent: "competition_types",
    title: "Competition Types",
    aliases: ["competition types", "types of competitions", "what competitions are there", "story talks", "idol talk", "power talk", "debate", "storytelling"],
    keywords: ["type", "types", "story", "storytelling", "idol", "role", "model", "motivational", "power", "debate", "extempore", "speech", "challenge"],
    answer:
      "LockInTalks can host different public speaking formats, including storytelling, motivational speaking, role-model speeches, extempore speaking, debate-style events, and speech challenges.\n\nAlways check the live competition page because each event has its own age group, topic style, rules, time limit, judging criteria, date, and prize details.",
    followUps: ["Can I speak about a role model?", "How are winners chosen?", "Which competitions are live?"]
  },
  {
    intent: "speech_topics",
    title: "Speech Topics And Preparation",
    aliases: ["what can i speak about", "speech topic", "topic ideas", "can i speak about football", "can i talk about my idol", "role model speech", "how should i prepare"],
    keywords: ["topic", "topics", "speech", "prepare", "preparation", "football", "sports", "idol", "role", "model", "dream", "discipline", "confidence", "story", "motivation"],
    answer:
      "Your topic depends on the competition. Some events may allow stories, role models, sports mindset, dreams, discipline, confidence, student life, leadership, or motivational ideas.\n\nA strong speech usually has a clear opening, one main message, simple examples, confident delivery, and a short ending that feels complete. Read the competition detail page before preparing so your topic matches the event rules.",
    followUps: ["Can beginners join?", "How will I be judged?", "How do online competitions work?"]
  },
  {
    intent: "parent_consent",
    title: "Parent Or Guardian Support",
    aliases: ["parent consent", "guardian consent", "do parents need to know", "under 18", "minor participant", "parent permission"],
    keywords: ["parent", "guardian", "consent", "permission", "minor", "under", "18", "family", "email", "support"],
    answer:
      "Participants below 18 should register with parent or guardian awareness and guidance. LockInTalks asks for guardian details so important event, age verification, payment, or support communication can reach the right adult.\n\nParents can contact lockintalks@gmail.com before registration if they want help understanding an event.",
    followUps: ["Is age proof required?", "What details are required?", "Is LockInTalks safe?"]
  },
  {
    intent: "prize_pool",
    title: "Prize Pool",
    aliases: ["prize pool", "live prize pool", "how prize pool works", "500 every 5", "verified contestants"],
    keywords: ["prize", "pool", "live", "500", "5", "participants", "verified", "paid", "cash", "amazon", "gift", "cards"],
    answer:
      "Where prize pool logic is enabled, the prize pool should count only verified successful paid registrations. Failed, cancelled, refunded, pending, or unverified payments should not increase the prize pool.\n\nFor the current launch format, each competition can have its own admin-configured entry fee and prize pool contribution. Public pages should explain that more verified participants can create a bigger prize pool, and final prize details should always be checked on the live competition page.",
    followUps: ["Do competitions have cash prizes?", "How are winners chosen?", "How do payments work?"]
  },
  {
    intent: "account_login_help",
    title: "Login, Signup, And Account Help",
    aliases: ["login help", "signup help", "cannot login", "cannot sign up", "account problem", "forgot password", "email confirmation"],
    keywords: ["login", "signup", "sign", "account", "email", "confirmation", "dashboard", "password", "stuck", "register", "session"],
    answer:
      "If you cannot log in or sign up, first make sure you are using the correct email and a stable internet connection. If email confirmation is enabled, check your inbox and spam folder for the confirmation email.\n\nIf the issue continues, contact lockintalks@gmail.com with your account email and a short explanation. Do not send passwords or private payment details in normal chat messages.",
    followUps: ["How do I register?", "What appears in the dashboard?", "Who should I contact for help?"]
  },
  {
    intent: "contact_support",
    title: "Contact Support",
    aliases: ["contact", "support", "help", "email lockintalks", "who do i contact", "contact us", "customer care"],
    keywords: ["contact", "support", "help", "email", "problem", "question", "issue", "stuck", "error", "mail"],
    answer:
      "For support, questions, or competition help, contact lockintalks@gmail.com.\n\nInclude your account email, participant name, competition name, and a short explanation so the team can help faster.",
    followUps: ["How do payments work?", "How do I register?"]
  },
  {
    intent: "certificates",
    title: "Certificates",
    aliases: ["certificate", "certificates", "do students get certificates", "recognition", "participation certificate"],
    keywords: ["certificate", "certificates", "recognition", "proof", "participation", "dashboard", "award"],
    answer:
      "Certificates are planned for completed competitions and appear as a dashboard section. Availability can depend on the event and results process.\n\nIf a certificate is not visible yet, wait for the results process or contact lockintalks@gmail.com for help.",
    followUps: ["What appears in the dashboard?", "How are winners chosen?"]
  },
  {
    intent: "results",
    title: "Results And Announcements",
    aliases: ["when are results", "results", "winner announcement", "how will results be announced", "where are results"],
    keywords: ["result", "results", "announcement", "announce", "winner", "winners", "shortlist", "selected", "after", "competition"],
    answer:
      "Results are shared after the competition and judging process is complete. Winners are selected based on the listed judging criteria, and important updates may appear in the dashboard or be shared through email.\n\nUse a valid guardian email so result and verification communication can reach you.",
    followUps: ["How are winners chosen?", "Do competitions have cash prizes?", "Do students get certificates?"]
  },
  {
    intent: "admin_publication",
    title: "Live Competitions",
    aliases: ["admin-created competitions", "which competitions appear", "draft live closed", "why can't i see a competition", "competition not visible"],
    keywords: ["admin", "created", "competition", "draft", "live", "closed", "published", "visibility", "hidden", "public", "appear"],
    answer:
      "Competitions appear publicly when the LockInTalks admin team marks them live. Draft competitions stay hidden, and closed competitions are not open for new registration.\n\nIf you expected a competition to be visible, it may still be in draft, closed, or waiting for final details.",
    followUps: ["Which competitions are live?", "How do I register?"]
  }
];

const stopWords = new Set([
  "a",
  "an",
  "and",
  "are",
  "can",
  "do",
  "does",
  "for",
  "from",
  "how",
  "i",
  "is",
  "it",
  "me",
  "my",
  "of",
  "on",
  "or",
  "please",
  "should",
  "the",
  "there",
  "this",
  "to",
  "what",
  "when",
  "where",
  "who",
  "why",
  "with"
]);

const synonymGroups = [
  ["kid", "kids", "child", "children", "student", "students", "young", "younger"],
  ["signup", "sign", "register", "registration", "join", "account"],
  ["pay", "payment", "paid", "checkout", "transaction", "razorpay", "upi"],
  ["prize", "prizes", "award", "awards", "reward", "cash", "money"],
  ["judge", "judges", "judging", "criteria", "score", "scoring", "winner", "winners"],
  ["safe", "safety", "trusted", "trustworthy", "legit", "secure", "parent", "guardian"],
  ["time", "date", "schedule", "deadline", "timezone", "ist", "countdown"],
  ["shy", "nervous", "beginner", "beginners", "scared", "practice", "confidence"],
  ["certificate", "certificates", "recognition", "participation"],
  ["support", "contact", "help", "email", "mail", "issue", "problem"],
  ["topic", "topics", "speech", "idea", "ideas", "prepare", "preparation"],
  ["pool", "prizepool", "participants", "verified", "paid"]
];

const unrelatedTerms = [
  "weather",
  "movie",
  "song lyrics",
  "game cheat",
  "hack",
  "crypto",
  "stock",
  "fortnite skin",
  "football score",
  "homework answer"
];

const internalSafetyTerms = ["api key", "service role", "cookie value", "token", "secret key", "real password", "database password", "debug endpoint"];

export function findFAQAnswer(question: string, knowledgeChunks: FAQKnowledgeChunk[] = []): FAQResult {
  const normalized = normalizeFAQText(question);
  if (!normalized) {
    return {
      answer: "Ask a LockInTalks question and I will try to help. I can answer questions about age groups, registration, prizes, judging, payments, safety, dashboard basics, and online competition flow.",
      title: "Ready When You Are",
      followUps: faqCorpus[0].followUps,
      isFallback: false,
      confidence: 1,
      matchedIntent: "what_is_lockintalks"
    };
  }

  if (unrelatedTerms.some((term) => normalized.includes(term)) || internalSafetyTerms.some((term) => normalized.includes(term))) {
    return fallbackResult();
  }

  const shortcut = findShortcutAnswer(normalized);
  if (shortcut) return answerToResult(shortcut, 99);

  const questionTokens = expandTokens(tokenize(normalized));
  let best = { score: 0, item: faqCorpus[0] };
  const essayMatch = findEssayMatch(questionTokens, normalized, knowledgeChunks);

  for (const item of faqCorpus) {
    const normalizedTitle = normalizeFAQText(item.title);
    const aliasScore = item.aliases.reduce((total, alias) => {
      const normalizedAlias = normalizeFAQText(alias);
      if (normalized === normalizedAlias) return total + 28;
      if (normalized.includes(normalizedAlias)) return total + 16;
      if (sharesImportantPhrase(normalized, normalizedAlias)) return total + 8;
      return total;
    }, 0);

    const keywordScore = item.keywords.reduce((total, keyword) => {
      const normalizedKeyword = normalizeFAQText(keyword);
      if (questionTokens.has(normalizedKeyword)) return total + 4;
      if (normalized.includes(normalizedKeyword)) return total + 2;
      return total;
    }, 0);

    const titleScore = tokenize(normalizedTitle).reduce((total, token) => (questionTokens.has(token) ? total + 2 : total), 0);
    const coverageScore = getCoverageScore(questionTokens, item);
    const score = aliasScore + keywordScore + titleScore + coverageScore;

    if (score > best.score) {
      best = { score, item };
    }
  }

  if (best.score < 4) {
    if (essayMatch && essayMatch.score >= 5) return essayToResult(essayMatch.chunk, essayMatch.score);
    return fallbackResult();
  }

  const structuredResult = answerToResult(best.item, best.score);
  if (essayMatch && essayMatch.score >= 7 && best.score < 18) {
    return {
      ...structuredResult,
      answer: `${structuredResult.answer}\n\nExtra context from the LockInTalks knowledge essay: ${trimEssayText(essayMatch.chunk.text)}`,
      confidence: structuredResult.confidence + Math.min(essayMatch.score, 12)
    };
  }

  return structuredResult;
}

export function normalizeFAQText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

export function buildFAQKnowledgeChunks(essay: string): FAQKnowledgeChunk[] {
  const sections = essay
    .split(/\n(?=##\s+)/)
    .map((section) => section.trim())
    .filter(Boolean);

  const chunks: FAQKnowledgeChunk[] = [];

  for (const section of sections) {
    const lines = section.split("\n").map((line) => line.trim()).filter(Boolean);
    const title = lines[0]?.replace(/^#+\s*/, "").trim() || "LockInTalks Knowledge";
    const body = lines
      .slice(1)
      .filter((line) => !line.startsWith("|"))
      .filter((line) => !line.startsWith("```"))
      .join("\n\n");
    const paragraphs = body.split(/\n{2,}/).map((paragraph) => paragraph.trim()).filter(Boolean);

    for (let index = 0; index < paragraphs.length; index += 2) {
      const text = [paragraphs[index], paragraphs[index + 1]].filter(Boolean).join("\n\n");
      if (!isPublicFAQChunk(text)) continue;
      chunks.push({
        title,
        text,
        keywords: extractChunkKeywords(`${title} ${text}`),
        wordCount: countWords(text)
      });
    }
  }

  return chunks.filter((chunk) => chunk.wordCount >= 35).slice(0, 90);
}

function tokenize(value: string) {
  return normalizeFAQText(value)
    .split(" ")
    .filter((token) => token.length > 1 && !stopWords.has(token));
}

function expandTokens(tokens: string[]) {
  const expanded = new Set(tokens);

  for (const token of tokens) {
    const singular = token.endsWith("s") ? token.slice(0, -1) : token;
    if (singular.length > 2) expanded.add(singular);

    for (const group of synonymGroups) {
      if (group.includes(token) || group.includes(singular)) {
        group.forEach((word) => expanded.add(word));
      }
    }
  }

  return expanded;
}

function getCoverageScore(questionTokens: Set<string>, item: FAQAnswer) {
  const answerTokens = new Set([...tokenize(item.answer), ...item.keywords]);
  let matches = 0;

  questionTokens.forEach((token) => {
    if (answerTokens.has(token)) matches += 1;
  });

  return Math.min(matches, 6);
}

function sharesImportantPhrase(question: string, alias: string) {
  const aliasTokens = tokenize(alias);
  if (aliasTokens.length < 2) return false;
  return aliasTokens.some((token, index) => index > 0 && question.includes(`${aliasTokens[index - 1]} ${token}`));
}

function findShortcutAnswer(normalized: string) {
  const hasAny = (terms: string[]) => terms.some((term) => normalized.includes(term));

  if (/\b(7|seven|8|eight|9|nine)\b/.test(normalized) && hasAny(["year old", "child", "kid", "student", "join", "participate", "suitable", "friendly"])) {
    return faqCorpus.find((item) => item.intent === "is_it_kid_friendly");
  }

  if (hasAny(["shy", "nervous", "stage fear", "beginner", "first time", "scared"]) && hasAny(["join", "good", "okay", "competition", "speak", "student"])) {
    return faqCorpus.find((item) => item.intent === "beginner_shy");
  }

  if (hasAny(["refund", "cancel", "money back"])) return faqCorpus.find((item) => item.intent === "refunds");
  if (hasAny(["age proof", "proof of age", "birth certificate", "age verification"])) return faqCorpus.find((item) => item.intent === "age_rules");
  if (hasAny(["payment pending", "payment failed", "upi", "razorpay", "transaction"])) return faqCorpus.find((item) => item.intent === "payment_help");
  if (hasAny(["prize pool", "live prize pool", "500 every 5", "verified contestants"])) return faqCorpus.find((item) => item.intent === "prize_pool");
  if (hasAny(["cash prize", "cash prizes", "prize money", "cash award"])) return faqCorpus.find((item) => item.intent === "cash_prizes");
  if (hasAny(["speech topic", "topic ideas", "football speech", "role model", "my idol"])) return faqCorpus.find((item) => item.intent === "speech_topics");
  if (hasAny(["parent consent", "guardian consent", "under 18", "parent permission"])) return faqCorpus.find((item) => item.intent === "parent_consent");
  if (hasAny(["login help", "signup help", "cannot login", "forgot password", "email confirmation"])) return faqCorpus.find((item) => item.intent === "account_login_help");
  if (hasAny(["story talks", "idol talk", "power talk", "competition types", "types of competitions"])) return faqCorpus.find((item) => item.intent === "competition_types");
  if (hasAny(["contact", "support", "help email", "email lockintalks"])) return faqCorpus.find((item) => item.intent === "contact_support");
  if (hasAny(["is it safe", "is this safe", "is this legit", "parent trust", "scam"])) return faqCorpus.find((item) => item.intent === "safety_and_trust");
  if (hasAny(["online competition", "how online", "do i travel", "from home"])) return faqCorpus.find((item) => item.intent === "online_format");

  return undefined;
}

function findEssayMatch(questionTokens: Set<string>, normalizedQuestion: string, knowledgeChunks: FAQKnowledgeChunk[]) {
  let best: { score: number; chunk: FAQKnowledgeChunk } | null = null;

  for (const chunk of knowledgeChunks) {
    const title = normalizeFAQText(chunk.title);
    const text = normalizeFAQText(chunk.text);
    let score = 0;

    questionTokens.forEach((token) => {
      if (chunk.keywords.includes(token)) score += 3;
      if (title.includes(token)) score += 2;
      if (text.includes(token)) score += 1;
    });

    if (normalizedQuestion.length > 12 && text.includes(normalizedQuestion)) score += 12;
    if (sharesAnyEssayPhrase(normalizedQuestion, text)) score += 4;

    if (!best || score > best.score) best = { score, chunk };
  }

  return best;
}

function sharesAnyEssayPhrase(question: string, text: string) {
  const tokens = tokenize(question);
  for (let index = 0; index < tokens.length - 1; index += 1) {
    if (text.includes(`${tokens[index]} ${tokens[index + 1]}`)) return true;
  }
  return false;
}

function essayToResult(chunk: FAQKnowledgeChunk, confidence: number): FAQResult {
  return {
    answer: trimEssayText(chunk.text),
    title: `From The LockInTalks Knowledge Essay: ${chunk.title}`,
    followUps: ["How do I register?", "Is LockInTalks safe?", "Who should I contact for help?"],
    isFallback: false,
    confidence
  };
}

function answerToResult(item: FAQAnswer, confidence: number): FAQResult {
  return {
    answer: item.answer,
    title: item.title,
    followUps: item.followUps,
    isFallback: false,
    confidence,
    matchedIntent: item.intent
  };
}

function isPublicFAQChunk(text: string) {
  const normalized = normalizeFAQText(text);
  const blocked = [
    "api auth",
    "api debug",
    "app session",
    "cookie",
    "commit",
    "debug endpoint",
    "environment variable",
    "git ",
    "middleware",
    "password",
    "service role",
    "sql",
    "supabase schema",
    "token",
    "vercel deployment",
    "what not to touch"
  ];

  if (blocked.some((term) => normalized.includes(term.trim()))) return false;
  return /lockintalks|competition|student|parent|guardian|speaking|registration|dashboard|payment|prize|certificate|confidence|judge|online|age/.test(normalized);
}

function extractChunkKeywords(text: string) {
  const counts = new Map<string, number>();
  for (const token of tokenize(text)) {
    if (token.length < 3) continue;
    counts.set(token, (counts.get(token) || 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 28)
    .map(([token]) => token);
}

function trimEssayText(text: string) {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= 720) return cleaned;
  return `${cleaned.slice(0, 700).trim()}...`;
}

function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function fallbackResult(): FAQResult {
  return {
    answer: faqFallback,
    title: "Unsupported Question",
    followUps: ["Who should I contact for help?", "What is LockInTalks?"],
    isFallback: true,
    confidence: 0
  };
}
