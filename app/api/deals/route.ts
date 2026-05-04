import { NextResponse } from "next/server";
import { requireRole } from "@/lib/api-auth";
import {
  createDealSchema,
  validateOwnershipPercentages,
} from "@/lib/deal-validation";
import type { CreateDealInput } from "@/lib/deal-validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const {
      error: authError,
      user,
      supabase,
    } = await requireRole(["seller", "admin"]);
    if (authError || !user || !supabase) return authError;

    const body = await request.json();

    // VALIDATION: Parse and validate all required fields with Zod
    const validation = createDealSchema.safeParse(body);
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
          error: "Invalid deal data",
          details: fieldErrors,
        },
        { status: 400 },
      );
    }

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
    } = validation.data as CreateDealInput & {
      founder_pct?: number;
      investor_pct?: number;
      esop_pct?: number;
    };

    const locationStr = [city, country].filter(Boolean).join(", ") || "Unknown";

    // VALIDATION: Ownership percentages must sum to 100%
    const ownershipValidation = validateOwnershipPercentages(
      founder_pct || 0,
      investor_pct || 0,
      esop_pct || 0,
    );

    if (!ownershipValidation.valid) {
      return NextResponse.json(
        { error: ownershipValidation.error },
        { status: 400 },
      );
    }

    // Prepare safe body with field mapping
    const safeBody = {
      ...rest,
      description: reason || description || "N/A",
      market_position: Array.isArray(strengths)
        ? strengths.join("\n")
        : strengths || "N/A",
      location: locationStr,
      revenue_min: revenue_y1,
      revenue_max: revenue_y2,
      ebitda_min: ebitda,
      valuation_min: valuation,
      equity_pct: equity_pct,
      ownership_structure: {
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
        founder_pct: founder_pct || 0,
        investor_pct: investor_pct || 0,
        esop_pct: esop_pct || 0,
      },
    };

    // CREATE: Insert new deal
    const { data, error } = await supabase
      .from("deals")
      .insert({
        ...safeBody,
        seller_id: user.id,
        status: "draft",
      })
      .select()
      .single();

    if (error) {
      console.error("[Deal POST Error]", error);
      throw error;
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error("[Deal POST Exception]", error);
    return NextResponse.json(
      { error: "Failed to create deal: " + error.message },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  try {
    const {
      error: authError,
      user,
      supabase,
    } = await requireRole(["buyer", "seller", "admin"]);
    if (authError || !supabase)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Fetch user role to determine visibility
    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 404 },
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = 20;
    const offset = (page - 1) * limit;

    let query = supabase.from("deals").select("*", { count: "exact" });

    // RBAC: Filter by role to prevent draft deal exposure
    if (userProfile.role === "buyer" || userProfile.role === "advisor") {
      // Buyers and advisors see ONLY published, in_negotiation, and closed deals
      query = query.in("status", ["active", "under_offer", "closed"]);
    } else if (userProfile.role === "seller") {
      // Sellers see: their own deals (all statuses) + public deals (published/in_negotiation/closed)
      query = query.or(
        `seller_id.eq.${user.id},status.in.(active,under_offer,closed)`,
      );
    }
    // Admin sees all deals (no filter applied)

    // Apply status filter if provided (with role validation)
    if (status) {
      // Prevent buyers from overriding filter to access draft deals
      if (userProfile.role === "buyer" || userProfile.role === "advisor") {
        const allowedStatuses = ["active", "under_offer", "closed"];
        if (!allowedStatuses.includes(status)) {
          return NextResponse.json(
            {
              error: `Status filter '${status}' not allowed for your role. Allowed: ${allowedStatuses.join(", ")}`,
              allowedStatuses,
            },
            { status: 403 },
          );
        }
      }
      query = query.eq("status", status);
    }

    const { data: deals, error, count } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("[Deal GET Error]", error);
      throw error;
    }

    const totalCount = count ?? 0;
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      deals,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasNext: page * limit < totalCount,
        hasPrev: page > 1,
      },
    });
  } catch (error: any) {
    console.error("[Deal GET Exception]", error);
    return NextResponse.json(
      { error: "Failed to fetch deals: " + error.message },
      { status: 500 },
    );
  }
}
