import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
    }

    supabaseClient = createClient(supabaseUrl, supabaseKey);
  }
  return supabaseClient;
}

// Export a getter function instead of the client directly
export function getSupabase(): SupabaseClient {
  return getSupabaseClient();
}

// For backward compatibility, export the client (will be initialized when first accessed)
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(target, prop) {
    const client = getSupabaseClient();
    return client[prop as keyof SupabaseClient];
  }
});

// Database types
export interface Customer {
  id: string;
  customerId: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Quotation {
  id: string;
  quotationId: string;
  customerId: string;
  eventType: string;
  eventDateStart: string;
  eventDateEnd?: string;
  location: string;
  photographyServices: any;
  videographyServices: any;
  additionalServices: any;
  manualTotal?: number;
  customerTotal?: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  orderId: string;
  customerId: string;
  quotationId: string;
  estimatedBudget?: number;
  finalBudget?: number;
  workflowStatus?: any;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  orderId: string;
  description: string;
  amount: number;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  paymentType: string;
  date: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Package {
  id: string;
  packageType: string;
  eventType: string;
  photographyRate: number;
  videographyRate: number;
  createdAt: string;
  updatedAt: string;
}