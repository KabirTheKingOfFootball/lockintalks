export type Competition = {
  slug: string;
  name: string;
  category: string;
  ageGroup: string;
  date: string;
  dateIso: string;
  fee: string;
  status: "draft" | "live" | "closed";
  slotsRemaining: number;
  featured?: boolean;
  summary: string;
  description: string;
  accent: string;
  rules: string[];
  schedule: string[];
  prizes: string[];
  judges: string[];
  criteria: string[];
};

export const competitions: Competition[] = [
  {
    slug: "debate-battles-global",
    name: "Debate Battles Global",
    category: "Debate Battles",
    ageGroup: "10-16 years",
    date: "June 22, 2026",
    dateIso: "2026-06-22T14:00:00+05:30",
    fee: "₹499",
    status: "live",
    slotsRemaining: 28,
    featured: true,
    summary: "Fast-paced argument rounds for sharp thinkers who love strategy, evidence, and stage presence.",
    description:
      "A bracket-style debate tournament designed for young speakers who can think clearly, listen carefully, and respond with confidence under pressure.",
    accent: "from-amber-300 via-yellow-500 to-orange-500",
    rules: ["Two speakers per match", "Opening statement, rebuttal, and closing round", "Citations must be age-appropriate", "Respectful language is required"],
    schedule: ["Orientation: June 20", "Preliminary rounds: June 22", "Semi-finals: June 24", "Final showcase: June 26"],
    prizes: ["Champion trophy certificate", "Featured speaker badge", "Judge feedback report"],
    judges: ["Anika Rao", "Marcus Bell", "Leah Chen"],
    criteria: ["Argument clarity", "Evidence use", "Listening and rebuttal", "Composure under pressure"]
  },
  {
    slug: "storytelling-showcase",
    name: "Storytelling Showcase",
    category: "Storytelling",
    ageGroup: "7-13 years",
    date: "July 5, 2026",
    dateIso: "2026-07-05T11:00:00+05:30",
    fee: "₹399",
    status: "live",
    slotsRemaining: 34,
    featured: true,
    summary: "A creative stage for original stories, expressive delivery, and memorable characters.",
    description:
      "Students perform a polished story with emotion, structure, and voice control while learning how to keep an audience hooked online.",
    accent: "from-yellow-200 via-amber-400 to-yellow-700",
    rules: ["Original or adapted stories allowed", "3 to 5 minute performance", "Props are optional", "No offensive or unsafe content"],
    schedule: ["Submission check: July 2", "Live rounds: July 5", "Awards stream: July 6"],
    prizes: ["Best storyteller medal", "Creativity certificate", "Audience favorite mention"],
    judges: ["Priya Sethi", "Owen Brooks", "Maya Torres"],
    criteria: ["Story structure", "Expression", "Originality", "Audience connection"]
  },
  {
    slug: "motivational-speaking-cup",
    name: "Motivational Speaking Cup",
    category: "Motivational Speaking",
    ageGroup: "12-18 years",
    date: "July 19, 2026",
    dateIso: "2026-07-19T16:00:00+05:30",
    fee: "₹599",
    status: "live",
    slotsRemaining: 19,
    featured: true,
    summary: "TED-style short talks for teens ready to inspire action and lead with presence.",
    description:
      "A premium speech challenge focused on purpose, clarity, stage confidence, and a message that can move a global youth audience.",
    accent: "from-white via-yellow-300 to-amber-600",
    rules: ["4 to 6 minute speech", "Original speech required", "Slides are optional", "One speaker per entry"],
    schedule: ["Speaker briefing: July 16", "Qualifiers: July 19", "Grand stage: July 21"],
    prizes: ["Gold speaker certificate", "Leadership spotlight", "Mentor feedback session"],
    judges: ["Daniel Kim", "Sara Williams", "Aarav Mehta"],
    criteria: ["Message strength", "Voice control", "Stage presence", "Call to action"]
  },
  {
    slug: "extempore-arena",
    name: "Extempore Arena",
    category: "Extempore",
    ageGroup: "9-17 years",
    date: "August 3, 2026",
    dateIso: "2026-08-03T15:00:00+05:30",
    fee: "₹349",
    status: "live",
    slotsRemaining: 42,
    summary: "Think fast, speak clear, and turn surprise topics into winning moments.",
    description:
      "A high-energy online format where students receive surprise prompts and deliver concise, structured speeches after a short preparation window.",
    accent: "from-blue-100 via-amber-300 to-yellow-600",
    rules: ["Topic assigned live", "90 seconds preparation", "2 minute speech", "No external help during prep"],
    schedule: ["Tech check: August 2", "Live competition: August 3", "Results: August 4"],
    prizes: ["Quick thinker badge", "Finalist certificate", "Performance scorecard"],
    judges: ["Nina Patel", "James Carter", "Fatima Noor"],
    criteria: ["Topic relevance", "Structure", "Fluency", "Time control"]
  }
];

export const getCompetition = (slug: string) => competitions.find((competition) => competition.slug === slug);
