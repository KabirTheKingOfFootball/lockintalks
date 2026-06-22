export const launchSiteUrl = "https://lockintalks.vercel.app";

export const launchCompetitionDefaults: Record<
  string,
  {
    feeLabel: string;
    feeAmount: number;
    prizePoolContributionPaise: number;
    publicOfferLabel: string;
    maxParticipants: number;
    judges: string[];
  }
> = {
  "story-talks": {
    feeLabel: "₹99.99",
    feeAmount: 9999,
    prizePoolContributionPaise: 9999,
    publicOfferLabel: "Founder's Discount",
    maxParticipants: 777,
    judges: ["To Be Announced"]
  },
  "idol-talk": {
    feeLabel: "₹99.99",
    feeAmount: 9999,
    prizePoolContributionPaise: 9999,
    publicOfferLabel: "Founder's Discount",
    maxParticipants: 777,
    judges: ["To Be Announced"]
  },
  "power-talk": {
    feeLabel: "₹99.99",
    feeAmount: 9999,
    prizePoolContributionPaise: 9999,
    publicOfferLabel: "Founder's Discount",
    maxParticipants: 777,
    judges: ["To Be Announced"]
  }
};

export function getLaunchCompetitionDefault(slug: string | null | undefined) {
  return slug ? launchCompetitionDefaults[slug] || null : null;
}
