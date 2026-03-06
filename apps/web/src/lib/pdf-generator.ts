import { PDFDocument, PDFPage, rgb, StandardFonts } from 'pdf-lib'

interface Quote {
  quoteNumber: string
  customerName: string
  customerEmail: string
  customerPhone?: string | null
  customerAddress?: any
  items: QuoteItem[]
  subtotal: { toNumber: () => number }
  markupAmount: { toNumber: () => number }
  total: { toNumber: () => number }
  createdAt: Date
}

interface QuoteItem {
  productType: string
  shape: string
  dimensions: any
  foamType: string
  fabricCode: string
  fabricName?: string
  zipperPosition: string
  quantity: number
  unitPrice: { toNumber: () => number }
  totalPrice: { toNumber: () => number }
  piping: string
  ties: string
}

interface Retailer {
  businessName: string
  email: string
  phone?: string | null
  address?: any
  logoUrl?: string | null
  pdfPreference?: string | null
  pdfCustomization?: any
  labelFileUrl?: string | null
  labelPreference?: string | null
}

export async function generateQuotePDF(
  quote: Quote,
  retailer: Retailer,
  customizationOverride?: any,
  isAdmin: boolean = false
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([612, 792]) // Letter size

  const { width, height } = page.getSize()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  let y = height - 50

  // Apply customizations
  const pref = customizationOverride?.pdfPreference || retailer.pdfPreference;
  const custom = customizationOverride?.pdfCustomization || retailer.pdfCustomization || {};

  // Header with retailer info
  let headerText = retailer.businessName;
  if (pref !== 'NONE' && custom.headerText) {
    headerText = custom.headerText;
  }

  page.drawText(headerText, {
    x: 50,
    y,
    size: 24,
    font: boldFont,
    color: rgb(0.23, 0.51, 0.96),
  })
  y -= 30

  if (pref !== 'NONE') {
    let logoRendered = false;

    console.log('--- PDF GENERATOR DEBUG ---')
    console.log(`pref: ${pref}, custom.includeLogo:`, custom.includeLogo, 'typeof:', typeof custom.includeLogo);
    console.log(`Has labelFileUrl:`, !!retailer.labelFileUrl);

    // Explicitly handle if it's implicitly true or explicitly true, allowing undefined to mean true internally over network payloads
    const shouldIncludeLogo = custom.includeLogo !== false && custom.includeLogo !== 'false';

    if (shouldIncludeLogo && retailer.labelFileUrl) {
      if (retailer.labelFileUrl.startsWith('data:image/jpeg') || retailer.labelFileUrl.startsWith('data:image/png')) {
        try {
          console.log('Attempting to embed logo inside pdf...');
          const base64Data = retailer.labelFileUrl.split(',')[1];
          const imageBytes = Buffer.from(base64Data, 'base64');
          console.log('Parsed base64 imageBytes length:', imageBytes.length);

          let image;
          try {
            image = await pdfDoc.embedJpg(imageBytes);
            console.log('Successfully embedded JPG.');
          } catch (jpgErr) {
            console.log('Failed to embed as JPG, attempting PNG...');
            image = await pdfDoc.embedPng(imageBytes);
            console.log('Successfully embedded PNG.');
          }

          if (image) {
            const scaled = image.scale(0.20);
            page.drawImage(image, {
              x: width - scaled.width - 50,
              y: (y + 30) - (scaled.height / 2),
              width: scaled.width,
              height: scaled.height,
            });
            logoRendered = true;
            console.log('Logo image drawn on page.');
          }
        } catch (err) {
          console.error('Failed to embed logo from base64 data:', err);
        }
      } else {
        console.log('labelFileUrl does not start with data:image/jpeg or png. It is:', retailer.labelFileUrl.substring(0, 50));
      }
    } else {
      console.log('Logo inclusion skipped. shouldIncludeLogo:', shouldIncludeLogo);
    }

    const shouldIncludeLabel = custom.includeLabel !== false && custom.includeLabel !== 'false';
    if (shouldIncludeLabel) {
      const textY = logoRendered ? y - 10 : y + 30; // drop text below logo if logo exists
      page.drawText(custom.labelText || '[ BRAND LABEL APPLIED ]', {
        x: width - 200,
        y: textY,
        size: 9,
        font: boldFont,
        color: rgb(0.5, 0.5, 0.5)
      });
    }
  }

  page.drawText('QUOTATION', {
    x: 50,
    y,
    size: 18,
    font: boldFont,
    color: rgb(0.23, 0.51, 0.96),
  })
  y -= 40

  // Quote Info
  page.drawText(`Quote #: ${quote.quoteNumber}`, { x: 50, y, size: 10, font })
  page.drawText(`Date: ${new Date(quote.createdAt).toLocaleDateString()}`, {
    x: 400, y, size: 10, font
  })
  y -= 20

  // Customer Info
  y -= 20
  page.drawText('BILL TO:', { x: 50, y, size: 12, font: boldFont })
  y -= 15
  page.drawText(quote.customerName, { x: 50, y, size: 10, font })
  y -= 15
  page.drawText(quote.customerEmail, { x: 50, y, size: 10, font })
  if (quote.customerPhone) {
    y -= 15
    page.drawText(quote.customerPhone, { x: 50, y, size: 10, font })
  }
  if (quote.customerAddress) {
    const addr = typeof quote.customerAddress === 'string' ? JSON.parse(quote.customerAddress) : quote.customerAddress
    if (addr.line1) {
      y -= 15
      page.drawText(addr.line1, { x: 50, y, size: 10, font })
    }
    if (addr.line2) {
      y -= 15
      page.drawText(addr.line2, { x: 50, y, size: 10, font })
    }
    const cityStateZip = [addr.city, addr.state, addr.zip].filter(Boolean).join(', ')
    if (cityStateZip) {
      y -= 15
      page.drawText(cityStateZip, { x: 50, y, size: 10, font })
    }
  }
  y -= 30

  // Items Table Header
  const drawTableHeader = () => {
    page.drawRectangle({
      x: 50,
      y: y - 5,
      width: width - 100,
      height: 20,
      color: rgb(0.23, 0.51, 0.96),
    })

    page.drawText('Item', { x: 60, y, size: 10, font: boldFont, color: rgb(1, 1, 1) })
    page.drawText('Qty', { x: 300, y, size: 10, font: boldFont, color: rgb(1, 1, 1) })
    page.drawText('Price', { x: 400, y, size: 10, font: boldFont, color: rgb(1, 1, 1) })
    page.drawText('Total', { x: 500, y, size: 10, font: boldFont, color: rgb(1, 1, 1) })
    return y - 25
  }

  let dynamicFees = 0;
  if (pref !== 'NONE' && (customizationOverride?.pdfPreference === 'ALWAYS' || retailer.pdfPreference === 'ALWAYS' || pref === 'ALWAYS')) {
    dynamicFees += 10;
  }
  // Use the quote-level snapshotted labelPreference (ALWAYS or PER_ORDER = fee applies)
  const quoteLabelPref = customizationOverride?.labelPreference || retailer.labelPreference;
  if (quoteLabelPref === 'ALWAYS' || quoteLabelPref === 'PER_ORDER') {
    const qty = quote.items?.reduce((acc: number, item: any) => acc + item.quantity, 0) || 0;
    dynamicFees += (8 * qty);
  }

  y = drawTableHeader()

  // Items
  for (const item of quote.items) {
    const itemText = `${item.shape} - ${item.fabricCode.split('_').pop()}`
    page.drawText(itemText, { x: 60, y, size: 9, font })
    page.drawText(item.quantity.toString(), { x: 300, y, size: 9, font })

    let displayTotal = item.totalPrice.toNumber();
    let displayUnit = item.unitPrice.toNumber();

    const isOldRecord = quote.total.toNumber() === quote.subtotal.toNumber() && quote.markupAmount.toNumber() > 0;
    const hasMarkup = quote.total.toNumber() > quote.subtotal.toNumber() || isOldRecord || dynamicFees > 0;

    if (hasMarkup) {
      const subtotalBase = quote.subtotal.toNumber();
      const ratio = subtotalBase > 0 ? (item.totalPrice.toNumber() / subtotalBase) : 0;
      const totalToDistribute = quote.markupAmount.toNumber() + dynamicFees;
      const distributedExtra = totalToDistribute * ratio;
      displayTotal += distributedExtra;
      displayUnit = displayTotal / item.quantity;
    }

    page.drawText(`$${displayUnit.toFixed(2)}`, { x: 400, y, size: 9, font })
    page.drawText(`$${displayTotal.toFixed(2)}`, { x: 500, y, size: 9, font })
    y -= 15

    // Details line 1: Category, Shape, Dimensions
    const dims = (item as any).dimensions || {}
    const dimParts: string[] = []
    if (dims.length) dimParts.push(`L:${dims.length}"`)
    if (dims.width) dimParts.push(`W:${dims.width}"`)
    if (dims.thickness) dimParts.push(`T:${dims.thickness}"`)
    if (dims.diameter) dimParts.push(`Dia:${dims.diameter}"`)
    if (dims.bottomWidth) dimParts.push(`BW:${dims.bottomWidth}"`)
    if (dims.topWidth) dimParts.push(`TW:${dims.topWidth}"`)
    if (dims.ear) dimParts.push(`Ear:${dims.ear}"`)
    const dimStr = dimParts.length > 0 ? dimParts.join(' x ') : ''

    const detailLine1 = `  ${(item as any).productType || ''} | ${item.shape}${dimStr ? ' | ' + dimStr : ''}`
    page.drawText(detailLine1, {
      x: 60,
      y,
      size: 7,
      font,
      color: rgb(0.4, 0.4, 0.4),
    })
    y -= 12

    // Details line 2: Foam, Fabric, Zipper, Piping, Ties
    const fabricLabel = (item as any).fabricName ? `${item.fabricCode} (${(item as any).fabricName})` : item.fabricCode
    const detailLine2 = `  ${item.foamType} | ${fabricLabel} | Zip: ${(item as any).zipperPosition || 'N/A'} | ${item.piping} | ${item.ties}`
    page.drawText(detailLine2, {
      x: 60,
      y,
      size: 7,
      font,
      color: rgb(0.4, 0.4, 0.4),
    })
    y -= 18

    // New page if needed
    if (y < 100) {
      const newPage = pdfDoc.addPage([612, 792])
      y = newPage.getSize().height - 50
    }
  }

  const isOldRecord = quote.total.toNumber() === quote.subtotal.toNumber() && quote.markupAmount.toNumber() > 0;
  let finalPdfTotal = isOldRecord ? (quote.subtotal.toNumber() + quote.markupAmount.toNumber()) : quote.total.toNumber();

  finalPdfTotal += dynamicFees;

  y -= 20
  page.drawLine({
    start: { x: 350, y },
    end: { x: width - 50, y },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  })
  y -= 20

  y -= 10
  page.drawText('TOTAL:', { x: 400, y, size: 14, font: boldFont })
  page.drawText(`$${finalPdfTotal.toFixed(2)}`, { x: 500, y, size: 14, font: boldFont })

  // Footer
  let footerStr = 'Thank you for your business!';
  if (pref !== 'NONE' && custom.footerContact) {
    footerStr += ` | ${custom.footerContact}`;
  }

  page.drawText(footerStr, {
    x: 50,
    y: 50,
    size: 10,
    font,
    color: rgb(0.5, 0.5, 0.5),
  })

  return await pdfDoc.save()
}

