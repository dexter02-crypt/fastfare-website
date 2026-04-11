import { z } from 'zod';

export const orderValueSchema = z.object({
  orderValue: z.number().min(150, "Minimum order value is ₹150. Orders below this amount cannot be accepted.")
});

export const createOrderSchema = z.object({
  customer: z.object({
    name: z.string().min(1, "Customer name is required"),
    phone: z.string().min(10, "Valid phone number is required"),
    email: z.string().email("Valid email is required").optional()
  }),
  address: z.object({
    line1: z.string().min(1, "Address is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    pincode: z.string().min(6, "Valid pincode is required")
  }),
  items: z.array(z.object({
    name: z.string(),
    qty: z.number(),
    unitPrice: z.number(),
    total: z.number()
  })),
  orderValue: z.number().min(150, "Minimum order value is ₹150. Orders below this amount cannot be accepted."),
  paymentStatus: z.enum(['Paid', 'Unpaid', 'COD Pending', 'Refunded']).optional(),
  orderStatus: z.enum(['New', 'Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled']).optional()
});

export type OrderInput = z.infer<typeof createOrderSchema>;
export type OrderValueInput = z.infer<typeof orderValueSchema>;