/**
 * Blueprint PDF Export Utility
 * Exports blueprint with brand-styled dashboard and markdown content
 */

export interface BlueprintExportData {
  id: string;
  title: string | null;
  created_at: string;
  blueprint_markdown: string | null;
  blueprint_json: unknown;
}

/**
 * Export blueprint to PDF with dashboard and markdown content
 */
export async function exportBlueprintToPDF(data: BlueprintExportData): Promise<void> {
  // Dynamic import to avoid SSR issues
  const html2pdf = (await import('html2pdf.js')).default;

  const blueprintTitle = data.title ?? 'Learning Blueprint';
  const createdDate = new Date(data.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Parse blueprint JSON
  let blueprintData = null;
  if (data?.blueprint_json) {
    try {
      blueprintData =
        typeof data.blueprint_json === 'string'
          ? JSON.parse(data.blueprint_json)
          : data.blueprint_json;
    } catch (e) {
      console.error('Failed to parse blueprint JSON:', e);
    }
  }

  // Create temporary container - visible but scrolled out of view
  const exportContainer = document.createElement('div');
  exportContainer.style.position = 'fixed';
  exportContainer.style.top = '0';
  exportContainer.style.left = '0';
  exportContainer.style.width = '210mm';
  exportContainer.style.backgroundColor = '#ffffff';
  exportContainer.style.color = '#1e293b';
  exportContainer.style.fontFamily = 'system-ui, -apple-system, sans-serif';
  exportContainer.style.padding = '0';
  exportContainer.style.zIndex = '-9999';
  exportContainer.style.opacity = '0';
  exportContainer.style.pointerEvents = 'none';
  document.body.appendChild(exportContainer);

  // Build HTML content
  let htmlContent = '';

  // Add cover page
  htmlContent += generateCoverPage(blueprintTitle, createdDate);

  // Add dashboard if data exists
  if (blueprintData) {
    htmlContent += generateDashboardPage(blueprintData);
  }

  // Add markdown content
  const markdown = data.blueprint_markdown ?? '# Blueprint\n\nNo content available.';
  htmlContent += generateMarkdownPage(markdown, createdDate);

  exportContainer.innerHTML = htmlContent;

  // Wait for fonts and rendering
  await new Promise((resolve) => setTimeout(resolve, 500));

  const opt = {
    margin: [10, 10, 10, 10],
    filename: `${blueprintTitle.replace(/[^a-z0-9]/gi, '_')}.pdf`,
    image: { type: 'jpeg', quality: 0.95 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 794, // A4 width in pixels at 96 DPI
      windowHeight: 1123, // A4 height in pixels at 96 DPI
    },
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait',
    },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
  };

  try {
    await html2pdf().set(opt).from(exportContainer).save();
  } finally {
    // Always clean up
    if (exportContainer.parentNode) {
      document.body.removeChild(exportContainer);
    }
  }
}

function generateCoverPage(title: string, date: string): string {
  return `
    <div style="padding: 80px 60px; text-align: center; page-break-after: always; min-height: 1000px; display: flex; flex-direction: column; justify-content: center; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);">
      <div style="margin-bottom: 40px;">
        <div style="display: inline-block; padding: 12px 28px; background: linear-gradient(135deg, #7bc5c7 0%, #4F46E5 100%); border-radius: 50px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);">
          <span style="color: #ffffff; font-size: 16px; font-weight: 600; letter-spacing: 0.5px;">✨ AI-Generated Learning Blueprint</span>
        </div>
      </div>
      <h1 style="font-size: 42px; font-weight: 800; color: #0f172a; margin: 40px 0; line-height: 1.2; font-family: system-ui, -apple-system, sans-serif;">${title}</h1>
      <p style="color: #64748b; font-size: 18px; margin: 30px 0 60px 0;">Created on ${date}</p>
      <div style="margin-top: 80px; padding-top: 40px; border-top: 2px solid #cbd5e1;">
        <p style="color: #94a3b8; font-size: 14px; font-weight: 500;">Generated with SmartSlate AI</p>
      </div>
    </div>
  `;
}

