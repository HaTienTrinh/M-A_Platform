// Make sure to configure this function in Supabase Dashboard or deploy via CLI.

// We simulate an edge function that listens to webhooks.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { GoogleGenAI } from 'https://esm.sh/@google/genai'

serve(async (req) => {
  try {
    const payload = await req.json()
    // Payload from Supabase Webhook (INSERT or UPDATE on deals where status changes to 'approved')
    const deal = payload.record;

    if (!deal || deal.status !== 'approved' || deal.ai_summary) {
       return new Response("Not applicable", { status: 200 })
    }

    const ai = new GoogleGenAI({
      apiKey: Deno.env.get('GEMINI_API_KEY') as string,
    });

    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string
    const supabase = createClient(supabaseUrl, supabaseKey)

    const prompt = `You are an M&A analyst. Given this deal data, write a professional 3-paragraph executive summary investment memo:
Paragraph 1: Investment thesis
Paragraph 2: Financials
Paragraph 3: Risk factors

Deal data:
${JSON.stringify({
  title: deal.title,
  industry: deal.industry,
  location: deal.location,
  asking_price: deal.asking_price,
  revenue: deal.revenue,
  ebitda: deal.ebitda,
  description: deal.description
})}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
    });

    if (response.text) {
       await supabase.from('deals').update({ ai_summary: response.text }).eq('id', deal.id);
    }
    
    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { "Content-Type": "application/json" } })
  }
})
