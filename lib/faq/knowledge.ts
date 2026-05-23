export type FAQIntent =
  | "what_is_lockintalks"
  | "is_it_kid_friendly"
  | "age_rules"
  | "registration_steps"
  | "payment_help"
  | "refunds"
  | "judging"
  | "cash_prizes"
  | "safety_and_trust"
  | "dashboard_help"
  | "competition_schedule"
  | "contact_support"
  | "certificates"
  | "admin_publication";

export type FAQAnswer = {
  intent: FAQIntent;
  title: string;
  aliases: string[];
  keywords: string[];
  answer: string;
  followUps: string[];
};

export const faqFallback = "I Can't Help With That Yet. Please Contact LockInTalks For More Assistance.";

export const faqCorpus: FAQAnswer[] = [
  {
    intent: "what_is_lockintalks",
    title: "What LockInTalks Is",
    aliases: ["what is lockintalks", "about lockintalks", "what does lockintalks do"],
    keywords: ["platform", "public", "speaking", "competition", "online", "students", "teens", "children"],
    answer:
      "LockInTalks is an online public speaking competition platform for young students and teenagers. It gives students a structured place to practise speaking, build confidence, join age-grouped events, and compete for recognition and cash prize opportunities.",
    followUps: ["Who can join?", "Can beginners join?", "How do online competitions work?"]
  },
  {
    intent: "is_it_kid_friendly",
    title: "Younger Kids And Parent Guidance",
    aliases: ["is lockintalks good for a 7-year-old", "is it good for a 7-year-old", "is it friendly for a 7 year old", "can younger kids join", "can my child join"],
    keywords: ["7", "seven", "year", "old", "young", "younger", "kid", "child", "children", "parent", "guardian", "suitable", "age"],
    answer:
      "LockInTalks is designed mainly for young students and teens. Younger children may be able to participate depending on the specific competition age group, with parent or guardian guidance. Please check the competition details or contact lockintalks@gmail.com.",
    followUps: ["Is age proof required?", "Can shy students join?", "Who should I contact for help?"]
  },
  {
    intent: "age_rules",
    title: "Age Groups And Verification",
    aliases: ["age rules", "age group", "age proof", "age verification", "proof of age"],
    keywords: ["age", "proof", "verification", "birth", "certificate", "fair", "category", "group"],
    answer:
      "Each competition lists its age group. Age verification may be required before participation, and accepted participants may be asked by email to submit proof of age. This helps keep competition categories fair and trusted for students, parents, and schools.",
    followUps: ["Can younger kids join?", "What details are required?", "How do online competitions work?"]
  },
  {
    intent: "registration_steps",
    title: "Registration Steps",
    aliases: ["how to register", "registration steps", "join competition", "sign up for competition"],
    keywords: ["register", "registration", "signup", "sign", "login", "participant", "city", "country", "guardian", "details"],
    answer:
      "To register, log in or create an account, choose a live competition, enter the participant details, and continue to payment. The form asks for student age, city, country or nation, and guardian contact details so the entry can be managed safely.",
    followUps: ["How do payments work?", "What appears in the dashboard?", "Is age proof required?"]
  },
  {
    intent: "payment_help",
    title: "Payments",
    aliases: ["how do payments work", "payment help", "razorpay", "upi payment"],
    keywords: ["payment", "pay", "razorpay", "upi", "card", "wallet", "netbanking", "checkout", "failed", "pending"],
    answer:
      "Payments use Razorpay Checkout for UPI, cards, netbanking, and wallets. LockInTalks treats a payment as confirmed only after server-side verification and captured payment confirmation. If a payment is pending, please do not pay again right away; contact lockintalks@gmail.com if it does not update.",
    followUps: ["What if payment fails?", "Do competitions have cash prizes?", "Who should I contact for help?"]
  },
  {
    intent: "refunds",
    title: "Refunds And Cancellations",
    aliases: ["refund policy", "refund", "cancel payment", "money back"],
    keywords: ["refund", "cancel", "cancellation", "money", "back"],
    answer:
      "A public refund policy is not listed yet. For refund or cancellation questions, contact lockintalks@gmail.com with the participant name and competition details.",
    followUps: ["Who should I contact for help?", "How do payments work?"]
  },
  {
    intent: "judging",
    title: "Judging And Winners",
    aliases: ["how are winners chosen", "judging criteria", "how will I be judged"],
    keywords: ["judge", "judging", "criteria", "winner", "score", "clarity", "confidence", "creativity", "structure", "stage", "presence", "time"],
    answer:
      "Winners are chosen using the judging criteria listed on the competition page. Criteria may include confidence, clarity, creativity, speech structure, stage presence, and time management.",
    followUps: ["Do competitions have cash prizes?", "Can beginners join?", "Where is the schedule?"]
  },
  {
    intent: "cash_prizes",
    title: "Cash Prizes",
    aliases: ["cash prizes", "do competitions have prizes", "winner prize", "cash awards"],
    keywords: ["cash", "prize", "award", "reward", "money", "winner", "top", "performer"],
    answer:
      "Every LockInTalks competition includes cash prize opportunities. Exact prize details are shown on the competition page when published by the admin team, so families can review the reward information before registering.",
    followUps: ["How are winners chosen?", "How do payments work?", "Which competitions are live?"]
  },
  {
    intent: "safety_and_trust",
    title: "Safety And Parent Trust",
    aliases: ["is it safe", "parent trust", "is lockintalks safe", "school friendly"],
    keywords: ["safe", "safety", "trust", "parent", "guardian", "school", "secure", "email", "fair"],
    answer:
      "LockInTalks is designed to keep registration, categories, and competition communication clear for students and parents. It uses secure accounts, guardian email details, age verification when needed, and server-verified payments.",
    followUps: ["Is age proof required?", "Who should I contact for help?", "Can shy students join?"]
  },
  {
    intent: "dashboard_help",
    title: "Dashboard",
    aliases: ["dashboard", "where is my registration", "payment history", "certificates section"],
    keywords: ["dashboard", "account", "registration", "payment", "history", "certificate", "event", "profile"],
    answer:
      "The dashboard shows your registered competitions, payment history, upcoming-event guidance, and certificate placeholders. After login, normal users are sent to the dashboard automatically.",
    followUps: ["How do I register?", "Do students get certificates?", "Who should I contact for help?"]
  },
  {
    intent: "competition_schedule",
    title: "Competition Date And Time",
    aliases: ["competition time", "competition date", "timezone", "schedule", "deadline"],
    keywords: ["date", "time", "timezone", "ist", "schedule", "deadline", "countdown", "upcoming", "live", "closed"],
    answer:
      "Each competition page shows the competition date, time, timezone, countdown, and registration deadline when available. IST is used by default unless another timezone is listed.",
    followUps: ["How do online competitions work?", "How are winners chosen?", "Which competitions are live?"]
  },
  {
    intent: "contact_support",
    title: "Contact Support",
    aliases: ["contact", "support", "help", "email lockintalks"],
    keywords: ["contact", "support", "help", "email", "problem", "question", "issue"],
    answer: "For support, questions, or competition help, contact lockintalks@gmail.com.",
    followUps: ["How do payments work?", "How do I register?"]
  },
  {
    intent: "certificates",
    title: "Certificates",
    aliases: ["certificate", "do students get certificates", "recognition"],
    keywords: ["certificate", "certificates", "recognition", "proof", "participation", "dashboard"],
    answer:
      "Certificates are planned for completed competitions and appear as a dashboard section. Availability can depend on the event and results process.",
    followUps: ["What appears in the dashboard?", "How are winners chosen?"]
  },
  {
    intent: "admin_publication",
    title: "Live Competitions",
    aliases: ["admin-created competitions", "which competitions appear", "draft live closed"],
    keywords: ["admin", "created", "competition", "draft", "live", "closed", "published", "visibility"],
    answer:
      "Competitions appear publicly when the LockInTalks admin team marks them live. Draft competitions stay hidden, and closed competitions are not open for new registration.",
    followUps: ["Which competitions are live?", "How do I register?"]
  }
];

