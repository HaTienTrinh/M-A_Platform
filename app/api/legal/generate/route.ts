import { NextRequest, NextResponse } from 'next/server';
import { generateNDAPDF, generateLOIPDF, generateSPAPDF } from '@/lib/pdf-generator';
import { requireDealParticipant } from '@/lib/api-auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { dealId, docType, templateData } = body;

    const { error: authError, user, supabase } = await requireDealParticipant(dealId);
    if (authError || !user || !supabase) return authError;

    let pdfBytes: Uint8Array;

    if (docType === 'nda') {
      pdfBytes = await generateNDAPDF(templateData as any);
    } else if (docType === 'loi') {
      pdfBytes = await generateLOIPDF(templateData as any);
    } else if (docType === 'spa') {
      pdfBytes = await generateSPAPDF(templateData as any);
    } else {
      return NextResponse.json({ error: 'Document type not supported' }, { status: 400 });
    }

    // Upload to Supabase Storage
    const fileName = `${dealId}/${docType}_${Date.now()}.pdf`;
    
    // We must use a buffer to upload to storage
    const buffer = Buffer.from(pdfBytes);
    
    const { error: uploadError } = await supabase.storage
      .from('legal-documents')
      .upload(fileName, buffer, {
        contentType: 'application/pdf',
      });

    if (uploadError) {
      throw uploadError;
    }

    // Create DB record
    const { data: dbRecord, error: dbError } = await supabase
      .from('legal_documents')
      .insert({
        deal_id: dealId,
        doc_type: docType,
        template_data: templateData,
        pdf_url: fileName,
        status: 'pending_signature'
      })
      .select()
      .single();

    if (dbError) throw dbError;

    return NextResponse.json({ document: dbRecord });
  } catch (error: any) {
    console.error('Generate PDF Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
