import { Response, NextFunction } from 'express';
import { HTTP_STATUS, PROJECT_ROLES } from '../utils/constants';
import { ProjectAuthRequest } from '../types';
import prisma from '../config/database';

export const checkProjectAccess = async (
  req: ProjectAuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { projectId } = req.params;
    const userId = req.user?.id;

    if (!projectId || !userId) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Project ID and user authentication required',
      });
    }

    const projectMember = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId,
          projectId,
        },
      },
      include: {
        project: true,
      },
    });

    if (!projectMember) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Access denied to this project',
      });
    }

    req.project = {
      id: projectId,
      role: projectMember.role,
    };

    next();
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Error checking project access',
    });
  }
};

export const requireProjectAdmin = (req: ProjectAuthRequest, res: Response, next: NextFunction) => {
  if (req.project?.role !== PROJECT_ROLES.ADMIN) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: 'Admin access required for this action',
    });
  }
  next();
};