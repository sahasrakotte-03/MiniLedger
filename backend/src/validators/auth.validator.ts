import { z } from 'zod';
import { normalizeIndianPhoneNumber } from '../utils/format';

export const sendOtpSchema = z.object({
  phoneNumber: z
    .string({ required_error: 'Phone number is required' })
    .trim()
    .refine((val) => normalizeIndianPhoneNumber(val).isValid, {
      message: 'Please provide a valid 10-digit Indian phone number (e.g. 9876543210 or +919876543210)',
    }),
});

export const verifyOtpSchema = z.object({
  phoneNumber: z
    .string({ required_error: 'Phone number is required' })
    .trim()
    .refine((val) => normalizeIndianPhoneNumber(val).isValid, {
      message: 'Please provide a valid 10-digit Indian phone number',
    }),
  otp: z
    .string({ required_error: 'OTP is required' })
    .trim()
    .regex(/^\d{6}$/, { message: 'OTP must be exactly 6 numeric digits' }),
});

export type SendOtpInput = z.infer<typeof sendOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
