import Joi from 'joi';

export const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  firstName: Joi.string().min(2).required(),
  lastName: Joi.string().min(2).required(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const updateProfileSchema = Joi.object({
  firstName: Joi.string().min(2).optional(),
  lastName: Joi.string().min(2).optional(),
});

export const createProjectSchema = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  description: Joi.string().max(500).allow('').optional(),
  type: Joi.string().valid('SINGLE', 'ORGANIZATION').required(),
});

export const inviteUserSchema = Joi.object({
  email: Joi.string().email().required(),
  role: Joi.string().valid('ADMIN', 'MEMBER').default('MEMBER'),
});

export const chartConfigSchema = Joi.object({
  xAxis: Joi.string().required(),
  yAxis: Joi.string().required(),
  chartType: Joi.string().valid('BAR', 'LINE', 'PIE', 'SCATTER', 'COLUMN_3D', 'BAR_3D', 'LINE_3D').required(),
  title: Joi.string().optional(),
  styling: Joi.object().optional(),
});