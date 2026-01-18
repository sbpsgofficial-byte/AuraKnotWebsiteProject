import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/google-auth';
import { sheetsClient } from '@/lib/google-sheets';
import { GOOGLE_SHEETS_SHEET_NAMES } from '@/config/constants';
import { createCalendarEvent } from '@/lib/google-calendar';
import { generateOrderId } from '@/lib/quotation-generator';
import { Quotation, EventType, PackageType, SessionType, QuotationStatus } from '@/types';

export const dynamic = 'force-dynamic';

// Type for PATCH request body
interface PatchBody {
  status: 'Confirmed' | 'Declined' | string;
}

// GET handler — fetch single quotation by id
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { getQuotations } = await import('@/lib/google-sheets');
    const quotations = await getQuotations();
    const quotation = quotations.find((q: any) => q.quotationId === params.id);

    if (!quotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }

    return NextResponse.json(quotation);
  } catch (error: any) {
    console.error('Error fetching quotation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch quotation' },
      { status: 500 }
    );
  }
}

// PATCH handler — update quotation status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Parse request body once
    const body: any = await request.json();
    const { status, services, customerTotal, manualTotal, deliverables, remarks } = body;

    const isCustomerAction = !session && (status === 'Confirmed' || status === 'Declined' || status === 'Pending');
    if (!session && !isCustomerAction) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Read quotation sheet
    const rows = await sheetsClient.readSheet(GOOGLE_SHEETS_SHEET_NAMES.QUOTATIONS);
    const headerRow = rows[0] ?? [];
    const headerIndexMap: Record<string, number> = headerRow.reduce((acc, header, idx) => {
      acc[header] = idx;
      return acc;
    }, {} as Record<string, number>);

    const rowIndex = rows.findIndex(row => row[headerIndexMap['quotationId']] === params.id);
    if (rowIndex === -1) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }

    const currentRow = [...rows[rowIndex]];
    const confirmedAtIndex = headerIndexMap['confirmedAt'] ?? headerRow.indexOf('confirmedAt');

    // Lock if already confirmed for customer actions modifying core fields
    // Allow admins (with session) to modify services/manualTotal/deliverables
    if (currentRow[confirmedAtIndex] && !session && (services || manualTotal || deliverables)) {
      return NextResponse.json(
        { error: 'Quotation is already confirmed and cannot be modified by customer' },
        { status: 400 }
      );
    }

    // Update fields if provided
    if (services !== undefined) {
      const servicesIndex = headerIndexMap['services'] ?? headerRow.indexOf('services');
      if (servicesIndex >= 0) {
        currentRow[servicesIndex] = JSON.stringify(services);
      }
    }
    
    if (manualTotal !== undefined) {
      const manualTotalIndex = headerIndexMap['manualTotal'] ?? headerRow.indexOf('manualTotal');
      if (manualTotalIndex >= 0) {
        currentRow[manualTotalIndex] = manualTotal;
      }
      // Also update customerTotal for backward compatibility
      const customerTotalIndex = headerIndexMap['customerTotal'] ?? headerRow.indexOf('customerTotal');
      if (customerTotalIndex >= 0) {
        currentRow[customerTotalIndex] = manualTotal;
      }
    }
    
    if (deliverables !== undefined) {
      const deliverablesIndex = headerIndexMap['deliverables'] ?? headerRow.indexOf('deliverables');
      if (deliverablesIndex >= 0) {
        currentRow[deliverablesIndex] = JSON.stringify(deliverables);
      }
    }

    // If totals changed, try to update existing order (if any) so we don't create a duplicate order
    if (manualTotal !== undefined || customerTotal !== undefined) {
      try {
        const ordersSheet = await sheetsClient.readSheet(GOOGLE_SHEETS_SHEET_NAMES.ORDERS);
        if (ordersSheet.length > 0) {
          const oHeaders: string[] = ordersSheet[0];
          const qIdx = oHeaders.indexOf('quotationId');
          if (qIdx >= 0) {
            const foundIndex = ordersSheet.findIndex(row => row[qIdx] === params.id);
            if (foundIndex !== -1) {
              const orderRow = [...ordersSheet[foundIndex]];
              const estIdx = oHeaders.indexOf('estimatedBudget');
              const finIdx = oHeaders.indexOf('finalBudget');
              const newVal = manualTotal !== undefined ? manualTotal : (customerTotal !== undefined ? customerTotal : undefined);
              if (newVal !== undefined) {
                if (estIdx >= 0) orderRow[estIdx] = newVal;
                if (finIdx >= 0) orderRow[finIdx] = newVal;
                // Persist order update
                await sheetsClient.updateRow(GOOGLE_SHEETS_SHEET_NAMES.ORDERS, foundIndex + 1, orderRow);

                // Update any payments for this order to reflect new balance (support new `amount` or legacy `paidAmount`)
                try {
                  const paymentsSheet = await sheetsClient.readSheet(GOOGLE_SHEETS_SHEET_NAMES.PAYMENTS);
                  if (paymentsSheet.length > 0) {
                    const pHeaders: string[] = paymentsSheet[0];
                    const orderIdIdx = pHeaders.indexOf('orderId');
                    const paymentOrderId = orderRow[0];
                    const estimatedIdx = pHeaders.indexOf('estimatedAmount');
                    const paidIdx = pHeaders.indexOf('paidAmount');
                    const amountIdx = pHeaders.indexOf('amount');
                    const balanceIdx = pHeaders.indexOf('balanceAmount');
                    for (let i = 1; i < paymentsSheet.length; i++) {
                      const prow = [...paymentsSheet[i]];
                      const prowOrderId = prow[orderIdIdx] || '';
                      if (prowOrderId === paymentOrderId) {
                        const paid = parseFloat((amountIdx >= 0 ? prow[amountIdx] : prow[paidIdx]) || '0') || 0;
                        if (estimatedIdx >= 0) prow[estimatedIdx] = newVal;
                        if (balanceIdx >= 0) prow[balanceIdx] = (Number(newVal) || 0) - (paid || 0);
                        await sheetsClient.updateRow(GOOGLE_SHEETS_SHEET_NAMES.PAYMENTS, i + 1, prow);
                      }
                    }
                  }
                } catch (e) {
                  console.error('Error updating payments after quotation total change:', e);
                }
              }
            }
          }
        }
      } catch (e) {
        console.error('Error checking/updating related order for quotation:', e);
      }
    }

    // Update status if provided
    if (status !== undefined) {
      const statusIndex = headerIndexMap['status'] ?? headerRow.indexOf('status');
      if (statusIndex >= 0) {
        currentRow[statusIndex] = status;
      }
    }

    // Update remarks if provided (for declined quotations)
    if (remarks !== undefined) {
      const remarksIndex = headerIndexMap['remarks'] ?? headerRow.indexOf('remarks');
      if (remarksIndex >= 0) {
        currentRow[remarksIndex] = remarks;
      } else {
        // Add remarks column if it doesn't exist
        currentRow.push(remarks);
        if (headerRow.indexOf('remarks') === -1) {
          headerRow.push('remarks');
        }
      }
    }

    // Handle confirmed quotations
    if (status === 'Confirmed') {
      currentRow[confirmedAtIndex] = new Date().toISOString();

      // Generate or update order
      const customerId = currentRow[headerIndexMap['customerId']];
      const manualTotalIndex = headerIndexMap['manualTotal'] ?? headerRow.indexOf('manualTotal');
      const customerTotalIndex = headerIndexMap['customerTotal'] ?? headerRow.indexOf('customerTotal');
      const customerTotal = parseFloat(
        (manualTotalIndex >= 0 && currentRow[manualTotalIndex]) 
          ? currentRow[manualTotalIndex] 
          : (currentRow[customerTotalIndex] || '0')
      );

      // Check if an order for this quotation already exists
      let ordersSheet = await sheetsClient.readSheet(GOOGLE_SHEETS_SHEET_NAMES.ORDERS);
      let orderId: string | null = null;
      
      // Always check for existing orders (even if sheet is empty, this is a no-op)
      if (ordersSheet.length > 0) {
        const oHeaders: string[] = ordersSheet[0];
        const qIdx = oHeaders.indexOf('quotationId');
        if (qIdx >= 0) {
          const found = ordersSheet.slice(1).find((r) => (r[qIdx] || '').trim() === params.id.trim());
          if (found) {
            orderId = found[0];
            console.log(`Found existing order ${orderId} for quotation ${params.id}`);
            // Update existing order budgets to match confirmed total
            try {
              const foundIndex = ordersSheet.slice(1).findIndex((r) => (r[qIdx] || '').trim() === params.id.trim()) + 1;
              const orderRow = [...ordersSheet[foundIndex]];
              const estIdx = oHeaders.indexOf('estimatedBudget');
              const finIdx = oHeaders.indexOf('finalBudget');
              if (estIdx >= 0) orderRow[estIdx] = customerTotal;
              if (finIdx >= 0) orderRow[finIdx] = customerTotal;
              await sheetsClient.updateRow(GOOGLE_SHEETS_SHEET_NAMES.ORDERS, foundIndex + 1, orderRow);
              console.log(`Updated existing order ${orderId} with new total ${customerTotal}`);
            } catch (e) {
              console.error('Error updating existing order on confirm:', e);
            }
          } else {
            console.log(`No existing order found for quotation ${params.id}`);
          }
        } else {
          console.log(`quotationId column not found in orders sheet headers: ${oHeaders}`);
        }
      } else {
        console.log(`Orders sheet is empty for quotation ${params.id}`);
      }

      // If no existing order, create a new one
      if (!orderId) {
        const newOrderId = await generateOrderId();
        orderId = newOrderId;
        console.log(`Creating new order ${newOrderId} for quotation ${params.id}`);
        const orderData = [
          orderId,
          params.id, // quotationId
          customerId,
          customerTotal, // estimatedBudget
          customerTotal, // finalBudget
          JSON.stringify({
            photoSelection: 'No',
            albumDesign: 'No',
            albumPrinting: 'No',
            videoEditing: 'No',
            outdoorShoot: 'No',
            albumDelivery: 'No',
          }),
          new Date().toISOString(),
        ];

        if (ordersSheet.length === 0) {
          await sheetsClient.writeSheet(GOOGLE_SHEETS_SHEET_NAMES.ORDERS, [
            [
              'orderId',
              'quotationId',
              'customerId',
              'estimatedBudget',
              'finalBudget',
              'workflowStatus',
              'createdAt',
            ],
            orderData,
          ]);
        } else {
          await sheetsClient.appendRow(GOOGLE_SHEETS_SHEET_NAMES.ORDERS, orderData);
        }
        console.log(`Created new order ${newOrderId} for quotation ${params.id}`);
      }

      // Prepare full Quotation object for calendar
      const quotationForCalendar: Quotation = {
        quotationId: currentRow[headerIndexMap['quotationId']],
        customerId: currentRow[headerIndexMap['customerId']],
        eventType: currentRow[headerIndexMap['eventType']] as EventType,
        eventDateStart: currentRow[headerIndexMap['eventDateStart']],
        eventDateEnd: currentRow[headerIndexMap['eventDateEnd']],
        location: currentRow[headerIndexMap['location']],
        locationCoordinates: undefined,
        packageType: currentRow[headerIndexMap['packageType']] as PackageType,
        sessionType: currentRow[headerIndexMap['sessionType']] as SessionType,
        services: {
          photography: [],
          videography: [],
          additional: [],
        },
        customerTotal: customerTotal,
        status: status as QuotationStatus,
        createdAt: currentRow[headerIndexMap['createdAt']],
        confirmedAt: currentRow[confirmedAtIndex],
      };

      // Get customer name
      const customers = await sheetsClient.readSheet(GOOGLE_SHEETS_SHEET_NAMES.CUSTOMERS);
      const customerRow = customers.find((row: any[]) => row[0] === customerId);
      const customerName = customerRow?.[1] || 'Customer';

      // Create calendar event
      await createCalendarEvent(quotationForCalendar, customerName);
    }

    // Handle declined quotations - delete associated order and payments
    if (status === 'Declined') {
      try {
        const ordersSheet = await sheetsClient.readSheet(GOOGLE_SHEETS_SHEET_NAMES.ORDERS);
        if (ordersSheet.length > 0) {
          const oHeaders: string[] = ordersSheet[0];
          const qIdx = oHeaders.indexOf('quotationId');
          if (qIdx >= 0) {
            const orderIndex = ordersSheet.findIndex(row => row[qIdx] === params.id);
            if (orderIndex !== -1) {
              const orderRow = ordersSheet[orderIndex];
              const orderId = orderRow[0];
              
              // Delete the order
              await sheetsClient.deleteRow(GOOGLE_SHEETS_SHEET_NAMES.ORDERS, orderIndex + 1);
              
              // Delete payments for this order
              const paymentsSheet = await sheetsClient.readSheet(GOOGLE_SHEETS_SHEET_NAMES.PAYMENTS);
              if (paymentsSheet.length > 0) {
                const pHeaders: string[] = paymentsSheet[0];
                const orderIdIdx = pHeaders.indexOf('orderId');
                if (orderIdIdx >= 0) {
                  // Collect payment row indices to delete
                  const paymentIndices: number[] = [];
                  for (let i = 1; i < paymentsSheet.length; i++) {
                    if (paymentsSheet[i][orderIdIdx] === orderId) {
                      paymentIndices.push(i + 1);
                    }
                  }
                  // Delete from highest index to lowest
                  paymentIndices.sort((a, b) => b - a);
                  for (const idx of paymentIndices) {
                    await sheetsClient.deleteRow(GOOGLE_SHEETS_SHEET_NAMES.PAYMENTS, idx);
                  }
                }
              }
            }
          }
        }
      } catch (e) {
        console.error('Error deleting order and payments on quotation decline:', e);
      }
    }

    // Save updated quotation
    await sheetsClient.updateRow(GOOGLE_SHEETS_SHEET_NAMES.QUOTATIONS, rowIndex + 1, currentRow);

    return NextResponse.json({ success: true, status });
  } catch (error: any) {
    console.error('Error updating quotation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update quotation' },
      { status: 500 }
    );
  }
}