import { z } from 'zod';
import { passwordValidation } from './auth.validation.ts';

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(1, 'Name cannot be empty').optional(),
    avatarUrl: z.string().url('Invalid avatar URL').trim().optional(),
    userBodyImageUrl: z
      .string()
      .url('Invalid user body image URL')
      .trim()
      .optional(),
    age: z.number().min(0).optional(),
    gender: z.string().optional(),
    location: z.string().optional(),
    interests: z.array(z.string()).optional(),
    ethnicity: z.string().optional(),
  })
  .refine(data => Object.keys(data).length > 0, {
    message: 'At least one field (name or avatarUrl) must be provided',
  });

export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordValidation,
    confirmPassword: z.string(),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine(data => data.currentPassword !== data.newPassword, {
    message: 'New password cannot be the same as the old password',
    path: ['newPassword'],
  });
