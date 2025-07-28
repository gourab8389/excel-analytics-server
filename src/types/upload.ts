export interface ProcessedExcelData {
  headers: string[];
  rows: any[];
  metadata: {
    totalRows: number;
    totalColumns: number;
    fileName: string;
  };
}

export interface ChartConfig {
  xAxis: string;
  yAxis: string;
  chartType: string;
  title?: string;
  styling?: any;
}