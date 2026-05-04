import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { getGeminiClient } from '@/lib/gemini'

export async function POST(request: Request) {
  try {
    const { error: authError, supabase } = await requireAuth()
    if (authError || !supabase) return authError

    const { dealId } = await request.json()
    if (!dealId || typeof dealId !== 'string') {
      return NextResponse.json({ error: 'dealId is required' }, { status: 400 })
    }

    const { data: deal, error: dealError } = await supabase
      .from('deals')
      .select('*')
      .eq('id', dealId)
      .single()

    if (dealError || !deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
    }

    const prompt = `You are an M&A analyst. Given this deal data, write a professional 3-paragraph executive summary investment memo:
Paragraph 1: Investment thesis
Paragraph 2: Financials
Paragraph 3: Risk factors

Deal data:
${JSON.stringify({
  title: deal.title,
  industry: deal.industry,
  location: deal.location,
  asking_price: deal.valuation,
  revenue: deal.revenue_y3,
  ebitda: deal.ebitda_y3,
  description: deal.description,
})}`

    const ai = getGeminiClient()
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    })

    const summary = response.text
    if (!summary) throw new Error('No output from Gemini')

    await supabase.from('deals').update({ ai_summary: summary }).eq('id', dealId)

    return NextResponse.json({ summary })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.message?.includes('GEMINI_API_KEY') ? 503 : 500 })
  }
}
