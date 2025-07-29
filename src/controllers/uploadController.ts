import { Request, Response } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import { HTTP_STATUS } from "../utils/constants";
import { ExcelService } from "../services/excelService";
import prisma from "../config/database";
import fs from "fs";

export const uploadFile = asyncHandler(async (req: any, res: Response) => {
  if (!req.file) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: "No file uploaded",
    });
  }

  const { projectId } = req.params;
  const userId = req.user.id;
  const file = req.file;
  let upload;

  try {
    // Create upload record
    upload = await prisma.upload.create({
      data: {
        fileName: file.filename,
        originalName: file.originalname,
        filePath: file.path,
        fileSize: file.size,
        userId,
        projectId,
        status: "PROCESSING",
      },
    });

    // Process Excel file
    const processedData = await ExcelService.processExcelFile(
      file.path,
      file.originalname
    );

    // Save processed data
    await prisma.excelData.create({
      data: {
        uploadId: upload.id,
        headers: processedData.headers,
        rows: processedData.rows,
        metadata: processedData.metadata,
      },
    });

    // Update upload status
    await prisma.upload.update({
      where: { id: upload.id },
      data: {
        status: "COMPLETED",
        processedAt: new Date(),
      },
    });

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: "File uploaded and processed successfully",
      data: {
        upload: {
          id: upload.id,
          fileName: upload.fileName,
          originalName: upload.originalName,
          fileSize: upload.fileSize,
          status: "COMPLETED",
          uploadedAt: upload.uploadedAt,
        },
        data: processedData,
      },
    });
  } catch (error) {
    // Update upload status to failed
    if (upload) {
      await prisma.upload.update({
        where: { id: upload.id },
        data: { status: "FAILED" },
      });
    }

    // Clean up file
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: (error && typeof error === "object" && "message" in error) ? (error as any).message : "Failed to process file",
    });
  }
});

export const getUploads = asyncHandler(async (req: any, res: Response) => {
  const { projectId } = req.params;
  const userId = req.user.id;

  const uploads = await prisma.upload.findMany({
    where: {
      projectId,
      userId,
    },
    include: {
      data: {
        select: {
          headers: true,
          metadata: true,
        },
      },
      _count: {
        select: {
          charts: true,
        },
      },
    },
    orderBy: {
      uploadedAt: "desc",
    },
  });

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: "Uploads retrieved successfully",
    data: { uploads },
  });
});

export const getUpload = asyncHandler(async (req: Request, res: Response) => {
  const { uploadId } = req.params;

  const upload = await prisma.upload.findUnique({
    where: { id: uploadId },
    include: {
      data: true,
      charts: true,
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  if (!upload) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: "Upload not found",
    });
  }

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: "Upload details retrieved successfully",
    data: { upload },
  });
});

export const deleteUpload = asyncHandler(async (req: any, res: Response) => {
  const { uploadId } = req.params;
  const userId = req.user.id;

  const upload = await prisma.upload.findFirst({
    where: {
      id: uploadId,
      userId,
    },
  });

  if (!upload) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: "Upload not found",
    });
  }

  // Delete file from filesystem
  if (fs.existsSync(upload.filePath)) {
    fs.unlinkSync(upload.filePath);
  }

  // Delete from database (cascade will handle related records)
  await prisma.upload.delete({
    where: { id: uploadId },
  });

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: "Upload deleted successfully",
  });
});
