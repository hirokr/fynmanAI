import { AuthRequest } from '#src/types/authRequest.js';
import { Request, Response } from 'express';
import {
  findUserByEmail,
  findUserById,
  findUserByVerificationToken,
  updateUserPassword,
  updateUserProfile,
  verifyUserEmail,
} from '#src/services/user.service.ts';
import { hashing, verifyHash } from '#src/utils/auth/hash.ts';
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
} from '#src/utils/mail/sendMail.ts';
import {
  createRandomToken,
  generateAccessToken,
} from '#src/utils/jwt/tokens.ts';
import { clearTokens } from '#src/utils/jwt/tokens.ts';
import {
  deleteAllRefreshTokens,
  deleteCurrentRefreshToken,
} from '#src/services/token.service.ts';
import {
  ChangePasswordSchema,
  updateProfileSchema,
} from '#src/validations/user.validation.ts';
import { deleteUserCache } from '#src/utils/redis.ts';
import { sendApiError, sendApiSuccess } from '#src/utils/api-response.ts';

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return sendApiError(res, {
        status: 401,
        message: 'User not authenticated',
      });
    }

    const user = await findUserById(req.userId);
    if (!user) {
      return sendApiError(res, { status: 404, message: 'User not found' });
    }

    const { passwordHash, oauthProvider, oauthId, deletedAt, ...userProfile } =
      user;
    return sendApiSuccess(res, { data: { user: userProfile } });
  } catch (error) {
    //  console.error('Error fetching user profile:', error);
    return sendApiError(res, {
      status: 500,
      message: 'Failed to fetch user profile',
    });
  }
};

export const updateUserProfileData = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.userId) {
      return sendApiError(res, {
        status: 401,
        message: 'User not authenticated',
      });
    }
    const validData = updateProfileSchema.safeParse(req.body);
    if (!validData.success) {
      return sendApiError(res, {
        status: 400,
        message: validData.error.issues[0]?.message || 'Validation error',
        errors: validData.error.flatten().fieldErrors,
      });
    }

    const updatedUser = await updateUserProfile({
      userId: req.userId,
      ...validData.data,
    });

    return sendApiSuccess(res, {
      message: 'Profile updated successfully',
      data: { user: updatedUser },
    });
  } catch (error) {
    // console.error('Error updating user profile:', error);
    return sendApiError(res, {
      status: 500,
      message: 'Failed to update user profile',
    });
  }
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return sendApiError(res, {
        status: 401,
        message: 'User not authenticated',
      });
    }
    // Validate input using Zod schema
    const parsedData = ChangePasswordSchema.safeParse(req.body);
    if (!parsedData.success) {
      return sendApiError(res, {
        status: 400,
        message: parsedData.error.issues[0]?.message || 'Validation error',
        errors: parsedData.error.flatten().fieldErrors,
      });
    }
    const { currentPassword, newPassword } = parsedData.data;

    // Fetch user
    const user = await findUserById(req.userId);
    if (!user) {
      return sendApiError(res, { status: 404, message: 'User not found' });
    }
    if (!user.passwordHash) {
      return sendApiError(res, {
        status: 400,
        message: 'User account does not have a password set',
      });
    }

    // Verify current password
    const isPasswordValid = await verifyHash(
      user.passwordHash,
      currentPassword
    );
    if (!isPasswordValid) {
      return sendApiError(res, {
        status: 401,
        message: 'Current password is incorrect',
      });
    }

    // Hash and update new password
    const hashedNewPassword = await hashing(newPassword);
    await updateUserPassword(req.userId, hashedNewPassword);

    return sendApiSuccess(res, { message: 'Password changed successfully' });
  } catch (error) {
    // console.error('Error changing password:', error);
    return sendApiError(res, {
      status: 500,
      message: 'Failed to change password',
    });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return sendApiError(res, { status: 400, message: 'Email is required' });
    }

    // Find user by email
    const user = await findUserByEmail(email);
    if (!user) {
      // For security, do not reveal that the email is not registered
      return sendApiSuccess(res, {
        message: 'If that email is registered, a reset link has been sent',
      });
    }

    // Generate password reset token (valid for 1 hour)
    const resetToken = createRandomToken();

    await updateUserProfile({ userId: user.id, verificationToken: resetToken });

    await sendPasswordResetEmail({
      to: user.email,
      userName: user.name,
      resetLink: `${process.env.FRONTEND_URL}/auth/reset-pass?token=${resetToken}`,
      verificationLink: '',
      expiryMinutes: 60,
    });

    return sendApiSuccess(res, {
      message: 'If that email is registered, a reset link has been sent',
    });
  } catch (error) {
    // console.error('Error in forgot password:', error);
    return sendApiError(res, {
      status: 500,
      message: 'Failed to process forgot password request',
    });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token || !newPassword || !confirmPassword) {
      return sendApiError(res, {
        status: 400,
        message: 'Token and password fields are required',
      });
    }

    if (newPassword !== confirmPassword) {
      return sendApiError(res, {
        status: 400,
        message: 'Passwords do not match',
      });
    }

    if (newPassword.length < 8) {
      return sendApiError(res, {
        status: 400,
        message: 'Password must be at least 8 characters long',
      });
    }

    const user = await findUserByVerificationToken(token);
    if (!user) {
      return sendApiError(res, {
        status: 400,
        message: 'Invalid or expired token',
      });
    }

    // Hash the new password and update it in the database
    const newPasswordHash = await hashing(newPassword);
    await updateUserPassword(user.id, newPasswordHash);

    return sendApiSuccess(res, { message: 'Password reset successfully' });
  } catch (error) {
    // console.error('Error resetting password:', error);
    return sendApiError(res, {
      status: 500,
      message: 'Failed to reset password',
    });
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token, userId } = req.body;

    if (!token) {
      return sendApiError(res, {
        status: 400,
        message: 'Verification token is required',
      });
    }

    let resolvedUserId = userId;
    // If userId not provided, try to find the user by token (token-only links)
    if (!resolvedUserId) {
      const userByToken = await findUserByVerificationToken(token);
      if (!userByToken) {
        return sendApiError(res, {
          status: 400,
          message: 'Invalid or expired token',
        });
      }
      resolvedUserId = userByToken.id;
    }

    await verifyUserEmail(resolvedUserId, token);

    return sendApiSuccess(res, { message: 'Email verified successfully' });
  } catch (error) {
    // console.error('Error verifying email:', error);
    return sendApiError(res, {
      status: 500,
      message: 'Failed to verify email',
    });
  }
};

