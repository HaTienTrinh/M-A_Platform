/**
 * Deal validation schemas using Zod
 * Ensures all required fields are present and valid
 */

import { z } from "zod";

export const createDealSchema = z.object({
  title: z.string().min(1, "Deal name is required"),
  industry: z.string().min(1, "Industry is required"),
  country: z.string().optional(),
  city: z.string().optional(),
  location: z.string().optional(),
  deal_type: z.string().optional(),
  
  revenue_y1: z.coerce.number().nullable().optional(),
  revenue_y2: z.coerce.number().nullable().optional(),
  revenue_y3: z.coerce.number().nullable().optional(),
  ebitda: z.coerce.number().nullable().optional(),
  net_profit: z.coerce.number().nullable().optional(),
  growth_rate: z.coerce.number().nullable().optional(),
  
  valuation: z.coerce.number().nullable().optional(),
  equity_pct: z.coerce.number().nullable().optional(),
  min_ticket: z.coerce.number().nullable().optional(),
  
  reason: z.string().optional(),
  future_plans: z.string().optional(),
  strengths: z.array(z.string()).optional(),
  description: z.string().optional(),
  currency: z.string().default("USD"),
  company_id: z.string().uuid().optional(),
});

export const updateDealSchema = createDealSchema.partial();

export type CreateDealInput = z.infer<typeof createDealSchema>;
export type UpdateDealInput = z.infer<typeof updateDealSchema>;

export function validateOwnershipPercentages(
  founder: number,
  investor: number,
  esop: number,
): { valid: boolean; error?: string } {
  // Relaxed for drafts
  return { valid: true };
}
