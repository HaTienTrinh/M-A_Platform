import { NextResponse } from 'next/server';
import { requireDealParticipant } from '@/lib/api-auth';
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ dealId: string, fileId: string }> }
) {
  try {
    const { dealId, fileId } = await params;
    const { error: authError, user, supabase } = await requireDealParticipant(dealId);
    
    if (authError || !user || !supabase) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // 1. Get file details
    const { data: file, error: fileError } = await supabase
      .from('dataroom_files')
      .select('*')
      .eq('id', fileId)
      .eq('deal_id', dealId)
      .single();

    if (fileError || !file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // 2. Log activity
    await supabase.from('dataroom_activity').insert({
      deal_id: dealId,
      user_id: user.id,
      file_id: file.id,
      action: 'download'
    });

    // 3. Get signed URL from Supabase Storage
    const { data: signedUrlData, error: signedUrlError } = await supabase
      .storage
      .from('deal_documents')
      .createSignedUrl(file.file_path, 60); // 60 seconds

    if (signedUrlError || !signedUrlData) {
      return NextResponse.json({ error: 'Could not generate download link' }, { status: 500 });
    }

    // 4. If it's a PDF, fetch and watermark it
    if (file.file_path.toLowerCase().endsWith('.pdf')) {
      const pdfResponse = await fetch(signedUrlData.signedUrl);
      const pdfArrayBuffer = await pdfResponse.arrayBuffer();
      
      const pdfDoc = await PDFDocument.load(pdfArrayBuffer);
      const pages = pdfDoc.getPages();
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      const watermarkText = `CONFIDENTIAL - ${user.email} - ${new Date().toISOString()}`;
      
      for (const page of pages) {
        const { width, height } = page.getSize();
        page.drawText(watermarkText, {
          x: width / 2 - 200,
          y: height / 2,
          size: 24,
          font,
          color: rgb(0.95, 0.4, 0.4),
          opacity: 0.3,
          rotate: degrees(45),
        });
      }
      
      const watermarkedPdfBytes = await pdfDoc.save();
      
      return new Response(watermarkedPdfBytes, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${file.filename}"`,
        },
      });
    }

    // 5. If not PDF, just redirect to the signed URL
    return NextResponse.redirect(signedUrlData.signedUrl);

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
