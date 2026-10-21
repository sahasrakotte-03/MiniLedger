import jwt from 'jsonwebtoken';
import { prisma } from '../db/prisma';
import { config } from '../config/env';
import { normalizeIndianPhoneNumber } from '../utils/format';
import { AppError } from '../middleware/error.middleware';

export class AuthService {
  /**
   * Generates a random 6-digit OTP, records it in the database,
   * and prints it prominently in the server terminal (Mock SMS).
   */
  static async sendOtp(rawPhoneNumber: string) {
    const { isValid, normalized, error } = normalizeIndianPhoneNumber(rawPhoneNumber);
    if (!isValid || !normalized) {
      throw new AppError(error || 'Invalid Indian phone number', 400);
    }

    // Generate random 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + config.otpExpirationMinutes * 60 * 1000);

    // Invalidate any previously unused OTPs for this phone number
    await prisma.otpChallenge.updateMany({
      where: {
        phoneNumber: normalized,
        isUsed: false,
      },
      data: {
        isUsed: true,
      },
    });

    // Create fresh OTP challenge record
    await prisma.otpChallenge.create({
      data: {
        phoneNumber: normalized,
        otp,
        expiresAt,
        attempts: 0,
        maxAttempts: config.otpMaxAttempts,
        isUsed: false,
      },
    });

    // Prominently print to backend terminal as specified in the assignment
    console.log('\n' + '='.repeat(60));
    console.log(`[MiniLedger AUTH] 📱 MOCK OTP FOR ${normalized}`);
    console.log(`[MiniLedger AUTH] 👉 OTP: ${otp} 👈`);
    console.log(`[MiniLedger AUTH] ⏳ Valid for ${config.otpExpirationMinutes} minutes (Max ${config.otpMaxAttempts} attempts)`);
    console.log(`[MiniLedger AUTH] Note: SMS delivery is mocked for local development.`);
    console.log('='.repeat(60) + '\n');

    return {
      message: 'OTP sent successfully (printed to server terminal)',
      phoneNumber: normalized,
      expiresInSeconds: config.otpExpirationMinutes * 60,
      mockNotice: 'Check the backend terminal console for the 6-digit verification code.',
    };
  }

  /**
   * Verifies the OTP, checks expiration, enforces attempt limits,
   * invalidates the OTP after use (one-time use), and issues a JWT token.
   */
  static async verifyOtp(rawPhoneNumber: string, otpInput: string) {
    const { isValid, normalized, error } = normalizeIndianPhoneNumber(rawPhoneNumber);
    if (!isValid || !normalized) {
      throw new AppError(error || 'Invalid Indian phone number', 400);
    }

    // Find the latest active OTP challenge
    const challenge = await prisma.otpChallenge.findFirst({
      where: {
        phoneNumber: normalized,
        isUsed: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!challenge) {
      throw new AppError(
        'No active OTP request found for this phone number. Please request an OTP first.',
        400
      );
    }

    // Check expiration
    if (new Date() > challenge.expiresAt) {
      await prisma.otpChallenge.update({
        where: { id: challenge.id },
        data: { isUsed: true },
      });
      throw new AppError('OTP has expired. Please request a new OTP.', 400);
    }

    // Check attempt limits
    if (challenge.attempts >= challenge.maxAttempts) {
      await prisma.otpChallenge.update({
        where: { id: challenge.id },
        data: { isUsed: true },
      });
      throw new AppError(
        'Maximum verification attempts exceeded for this OTP. Please request a new OTP.',
        400
      );
    }

    // Increment attempts
    const newAttemptCount = challenge.attempts + 1;
    await prisma.otpChallenge.update({
      where: { id: challenge.id },
      data: { attempts: newAttemptCount },
    });

    // Verify OTP match
    if (challenge.otp !== otpInput.trim()) {
      const remainingAttempts = challenge.maxAttempts - newAttemptCount;
      if (remainingAttempts <= 0) {
        await prisma.otpChallenge.update({
          where: { id: challenge.id },
          data: { isUsed: true },
        });
        throw new AppError(
          'Incorrect OTP. Maximum attempts reached. Please request a new OTP.',
          400
        );
      }
      throw new AppError(
        `Incorrect OTP. You have ${remainingAttempts} attempt(s) remaining.`,
        400
      );
    }

    // Mark OTP as used (one-time use enforced)
    await prisma.otpChallenge.update({
      where: { id: challenge.id },
      data: { isUsed: true },
    });

    // Find or create user
    const user = await prisma.user.upsert({
      where: { phoneNumber: normalized },
      update: {},
      create: { phoneNumber: normalized },
    });

    // Generate JWT token
    const token = jwt.sign(
      {
        sub: user.id,
        phoneNumber: user.phoneNumber,
        name: user.name,
      },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn as any }
    );

    return {
      token,
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        name: user.name,
        createdAt: user.createdAt,
      },
    };
  }
}
