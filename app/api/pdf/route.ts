import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { quotationId } = await request.json();

    if (!quotationId) {
      return NextResponse.json({ error: 'Quotation ID is required' }, { status: 400 });
    }

    const baseUrl = request.nextUrl.origin;

    // Fetch quotation data directly from database (avoid auth-protected API route)
    const { data: qData, error: qError } = await supabase
      .from('quotations')
      .select(`*, customers (customer_id, name, phone, email, address)`)
      .eq('quotation_id', quotationId)
      .single();

    if (qError || !qData) {
      console.error('Quotation fetch error:', qError);
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }

    const quotation = {
      quotationId: qData.quotation_id,
      customerId: qData.customer_id,
      customer: qData.customers ? {
        customerId: qData.customers.customer_id,
        name: qData.customers.name,
        mobile: qData.customers.phone,
        email: qData.customers.email,
        location: qData.customers.address,
      } : null,
      eventType: qData.event_type,
      eventDateStart: qData.event_date_start,
      eventDateEnd: qData.event_date_end,
      location: qData.location,
      services: qData.photography_services,
      deliverables: qData.additional_services,
      manualTotal: qData.manual_total,
      customerTotal: qData.customer_total,
      status: qData.status,
      createdAt: qData.created_at,
    };

    // Fetch customer data
    let customerName = 'Customer Name';
    if (quotation.customerId) {
      try {
        const customerRes = await fetch(`${baseUrl}/api/customers?id=${quotation.customerId}`);
        if (customerRes.ok) {
          const customerData = await customerRes.json();
          customerName = customerData.name || customerName;
        }
      } catch (error) {
        console.warn('Failed to fetch customer data:', error);
      }
    }

    // Prepare customer data for PDF generation
    const customerData = {
      quotationId: quotation.quotationId || 'Q-AKP-26-0001',
      date: quotation.createdAt ? new Date(quotation.createdAt).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'),
      clientName: customerName,
      eventDates: `${quotation.eventDateStart ? new Date(quotation.eventDateStart).toLocaleDateString('en-GB') : ''}${quotation.eventDateStart && quotation.eventDateEnd ? ' – ' + new Date(quotation.eventDateEnd).toLocaleDateString('en-GB') : ''}` || 'Event Dates',
      location: quotation.location || 'Event Location',
      totalAmount: `₹${quotation.manualTotal || quotation.customerTotal || 0}`,
      otherWorks: (quotation.deliverables && quotation.deliverables.others && quotation.deliverables.others.otherWorksText) ? quotation.deliverables.others.otherWorksText : ''
    };

    // Read HTML template
    const templatePath = path.join(process.cwd(), 'pdf-report', 'quotation.html');
    let htmlContent = await fs.readFile(templatePath, 'utf-8');

    // Read logo and convert to base64
    const logoPath = path.join(process.cwd(), 'pdf-report', 'assets', 'ak-logo-final.png');
    const logoBuffer = await fs.readFile(logoPath);
    const logoBase64 = logoBuffer.toString('base64');
    const logoDataUrl = `data:image/png;base64,${logoBase64}`;

    // Replace placeholders with customer data and logo
    htmlContent = htmlContent
      .replace(/{{QUOTATION_ID}}/g, customerData.quotationId)
      .replace(/{{DATE}}/g, customerData.date)
      .replace(/{{CLIENT_NAME}}/g, customerData.clientName)
      .replace(/{{EVENT_DATES}}/g, customerData.eventDates)
      .replace(/{{LOCATION}}/g, customerData.location)
      .replace(/{{TOTAL_AMOUNT}}/g, customerData.totalAmount)
      .replace(/{{OTHER_WORKS}}/g, customerData.otherWorks)
      .replace(/assets\/ak-logo-final\.png/g, logoDataUrl);

    // Launch Puppeteer and generate PDF
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      }
    });

    await browser.close();

    // Return PDF as response
    return new NextResponse(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Quotation-${quotation.quotationId}.pdf"`,
      },
    });

  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}