interface Order {
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone?: string | null
  customerAddress?: any
  items: QuoteItem[]
  subtotal: { toNumber: () => number }
  markupAmount: { toNumber: () => number }
  total: { toNumber: () => number }
  createdAt: Date
}

export async function generateOrderPDF(
  order: Order,
  retailer: Retailer,
  customizationOverride?: any,
  isAdmin: boolean = false
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([612, 792])

  const { width, height } = page.getSize()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  let y = height - 50

  const pref = customizationOverride?.pdfPreference || retailer.pdfPreference;
  const custom = customizationOverride?.pdfCustomization || retailer.pdfCustomization || {};

  let headerText = retailer.businessName;
  if (pref !== 'NONE' && custom.headerText) {
    headerText = custom.headerText;
  }

  page.drawText(headerText, {
    x: 50,
    y,
    size: 24,
    font: boldFont,
    color: rgb(0.23, 0.51, 0.96),
  })
  y -= 30

  if (pref !== 'NONE') {
    let logoRendered = false;

    console.log('--- PDF GENERATOR DEBUG (ORDER) ---')
    console.log(`pref: ${pref}, custom.includeLogo:`, custom.includeLogo);

    const shouldIncludeLogo = custom.includeLogo !== false && custom.includeLogo !== 'false';

    if (shouldIncludeLogo && retailer.labelFileUrl) {
      if (retailer.labelFileUrl.startsWith('data:image/jpeg') || retailer.labelFileUrl.startsWith('data:image/png')) {
        try {
          const base64Data = retailer.labelFileUrl.split(',')[1];
          const imageBytes = Buffer.from(base64Data, 'base64');

          let image;
          try {
            image = await pdfDoc.embedJpg(imageBytes);
          } catch (jpgErr) {
            console.log('Failed to embed as JPG in Order, attempting PNG...');
            image = await pdfDoc.embedPng(imageBytes);
          }

          if (image) {
            const scaled = image.scale(0.20);
            page.drawImage(image, {
              x: width - scaled.width - 50,
              y: (y + 30) - (scaled.height / 2),
              width: scaled.width,
              height: scaled.height,
            });
            logoRendered = true;
          }
        } catch (err) {
          console.error('Failed to embed logo from base64 data:', err);
        }
      }
    }

    const shouldIncludeLabel = custom.includeLabel !== false && custom.includeLabel !== 'false';
    if (shouldIncludeLabel) {
      const textY = logoRendered ? y - 10 : y + 30; // drop text below logo if logo exists
      page.drawText(custom.labelText || '[ BRAND LABEL APPLIED ]', {
        x: width - 200,
        y: textY,
        size: 9,
        font: boldFont,
        color: rgb(0.5, 0.5, 0.5)
      });
    }
  }

  page.drawText('ORDER CONFIRMATION', {
    x: 50,
    y,
    size: 18,
    font: boldFont,
    color: rgb(0.23, 0.51, 0.96),
  })
  y -= 40

  page.drawText(`Order #: ${order.orderNumber}`, { x: 50, y, size: 10, font })
  page.drawText(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, {
    x: 400, y, size: 10, font
  })
  y -= 20

  y -= 20
  page.drawText('BILL TO:', { x: 50, y, size: 12, font: boldFont })
  y -= 15
  page.drawText(order.customerName, { x: 50, y, size: 10, font })
  y -= 15
  page.drawText(order.customerEmail, { x: 50, y, size: 10, font })
  if (order.customerPhone) {
    y -= 15
    page.drawText(order.customerPhone, { x: 50, y, size: 10, font })
  }
  if (order.customerAddress) {
    const oAddr = typeof order.customerAddress === 'string' ? JSON.parse(order.customerAddress) : order.customerAddress
    if (oAddr.line1) {
      y -= 15
      page.drawText(oAddr.line1, { x: 50, y, size: 10, font })
    }
    if (oAddr.line2) {
      y -= 15
      page.drawText(oAddr.line2, { x: 50, y, size: 10, font })
    }
    const oCityStateZip = [oAddr.city, oAddr.state, oAddr.zip].filter(Boolean).join(', ')
    if (oCityStateZip) {
      y -= 15
      page.drawText(oCityStateZip, { x: 50, y, size: 10, font })
    }
  }
  y -= 30

  const drawTableHeader = () => {
    page.drawRectangle({
      x: 50,
      y: y - 5,
      width: width - 100,
      height: 20,
      color: rgb(0.23, 0.51, 0.96),
    })

    page.drawText('Item', { x: 60, y, size: 10, font: boldFont, color: rgb(1, 1, 1) })
    page.drawText('Qty', { x: 300, y, size: 10, font: boldFont, color: rgb(1, 1, 1) })
    page.drawText('Price', { x: 400, y, size: 10, font: boldFont, color: rgb(1, 1, 1) })
    page.drawText('Total', { x: 500, y, size: 10, font: boldFont, color: rgb(1, 1, 1) })
    return y - 25
  }

  let dynamicFeesOrder = 0;
  if (pref !== 'NONE' && (customizationOverride?.pdfPreference === 'ALWAYS' || retailer.pdfPreference === 'ALWAYS' || pref === 'ALWAYS')) {
    dynamicFeesOrder += 10;
  }
  const orderLabelPref = customizationOverride?.labelPreference || retailer.labelPreference;
  if (orderLabelPref === 'ALWAYS' || orderLabelPref === 'PER_ORDER') {
    const qty = order.items?.reduce((acc: number, item: any) => acc + item.quantity, 0) || 0;
    dynamicFeesOrder += (8 * qty);
  }

  y = drawTableHeader()

  for (const item of order.items) {
    const itemText = `${item.shape} - ${item.fabricCode.split('_').pop()}`
    page.drawText(itemText, { x: 60, y, size: 9, font })
    page.drawText(item.quantity.toString(), { x: 300, y, size: 9, font })

    let displayTotal = item.totalPrice.toNumber();
    let displayUnit = item.unitPrice.toNumber();

    const isOldRecord = order.total.toNumber() === order.subtotal.toNumber() && order.markupAmount.toNumber() > 0;
    const hasMarkup = order.total.toNumber() > order.subtotal.toNumber() || isOldRecord || dynamicFeesOrder > 0;

    if (hasMarkup) {
      const subtotalBase = order.subtotal.toNumber();
      const ratio = subtotalBase > 0 ? (item.totalPrice.toNumber() / subtotalBase) : 0;
      const totalToDistribute = order.markupAmount.toNumber() + dynamicFeesOrder;
      const distributedExtra = totalToDistribute * ratio;
      displayTotal += distributedExtra;
      displayUnit = displayTotal / item.quantity;
    }

    page.drawText(`$${displayUnit.toFixed(2)}`, { x: 400, y, size: 9, font })
    page.drawText(`$${displayTotal.toFixed(2)}`, { x: 500, y, size: 9, font })
    y -= 15

    // Details line 1: Category, Shape, Dimensions
    const oDims = (item as any).dimensions || {}
    const oDimParts: string[] = []
    if (oDims.length) oDimParts.push(`L:${oDims.length}"`)
    if (oDims.width) oDimParts.push(`W:${oDims.width}"`)
    if (oDims.thickness) oDimParts.push(`T:${oDims.thickness}"`)
    if (oDims.diameter) oDimParts.push(`Dia:${oDims.diameter}"`)
    if (oDims.bottomWidth) oDimParts.push(`BW:${oDims.bottomWidth}"`)
    if (oDims.topWidth) oDimParts.push(`TW:${oDims.topWidth}"`)
    if (oDims.ear) oDimParts.push(`Ear:${oDims.ear}"`)
    const oDimStr = oDimParts.length > 0 ? oDimParts.join(' x ') : ''

    const oDetailLine1 = `  ${(item as any).productType || ''} | ${item.shape}${oDimStr ? ' | ' + oDimStr : ''}`
    page.drawText(oDetailLine1, {
      x: 60,
      y,
      size: 7,
      font,
      color: rgb(0.4, 0.4, 0.4),
    })
    y -= 12

    // Details line 2: Foam, Fabric, Zipper, Piping, Ties
    const oFabricLabel = (item as any).fabricName ? `${item.fabricCode} (${(item as any).fabricName})` : item.fabricCode
    const oDetailLine2 = `  ${item.foamType} | ${oFabricLabel} | Zip: ${(item as any).zipperPosition || 'N/A'} | ${item.piping} | ${item.ties}`
    page.drawText(oDetailLine2, {
      x: 60,
      y,
      size: 7,
      font,
      color: rgb(0.4, 0.4, 0.4),
    })
    y -= 18

    if (y < 100) {
      const newPage = pdfDoc.addPage([612, 792])
      y = newPage.getSize().height - 50
    }
  }

  const isOldRecord = order.total.toNumber() === order.subtotal.toNumber() && order.markupAmount.toNumber() > 0;
  let finalPdfTotal = isOldRecord ? (order.subtotal.toNumber() + order.markupAmount.toNumber()) : order.total.toNumber();

  finalPdfTotal += dynamicFeesOrder;

  y -= 20
  page.drawLine({
    start: { x: 350, y },
    end: { x: width - 50, y },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  })
  y -= 20

  y -= 10
  page.drawText('TOTAL:', { x: 400, y, size: 14, font: boldFont })
  page.drawText(`$${finalPdfTotal.toFixed(2)}`, { x: 500, y, size: 14, font: boldFont })

  let footerStr = 'Thank you for your order!';
  if (pref !== 'NONE' && custom.footerContact) {
    footerStr += ` | ${custom.footerContact}`;
  }

  page.drawText(footerStr, {
    x: 50,
    y: 50,
    size: 10,
    font,
    color: rgb(0.5, 0.5, 0.5),
  })

  return await pdfDoc.save()
}
