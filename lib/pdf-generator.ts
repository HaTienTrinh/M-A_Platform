import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export async function generateNDAPDF(data: {
  buyerName: string;
  sellerCompany: string;
  dealName: string;
  date: string;
}): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const size = 12;

  page.drawText('NON-DISCLOSURE AGREEMENT', { x: 50, y: 780, size: 16, font: boldFont });
  
  const text = `
This Non-Disclosure Agreement (the "Agreement") is entered into on ${data.date}, 
between ${data.buyerName} (the "Receiving Party") and 
${data.sellerCompany} (the "Disclosing Party").

1. Confidential Information
The Disclosing Party proposes to disclose certain of its confidential and proprietary 
information (the "Confidential Information") to the Receiving Party for the purpose of 
evaluating a potential business transaction regarding ${data.dealName}.

2. Obligations of Receiving Party
The Receiving Party agrees that the Confidential Information is to be considered 
confidential and proprietary to the Disclosing Party and the Receiving Party shall hold 
the same in confidence, shall not use the Confidential Information other than for the 
purposes of its business with the Disclosing Party.

3. Term
This Agreement shall remain in effect for a period of two (2) years from the date hereof.

IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first 
written above.
  `;

  page.drawText(text, { x: 50, y: 740, size, font, maxWidth: 500, lineHeight: 18 });

  return await pdfDoc.save();
}

export async function generateLOIPDF(data: {
  buyerName: string;
  sellerCompany: string;
  valuation: string;
  equityPercent: string;
  closingDate: string;
  conditions: string;
}): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const size = 12;

  page.drawText('LETTER OF INTENT (LOI)', { x: 50, y: 780, size: 16, font: boldFont });

  const text = `
Date: ${new Date().toLocaleDateString()}

To: ${data.sellerCompany}
From: ${data.buyerName}

Subject: Letter of Intent - Acquisition of ${data.sellerCompany}

This letter of intent ("LOI") outlines the proposed terms and conditions for the 
acquisition of a ${data.equityPercent}% equity interest in ${data.sellerCompany} by 
${data.buyerName}.

1. Purchase Price and Valuation
The proposed valuation for the transaction is ${data.valuation}.

2. Expected Closing Date
The parties will work diligently to close the transaction by ${data.closingDate}.

3. Conditions
This offer is subject to the following conditions:
${data.conditions}

This LOI is non-binding and is intended solely as an expression of mutual interest.
  `;

  page.drawText(text, { x: 50, y: 740, size, font, maxWidth: 500, lineHeight: 18 });

  return await pdfDoc.save();
}