function generateDashboardPage(blueprintData: any): string {
  const modules = 'modules' in blueprintData ? blueprintData.modules : [];
  const learningObjectives =
    'learningObjectives' in blueprintData ? blueprintData.learningObjectives : [];
  const resources =
    'resources' in blueprintData && Array.isArray(blueprintData.resources)
      ? blueprintData.resources
      : [];

  const totalDuration = modules.reduce((sum: number, module: any) => {
    const duration = typeof module.duration === 'number' ? module.duration : 0;
    return sum + duration;
  }, 0);

  return `
    <div style="padding: 50px 40px; page-break-after: always; background: #ffffff;">
      <div style="text-align: center; margin-bottom: 50px;">
        <h2 style="font-size: 32px; font-weight: 700; color: #0f172a; margin-bottom: 12px;">Learning Journey Overview</h2>
        <p style="color: #64748b; font-size: 16px;">Comprehensive analysis of your personalized learning blueprint</p>
      </div>

      <!-- Key Metrics Grid -->
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; margin-bottom: 50px;">
        ${generateMetricCard('Total Duration', `${totalDuration} hrs`, '#7bc5c7')}
        ${generateMetricCard('Learning Modules', modules.length.toString(), '#4F46E5')}
        ${generateMetricCard('Learning Objectives', learningObjectives.length.toString(), '#10b981')}
        ${generateMetricCard('Resources', resources.length.toString(), '#f59e0b')}
      </div>

      ${generateObjectivesSection(learningObjectives)}
      ${generateModulesSection(modules)}
    </div>
  `;
}

function generateMetricCard(label: string, value: string, color: string): string {
  return `
    <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 2px solid #e2e8f0; border-radius: 16px; padding: 28px 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
      <div style="width: 48px; height: 48px; background: ${color}20; border-radius: 12px; margin-bottom: 16px; display: flex; align-items: center; justify-content: center;">
        <div style="width: 24px; height: 24px; background: ${color}; border-radius: 50%;"></div>
      </div>
      <p style="color: #64748b; font-size: 13px; margin: 0 0 8px 0; font-weight: 500;">${label}</p>
      <p style="color: #0f172a; font-size: 36px; font-weight: 800; margin: 0; line-height: 1;">${value}</p>
    </div>
  `;
}

function generateObjectivesSection(objectives: string[]): string {
  if (objectives.length === 0) return '';

  return `
    <div style="margin-top: 50px; page-break-inside: avoid;">
      <h3 style="color: #0f172a; font-size: 24px; font-weight: 700; margin-bottom: 24px; padding-bottom: 12px; border-bottom: 3px solid #7bc5c7;">Learning Objectives</h3>
      <div style="display: grid; grid-template-columns: repeat(1, 1fr); gap: 14px;">
        ${objectives
          .slice(0, 10)
          .map(
            (obj) => `
          <div style="background: linear-gradient(135deg, #f0f9ff 0%, #f8fafc 100%); border-left: 4px solid #7bc5c7; border-radius: 8px; padding: 16px 20px; display: flex; align-items: start; gap: 14px;">
            <span style="color: #7bc5c7; font-size: 20px; line-height: 1; margin-top: 2px;">✓</span>
            <span style="color: #334155; font-size: 14px; line-height: 1.6; flex: 1;">${obj}</span>
          </div>
        `
          )
          .join('')}
      </div>
    </div>
  `;
}