export const resendVerificationEmail = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.userId) {
      return sendApiError(res, {
        status: 401,
        message: 'User not authenticated',
      });
    }

    // Fetch user
    const user = await findUserById(req.userId);
    if (!user) {
      return sendApiError(res, { status: 404, message: 'User not found' });
    }

    if (user.emailVerified) {
      return sendApiError(res, {
        status: 400,
        message: 'Email is already verified',
      });
    }

    // Generate verification token (valid for 24 hours)
    const newToken = createRandomToken();

    // TODO: Save token to database with expiration
    await updateUserProfile({
      userId: req.userId,
      verificationToken: newToken,
    });

    // Build verification link
    const verificationLink = `${process.env.FRONTEND_URL}/auth/verify-email?token=${newToken}`;

    await sendVerificationEmail({
      to: user.email,
      userName: user.name,
      verificationLink,
      otpCode: '',
      expiryMinutes: 1440, // 24 hours
    });

    return sendApiSuccess(res, {
      message: 'Verification email sent successfully',
    });
  } catch (error) {
    // console.error('Error resending verification email:', error);
    return sendApiError(res, {
      status: 500,
      message: 'Failed to send verification email',
    });
  }
};

export const deleteAccount = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return sendApiError(res, {
        status: 401,
        message: 'User not authenticated',
      });
    }
    const { password } = req.body;

    // Validate password for account deletion
    if (!password) {
      return sendApiError(res, {
        status: 400,
        message: 'Password is required to delete account',
      });
    }

    // Fetch user
    const user = await findUserById(req.userId);
    if (!user) {
      return sendApiError(res, { status: 404, message: 'User not found' });
    }

    // Verify password
    if (!user.passwordHash) {
      return sendApiError(res, {
        status: 400,
        message: 'Cannot delete account without password verification',
      });
    }

    const isPasswordValid = await verifyHash(user.passwordHash, password);
    if (!isPasswordValid) {
      return sendApiError(res, {
        status: 401,
        message: 'Password is incorrect',
      });
    }

    // Soft delete: mark account as deleted
    await updateUserProfile({
      userId: req.userId,
      deletedAt: new Date(),
      isActive: false,
    });

    // Clear all refresh tokens for this user
    await deleteAllRefreshTokens(req.userId);

    // Delete all the user's cache entries (sessions, profile, etc.)
    await deleteUserCache(req.userId);

    // Clear authentication cookies
    clearTokens(res);

    return sendApiSuccess(res, { message: 'Account deleted successfully' });
  } catch (error) {
    // console.error('Error deleting account:', error);
    return sendApiError(res, {
      status: 500,
      message: 'Failed to delete account',
    });
  }
};
