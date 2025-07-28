import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { chartConfigSchema } from '../utils/validation';
import { HTTP_STATUS } from '../utils/constants';
import { ExcelService } from '../services/excelService';
import { ChartService } from '../services/chartService';
import prisma from '../config/database';

export const createChart = asyncHandler(async (req: Request, res: Response) => {
  const { error, value } = chartConfigSchema.validate(req.body);
  
  if (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.details[0].message,
    });
  }

  const { uploadId } = req.params;
  const { xAxis, yAxis, chartType, title, styling } = value;

  // Get upload data
  const upload = await prisma.upload.findUnique({
    where: { id: uploadId },
    include: {
      data: true,
    },
  });

  if (!upload || !upload.data) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Upload data not found',
    });
  }

  const excelData = upload.data[0];

  // Validate chart data
  if (!ExcelService.validateChartData(excelData.rows as any[], xAxis, yAxis)) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Invalid data for the selected axes',
    });
  }

  // Prepare chart data
  const chartData = ExcelService.prepareChartData(
    excelData.rows as any[],
    xAxis,
    yAxis,
    chartType
  );

  // Generate chart configuration
  const chartConfig = ChartService.generateChartConfig(
    chartData,
    { xAxis, yAxis, chartType, title, styling },
    chartType
  );

  // Save chart
  const chart = await prisma.chart.create({
    data: {
      uploadId,
      name: title || `${chartType} Chart`,
      type: chartType as any,
      config: {
        xAxis,
        yAxis,
        chartType,
        title,
        styling,
      },
      data: {
        chartData,
        chartConfig,
      },
    },
  });

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'Chart created successfully',
    data: { chart },
  });
});

export const getCharts = asyncHandler(async (req: Request, res: Response) => {
  const { uploadId } = req.params;

  const charts = await prisma.chart.findMany({
    where: { uploadId },
    orderBy: {
      createdAt: 'desc',
    },
  });

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { charts },
  });
});

export const getChart = asyncHandler(async (req: Request, res: Response) => {
  const { chartId } = req.params;

  const chart = await prisma.chart.findUnique({
    where: { id: chartId },
    include: {
      upload: {
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

  if (!chart) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Chart not found',
    });
  }

  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: { chart },
  });
});

export const updateChart = asyncHandler(async (req: Request, res: Response) => {
  const { error, value } = chartConfigSchema.validate(req.body);
  
  if (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: error.details[0].message,
    });
  }

  const { chartId } = req.params;
  const { xAxis, yAxis, chartType, title, styling } = value;

  const chart = await prisma.chart.findUnique({
    where: { id: chartId },
    include: {
      upload: {
        include: {
          data: true,
        },
      },
    },
  });

  if (!chart) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Chart not found',
    });
  }

  const excelData = chart.upload.data[0];

  // Validate chart data
  if (!ExcelService.validateChartData(excelData.rows as any[], xAxis, yAxis)) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Invalid data for the selected axes',
    });
  }

  // Prepare chart data
  const chartData = ExcelService.prepareChartData(
    excelData.rows as any[],
    xAxis,
    yAxis,
    chartType
  );

  // Generate chart configuration
  const chartConfig = ChartService.generateChartConfig(
    chartData,
    { xAxis, yAxis, chartType, title, styling },
    chartType
  );

  // Update chart
  const updatedChart = await prisma.chart.update({
    where: { id: chartId },
    data: {
      name: title || `${chartType} Chart`,
      type: chartType as any,
      config: {
        xAxis,
        yAxis,
        chartType,
        title,
        styling,
      },
      data: {
        chartData,
        chartConfig,
      },
    },
  });

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Chart updated successfully',
    data: { chart: updatedChart },
  });
});

export const deleteChart = asyncHandler(async (req: Request, res: Response) => {
  const { chartId } = req.params;

  const chart = await prisma.chart.findUnique({
    where: { id: chartId },
  });

  if (!chart) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      message: 'Chart not found',
    });
  }

  await prisma.chart.delete({
    where: { id: chartId },
  });

  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Chart deleted successfully',
  });
});