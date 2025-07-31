import { Request, Response } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import { createProjectSchema, inviteUserSchema } from "../utils/validation";
import { HTTP_STATUS, PROJECT_ROLES, PROJECT_TYPES } from "../utils/constants";
import { generateInvitationToken, verifyInvitationToken } from "../utils/jwt";
import { sendInvitationEmail } from "../services/emailService";
import prisma from "../config/database";

export const createProject = asyncHandler(async (req: any, res: Response) => {
  const { error, value } = createProjectSchema.validate(req.body);

  if (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.details[0].message,
    });
  }

  const { name, description, type } = value;
  const userId = req.user.id;

  // Create project
  const project = await prisma.project.create({
    data: {
      name,
      description,
      type,
      creatorId: userId,
    },
  });

  // Add creator as admin member
  await prisma.projectMember.create({
    data: {
      userId,
      projectId: project.id,
      role:
        type === PROJECT_TYPES.ORGANIZATION
          ? PROJECT_ROLES.ADMIN
          : PROJECT_ROLES.MEMBER,
    },
  });

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: "Project created successfully",
    data: { project },
  });
});

export const getUserProjects = asyncHandler(async (req: any, res: Response) => {
  const userId = req.user.id;

  const projectMembers = await prisma.projectMember.findMany({
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
      joinedAt: "desc",
    },
  });

  const projects = projectMembers.map((member) => ({
    ...member.project,
    role: member.role,
    joinedAt: member.joinedAt,
    memberCount: member.project._count.members,
    uploadCount: member.project._count.uploads,
  }));

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { projects },
  });
});

export const getProject = asyncHandler(async (req: any, res: Response) => {
  const { projectId } = req.params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      creator: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
      _count: {
        select: {
          uploads: true,
        },
      },
    },
  });

  if (!project) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: "Project not found",
    });
  }

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { project },
  });
});

export const inviteUser = asyncHandler(async (req: any, res: Response) => {
  const { error, value } = inviteUserSchema.validate(req.body);

  if (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.details[0].message,
    });
  }

  const { email, role } = value;
  const { projectId } = req.params;
  const inviterId = req.user.id;

  // Get project and inviter details
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  const inviter = await prisma.user.findUnique({
    where: { id: inviterId },
  });

  const inviteeUser = await prisma.user.findUnique({
    where: { email },
  });

  if (!project || !inviter) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: "Project or user not found",
    });
  }

  // Check if user is already a member (only if user exists)
  if (inviteeUser) {
    const existingMember = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: inviteeUser.id,
          projectId,
        },
      },
    });

    if (existingMember) {
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        message: "User is already a member of this project",
      });
    }
  }

  // Check for existing pending invitation
  const existingInvitation = await prisma.invitation.findFirst({
    where: {
      email,
      projectId,
      status: "PENDING",
      expiresAt: { gt: new Date() },
    },
  });

  if (existingInvitation) {
    return res.status(HTTP_STATUS.CONFLICT).json({
      success: false,
      message: "A pending invitation already exists for this email",
    });
  }

  // Generate invitation token
  const invitationToken = generateInvitationToken(email, projectId);

  // Create invitation record
  await prisma.invitation.create({
    data: {
      email,
      projectId,
      token: invitationToken,
      role,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  // Send invitation email
  await sendInvitationEmail(
    email,
    inviter.email,
    project.name,
    `${inviter.firstName} ${inviter.lastName}`,
    invitationToken
  );

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: "Invitation sent successfully",
    data: {
      email,
      projectId,
      token: invitationToken,
    },
  });
});

// NEW: Get invitation details (for preview before accepting)
export const getInvitationDetails = asyncHandler(
  async (req: Request, res: Response) => {
    const { token } = req.params;

    if (!token) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Invitation token is required",
      });
    }

    try {
      // Verify token
      const decoded = verifyInvitationToken(token);
      if (!decoded || !decoded.email || !decoded.projectId) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "Invalid invitation token",
        });
      }

      // Find invitation first
      const invitation = await prisma.invitation.findUnique({
        where: { token },
      });

      if (!invitation || invitation.expiresAt < new Date()) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "Invalid or expired invitation",
        });
      }

      if (invitation.status !== "PENDING") {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "Invitation has already been processed",
        });
      }

      // Get project and creator separately
      const project = await prisma.project.findUnique({
        where: { id: invitation.projectId },
      });

      const creator = await prisma.user.findUnique({
        where: { id: project?.creatorId },
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      });

      if (!project || !creator) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: "Project or creator not found",
        });
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          invitation: {
            email: invitation.email,
            role: invitation.role,
            expiresAt: invitation.expiresAt,
            project: {
              id: project.id,
              name: project.name,
              description: project.description,
              type: project.type,
              creator: {
                firstName: creator.firstName,
                lastName: creator.lastName,
                email: creator.email,
              },
            },
          },
        },
      });
    } catch (error) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Invalid invitation token",
      });
    }
  }
);

