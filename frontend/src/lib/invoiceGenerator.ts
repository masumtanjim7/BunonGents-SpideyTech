import { Order, SiteSettings } from './api';

// Escape special characters for PDF literal strings
function pdfEscape(str: string): string {
  return (str || '')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function formatBDTPlain(amount: number): string {
  return `BDT ${Number(amount || 0).toLocaleString('en-IN')}`;
}

/**
 * Generates and downloads a true vector A4 PDF invoice styled in the
 * Bunon Gents luxury theme (#11241c Deep Forest Green, #f4f3ee Warm Cream, #e5c158 Gold).
 */
export function downloadOrderInvoicePDF(order: Order, settings?: SiteSettings | null) {
  const pageWidth = 595.28; // A4 width in pt
  const pageHeight = 841.89; // A4 height in pt

  const ops: string[] = [];

  // Helper to convert top-down Y to PDF bottom-up Y
  const py = (topY: number) => +(pageHeight - topY).toFixed(2);

  // Helper: Draw filled rectangle (top-left x, topY, width, height, r,g,b in 0..255)
  const fillRect = (
    x: number,
    topY: number,
    w: number,
    h: number,
    r: number,
    g: number,
    b: number
  ) => {
    ops.push(
      `${(r / 255).toFixed(3)} ${(g / 255).toFixed(3)} ${(b / 255).toFixed(3)} rg`,
      `${x.toFixed(2)} ${(pageHeight - topY - h).toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f`
    );
  };

  // Helper: Draw stroked rectangle
  const strokeRect = (
    x: number,
    topY: number,
    w: number,
    h: number,
    r: number,
    g: number,
    b: number,
    lineWidth = 1
  ) => {
    ops.push(
      `${lineWidth.toFixed(2)} w`,
      `${(r / 255).toFixed(3)} ${(g / 255).toFixed(3)} ${(b / 255).toFixed(3)} RG`,
      `${x.toFixed(2)} ${(pageHeight - topY - h).toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re S`
    );
  };

  // Helper: Draw line
  const drawLine = (
    x1: number,
    topY1: number,
    x2: number,
    topY2: number,
    r: number,
    g: number,
    b: number,
    lineWidth = 0.75
  ) => {
    ops.push(
      `${lineWidth.toFixed(2)} w`,
      `${(r / 255).toFixed(3)} ${(g / 255).toFixed(3)} ${(b / 255).toFixed(3)} RG`,
      `${x1.toFixed(2)} ${py(topY1)} m ${x2.toFixed(2)} ${py(topY2)} l S`
    );
  };

  // Helper: Draw text
  // Font keys: F1 = Helvetica, F2 = Helvetica-Bold, F3 = Times-Bold, F4 = Courier-Bold
  const drawText = (
    text: string,
    x: number,
    topY: number,
    font: 'F1' | 'F2' | 'F3' | 'F4',
    size: number,
    r: number,
    g: number,
    b: number
  ) => {
    ops.push(
      'BT',
      `/${font} ${size} Tf`,
      `${(r / 255).toFixed(3)} ${(g / 255).toFixed(3)} ${(b / 255).toFixed(3)} rg`,
      `${x.toFixed(2)} ${py(topY)} Td`,
      `(${pdfEscape(text)}) Tj`,
      'ET'
    );
  };

  // 1. Page Background: Warm Cream (#f8f7f3)
  fillRect(0, 0, pageWidth, pageHeight, 248, 247, 243);

  // 2. Top Luxury Header Banner (#0e2018 Deep Forest Green)
  fillRect(0, 0, pageWidth, 118, 14, 32, 24);
  // Gold accent strip at bottom of header (#e5c158)
  fillRect(0, 118, pageWidth, 3.5, 229, 193, 88);

  // Brand Monogram Box
  fillRect(42, 28, 36, 36, 21, 45, 34);
  strokeRect(42, 28, 36, 36, 229, 193, 88, 1.2);
  drawText('B', 53, 53, 'F3', 22, 229, 193, 88);

  // Brand Title & Tagline
  drawText('BUNON GENTS', 88, 46, 'F3', 20, 244, 243, 238);
  drawText('CLOTHES FOR MODERN MEN  |  OFFICIAL ORDER INVOICE', 88, 62, 'F2', 7.5, 229, 193, 88);
  drawText(
    `${settings?.contactPhone || '+880 1700-000000'}   |   ${settings?.contactEmail || 'support@bunongents.com'}`,
    88,
    78,
    'F1',
    8.5,
    200,
    212,
    205
  );

  // Right side of Header: INVOICE Badge & Number
  drawText('INVOICE / PACKING SLIP', 415, 40, 'F2', 10, 229, 193, 88);
  drawText(order.orderNumber, 415, 58, 'F4', 14, 255, 255, 255);
  const formattedDate = new Date(order.createdAt).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  drawText(`Date: ${formattedDate}`, 415, 75, 'F1', 9, 210, 220, 214);
  drawText(`Status: ${order.orderStatus.toUpperCase()}`, 415, 90, 'F2', 8.5, 229, 193, 88);

  // 3. Customer & Delivery Information Cards
  // Left Card: Bill & Ship To
  fillRect(42, 140, 248, 112, 255, 255, 255);
  strokeRect(42, 140, 248, 112, 215, 222, 216, 1);
  drawText('DELIVER TO (RECIPIENT)', 56, 158, 'F2', 8, 17, 36, 28);
  drawLine(56, 164, 276, 164, 235, 240, 236, 0.8);
  drawText(order.customerName || 'Valued Customer', 56, 181, 'F2', 12, 17, 36, 28);
  drawText(`Phone: ${order.customerPhone || 'N/A'}`, 56, 197, 'F2', 9.5, 35, 58, 47);
  const addrLine = `${order.shippingAddress?.address || ''}`;
  drawText(addrLine.slice(0, 44), 56, 213, 'F1', 9, 60, 78, 70);
  if (addrLine.length > 44) {
    drawText(addrLine.slice(44, 88), 56, 225, 'F1', 9, 60, 78, 70);
  }
  drawText(
    `${order.shippingAddress?.city || 'Dhaka'} (${order.shippingAddress?.deliveryZone || 'Inside Dhaka'})`,
    56,
    240,
    'F2',
    8.5,
    17,
    36,
    28
  );

  // Right Card: Payment & Courier Summary
  fillRect(305, 140, 248, 112, 255, 255, 255);
  strokeRect(305, 140, 248, 112, 215, 222, 216, 1);
  drawText('PAYMENT & COURIER DETAILS', 319, 158, 'F2', 8, 17, 36, 28);
  drawLine(319, 164, 539, 164, 235, 240, 236, 0.8);

  drawText(`Payment Method: ${order.paymentMethod}`, 319, 181, 'F2', 10, 17, 36, 28);
  drawText(`Payment Status: ${order.paymentStatus}`, 319, 197, 'F1', 9.5, 40, 65, 52);

  if (order.paymentDetails?.transactionId) {
    drawText(
      `TrxID: ${order.paymentDetails.transactionId} (${order.paymentDetails.senderNumber || ''})`,
      319,
      213,
      'F4',
      8.5,
      157,
      23,
      77
    );
  } else {
    drawText('Cash on Delivery / Collect on Delivery', 319, 213, 'F1', 8.5, 90, 105, 98);
  }

  const codCollectable =
    order.paymentStatus === 'Verified' ? 0 : order.totalAmount;
  fillRect(319, 222, 220, 22, 17, 36, 28);
  drawText(
    `COLLECTABLE AMOUNT: ${formatBDTPlain(codCollectable)}`,
    327,
    236,
    'F2',
    9,
    229,
    193,
    88
  );

  // 4. Ordered Items Table Header
  let y = 272;
  fillRect(42, y, 511, 26, 17, 36, 28);
  drawText('#', 54, y + 17, 'F2', 8.5, 244, 243, 238);
  drawText('ITEM DESCRIPTION', 78, y + 17, 'F2', 8.5, 244, 243, 238);
  drawText('SIZE / COLOR', 300, y + 17, 'F2', 8.5, 244, 243, 238);
  drawText('QTY', 405, y + 17, 'F2', 8.5, 244, 243, 238);
  drawText('UNIT', 442, y + 17, 'F2', 8.5, 244, 243, 238);
  drawText('LINE TOTAL', 492, y + 17, 'F2', 8.5, 229, 193, 88);

  y += 26;

  // 5. Ordered Items Rows
  const items = order.items || [];
  items.forEach((item, index) => {
    const rowH = 28;
    const isEven = index % 2 === 0;
    fillRect(
      42,
      y,
      511,
      rowH,
      isEven ? 255 : 244,
      isEven ? 255 : 243,
      isEven ? 255 : 238
    );
    strokeRect(42, y, 511, rowH, 225, 231, 226, 0.5);

    drawText(String(index + 1), 54, y + 18, 'F4', 9, 17, 36, 28);
    drawText((item.title || 'Menswear Piece').slice(0, 36), 78, y + 18, 'F2', 9.5, 17, 36, 28);
    drawText(
      `${item.size || 'L'} / ${(item.color || 'Standard').slice(0, 14)}`,
      300,
      y + 18,
      'F1',
      9,
      60,
      78,
      70
    );
    drawText(String(item.quantity || 1), 410, y + 18, 'F2', 9.5, 17, 36, 28);
    drawText(
      Number(item.price || 0).toLocaleString('en-IN'),
      442,
      y + 18,
      'F4',
      8.5,
      60,
      78,
      70
    );
    drawText(
      formatBDTPlain((item.price || 0) * (item.quantity || 1)),
      485,
      y + 18,
      'F4',
      9,
      17,
      36,
      28
    );

    y += rowH;
  });

  // 6. Totals Box
  y += 14;
  const totalsX = 335;
  fillRect(totalsX, y, 218, 86, 255, 255, 255);
  strokeRect(totalsX, y, 218, 86, 215, 222, 216, 1);

  drawText('Subtotal:', totalsX + 14, y + 20, 'F1', 9.5, 70, 88, 80);
  drawText(formatBDTPlain(order.subtotal), totalsX + 125, y + 20, 'F4', 9.5, 17, 36, 28);

  drawText(
    `Shipping (${order.shippingAddress?.deliveryZone || 'Standard'}):`,
    totalsX + 14,
    y + 38,
    'F1',
    9,
    70,
    88,
    80
  );
  drawText(formatBDTPlain(order.shippingCost), totalsX + 125, y + 38, 'F4', 9.5, 17, 36, 28);

  fillRect(totalsX, y + 52, 218, 34, 17, 36, 28);
  drawText('GRAND TOTAL:', totalsX + 14, y + 73, 'F2', 10, 244, 243, 238);
  drawText(formatBDTPlain(order.totalAmount), totalsX + 115, y + 73, 'F4', 11, 229, 193, 88);

  // Left side note / courier parcel box
  if (order.shippingAddress?.notes) {
    fillRect(42, y, 275, 56, 255, 255, 255);
    strokeRect(42, y, 275, 56, 215, 222, 216, 0.8);
    drawText('DELIVERY NOTE / INSTRUCTION:', 54, y + 18, 'F2', 8, 17, 36, 28);
    drawText(order.shippingAddress.notes.slice(0, 48), 54, y + 34, 'F1', 8.5, 70, 88, 80);
  }

  // 7. Courier Cut-Out Slip at Bottom
  const footerTop = 710;
  drawLine(42, footerTop - 12, 553, footerTop - 12, 180, 190, 184, 0.8);
  fillRect(42, footerTop, 511, 78, 235, 240, 236);
  strokeRect(42, footerTop, 511, 78, 17, 36, 28, 1);

  drawText('STEADFAST / PATHAO COURIER DISPATCH LABEL', 56, footerTop + 18, 'F2', 8.5, 17, 36, 28);
  drawText(`Invoice: ${order.orderNumber}`, 56, footerTop + 34, 'F4', 10, 17, 36, 28);
  drawText(
    `Recipient: ${order.customerName} (${order.customerPhone})`,
    56,
    footerTop + 50,
    'F2',
    9.5,
    17,
    36,
    28
  );
  drawText(
    `Address: ${(order.shippingAddress?.address || '')}, ${order.shippingAddress?.city || ''}`,
    56,
    footerTop + 64,
    'F1',
    8.5,
    50,
    68,
    60
  );
  drawText(
    `COD to Collect: ${formatBDTPlain(codCollectable)}`,
    365,
    footerTop + 34,
    'F2',
    10.5,
    17,
    36,
    28
  );
  drawText(
    `Zone: ${order.shippingAddress?.deliveryZone || 'Inside Dhaka'}`,
    365,
    footerTop + 50,
    'F1',
    9,
    50,
    68,
    60
  );

  // Bottom Thank You Line
  drawText(
    'Thank you for choosing Bunon Gents  |  Clothes for modern men, made for the everyday.',
    130,
    812,
    'F1',
    8.5,
    90,
    105,
    98
  );

  const streamContent = ops.join('\n');

  // Assemble valid PDF 1.4 document with exact byte offsets
  const objects: string[] = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj',
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 4 0 R /F2 5 0 R /F3 6 0 R /F4 7 0 R >> >> /Contents 8 0 R >>\nendobj`,
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj',
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj',
    '6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Times-Bold >>\nendobj',
    '7 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold >>\nendobj',
    `8 0 obj\n<< /Length ${streamContent.length} >>\nstream\n${streamContent}\nendstream\nendobj`,
  ];

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];

  for (const obj of objects) {
    offsets.push(pdf.length);
    pdf += obj + '\n';
  }

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i <= objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  const blob = new Blob([pdf], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `BunonGents-Invoice-${order.orderNumber}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * Opens a themed print dialog window matching the Bunon Gents dark forest green & warm cream theme.
 */
export function printThemedOrderInvoice(order: Order, settings?: SiteSettings | null) {
  const codCollectable =
    order.paymentStatus === 'Verified' ? 0 : order.totalAmount;
  const formattedDate = new Date(order.createdAt).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const rowsHtml = (order.items || [])
    .map(
      (item, idx) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e9e5;font-family:monospace;">${idx + 1}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e9e5;font-weight:600;">${item.title}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e9e5;">${item.size} · ${item.color}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e9e5;text-align:center;font-weight:600;">${item.quantity}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e9e5;text-align:right;font-family:monospace;">৳${Number(item.price).toLocaleString('en-IN')}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e9e5;text-align:right;font-family:monospace;font-weight:700;">৳${Number(item.price * item.quantity).toLocaleString('en-IN')}</td>
      </tr>`
    )
    .join('');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Invoice ${order.orderNumber} - Bunon Gents</title>
  <style>
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body { margin: 0; padding: 24px; background: #f4f3ee; color: #11241c; font-family: system-ui, -apple-system, sans-serif; }
    .sheet { max-width: 780px; margin: 0 auto; background: #f8f7f3; border: 1px solid #d7ded8; border-radius: 20px; overflow: hidden; }
    .header { background: #0e2018; color: #f4f3ee; padding: 28px 32px; display: flex; justify-content: space-between; align-items: center; border-bottom: 4px solid #e5c158; }
    .brand { display: flex; align-items: center; gap: 14px; }
    .monogram { width: 44px; height: 44px; border-radius: 10px; background: #152d22; border: 1.5px solid #e5c158; color: #e5c158; display: flex; align-items: center; justify-content: center; font-family: Georgia, serif; font-size: 24px; font-weight: bold; }
    .body-wrap { padding: 28px 32px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-bottom: 24px; }
    .card { background: #ffffff; border: 1px solid #d7ded8; border-radius: 14px; padding: 16px 18px; }
    .label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.16em; color: #5b6d64; font-weight: 700; margin-bottom: 6px; }
    table { width: 100%; border-collapse: collapse; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #d7ded8; font-size: 13px; }
    thead tr { background: #11241c; color: #f4f3ee; font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; }
    thead th { padding: 11px 12px; text-align: left; }
    .totals { margin-top: 20px; display: flex; justify-content: flex-end; }
    .totals-box { width: 280px; background: #ffffff; border: 1px solid #d7ded8; border-radius: 14px; overflow: hidden; font-size: 13px; }
    .totals-row { display: flex; justify-content: space-between; padding: 9px 16px; border-bottom: 1px solid #ebf0ec; }
    .totals-grand { display: flex; justify-content: space-between; padding: 12px 16px; background: #11241c; color: #e5c158; font-weight: 700; font-size: 15px; }
    .courier-slip { margin-top: 24px; padding: 16px 20px; border: 1.5px dashed #11241c; border-radius: 14px; background: #ebf0ec; display: flex; justify-content: space-between; align-items: center; font-size: 12px; }
    @media print { body { padding: 0; background: #f8f7f3; } .sheet { border: none; border-radius: 0; max-width: 100%; } }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="header">
      <div class="brand">
        <div class="monogram">B</div>
        <div>
          <div style="font-family: Georgia, serif; font-size: 24px; letter-spacing: 0.04em;">BUNON <em>Gents</em></div>
          <div style="font-size: 10px; letter-spacing: 0.2em; color: #e5c158; text-transform: uppercase; margin-top: 2px;">Clothes for Modern Men · Official Invoice</div>
          <div style="font-size: 11px; color: #c7d2cc; margin-top: 4px;">${settings?.contactPhone || '+880 1700-000000'} · ${settings?.contactEmail || 'support@bunongents.com'}</div>
        </div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 10px; letter-spacing: 0.2em; color: #e5c158; font-weight: 700;">ORDER INVOICE</div>
        <div style="font-family: monospace; font-size: 18px; font-weight: 700; margin-top: 3px;">${order.orderNumber}</div>
        <div style="font-size: 11px; color: #c7d2cc; margin-top: 3px;">Date: ${formattedDate} · ${order.orderStatus}</div>
      </div>
    </div>
    <div class="body-wrap">
      <div class="grid">
        <div class="card">
          <div class="label">Recipient & Delivery Address</div>
          <div style="font-size: 15px; font-weight: 700;">${order.customerName}</div>
          <div style="font-size: 13px; margin-top: 3px; font-family: monospace;">${order.customerPhone}</div>
          <div style="font-size: 12px; color: #3c4e46; margin-top: 6px; line-height: 1.4;">
            ${order.shippingAddress?.address || ''}<br/>
            <strong>${order.shippingAddress?.city || 'Dhaka'}</strong> (${order.shippingAddress?.deliveryZone || 'Inside Dhaka'})
          </div>
        </div>
        <div class="card">
          <div class="label">Payment & Courier Collectible</div>
          <div style="font-size: 13px; font-weight: 700;">Method: ${order.paymentMethod} (${order.paymentStatus})</div>
          ${
            order.paymentDetails?.transactionId
              ? `<div style="font-size: 12px; font-family: monospace; color: #9d174d; margin-top: 4px;">TrxID: ${order.paymentDetails.transactionId} (${order.paymentDetails.senderNumber || ''})</div>`
              : `<div style="font-size: 12px; color: #5b6d64; margin-top: 4px;">Cash on Delivery</div>`
          }
          <div style="margin-top: 10px; padding: 8px 12px; border-radius: 8px; background: #11241c; color: #e5c158; font-family: monospace; font-size: 13px; font-weight: 700;">
            Collectable COD: ৳${Number(codCollectable).toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Piece Title</th>
            <th>Size / Color</th>
            <th style="text-align:center;">Qty</th>
            <th style="text-align:right;">Unit Price</th>
            <th style="text-align:right;">Line Total</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <div class="totals">
        <div class="totals-box">
          <div class="totals-row">
            <span>Subtotal</span>
            <strong style="font-family:monospace;">৳${Number(order.subtotal).toLocaleString('en-IN')}</strong>
          </div>
          <div class="totals-row">
            <span>Shipping (${order.shippingAddress?.deliveryZone || 'Standard'})</span>
            <strong style="font-family:monospace;">৳${Number(order.shippingCost).toLocaleString('en-IN')}</strong>
          </div>
          <div class="totals-grand">
            <span>Grand Total</span>
            <span style="font-family:monospace;">৳${Number(order.totalAmount).toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      <div class="courier-slip">
        <div>
          <div style="font-weight:700; text-transform:uppercase; font-size:10px; letter-spacing:0.15em;">Steadfast / Pathao Parcel Label</div>
          <div style="margin-top:4px;"><strong>${order.orderNumber}</strong> · ${order.customerName} (${order.customerPhone})</div>
          <div style="color:#3c4e46;">${order.shippingAddress?.address || ''}, ${order.shippingAddress?.city || ''}</div>
        </div>
        <div style="text-align:right; font-family:monospace;">
          <div style="font-size:11px; color:#3c4e46;">COD TO COLLECT</div>
          <div style="font-size:16px; font-weight:700; color:#11241c;">৳${Number(codCollectable).toLocaleString('en-IN')}</div>
        </div>
      </div>
    </div>
  </div>
  <script>
    window.onload = function() { setTimeout(function() { window.print(); }, 250); };
  </script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=860,height=920');
  if (win) {
    win.document.open();
    win.document.write(html);
    win.document.close();
  }
}

/**
 * Exports given orders in Steadfast Courier bulk upload CSV format:
 * Columns: Invoice, Name, Address, Phone, Amount, Note
 */
export function exportSteadfastCSV(orders: Order[]) {
  const escapeCSV = (val: string | number) => {
    const str = String(val ?? '').replace(/"/g, '""');
    return `"${str}"`;
  };

  const headers = ['Invoice', 'Name', 'Address', 'Phone', 'Amount', 'Note'];
  const rows = orders.map((o) => {
    const collectable = o.paymentStatus === 'Verified' ? 0 : o.totalAmount;
    const itemSummary = (o.items || [])
      .map((i) => `${i.title} (${i.size}/${i.color}) x${i.quantity}`)
      .join('; ');
    const fullAddr = `${o.shippingAddress?.address || ''}, ${o.shippingAddress?.city || ''}`;
    const note = [o.shippingAddress?.notes, itemSummary].filter(Boolean).join(' | ');
    return [
      escapeCSV(o.orderNumber),
      escapeCSV(o.customerName),
      escapeCSV(fullAddr),
      escapeCSV(o.customerPhone),
      escapeCSV(collectable),
      escapeCSV(note),
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `BunonGents-Steadfast-Courier-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * Exports given orders in Pathao Merchant Courier bulk CSV format:
 * Columns: ItemType, StoreName, MerchantOrderId, RecipientName, RecipientPhone, RecipientCity, RecipientZone, RecipientAddress, AmountToCollect, ItemQuantity, ItemWeight, ItemDescription, SpecialInstruction
 */
export function exportPathaoCSV(orders: Order[], storeName = 'Bunon Gents') {
  const escapeCSV = (val: string | number) => {
    const str = String(val ?? '').replace(/"/g, '""');
    return `"${str}"`;
  };

  const headers = [
    'ItemType',
    'StoreName',
    'MerchantOrderId',
    'RecipientName',
    'RecipientPhone',
    'RecipientCity',
    'RecipientZone',
    'RecipientAddress',
    'AmountToCollect',
    'ItemQuantity',
    'ItemWeight',
    'ItemDescription',
    'SpecialInstruction',
  ];

  const rows = orders.map((o) => {
    const collectable = o.paymentStatus === 'Verified' ? 0 : o.totalAmount;
    const totalQty = (o.items || []).reduce((acc, i) => acc + (i.quantity || 1), 0) || 1;
    const itemDesc = (o.items || [])
      .map((i) => `${i.title} [${i.size}/${i.color}] x${i.quantity}`)
      .join(', ');
    return [
      escapeCSV('Parcel'),
      escapeCSV(storeName),
      escapeCSV(o.orderNumber),
      escapeCSV(o.customerName),
      escapeCSV(o.customerPhone),
      escapeCSV(o.shippingAddress?.city || 'Dhaka'),
      escapeCSV(o.shippingAddress?.area || o.shippingAddress?.deliveryZone || 'Dhaka'),
      escapeCSV(`${o.shippingAddress?.address || ''}, ${o.shippingAddress?.city || ''}`),
      escapeCSV(collectable),
      escapeCSV(totalQty),
      escapeCSV('0.5'),
      escapeCSV(itemDesc),
      escapeCSV(o.shippingAddress?.notes || 'Handle with care'),
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `BunonGents-Pathao-Courier-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