const unrelatedTerms = ["weather", "movie", "song", "game cheat", "hack", "password", "crypto", "stock", "fortnite skin", "football score"];

export function findFAQAnswer(question: string) {
  const normalized = normalizeFAQText(question);
  if (!normalized) {
    return {
      answer: "Ask a LockInTalks question and I will try to help.",
      title: "Ready When You Are",
      followUps: faqCorpus[0].followUps,
      isFallback: false
    };
  }

  if (unrelatedTerms.some((term) => normalized.includes(term))) {
    return { answer: faqFallback, title: "Unsupported Question", followUps: ["Who should I contact for help?"], isFallback: true };
  }

  const questionTokens = new Set(tokenize(normalized));
  let best = { score: 0, item: faqCorpus[0] };

  for (const item of faqCorpus) {
    const aliasScore = item.aliases.reduce((total, alias) => (normalized.includes(normalizeFAQText(alias)) ? total + 9 : total), 0);
    const keywordScore = item.keywords.reduce((total, keyword) => (questionTokens.has(keyword) || normalized.includes(keyword) ? total + 2 : total), 0);
    const titleScore = normalizeFAQText(item.title)
      .split(" ")
      .reduce((total, token) => (questionTokens.has(token) ? total + 1 : total), 0);
    const score = aliasScore + keywordScore + titleScore;

    if (score > best.score) {
      best = { score, item };
    }
  }

  if (best.score < 2) {
    return { answer: faqFallback, title: "Unsupported Question", followUps: ["Who should I contact for help?"], isFallback: true };
  }

  return {
    answer: best.item.answer,
    title: best.item.title,
    followUps: best.item.followUps,
    isFallback: false
  };
}

export function normalizeFAQText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function tokenize(value: string) {
  return normalizeFAQText(value)
    .split(" ")
    .filter((token) => token.length > 1);
}
