export const launchSiteUrl = "https://lockintalks.vercel.app";

export const launchCompetitionDefaults: Record<
  string,
  {
    feeLabel: string;
    feeAmount: number;
    maxParticipants: number;
    judges: string[];
  }
> = {
  "story-talks": {
    feeLabel: "INR 199",
    feeAmount: 19900,
    maxParticipants: 777,
    judges: ["Arti Sharma"]
  },
  "idol-talk": {
    feeLabel: "INR 199",
    feeAmount: 19900,
    maxParticipants: 777,
    judges: ["Arti Sharma"]
  },
  "power-talk": {
    feeLabel: "INR 199",
    feeAmount: 19900,
    maxParticipants: 777,
    judges: ["Arti Sharma"]
  }
};

export function getLaunchCompetitionDefault(slug: string | null | undefined) {
  return slug ? launchCompetitionDefaults[slug] || null : null;
}
