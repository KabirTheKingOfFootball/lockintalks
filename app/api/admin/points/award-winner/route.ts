import { NextResponse, type NextRequest } from "next/server";
import { adminNoStoreHeaders, checkAdmin } from "@/lib/admin/auth";
import { awardWinnerPointsForRegistration, winnerPoints } from "@/lib/rewards/points";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

type AwardWinnerRequest = {
  registrationId?: string;
  place?: "first" | "second" | "third";
};

export async function POST(request: NextRequest) {
  const admin = await checkAdmin("POST /api/admin/points/award-winner");
  if (!admin.ok) return NextResponse.json({ error: admin.message }, { status: admin.status, headers: adminNoStoreHeaders });

  try {
    const body = (await request.json()) as AwardWinnerRequest;

    if (!body.registrationId || !body.place || !(body.place in winnerPoints)) {
      return NextResponse.json({ error: "Choose a registration and winner place." }, { status: 400, headers: adminNoStoreHeaders });
    }

    const result = await awardWinnerPointsForRegistration({
      registrationId: body.registrationId,
      place: body.place,
      createdBy: admin.userId,
      source: "admin_winner_award"
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error || "Could not award this reward right now." }, { status: 400, headers: adminNoStoreHeaders });
    }

    return NextResponse.json(result, { headers: adminNoStoreHeaders });
  } catch (error) {
    console.error("[LockInTalks admin points] Winner award failed:", error);
    return NextResponse.json({ error: "Could not award this reward right now." }, { status: 500, headers: adminNoStoreHeaders });
  }
}