export const acceptInvitation = asyncHandler(
  async (req: any, res: Response) => {
    const { token } = req.body;

    if (!token) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Invitation token is required",
      });
    }

    try {
      // Verify token
      const decoded = verifyInvitationToken(token);

      // Find invitation first
      const invitation = await prisma.invitation.findUnique({
        where: { token },
      });

      if (!invitation || invitation.expiresAt < new Date()) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "Invalid or expired invitation",
        });
      }

      if (invitation.status !== "PENDING") {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: "Invitation has already been processed",
        });
      }

      // Get project separately
      const project = await prisma.project.findUnique({
        where: { id: invitation.projectId },
        select: {
          id: true,
          name: true,
          description: true,
          type: true,
        },
      });

      if (!project) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: "Project not found",
        });
      }

      // Get authenticated user
      const userId = req.user?.id;
      if (!userId) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: "Authentication required to accept invitation",
        });
      }

      // Find user
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: "User not found",
        });
      }

      // Check if invitation email matches user email
      if (user.email !== invitation.email) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: "This invitation is not for your email address",
        });
      }

      // Check if user is already a member
      const existingMember = await prisma.projectMember.findUnique({
        where: {
          userId_projectId: {
            userId: user.id,
            projectId: invitation.projectId,
          },
        },
      });

      if (existingMember) {
        // Update invitation status even if already a member
        await prisma.invitation.update({
          where: { id: invitation.id },
          data: { status: "ACCEPTED" },
        });

        return res.status(HTTP_STATUS.CONFLICT).json({
          success: false,
          message: "You are already a member of this project",
        });
      }

      // Add user to project
      await prisma.projectMember.create({
        data: {
          userId: user.id,
          projectId: invitation.projectId,
          role: invitation.role,
        },
      });

      // Update invitation status
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: "ACCEPTED" },
      });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Invitation accepted successfully",
        data: {
          project: project,
          role: invitation.role,
        },
      });
    } catch (error) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "Invalid invitation token",
      });
    }
  }
);

export const updateProject = asyncHandler(async (req: any, res: Response) => {
  const { projectId } = req.params;
  const { name, description } = req.body;

  // Validate input
  if (!name || !description) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: "Name and description are required",
    });
  }

  // Get project and user's membership
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: "Project not found",
    });
  }

  const projectMember = await prisma.projectMember.findUnique({
    where: {
      userId_projectId: {
        userId: req.user.id,
        projectId,
      },
    },
  });

  if (!projectMember) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: "You are not a member of this project",
    });
  }

  // Check if user is creator (members cannot update)
  const isCreator = project.creatorId === req.user.id;

  if (!isCreator) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message:
        "You do not have permission to update this project. Only creators can update projects.",
    });
  }

  // Update project
  const updatedProject = await prisma.project.update({
    where: { id: projectId },
    data: {
      name,
      description,
    },
  });

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: "Project updated successfully",
    data: { project: updatedProject },
  });
});

export const deleteProject = asyncHandler(async (req: any, res: Response) => {
  const { projectId } = req.params;

  // Get project
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: "Project not found",
    });
  }

  // Check if user is creator (only creators can delete)
  if (project.creatorId !== req.user.id) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message:
        "You do not have permission to delete this project. Only the project creator can delete projects.",
    });
  }

  // Delete project (cascade will handle related records)
  await prisma.project.delete({
    where: { id: projectId },
  });

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: "Project deleted successfully",
  });
});

export const updateMemberRole = asyncHandler(
  async (req: any, res: Response) => {
    const { projectId } = req.params;
    const { userId, role } = req.body;

    // Validate input
    if (!userId || !role) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: "User ID and role are required",
      });
    }

    // Get project and user's membership
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: "Project not found",
      });
    }

    const projectMember = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: req.user.id,
          projectId,
        },
      },
    });

    // only project creator can update member roles
    if (!projectMember && project.creatorId !== req.user.id) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: "You do not have permission to update member roles",
      });
    }

    // Update member role
    await prisma.projectMember.update({
      where: {
        userId_projectId: {
          userId,
          projectId,
        },
      },
      data: { role },
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Member role updated successfully",
    });
  }
);

export const removeMember = asyncHandler(async (req: any, res: Response) => {
  const { projectId } = req.params;
  const { userId } = req.body;

  // Validate input
  if (!userId) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: "User ID is required",
    });
  }

  // Get project and user's membership
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: "Project not found",
    });
  }

  const projectMember = await prisma.projectMember.findUnique({
    where: {
      userId_projectId: {
        userId: req.user.id,
        projectId,
      },
    },
  });

  // only project creator can remove members
  if (!projectMember && project.creatorId !== req.user.id) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      success: false,
      message: "You do not have permission to remove members",
    });
  }

  // Remove member
  await prisma.projectMember.delete({
    where: {
      userId_projectId: {
        userId,
        projectId,
      },
    },
  });

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: "Member removed successfully",
  });
});