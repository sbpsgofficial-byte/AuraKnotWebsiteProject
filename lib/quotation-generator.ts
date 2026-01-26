import { supabase } from './supabase';
import { QUOTATION_PREFIX } from '@/config/constants';

/* ======================================================
   SAFE QUOTATION ID GENERATOR
   Prevents duplicate IDs & cross-client data overwrite
   ====================================================== */
export async function generateQuotationId(): Promise<string> {
  const currentYear = new Date().getFullYear().toString().slice(-2);
  const prefix = `${QUOTATION_PREFIX}-${currentYear}-`;

  try {
    // Query Supabase to get all quotation IDs
    const { data: quotations, error } = await supabase
      .from('quotations')
      .select('quotation_id');

    if (error) throw error;

    let maxNumber = 0;

    if (quotations) {
      for (const quotation of quotations) {
        const quotationId = quotation.quotation_id;

        if (quotationId && quotationId.startsWith(prefix)) {
          const numericPart = quotationId
            .replace(prefix, '')
            .split('-')[0]; // remove random suffix if exists

          const number = parseInt(numericPart, 10);
          if (!isNaN(number) && number > maxNumber) {
            maxNumber = number;
          }
        }
      }
    }

    const nextNumber = (maxNumber + 1).toString().padStart(4, '0');

    // ✅ RANDOM SUFFIX TO AVOID COLLISION
    const uniqueSuffix = Math.random()
      .toString(36)
      .substring(2, 6)
      .toUpperCase();

    return `${prefix}${nextNumber}-${uniqueSuffix}`;
  } catch (error) {
    console.error('Error generating quotation ID:', error);

    // ✅ SAFE FALLBACK (never collides)
    const timestamp = Date.now().toString().slice(-6);
    return `${prefix}${timestamp}`;
  }
}

/* ======================================================
   SAFE ORDER ID GENERATOR
   ====================================================== */
export async function generateOrderId(): Promise<string> {
  const currentYear = new Date().getFullYear().toString().slice(-2);
  const prefix = `ORD-AKP-${currentYear}-`;

  try {
    // Query Supabase to get all order IDs
    const { data: orders, error } = await supabase
      .from('orders')
      .select('order_id');

    if (error) throw error;

    let maxNumber = 0;

    if (orders) {
      for (const order of orders) {
        const orderId = order.order_id;

        if (orderId && orderId.startsWith(prefix)) {
          const numericPart = orderId
            .replace(prefix, '')
            .split('-')[0];

          const number = parseInt(numericPart, 10);
          if (!isNaN(number) && number > maxNumber) {
            maxNumber = number;
          }
        }
      }
    }

    const nextNumber = (maxNumber + 1).toString().padStart(4, '0');

    const uniqueSuffix = Math.random()
      .toString(36)
      .substring(2, 6)
      .toUpperCase();

    return `${prefix}${nextNumber}-${uniqueSuffix}`;
  } catch (error) {
    console.error('Error generating order ID:', error);

    const timestamp = Date.now().toString().slice(-6);
    return `${prefix}${timestamp}`;
  }
}
