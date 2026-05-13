import { redirect } from "next/navigation";
import { SupabaseConfigError } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error(`[LockInTalks logout] Sign out failed: ${error.message}`);
    }
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      console.error(`[LockInTalks logout] ${error.message}`);
    } else {
      console.error("[LockInTalks logout] Unexpected logout error:", error);
    }
  }

  redirect("/login");
}
