import html2canvas from 'html2canvas';

export class ChartCaptureService {
  private defaultOptions = {
    width: 800,
    height: 400,
    quality: 0.95,
    backgroundColor: '#ffffff',
    format: 'png',
  };

  /**
   * Capture a single chart element as base64 image
   */
  async captureChart(chartElement: HTMLElement, options: Partial<any> = {}): Promise<string> {
    const captureOptions = { ...this.defaultOptions, ...options };

    try {
      // Wait for animations to complete
      await this.waitForAnimations(chartElement);

      const canvas = await html2canvas(chartElement, {
        background: captureOptions.backgroundColor,
        logging: false,
        useCORS: true,
        allowTaint: true,
        width: captureOptions.width,
        height: captureOptions.height,
      });

      return canvas.toDataURL(`image/${captureOptions.format}`, captureOptions.quality);
    } catch (error) {
      console.warn('Chart capture failed:', error);
      throw new Error(
        `Failed to capture chart: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Capture multiple charts by selector
   */
  async captureMultipleCharts(chartSelectors: string[]): Promise<Map<string, string>> {
    const chartImages = new Map<string, string>();

    for (const selector of chartSelectors) {
      try {
        const element = document.querySelector(selector) as HTMLElement;
        if (element) {
          const imageData = await this.captureChart(element);
          chartImages.set(selector, imageData);
        } else {
          console.warn(`Chart element not found for selector: ${selector}`);
        }
      } catch (error) {
        console.warn(`Failed to capture chart for selector ${selector}:`, error);
      }
    }

    return chartImages;
  }

  /**
   * Capture dashboard charts for PDF export
   */
  async captureDashboardCharts(): Promise<{
    timeline?: string;
    moduleBreakdown?: string;
    activityDistribution?: string;
  }> {
    const chartSelectors = [
      '[data-chart="timeline"]',
      '[data-chart="module-breakdown"]',
      '[data-chart="activity-distribution"]',
    ];

    const chartImages = await this.captureMultipleCharts(chartSelectors);

    return {
      timeline: chartImages.get('[data-chart="timeline"]'),
      moduleBreakdown: chartImages.get('[data-chart="module-breakdown"]'),
      activityDistribution: chartImages.get('[data-chart="activity-distribution"]'),
    };
  }

  /**
   * Wait for chart animations to complete
   */
  private async waitForAnimations(element: HTMLElement): Promise<void> {
    return new Promise((resolve) => {
      // Allow time for Recharts animations and transitions
      setTimeout(resolve, 1000);
    });
  }

  /**
   * Check if element is visible and ready for capture
   */
}
