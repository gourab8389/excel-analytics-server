import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { HTTP_STATUS } from '../utils/constants';
import prisma from '../config/database';

export const getDashboard = asyncHandler(async (req: any, res: Response) => {
  const userId = req.user.id;

  // Get user's projects count
  const projectsCount = await prisma.projectMember.count({
    where: { userId },
  });

  // Get user's uploads count
  const uploadsCount = await prisma.upload.count({
    where: { userId },
  });

  // Get user's charts count
  const chartsCount = await prisma.chart.count({
    where: {
      upload: {
        userId,
      },
    },
  });

  // Get recent uploads
  const recentUploads = await prisma.upload.findMany({
    where: { userId },
    include: {
      project: {
        select: {
          name: true,
        },
      },
      _count: {
        select: {
          charts: true,
        },
      },
    },
    orderBy: {
      uploadedAt: 'desc',
    },
    take: 5,
  });

  // Get recent projects
  const recentProjects = await prisma.projectMember.findMany({
    where: { userId },
    include: {
      project: {
        include: {
          _count: {
            select: {
              members: true,
              uploads: true,
            },
          },
        },
      },
    },
    orderBy: {
      joinedAt: 'desc',
    },
    take: 5,
  });

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: {
      stats: {
        projectsCount,
        uploadsCount,
        chartsCount,
      },
      recentUploads,
      recentProjects: recentProjects.map(member => ({
        ...member.project,
        role: member.role,
      })),
    },
  });
});