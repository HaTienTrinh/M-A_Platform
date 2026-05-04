// /app/api/dataroom/[dealId]/export/route.ts
import { NextResponse } from 'next/server';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { requireDealParticipant } from '@/lib/api-auth';

function escapeXml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function spreadsheetCell(value: unknown, type: 'String' | 'Number' = 'String') {
  return `<Cell><Data ss:Type="${type}">${escapeXml(value)}</Data></Cell>`;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ dealId: string }> }
) {
  const { dealId } = await params;
  const { format, dateFrom, dateTo } = await request.json();

  try {
    // 1. Check Authentication & Permission
    const { error: participantError, user, supabase } = await requireDealParticipant(dealId);
    if (participantError || !user || !supabase) return participantError;

    // Check if user is seller or admin
    const { data: deal, error: dealError } = await supabase
      .from('deals')
      .select('title, seller_id')
      .eq('id', dealId)
      .single();

    if (dealError || !deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = userData?.role === 'admin';
    const isSeller = deal.seller_id === user.id;

    if (!isAdmin && !isSeller) {
      return NextResponse.json({ error: 'Insufficient permissions — only sellers and admins can export logs' }, { status: 403 });
    }

    // 2. Fetch Data
    let query = supabase
      .from('dataroom_activity')
      .select('*, users(full_name, email), dataroom_files(filename, folder)')
      .eq('dataroom_files.deal_id', dealId)
      .order('created_at', { ascending: false });

    if (dateFrom) query = query.gte('created_at', dateFrom);
    if (dateTo) query = query.lte('created_at', dateTo);

    const { data: logs, error: logsError } = await query;
    if (logsError) throw logsError;

    // Filter out nulls from the join (though if table is joined it should be fine)
    const filteredLogs = logs?.filter(l => l.dataroom_files) || [];

    if (format === 'xlsx') {
      const ExcelJS = require('exceljs');
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Data Room Audit');

      worksheet.columns = [
        { header: 'Date/Time', key: 'datetime', width: 25 },
        { header: 'User Name', key: 'username', width: 25 },
        { header: 'User Email', key: 'email', width: 30 },
        { header: 'File Name', key: 'filename', width: 40 },
        { header: 'Folder', key: 'folder', width: 20 },
        { header: 'Action', key: 'action', width: 15 },
        { header: 'Duration (sec)', key: 'duration', width: 15 }
      ];

      filteredLogs.forEach(log => {
        worksheet.addRow({
          datetime: new Date(log.created_at).toLocaleString(),
          username: log.users?.full_name || 'N/A',
          email: log.users?.email || 'N/A',
          filename: log.dataroom_files?.filename || 'Unknown',
          folder: log.dataroom_files?.folder || 'General',
          action: log.action === 'view' ? 'View' : 'Download',
          duration: log.duration_seconds || 0
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      
      return new Response(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="DealFlow_DataRoom_Audit_${deal.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx"`
        }
      });
    }

    if (format === 'pdf') {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595.276, 841.890]); // A4
      const { width, height } = page.getSize();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // Header
      page.drawText(`Data Room Access Report — ${deal.title}`, {
        x: 50,
        y: height - 50,
        size: 20,
        font: boldFont,
        color: rgb(0, 0, 0)
      });

      page.drawText(`Generated on: ${new Date().toLocaleString()}`, {
        x: 50,
        y: height - 75,
        size: 10,
        font,
        color: rgb(0.4, 0.4, 0.4)
      });

      // Summary
      const totalViews = filteredLogs.filter(l => l.action === 'view').length;
      const totalDownloads = filteredLogs.filter(l => l.action === 'download').length;
      const uniqueUsers = new Set(filteredLogs.map(l => l.user_id)).size;
      
      // Most accessed file
      const fileCounts: Record<string, number> = {};
      filteredLogs.forEach(l => {
        const name = l.dataroom_files?.filename || 'Unknown';
        fileCounts[name] = (fileCounts[name] || 0) + 1;
      });
      const mostAccessed = Object.entries(fileCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

      page.drawText('Summary Statistics', { x: 50, y: height - 110, size: 14, font: boldFont });
      page.drawText(`Total Views: ${totalViews}`, { x: 60, y: height - 130, size: 10, font });
      page.drawText(`Total Downloads: ${totalDownloads}`, { x: 60, y: height - 145, size: 10, font });
      page.drawText(`Unique Visitors: ${uniqueUsers}`, { x: 200, y: height - 130, size: 10, font });
      page.drawText(`Most Accessed: ${mostAccessed}`, { x: 200, y: height - 145, size: 10, font });

      // Table Header
      let currentY = height - 180;
      page.drawRectangle({
        x: 45,
        y: currentY - 5,
        width: width - 90,
        height: 20,
        color: rgb(0.9, 0.9, 0.9)
      });

      page.drawText('User', { x: 50, y: currentY, size: 10, font: boldFont });
      page.drawText('Action', { x: 180, y: currentY, size: 10, font: boldFont });
      page.drawText('File', { x: 250, y: currentY, size: 10, font: boldFont });
      page.drawText('Date/Time', { x: 450, y: currentY, size: 10, font: boldFont });

      currentY -= 25;

      // Table Data (Limit to first page for simplicity in this demo, or loop if we want more)
      filteredLogs.slice(0, 20).forEach((log, index) => {
        if (currentY < 100) return; // Prevent going off page

        page.drawText(log.users?.full_name || log.users?.email || 'N/A', { x: 50, y: currentY, size: 9, font });
        page.drawText(log.action === 'view' ? 'View' : 'Download', { 
            x: 180, 
            y: currentY, 
            size: 9, 
            font, 
            color: log.action === 'download' ? rgb(0.8, 0, 0) : rgb(0, 0, 0) 
        });
        
        const fileName = log.dataroom_files?.filename || 'Unknown';
        const displayFileName = fileName.length > 30 ? fileName.substring(0, 27) + '...' : fileName;
        page.drawText(displayFileName, { x: 250, y: currentY, size: 9, font });
        page.drawText(new Date(log.created_at).toLocaleDateString(), { x: 450, y: currentY, size: 8, font });

        currentY -= 20;
      });

      // Footer
      page.drawText(`Confidential — Generated by DealFlow on ${new Date().toLocaleDateString()}`, {
        x: width / 2 - 120,
        y: 30,
        size: 8,
        font,
        color: rgb(0.6, 0.6, 0.6)
      });

      const pdfBytes = await pdfDoc.save();
      
      return new Response(pdfBytes, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="DealFlow_DataRoom_Audit_${deal.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf"`
        }
      });
    }

    return NextResponse.json({ error: 'Invalid format' }, { status: 400 });

  } catch (error: any) {
    console.error('Export error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
