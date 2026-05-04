import { Type } from '@google/genai'
import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { getGeminiClient } from '@/lib/gemini'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const dealId = searchParams.get('dealId')
    if (!dealId) {
      return NextResponse.json({ error: 'dealId is required' }, { status: 400 })
    }

    const { error: authError, user, supabase } = await requireAuth()
    if (authError || !user || !supabase) return authError

    const { data: cachedScore } = await supabase
      .from('deal_scores')
      .select('*')
      .eq('deal_id', dealId)
      .eq('buyer_id', user.id)
      .single()

    if (cachedScore) {
      return NextResponse.json({ score: cachedScore })
    }

    const [{ data: deal }, { data: buyer }] = await Promise.all([
      supabase.from('deals').select('*').eq('id', dealId).single(),
      supabase.from('users').select('*').eq('id', user.id).single(),
    ])

    if (!deal || !buyer) {
      return NextResponse.json({ error: 'Data not found' }, { status: 404 })
    }

    const prompt = `Score the match between this investor profile and deal on a 0-100 scale.
Investor: ${JSON.stringify(buyer)}
Deal: ${JSON.stringify(deal)}`

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        match_score: { type: Type.INTEGER, description: 'Score from 0 to 100' },
        risk_score: { type: Type.INTEGER, description: 'Risk score from 0 to 100' },
        growth_score: { type: Type.INTEGER, description: 'Growth score from 0 to 100' },
        top_reasons: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Top 3 reasons for the scores' },
      },
      required: ['match_score', 'risk_score', 'growth_score', 'top_reasons'],
    }

    const ai = getGeminiClient()
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema,
      },
    })

    const outputText = response.text
    if (!outputText) throw new Error('No output from Gemini')

    const scoreParams = JSON.parse(outputText)
    const { data: newScore, error: insertError } = await supabase
      .from('deal_scores')
      .insert({
        deal_id: deal.id,
        buyer_id: user.id,
        match_score: scoreParams.match_score,
        risk_score: scoreParams.risk_score,
        growth_score: scoreParams.growth_score,
        reasons: scoreParams.top_reasons,
      })
      .select()
      .single()

    if (insertError) throw insertError

    return NextResponse.json({ score: newScore })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: error.message?.includes('GEMINI_API_KEY') ? 503 : 500 })
  }
}
