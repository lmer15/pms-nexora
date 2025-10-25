const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;
const analyticsService = require('./analyticsAggregator');
const insightsEngine = require('../utils/insightsEngine');
const { formatDate, formatTimeRange } = require('../utils/dateUtils');

class PDFGenerator {
  constructor() {
    this.tempDir = path.join(__dirname, '../../temp');
    this.ensureTempDir();
  }

  async ensureTempDir() {
    try {
      await fs.access(this.tempDir);
    } catch {
      await fs.mkdir(this.tempDir, { recursive: true });
    }
  }

  async generateGlobalPDF(userId, userRole, range = '4w') {
    try {
      // Get analytics data
      const data = await analyticsService.getGlobalAnalytics(userId, userRole, range);
      
      // Generate HTML content
      const html = await this.generateGlobalHTML(data, range);
      
      // Generate PDF
      const filename = this.generateFilename('global', 'analytics', range);
      const filepath = path.join(this.tempDir, filename);
      
      await this.htmlToPDF(html, filepath);
      
      // Return download info
      return {
        downloadUrl: `/temp/${filename}`,
        filename,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      };
    } catch (error) {
      console.error('Global PDF generation error:', error);
      throw error;
    }
  }

  async generateFacilityPDF(facilityId, userId, userRole, range = '4w') {
    try {
      // Get analytics data
      const data = await analyticsService.getFacilityAnalytics(facilityId, userId, userRole, range);
      
      // Generate HTML content
      const html = await this.generateFacilityHTML(data, range);
      
      // Generate PDF
      const filename = this.generateFilename('facility', data.facility.name, range);
      const filepath = path.join(this.tempDir, filename);
      
      await this.htmlToPDF(html, filepath);
      
      // Return download info
      return {
        downloadUrl: `/temp/${filename}`,
        filename,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };
    } catch (error) {
      console.error('Facility PDF generation error:', error);
      throw error;
    }
  }

  async generateMemberPDF(memberId, userId, userRole, range = '4w') {
    try {
      // Get analytics data
      const data = await analyticsService.getMemberAnalytics(memberId, userId, userRole, range);
      
      // Generate HTML content
      const html = await this.generateMemberHTML(data, range);
      
      // Generate PDF
      const filename = this.generateFilename('member', data.member.name, range);
      const filepath = path.join(this.tempDir, filename);
      
      await this.htmlToPDF(html, filepath);
      
      // Return download info
      return {
        downloadUrl: `/temp/${filename}`,
        filename,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };
    } catch (error) {
      console.error('Member PDF generation error:', error);
      throw error;
    }
  }

