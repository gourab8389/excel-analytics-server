import { ChartConfig } from "../types/upload";
import { CHART_TYPES } from "../utils/constants";

export class ChartService {
  static generateChartConfig(
    data: any[],
    config: ChartConfig,
    chartType: string
  ) {
    const baseConfig = {
      type: chartType.toLowerCase(),
      data: {
        labels: data.map((item) => item.label),
        datasets: [
          {
            label: config.yAxis,
            data: data.map((item) => item.y),
            backgroundColor: this.getChartColors(data.length),
            borderColor: this.getBorderColors(data.length),
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: !!config.title,
            text: config.title || "",
          },
          legend: {
            display: true,
          },
        },
        scales: this.getScalesConfig(chartType),
      },
    };

    // Add 3D specific configurations
    if (chartType.includes("3D")) {
      baseConfig.options.plugins = {
        ...baseConfig.options.plugins,
        threejs: {
          enabled: true,
          depth: 20,
        },
      } as any;
    }

    return baseConfig;
  }

  private static getChartColors(count: number): string[] {
    const colors = [
      "rgba(255, 99, 132, 0.5)",
      "rgba(54, 162, 235, 0.5)",
      "rgba(255, 205, 86, 0.5)",
      "rgba(75, 192, 192, 0.5)",
      "rgba(153, 102, 255, 0.5)",
      "rgba(255, 159, 64, 0.5)",
    ];

    const result = [];
    for (let i = 0; i < count; i++) {
      result.push(colors[i % colors.length]);
    }
    return result;
  }

  private static getBorderColors(count: number): string[] {
    const colors = [
      "rgba(255, 99, 132, 1)",
      "rgba(54, 162, 235, 1)",
      "rgba(255, 205, 86, 1)",
      "rgba(75, 192, 192, 1)",
      "rgba(153, 102, 255, 1)",
      "rgba(255, 159, 64, 1)",
    ];

    const result = [];
    for (let i = 0; i < count; i++) {
      result.push(colors[i % colors.length]);
    }
    return result;
  }

  private static getScalesConfig(chartType: string) {
    if (chartType === CHART_TYPES.PIE) {
      return {};
    }

    return {
      y: {
        beginAtZero: true,
      },
    };
  }
}