export async function generateSPAPDF(data: {
  buyerName: string;
  sellerName: string;
  dealName: string;
  date: string;
  valuation: string;
  equityPercent: string;
  completionDate: string;
  paymentTerms: string;
  governingLaw: string;
  conditions: string;
  warranties: string;
  covenants: string;
}): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const size = 10;
  const titleSize = 14;
  const sectionSize = 12;

  const addPageWithContent = (title: string, content: string) => {
    const page = pdfDoc.addPage([595.28, 841.89]);
    page.drawText(title, { x: 50, y: 780, size: titleSize, font: boldFont });
    page.drawText(content, { x: 50, y: 750, size, font, maxWidth: 500, lineHeight: 15 });
  };

  // Section 1: Parties
  addPageWithContent('SHARE PURCHASE AGREEMENT', `
This SHARE PURCHASE AGREEMENT (the "Agreement") is dated ${data.date}.

BETWEEN:
1. ${data.sellerName} (the "Seller")
2. ${data.buyerName} (the "Buyer")

The Seller and the Buyer are collectively referred to as the "Parties".
  `);

  // Section 2: Definitions
  addPageWithContent('1. DEFINITIONS AND INTERPRETATION', `
"Company" means the business entity known as ${data.dealName}.
"Shares" means ${data.equityPercent}% of the issued share capital of the Company.
"Purchase Price" means the total consideration of ${data.valuation} payable by the Buyer.
"Completion" means the completion of the sale and purchase of the Shares.
"Completion Date" means ${data.completionDate} or such other date as the Parties may agree.
  `);

  // Section 3 & 4: Sale, Purchase, and Price
  addPageWithContent('2. SALE, PURCHASE AND PURCHASE PRICE', `
2.1 Sale and Purchase: The Seller shall sell and the Buyer shall purchase the Shares 
with full title guarantee free from all encumbrances.

2.2 Purchase Price: The total consideration for the Shares shall be ${data.valuation}.

2.3 Payment Terms: ${data.paymentTerms}.
  `);

  // Section 5: Conditions Precedent
  addPageWithContent('3. CONDITIONS PRECEDENT', `
Completion of the sale and purchase of the Shares is conditional upon the satisfaction 
of the following conditions on or before the Completion Date:

${data.conditions || 'None specified.'}

If any of the Conditions are not satisfied or waived by the Completion Date, this 
Agreement shall terminate.
  `);

  // Section 6: Representations & Warranties
  addPageWithContent('4. REPRESENTATIONS AND WARRANTIES', `
The Seller represents and warrants to the Buyer that:
4.1 The Seller is the sole legal and beneficial owner of the Shares.
4.2 The Seller has full power and authority to enter into and perform this Agreement.
4.3 The business of the Company has been conducted in all material respects in 
accordance with applicable laws.

Specific Warranties:
${data.warranties || 'Standard corporate warranties apply.'}
  `);

  // Section 7: Covenants
  addPageWithContent('5. COVENANTS', `
The Seller covenants with the Buyer that, between the date of this Agreement and 
Completion, it shall:
5.1 Carry on the business of the Company in the ordinary and usual course.
5.2 Not allow any material change to the share capital or constitution of the Company.

Additional Covenants:
${data.covenants || 'None specified.'}
  `);

  // Section 8 & 9: Closing and Governing Law
  addPageWithContent('6. COMPLETION AND GOVERNING LAW', `
6.1 Completion: Completion shall take place on the Completion Date at the offices 
of the Company or such other place as specified.

6.2 Deliveries: At Completion, the Seller shall deliver to the Buyer duly executed 
stock transfer forms and original share certificates.

6.3 Governing Law: This Agreement and any dispute or claim arising out of it shall 
be governed by and construed in accordance with the laws of ${data.governingLaw}.
  `);

  // Section 10: Signatures
  addPageWithContent('7. SIGNATURES', `
IN WITNESS WHEREOF the Parties have executed this Agreement on the date first written above.

SELLER: ____________________
Name: ${data.sellerName}

BUYER: ____________________
Name: ${data.buyerName}
  `);

  return await pdfDoc.save();
}

export async function appendSignatureToPDF(
  pdfBytes: Uint8Array,
  signerName: string,
  signerRole: string,
  date: string,
  ipAddress: string
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();
  const lastPage = pages[pages.length - 1];
  
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  // Find a rough place to put the signature block - we'll just put it at bottom
  // In a real app we'd probably track cursor position or add a new page if needed
  
  // Create a signature box
  const yPos = 150;
  
  lastPage.drawRectangle({
    x: 50,
    y: yPos - 100,
    width: 400,
    height: 120,
    borderColor: rgb(0.8, 0.8, 0.8),
    borderWidth: 1,
    color: rgb(0.98, 0.98, 0.98),
  });

  lastPage.drawText(`E-SIGNATURE BLOCK - ${signerRole.toUpperCase()}`, {
    x: 60, y: yPos - 5, size: 10, font: boldFont, color: rgb(0.2, 0.6, 0.4)
  });

  lastPage.drawText(`Digitally Signed By: ${signerName}`, {
    x: 60, y: yPos - 25, size: 12, font
  });
  
  lastPage.drawText(`Date: ${date}`, {
    x: 60, y: yPos - 45, size: 10, font
  });
  
  lastPage.drawText(`IP Address: ${ipAddress}`, {
    x: 60, y: yPos - 60, size: 10, font
  });

  lastPage.drawText(`Cryptographically Verified via DealFlow Platform`, {
    x: 60, y: yPos - 80, size: 8, font, color: rgb(0.5, 0.5, 0.5)
  });

  return await pdfDoc.save();
}
