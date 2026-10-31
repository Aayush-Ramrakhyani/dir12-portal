/*
 * auth.validators.ts
 * Express-validator rule chains for the /auth/register and /auth/login endpoints —
 * enforces Indian mobile number format, password complexity (upper + lower + digit),
 * and password confirmation equality before the controller runs.
 */
import { body } from 'express-validator';

export const registerValidators = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2, max: 100 }),
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('mobile')
    .trim()
    .matches(/^[6-9]\d{9}$/) // Indian mobile numbers start with 6-9 followed by 9 digits
    .withMessage('Valid 10-digit Indian mobile number required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and a number'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) throw new Error('Passwords do not match');
    return true;
  }),
];

export const loginValidators = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];
