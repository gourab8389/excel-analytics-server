import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { registerSchema, loginSchema, updateProfileSchema } from '../utils/validation';
import { hashPassword, comparePassword } from '../utils/helpers';
import { generateToken } from '../utils/jwt';
import { HTTP_STATUS } from '../utils/constants';
import prisma from '../config/database';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { error, value } = registerSchema.validate(req.body);
  
  if (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.details[0].message,
    });
  }

  const { email, password, firstName, lastName } = value;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return res.status(HTTP_STATUS.CONFLICT).json({
      success: false,
      message: 'User already exists with this email',
    });
  }

  // Hash password and create user
  const hashedPassword = await hashPassword(password);
  
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName,
      lastName,
    },
  });

  // Generate JWT token
  const token = generateToken({ id: user.id, email: user.email });

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      token,
    },
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { error, value } = loginSchema.validate(req.body);
  
  if (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.details[0].message,
    });
  }

  const { email, password } = value;

  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: 'Invalid email or password',
    });
  }

  // Check password
  const isPasswordValid = await comparePassword(password, user.password);
  
  if (!isPasswordValid) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: 'Invalid email or password',
    });
  }

  // Generate JWT token
  const token = generateToken({ id: user.id, email: user.email });

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      token,
    },
  });
});

export const getProfile = asyncHandler(async (req: any, res: Response) => {
  const userId = req.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      createdAt: true,
    },
  });

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'User profile fetched successfully',
    data: { user },
  });
});

export const updateProfile = asyncHandler(async (req: any, res: Response) => {
  const userId = req.user.id;
  const { error, value } = updateProfileSchema.validate(req.body);

  if (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.details[0].message,
    });
  }

  const { firstName, lastName } = value;

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!existingUser) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'User not found',
    });
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      firstName,
      lastName,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      createdAt: true,
    },
  });

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'User profile updated successfully',
    data: { user: updatedUser },
  });
});

export const deleteAccount = asyncHandler(async (req: any, res: Response) => {
  const userId = req.user.id;

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!existingUser) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'User not found',
    });
  }

  // Delete user and all related data (cascading delete)
  await prisma.user.delete({
    where: { id: userId },
  });

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'User account deleted successfully',
  });
});