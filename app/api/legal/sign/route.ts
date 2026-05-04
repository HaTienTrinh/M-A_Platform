import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { appendSignatureToPDF } from '@/lib/pdf-generator';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { documentId, signerName, signerRole } = body;

    // Get the document
    const { data: doc, error: docError } = await supabase
      .from('legal_documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (docError || !doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // ─── SECURITY FIX: Ensure user is a deal participant ──────────
    const { data: deal } = await supabase.from('deals').select('seller_id').eq('id', doc.deal_id).single();
    const isSeller = deal?.seller_id === user.id;
    
    let isBuyer = false;
    if (!isSeller) {
      // If signing an NDA, they can be pending. Otherwise, they must be approved.
      const allowedStatuses = doc.doc_type === 'nda' ? ['pending', 'approved'] : ['approved'];
      const { data: nda } = await supabase
        .from('nda_requests')
        .select('id')
        .eq('deal_id', doc.deal_id)
        .eq('buyer_id', user.id)
        .in('status', allowedStatuses)
        .single();
      if (nda) isBuyer = true;
    }

    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
    const isAdmin = profile?.role === 'admin';

    if (!isSeller && !isBuyer && !isAdmin) {
      return NextResponse.json({ error: 'Access denied - not a deal participant' }, { status: 403 });
    }
    // ─────────────────────────────────────────────────────────────

    // Prevent double-signing
    const { data: existingSignature } = await supabase
      .from('document_signatures')
      .select('id')
      .eq('document_id', documentId)
      .eq('signer_id', user.id)
      .single();

    if (existingSignature) {
      return NextResponse.json({ error: 'You have already signed this document' }, { status: 400 });
    }

    // Determine which file to download (base or already signed by someone else)
    const currentPdfUrl = doc.signed_pdf_url || doc.pdf_url;
    
    // Download the current PDF from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('legal-documents')
      .download(currentPdfUrl);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download document: ${downloadError?.message}`);
    }

    const pdfBuffer = await fileData.arrayBuffer();
    const pdfBytes = new Uint8Array(pdfBuffer);

    // Get IP address if available
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    
    // Append signature
    const signedPdfBytes = await appendSignatureToPDF(
      pdfBytes,
      signerName,
      signerRole,
      new Date().toISOString(),
      ip
    );

    // Upload signed PDF
    const newFileName = `${doc.deal_id}/${doc.doc_type}_signed_${Date.now()}.pdf`;
    const newBuffer = Buffer.from(signedPdfBytes);
    
    const { error: uploadError } = await supabase.storage
      .from('legal-documents')
      .upload(newFileName, newBuffer, {
        contentType: 'application/pdf',
      });

    if (uploadError) throw uploadError;

    // Record signature
    const { error: sigError } = await supabase
      .from('document_signatures')
      .insert({
        document_id: documentId,
        signer_id: user.id,
        signer_name: signerName,
        signer_role: signerRole,
        ip_address: ip
      });

    if (sigError) throw sigError;

    // Update document status
    // If doc type is NDA, usually 1 signature is enough for our simple demo, or 2.
    // For simplicity, let's say after any signature it becomes fully signed (or we check how many we need)
    
    // Let's check how many signatures exist
    const { count } = await supabase
      .from('document_signatures')
      .select('*', { count: 'exact', head: true })
      .eq('document_id', documentId);
      
    // typically NDA needs 1 (buyer) or 2. Let's say 2 for LOI, 2 for SPA, 1 for NDA (buyer signs Seller's template)
    let newStatus = doc.status;
    if (doc.doc_type === 'nda' && (count || 0) >= 1) newStatus = 'fully_signed';
    else if ((count || 0) >= 2) newStatus = 'fully_signed';
    
    await supabase.from('legal_documents')
      .update({
        signed_pdf_url: newFileName,
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId);

    // If it's an NDA and fully signed, we should auto-approve the NDA request for this user/deal
    if (doc.doc_type === 'nda' && newStatus === 'fully_signed') {
       // Look for a pending NDA request
       await supabase.from('nda_requests')
         .update({ status: 'approved' })
         .eq('deal_id', doc.deal_id)
         .eq('buyer_id', user.id);
    }

    return NextResponse.json({ success: true, status: newStatus });
  } catch (error: any) {
    console.error('Sign PDF Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
