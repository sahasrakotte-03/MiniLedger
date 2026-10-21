import { z } from 'zod';

export const createLoanSchema = z.object({
  friendName: z
    .string({ required_error: 'Friend name is required' })
    .trim()
    .min(1, { message: 'Friend name cannot be empty' })
    .max(100, { message: 'Friend name must be 100 characters or fewer' }),
  amount: z
    .union([z.number(), z.string()])
    .transform((val) => (typeof val === 'string' ? parseFloat(val) : val))
    .refine((val) => !isNaN(val) && val > 0, {
      message: 'Loan amount must be a positive number greater than 0',
    })
    .refine((val) => val <= 100000000, {
      message: 'Loan amount cannot exceed ₹10,00,00,000',
    }),
  dueDate: z
    .string({ required_error: 'Due date is required' })
    .trim()
    .refine((val) => !isNaN(new Date(val).getTime()), {
      message: 'Please provide a valid due date (e.g. YYYY-MM-DD)',
    }),
  receiptUrl: z.string().optional().nullable(),
  notes: z.string().max(500, { message: 'Notes must be 500 characters or fewer' }).optional().nullable(),
});

export const updateLoanSchema = z.object({
  friendName: z
    .string()
    .trim()
    .min(1, { message: 'Friend name cannot be empty' })
    .max(100, { message: 'Friend name must be 100 characters or fewer' })
    .optional(),
  amount: z
    .union([z.number(), z.string()])
    .transform((val) => (typeof val === 'string' ? parseFloat(val) : val))
    .refine((val) => !isNaN(val) && val > 0, {
      message: 'Loan amount must be a positive number greater than 0',
    })
    .refine((val) => val <= 100000000, {
      message: 'Loan amount cannot exceed ₹10,00,00,000',
    })
    .optional(),
  dueDate: z
    .string()
    .trim()
    .refine((val) => !isNaN(new Date(val).getTime()), {
      message: 'Please provide a valid due date',
    })
    .optional(),
  receiptUrl: z.string().optional().nullable(),
  notes: z.string().max(500, { message: 'Notes must be 500 characters or fewer' }).optional().nullable(),
});

export const listLoansQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(['ALL', 'PENDING', 'REPAID', 'OVERDUE']).default('ALL'),
  sortBy: z.enum(['dueDate', 'amount', 'createdAt', 'friendName']).default('dueDate'),
  order: z.enum(['asc', 'desc']).default('asc'),
});

export type CreateLoanInput = z.infer<typeof createLoanSchema>;
export type UpdateLoanInput = z.infer<typeof updateLoanSchema>;
export type ListLoansQuery = z.infer<typeof listLoansQuerySchema>;
