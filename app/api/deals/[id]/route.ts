// /app/api/deals/[id]/route.ts
import { NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/api-auth";
import {
  updateDealSchema,
  validateOwnershipPercentages,
} from "@/lib/deal-validation";
import { canSellerEditDeal, isDealLocked } from "@/lib/deal-state-machine";
import type { UpdateDealInput } from "@/lib/deal-validation";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { error: authError, supabase } = await requireAuth();
  if (authError || !supabase) return authError;

  const { data: dealRow, error } = await supabase
    .from("deals")
    .select(
      `
      *,
      users:seller_id ( full_name, role ),
      deal_financials (*),
      deal_documents (*)
    `,
    )
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  // Record a view (fire and forget basically, or wait for it)
  await supabase.rpc("increment_deal_view", { deal_id: id });

  // Safely map extended properties
  const deal = {
    ...dealRow,
    ...(dealRow.ownership_structure || {}),
  };

  return NextResponse.json({ deal });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: dealId } = await params;

    if (!dealId || typeof dealId !== "string") {
      return NextResponse.json({ error: "Invalid deal ID" }, { status: 400 });
    }

    const {
      error: authError,
      user,
      supabase,
    } = await requireRole(["seller", "admin"]);
    if (authError || !user || !supabase) return authError;

    const body = await request.json();
    const {
      id: bodyId,
      seller_id: bodySellerId,
      status: bodyStatus,
      ...updates
    } = body;

    // Prevent tampering with id/seller_id/status in request body
    if (bodyId || bodySellerId || bodyStatus) {
      return NextResponse.json(
        {
          error:
            "Cannot modify id, seller_id, or status via this endpoint. Use admin endpoint for status changes.",
        },
        { status: 400 },
      );
    }

    // VALIDATION: Parse update payload with Zod
    const validation = updateDealSchema.safeParse(updates);
    if (!validation.success) {
      const fieldErrors = validation.error.issues.reduce(
        (acc, issue) => {
          const path = issue.path.join(".");
          acc[path] = issue.message;
          return acc;
        },
        {} as Record<string, string>,
      );

      return NextResponse.json(
        {
          error: "Invalid deal update data",
          details: fieldErrors,
        },
        { status: 400 },
      );
    }

    // AUTHORIZATION: Ensure user owns the deal (or is admin)
    const { data: currentDeal, error: fetchError } = await supabase
      .from("deals")
      .select("seller_id, status, ownership_structure")
      .eq("id", dealId)
      .single();

    if (fetchError || !currentDeal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 });
    }

    if (currentDeal.seller_id !== user.id && user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized: You do not own this deal" },
        { status: 403 },
      );
    }

    // STATE GUARD: Sellers cannot edit published, in_negotiation, or closed deals
    if (user.role === "seller" && !canSellerEditDeal(currentDeal.status)) {
      return NextResponse.json(
        {
          error: `Cannot edit deal in '${currentDeal.status}' state. Editable states: draft, submitted, under_review, approved.`,
          currentState: currentDeal.status,
          isLocked: true,
        },
        { status: 403 },
      );
    }

    // Map incoming fields to database columns
    const {
      company_id,
      country,
      city,
      revenue_y1,
      revenue_y2,
      revenue_y3,
      ebitda,
      net_profit,
      growth_rate,
      currency,
      valuation,
      equity_pct,
      min_ticket,
      reason,
      future_plans,
      strengths,
      description,
      founder_pct,
      investor_pct,
      esop_pct,
      ...rest
    } = validation.data as UpdateDealInput & {
      founder_pct?: number;
      investor_pct?: number;
      esop_pct?: number;
    };

    const locationParts = [city, country].filter(Boolean);
    const locationStr =
      locationParts.length > 0
        ? locationParts.join(", ")
        : rest.location
          ? rest.location
          : undefined;

    const safeUpdates: any = {
      ...rest,
      updated_at: new Date().toISOString(),
    };

    if (reason !== undefined) safeUpdates.description = reason || "N/A";
    if (description !== undefined) safeUpdates.description = description;
    if (strengths !== undefined)
      safeUpdates.market_position = Array.isArray(strengths)
        ? strengths.join("\n")
        : strengths || "N/A";
    if (locationStr !== undefined) safeUpdates.location = locationStr;
    if (revenue_y1 !== undefined) safeUpdates.revenue_min = revenue_y1;
    if (revenue_y2 !== undefined) safeUpdates.revenue_max = revenue_y2;
    if (ebitda !== undefined) safeUpdates.ebitda_min = ebitda;
    if (valuation !== undefined) safeUpdates.valuation_min = valuation;
    if (equity_pct !== undefined) safeUpdates.equity_pct = equity_pct;

    // VALIDATION: Ownership percentages if any provided
    if (
      founder_pct !== undefined ||
      investor_pct !== undefined ||
      esop_pct !== undefined
    ) {
      const ownershipValidation = validateOwnershipPercentages(
        founder_pct ?? 0,
        investor_pct ?? 0,
        esop_pct ?? 0,
      );

      if (!ownershipValidation.valid) {
        return NextResponse.json(
          { error: ownershipValidation.error },
          { status: 400 },
        );
      }
    }

    safeUpdates.ownership_structure = {
      ...(currentDeal.ownership_structure || {}),
      ...(company_id !== undefined && { company_id }),
      ...(country !== undefined && { country }),
      ...(city !== undefined && { city }),
      ...(revenue_y1 !== undefined && { revenue_y1 }),
      ...(revenue_y2 !== undefined && { revenue_y2 }),
      ...(revenue_y3 !== undefined && { revenue_y3 }),
      ...(ebitda !== undefined && { ebitda }),
      ...(net_profit !== undefined && { net_profit }),
      ...(growth_rate !== undefined && { growth_rate }),
      ...(currency !== undefined && { currency }),
      ...(valuation !== undefined && { valuation }),
      ...(equity_pct !== undefined && { equity_pct }),
      ...(min_ticket !== undefined && { min_ticket }),
      ...(reason !== undefined && { reason }),
      ...(future_plans !== undefined && { future_plans }),
      ...(strengths !== undefined && { strengths }),
      ...(founder_pct !== undefined && { founder_pct }),
      ...(investor_pct !== undefined && { investor_pct }),
      ...(esop_pct !== undefined && { esop_pct }),
    };

    const { data, error } = await supabase
      .from("deals")
      .update(safeUpdates)
      .eq("id", dealId)
      .select()
      .single();

    if (error) {
      console.error("[Deal PUT Error]", error);
      throw error;
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[Deal PUT Exception]", error);
    return NextResponse.json(
      { error: "Failed to update deal: " + error.message },
      { status: 500 },
    );
  }
}