function generateModulesSection(modules: any[]): string {
  if (modules.length === 0) return '';

  return `
    <div style="margin-top: 50px; page-break-inside: avoid;">
      <h3 style="color: #0f172a; font-size: 24px; font-weight: 700; margin-bottom: 24px; padding-bottom: 12px; border-bottom: 3px solid #4F46E5;">Module Breakdown</h3>
      <div style="display: grid; grid-template-columns: repeat(1, 1fr); gap: 18px;">
        ${modules
          .slice(0, 8)
          .map((module, index) => {
            const duration = typeof module.duration === 'number' ? module.duration : 0;
            const topicCount = Array.isArray(module.topics) ? module.topics.length : 0;
            const activityCount = Array.isArray(module.activities) ? module.activities.length : 0;
            return `
              <div style="background: linear-gradient(135deg, #faf5ff 0%, #f8fafc 100%); border: 2px solid #e9d5ff; border-radius: 14px; padding: 20px 24px;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 14px;">
                  <h4 style="color: #0f172a; font-size: 16px; font-weight: 600; margin: 0; flex: 1;">${module.title}</h4>
                  <span style="background: linear-gradient(135deg, #7bc5c7 0%, #4F46E5 100%); color: #ffffff; padding: 6px 14px; border-radius: 20px; font-size: 11px; font-weight: 700; white-space: nowrap; margin-left: 12px;">Module ${index + 1}</span>
                </div>
                <div style="display: flex; gap: 20px; color: #64748b; font-size: 13px; font-weight: 500;">
                  <span>⏱ ${duration}h</span>
                  <span>📚 ${topicCount} topics</span>
                  <span>🎯 ${activityCount} activities</span>
                </div>
              </div>
            `;
          })
          .join('')}
      </div>
    </div>
  `;
}

function generateMarkdownPage(markdown: string, date: string): string {
  const markdownToHtml = (md: string) => {
    return md
      .replace(
        /^### (.*$)/gim,
        '<h3 style="color: #334155; font-size: 20px; font-weight: 600; margin: 28px 0 14px 0; line-height: 1.4;">$1</h3>'
      )
      .replace(
        /^## (.*$)/gim,
        '<h2 style="color: #0f172a; font-size: 26px; font-weight: 700; margin: 36px 0 18px 0; padding-bottom: 10px; border-bottom: 2px solid #e2e8f0; line-height: 1.3;">$1</h2>'
      )
      .replace(
        /^# (.*$)/gim,
        '<h1 style="color: #0f172a; font-size: 32px; font-weight: 800; margin: 40px 0 24px 0; padding-bottom: 14px; border-bottom: 3px solid #7bc5c7; line-height: 1.2;">$1</h1>'
      )
      .replace(/\*\*(.*?)\*\*/gim, '<strong style="color: #0f172a; font-weight: 700;">$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em style="color: #4F46E5; font-style: italic;">$1</em>')
      .replace(
        /^\* (.+$)/gim,
        '<li style="color: #475569; margin-bottom: 10px; line-height: 1.7; list-style-position: outside; margin-left: 20px;">$1</li>'
      )
      .replace(
        /^\d+\. (.+$)/gim,
        '<li style="color: #475569; margin-bottom: 10px; line-height: 1.7; list-style-position: outside; margin-left: 20px;">$1</li>'
      )
      .replace(
        /\n\n/g,
        '</p><p style="color: #475569; margin: 0 0 18px 0; line-height: 1.8; font-size: 15px;">'
      )
      .replace(/\n/g, '<br />');
  };

  return `
    <div style="padding: 50px 40px; background: #ffffff;">
      <div style="text-align: center; margin-bottom: 50px;">
        <h2 style="font-size: 32px; font-weight: 700; color: #0f172a; margin-bottom: 12px;">Blueprint Content</h2>
        <p style="color: #64748b; font-size: 16px;">Detailed learning path and resources</p>
      </div>
      
      <div style="font-size: 15px; line-height: 1.8; color: #475569;">
        <p style="color: #475569; margin: 0 0 18px 0; line-height: 1.8; font-size: 15px;">
          ${markdownToHtml(markdown)}
        </p>
      </div>
      
      <!-- Footer -->
      <div style="margin-top: 80px; padding-top: 30px; border-top: 2px solid #e2e8f0; text-align: center;">
        <p style="color: #94a3b8; font-size: 13px; font-weight: 500;">Generated with SmartSlate AI • ${date}</p>
      </div>
    </div>
  `;
}