  async generateGlobalHTML(data, range) {
    const insights = insightsEngine.generateGlobalInsights(data);
    const timeRange = formatTimeRange(range);
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Nexora Global Analytics Report</title>
        <style>
          ${this.getPDFStyles()}
        </style>
      </head>
      <body>
        <div class="page">
          <div class="header">
            <h1>Nexora Analytics Report</h1>
            <p class="subtitle">Global Resource Analytics</p>
            <p class="meta">Period: ${timeRange} | Generated: ${formatDate(new Date())}</p>
          </div>

          <div class="section">
            <h2>Executive Summary</h2>
            <p>Overall utilization stands at ${data.kpis.avgUtilization.toFixed(1)}% across ${data.kpis.totalFacilities} facilities.</p>
            <p>Key highlights:</p>
            <ul>
              ${insights.slice(0, 3).map(insight => `<li>${insight.message}</li>`).join('')}
            </ul>
          </div>

          <div class="section">
            <h2>Key Performance Indicators</h2>
            <div class="kpi-grid">
              <div class="kpi-card">
                <h3>Active Members</h3>
                <div class="kpi-value">${data.kpis.activeMembers}</div>
              </div>
              <div class="kpi-card">
                <h3>Total Facilities</h3>
                <div class="kpi-value">${data.kpis.totalFacilities}</div>
              </div>
              <div class="kpi-card">
                <h3>Avg Utilization</h3>
                <div class="kpi-value">${data.kpis.avgUtilization.toFixed(1)}%</div>
              </div>
              <div class="kpi-card">
                <h3>Overloaded Members</h3>
                <div class="kpi-value">${data.kpis.overloadedMembers}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <h2>Facility Overview</h2>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Facility</th>
                  <th>Members</th>
                  <th>Utilization</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${data.facilities.map(facility => `
                  <tr>
                    <td>${facility.name}</td>
                    <td>${facility.membersCount}</td>
                    <td>${facility.avgUtilization.toFixed(1)}%</td>
                    <td>
                      <span class="status ${facility.avgUtilization >= 90 ? 'overloaded' : facility.avgUtilization >= 70 ? 'caution' : 'balanced'}">
                        ${facility.avgUtilization >= 90 ? 'Overloaded' : facility.avgUtilization >= 70 ? 'Caution' : 'Balanced'}
                      </span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="section">
            <h2>Top Performers</h2>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Facility</th>
                  <th>Tasks</th>
                  <th>Utilization</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${data.members.slice(0, 10).map(member => `
                  <tr>
                    <td>${member.name}</td>
                    <td>${member.facilityName}</td>
                    <td>${member.tasks.total}</td>
                    <td>${member.utilization.toFixed(1)}%</td>
                    <td>
                      <span class="status ${member.status}">
                        ${member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="section">
            <h2>Insights & Recommendations</h2>
            <div class="insights">
              ${insights.map(insight => `
                <div class="insight ${insight.type}">
                  <div class="insight-icon">${insightsEngine.getInsightIcon(insight.type)}</div>
                  <div class="insight-content">
                    <p class="insight-message">${insight.message}</p>
                    <p class="insight-action"><strong>Action:</strong> ${insight.action}</p>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="footer">
            <p>Confidential - Nexora Analytics Report | Page 1</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async generateFacilityHTML(data, range) {
    const insights = insightsEngine.generateFacilityInsights(data);
    const timeRange = formatTimeRange(range);
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Nexora Facility Analytics Report</title>
        <style>
          ${this.getPDFStyles()}
        </style>
      </head>
      <body>
        <div class="page">
          <div class="header">
            <h1>Nexora Analytics Report</h1>
            <p class="subtitle">Facility Analytics - ${data.facility.name}</p>
            <p class="meta">Period: ${timeRange} | Generated: ${formatDate(new Date())}</p>
          </div>

          <div class="section">
            <h2>Facility Overview</h2>
            <p><strong>Facility:</strong> ${data.facility.name}</p>
            <p><strong>Projects:</strong> ${data.facility.projects}</p>
            <p><strong>Active Members:</strong> ${data.kpis.activeMembers}</p>
            <p><strong>Average Utilization:</strong> ${data.kpis.avgUtilization.toFixed(1)}%</p>
          </div>

          <div class="section">
            <h2>Key Performance Indicators</h2>
            <div class="kpi-grid">
              <div class="kpi-card">
                <h3>Active Members</h3>
                <div class="kpi-value">${data.kpis.activeMembers}</div>
              </div>
              <div class="kpi-card">
                <h3>Pending Tasks</h3>
                <div class="kpi-value">${data.kpis.pendingTasks}</div>
              </div>
              <div class="kpi-card">
                <h3>Avg Utilization</h3>
                <div class="kpi-value">${data.kpis.avgUtilization.toFixed(1)}%</div>
              </div>
            </div>
          </div>

          <div class="section">
            <h2>Member Performance</h2>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Role</th>
                  <th>Tasks</th>
                  <th>Utilization</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${data.members.map(member => `
                  <tr>
                    <td>${member.name}</td>
                    <td>${member.role}</td>
                    <td>${member.tasks.total}</td>
                    <td>${member.utilization.toFixed(1)}%</td>
                    <td>
                      <span class="status ${member.status}">
                        ${member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="section">
            <h2>Insights & Recommendations</h2>
            <div class="insights">
              ${insights.map(insight => `
                <div class="insight ${insight.type}">
                  <div class="insight-icon">${insightsEngine.getInsightIcon(insight.type)}</div>
                  <div class="insight-content">
                    <p class="insight-message">${insight.message}</p>
                    <p class="insight-action"><strong>Action:</strong> ${insight.action}</p>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="footer">
            <p>Confidential - Nexora Analytics Report | Page 1</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async generateMemberHTML(data, range) {
    const insights = insightsEngine.generateMemberInsights(data);
    const timeRange = formatTimeRange(range);
    
    // Get facility information
    const facility = data.member.facilityId ? await this.getFacilityInfo(data.member.facilityId) : null;
    const projectCount = facility ? facility.projects : 0;
    const facilityName = facility ? facility.name : 'Unknown Facility';
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Nexora Member Analytics Report</title>
        <style>
          ${this.getPDFStyles()}
        </style>
      </head>
      <body>
        <div class="page">
          <div class="header">
            <h1>Nexora Analytics Report</h1>
            <p class="subtitle">Member Analytics - ${data.member.name}</p>
            <p class="meta">Period: ${timeRange} | Generated: ${formatDate(new Date())}</p>
          </div>

          <div class="section">
            <h2>Member Overview</h2>
            <div class="member-info-grid">
              <div class="info-card">
                <h3>Personal Information</h3>
                <p><strong>Name:</strong> ${data.member.name}</p>
                <p><strong>Role:</strong> ${data.member.role}</p>
                <p><strong>Capacity:</strong> ${data.member.capacity} hours/week</p>
              </div>
              <div class="info-card">
                <h3>Facility Information</h3>
                <p><strong>Facility:</strong> ${facilityName}</p>
                <p><strong>Projects in Facility:</strong> ${projectCount}</p>
                <p><strong>Current Utilization:</strong> ${data.kpis.utilization.toFixed(1)}%</p>
              </div>
            </div>
          </div>

          <div class="section">
            <h2>Key Performance Indicators</h2>
            <div class="kpi-grid">
              <div class="kpi-card">
                <h3>Total Tasks</h3>
                <div class="kpi-value">${data.kpis.totalTasks}</div>
              </div>
              <div class="kpi-card">
                <h3>Ongoing</h3>
                <div class="kpi-value">${data.kpis.ongoing}</div>
              </div>
              <div class="kpi-card">
                <h3>Completed</h3>
                <div class="kpi-value">${data.kpis.completed}</div>
              </div>
              <div class="kpi-card">
                <h3>Utilization</h3>
                <div class="kpi-value">${data.kpis.utilization.toFixed(1)}%</div>
              </div>
            </div>
          </div>

          <div class="section">
            <h2>Task Breakdown</h2>
            <div class="task-summary">
              <div class="task-stats">
                <div class="stat-item">
                  <span class="stat-label">Total Tasks:</span>
                  <span class="stat-value">${data.kpis.totalTasks}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Completed:</span>
                  <span class="stat-value">${data.kpis.completed}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">In Progress:</span>
                  <span class="stat-value">${data.kpis.ongoing}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Pending:</span>
                  <span class="stat-value">${data.kpis.totalTasks - data.kpis.completed - data.kpis.ongoing}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="section">
            <h2>Recent Activity</h2>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Project</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${data.timeline.slice(0, 10).map(item => `
                  <tr>
                    <td>Task #${item.taskId}</td>
                    <td>${item.project}</td>
                    <td>${formatDate(item.start)}</td>
                    <td>${formatDate(item.end)}</td>
                    <td>
                      <span class="status ${item.status}">
                        ${item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="section">
            <h2>Insights & Recommendations</h2>
            <div class="insights">
              ${insights.map(insight => `
                <div class="insight ${insight.type}">
                  <div class="insight-icon">${insightsEngine.getInsightIcon(insight.type)}</div>
                  <div class="insight-content">
                    <p class="insight-message">${insight.message}</p>
                    <p class="insight-action"><strong>Action:</strong> ${insight.action}</p>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="footer">
            <p>Confidential - Nexora Analytics Report | Page 1</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getPDFStyles() {
    return `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        font-size: 12px;
        line-height: 1.5;
        color: #334155;
        background: white;
      }

      .page {
        max-width: 210mm;
        margin: 0 auto;
        padding: 20mm;
        min-height: 297mm;
        position: relative;
      }

      .header {
        text-align: center;
        margin-bottom: 30px;
        border-bottom: 2px solid #10B981;
        padding-bottom: 20px;
      }

      .header h1 {
        font-size: 24px;
        font-weight: 700;
        color: #10B981;
        margin-bottom: 5px;
      }

      .subtitle {
        font-size: 16px;
        color: #6B7280;
        margin-bottom: 10px;
      }

      .meta {
        font-size: 10px;
        color: #9CA3AF;
      }

      .section {
        margin-bottom: 25px;
      }

      .section h2 {
        font-size: 16px;
        font-weight: 600;
        color: #10B981;
        margin-bottom: 15px;
        border-bottom: 1px solid #E5E7EB;
        padding-bottom: 5px;
      }

      .kpi-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 15px;
        margin-bottom: 20px;
      }

      .member-info-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 20px;
        margin-bottom: 20px;
      }

      .info-card {
        background: #F8FAFC;
        border: 1px solid #E5E7EB;
        border-radius: 8px;
        padding: 15px;
      }

      .info-card h3 {
        font-size: 12px;
        font-weight: 600;
        color: #10B981;
        margin-bottom: 10px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        border-bottom: 1px solid #E5E7EB;
        padding-bottom: 5px;
      }

      .info-card p {
        font-size: 11px;
        margin-bottom: 5px;
        color: #374151;
      }

      .task-summary {
        background: #F8FAFC;
        border: 1px solid #E5E7EB;
        border-radius: 8px;
        padding: 15px;
        margin-bottom: 20px;
      }

      .task-stats {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 15px;
      }

      .stat-item {
        text-align: center;
        padding: 10px;
        background: white;
        border-radius: 6px;
        border: 1px solid #E5E7EB;
      }

      .stat-label {
        display: block;
        font-size: 10px;
        font-weight: 500;
        color: #6B7280;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 5px;
      }

      .stat-value {
        display: block;
        font-size: 18px;
        font-weight: 700;
        color: #10B981;
      }

      .kpi-card {
        background: #F8FAFC;
        border: 1px solid #E5E7EB;
        border-radius: 8px;
        padding: 15px;
        text-align: center;
      }

      .kpi-card h3 {
        font-size: 10px;
        font-weight: 500;
        color: #6B7280;
        margin-bottom: 8px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .kpi-value {
        font-size: 20px;
        font-weight: 700;
        color: #10B981;
      }

      .data-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 20px;
      }

      .data-table th,
      .data-table td {
        padding: 8px 12px;
        text-align: left;
        border-bottom: 1px solid #E5E7EB;
      }

      .data-table th {
        background: #F8FAFC;
        font-weight: 600;
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: #6B7280;
      }

      .data-table td {
        font-size: 11px;
      }

      .status {
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 9px;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .status.balanced {
        background: #D1FAE5;
        color: #065F46;
      }

      .status.caution {
        background: #FEF3C7;
        color: #92400E;
      }

      .status.overloaded {
        background: #FEE2E2;
        color: #991B1B;
      }

      .status.completed {
        background: #D1FAE5;
        color: #065F46;
      }

      .status.ongoing {
        background: #FEF3C7;
        color: #92400E;
      }

      .status.pending {
        background: #F3F4F6;
        color: #6B7280;
      }

      .insights {
        margin-top: 15px;
      }

      .insight {
        display: flex;
        align-items: flex-start;
        margin-bottom: 15px;
        padding: 12px;
        border-radius: 8px;
        border-left: 4px solid;
      }

      .insight.danger {
        background: #FEF2F2;
        border-left-color: #EF4444;
      }

      .insight.warning {
        background: #FFFBEB;
        border-left-color: #F59E0B;
      }

      .insight.info {
        background: #F0FDF4;
        border-left-color: #10B981;
      }

      .insight.success {
        background: #F0FDF4;
        border-left-color: #10B981;
      }

      .insight-icon {
        font-size: 16px;
        margin-right: 10px;
        margin-top: 2px;
      }

      .insight-content {
        flex: 1;
      }

      .insight-message {
        font-size: 11px;
        margin-bottom: 5px;
        font-weight: 500;
      }

      .insight-action {
        font-size: 10px;
        color: #6B7280;
      }

      .footer {
        position: absolute;
        bottom: 20mm;
        left: 20mm;
        right: 20mm;
        text-align: center;
        font-size: 9px;
        color: #9CA3AF;
        border-top: 1px solid #E5E7EB;
        padding-top: 10px;
      }

      @media print {
        .page {
          margin: 0;
          padding: 15mm;
        }
      }
    `;
  }

  async htmlToPDF(html, outputPath) {
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm'
        }
      });
      
      await fs.writeFile(outputPath, pdfBuffer);
      console.log(`PDF generated successfully: ${outputPath}`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  async getFacilityInfo(facilityId) {
    try {
      const Facility = require('../models/Facility');
      const Project = require('../models/Project');
      
      const facility = await Facility.findById(facilityId);
      if (!facility) return null;
      
      const projects = await Project.findByFacility(facilityId);
      const activeProjects = projects.filter(p => !p.deletedAt);
      
      return {
        id: facility.id,
        name: facility.name,
        projects: activeProjects.length
      };
    } catch (error) {
      console.error('Error getting facility info:', error);
      return null;
    }
  }

  generateFilename(scope, name, range) {
    const date = new Date().toISOString().split('T')[0];
    const sanitizedName = name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    return `nexora-analytics-${scope}-${sanitizedName}-${range}-${date}.pdf`;
  }
}

module.exports = new PDFGenerator();
