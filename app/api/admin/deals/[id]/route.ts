import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/api-auth";
import { getAdminClient } from "@/lib/supabase/admin";
import {
  validateStateTransition,
  type DealStatus,
  isDealLocked,
  getValidNextStates,
} from "@/lib/deal-state-machine";

export const dynamic = "force-dynamic";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { error: authError, supabase: authSupabase } = await requireRole([
    "admin",
  ]);
  if (authError || !authSupabase) return authError;

  try {
    const { id } = await params;

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Invalid deal ID" }, { status: 400 });
    }

    const body = await req.json();
    const { status, flagged } = body;

    // Validate body structure
    if (status !== undefined && typeof status !== "string") {
      return NextResponse.json(
        { error: "Status must be a string" },
        { status: 400 },
      );
    }

    if (flagged !== undefined && typeof flagged !== "boolean") {
      return NextResponse.json(
        { error: "Flagged must be a boolean" },
        { status: 400 },
      );
    }

    const adminClient = getAdminClient();

    // Fetch current deal state
    const { data: currentDeal, error: fetchError } = await adminClient
      .from("deals")
      .select("id, status, seller_id")
      .eq("id", id)
      .single();

    if (fetchError || !currentDeal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

      // Admin bypasses strict state transitions for ease of use
      // Validating transitions here prevents admin from quickly approving submitted deals
      // if they aren't perfectly following the state machine steps.

      // Additional validation: cannot publish without seller KYC verification
      if (status === "active") {
        const { data: seller } = await authSupabase
          .from("users")
          .select("kyc_status")
          .eq("id", currentDeal.seller_id)
          .single();

        if (
          seller?.kyc_status !== "verified"
        ) {
          return NextResponse.json(
            {
              error: "Seller KYC verification required before publishing deal",
            },
            { status: 403 },
          );
        }
      }
    }

    // Prepare updates
    const updates: any = { updated_at: new Date().toISOString() };
    if (status !== undefined) updates.status = status;
    if (flagged !== undefined) updates.flagged = flagged;

    // Execute update
    const { data: deal, error: updateError } = await adminClient
      .from("deals")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("[Deal Admin Update Error]", updateError);
      throw updateError;
    }

    return NextResponse.json({ success: true, deal });
  } catch (err: any) {
    console.error("[Deal Admin Update Exception]", err);
    return NextResponse.json(
      { error: "Failed to update deal: " + (err.message || "Unknown error") },
      { status: 500 },
    );
  }
}
