import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { getGeminiClient } from '@/lib/gemini'

export async function GET() {
  try {
    const { error: authError, user, supabase } = await requireAuth()
    if (authError || !user || !supabase) return authError

    const { data: buyer } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    const { data: ndas } = await supabase
      .from('nda_requests')
      .select('deal_id')
      .eq('buyer_id', user.id)

    const { data: availableDeals } = await supabase
      .from('deals')
      .select('id, title, industry, asking_price, revenue, location')
      .neq('seller_id', user.id)
      .eq('status', 'active')
      .limit(50)

    if (!availableDeals || availableDeals.length === 0) {
      return NextResponse.json({ recommendations: [] })
    }

    const prompt = `You are an AI deal matching engine for an M&A marketplace.
Given the investor profile, and a list of available deals, rank the top 6 deals most suitable for this investor.
Return an array of deal IDs ordered by match score (highest first).
Just return a JSON array of string deal IDs.

Investor Profile:
${JSON.stringify({
  company: buyer?.company_name,
  industry_interest: buyer?.industry,
  history: ndas?.map(n => n.deal_id) || [],
})}

Available Deals:
${JSON.stringify(availableDeals)}
`

    let recommendedIds: string[] = []

    try {
      const ai = getGeminiClient()
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      })

      const outputText = response.text
      if (!outputText) throw new Error('No output from Gemini')

      const parsedIds = JSON.parse(outputText)
      if (!Array.isArray(parsedIds)) throw new Error('Gemini did not return an array')
      recommendedIds = parsedIds.slice(0, 6)
    } catch (error) {
      console.error('Gemini failed to return valid recommendations', error)
      recommendedIds = availableDeals.slice(0, 6).map(deal => deal.id)
    }

    const recommendations = availableDeals
      .filter(deal => recommendedIds.includes(deal.id))
      .sort((a, b) => recommendedIds.indexOf(a.id) - recommendedIds.indexOf(b.id))

    return NextResponse.json({ recommendations })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
