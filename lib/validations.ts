import { z } from 'zod';

export const customerFormSchema = z.object({
  name: z.string().min(1, 'Customer name is required'),
  mobile: z.string().min(10, 'Valid mobile number is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  eventType: z.string().min(1, 'Event type is required'),
  eventDateStart: z.string().min(1, 'Event start date is required'),
  eventDateEnd: z.string().min(1, 'Event end date is required'),
  location: z.string().min(1, 'Event location is required'),
  packageType: z.string().min(1, 'Package type is required'),
  sessionType: z.string().min(1, 'Session type is required'),
});

export const quotationSchema = z.object({
  quotationId: z.string(),
  customerId: z.string(),
  eventType: z.string(),
  eventDateStart: z.string(),
  eventDateEnd: z.string(),
  location: z.string(),
  packageType: z.string(),
  sessionType: z.string(),
  services: z.object({
    photography: z.array(z.any()).optional(),
    videography: z.array(z.any()).optional(),
    additional: z.array(z.any()).optional(),
  }),
  customerTotal: z.number().min(0),
  status: z.enum(['Pending', 'Confirmed', 'Declined']),
});

export const expenseSchema = z.object({
  orderId: z.string(),
  costHead: z.string().min(1, 'Cost head is required'),
  amount: z.number().min(0, 'Amount must be positive'),
  vendorName: z.string().optional(),
  description: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
});

export const paymentSchema = z.object({
  orderId: z.string(),
  paymentType: z.enum(['Initial Advance', 'Function Advance', 'Printing Advance', 'Final Payment']),
  amount: z.number().min(0, 'Amount must be positive'),
  date: z.string().min(1, 'Date is required'),
  notes: z.string().optional(),
});
