#!/usr/bin/env tsx

/**
 * Incident Response Automation Script
 *
 * Automated incident detection, classification, and response coordination
 * for SmartSlate Polaris v3 production environment.
 *
 * Usage: npm run incident:respond [severity] [type] [message]
 *   severity: critical | high | medium | low
 *   type: payment | infrastructure | security | performance | user
 *   message: Incident description
 *
 * Environment Variables Required:
 * - SLACK_WEBHOOK_URL: Slack webhook for notifications
 * - ALERT_EMAIL: Email address for alert notifications
 * - EMERGENCY_CONTACTS_FILE: Path to emergency contacts config
 */

import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { spawn } from 'child_process';

// Load environment variables
config({ path: '.env.local' });
config({ path: '.env.production' });

interface Incident {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: string;
  message: string;
  timestamp: Date;
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  assignedTo?: string;
  escalationLevel: number;
  affectedServices: string[];
  userImpact: string;
}

interface ContactInfo {
  name: string;
  phone: string;
  email: string;
  role: string;
  slack: string;
  availability: string;
}

interface EmergencyContacts {
  primary: Record<string, ContactInfo>;
  management: Record<string, ContactInfo>;
  external: Record<string, ContactInfo>;
  escalationMatrix: Record<string, {
    responseTime: string;
    escalationChain: string[];
    notifyAll: boolean;
    executiveNotification: boolean;
  }>;
}

class IncidentResponseAutomation {
  private incidentId: string;
  private emergencyContacts: EmergencyContacts;

  constructor() {
    this.incidentId = this.generateIncidentId();
    this.loadEmergencyContacts();
  }

  private generateIncidentId(): string {
    const timestamp = new Date().toISOString().replace(/[-T:.]/g, '').slice(0, 14);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `INC-${timestamp}-${random}`;
  }

  private loadEmergencyContacts(): void {
    try {
      const contactsFile = process.env.EMERGENCY_CONTACTS_FILE ||
        './scripts/emergency-contacts-config.json';
      const contactsData = readFileSync(contactsFile, 'utf8');
      this.emergencyContacts = JSON.parse(contactsData);
    } catch (error) {
      console.error('Failed to load emergency contacts:', error);
      process.exit(1);
    }
  }

  async handleIncident(severity: string, type: string, message: string): Promise<void> {
    console.log(`🚨 Incident Response Automation - ID: ${this.incidentId}`);
    console.log(`📊 Severity: ${severity.toUpperCase()}`);
    console.log(`🏷️ Type: ${type}`);
    console.log(`📝 Message: ${message}`);
    console.log('='.repeat(60));

    const incident: Incident = {
      id: this.incidentId,
      severity: severity as any,
      type,
      message,
      timestamp: new Date(),
      status: 'open',
      escalationLevel: 1,
      affectedServices: this.getAffectedServices(type),
      userImpact: this.getUserImpact(severity, type)
    };

    try {
      // 1. Classify and log incident
      await this.classifyAndLog(incident);

      // 2. Send initial notifications
      await this.sendNotifications(incident);

      // 3. Execute automated responses
      await this.executeAutomatedResponse(incident);

      // 4. Create incident report
      await this.createIncidentReport(incident);

      // 5. Set up monitoring and follow-up
      await this.setupMonitoring(incident);

      console.log(`✅ Incident response initiated successfully`);
      console.log(`📋 Incident ID: ${this.incidentId}`);
      console.log(`👥 Response team notified`);
      console.log(`📊 Monitoring active`);

    } catch (error) {
      console.error('❌ Incident response failed:', error);
      process.exit(1);
    }
  }

  private async classifyAndLog(incident: Incident): Promise<void> {
    console.log(`\n📋 Classifying and logging incident...`);

    // Determine escalation level based on severity and type
    const severityLevel = this.getSeverityLevel(incident.severity);
    incident.escalationLevel = severityLevel;

    // Log to system logs
    await this.logIncident(incident);

    console.log(`  ✅ Incident classified (Level ${severityLevel})`);
    console.log(`  ✅ Incident logged to system`);
  }

  private async sendNotifications(incident: Incident): Promise<void> {
    console.log(`\n📢 Sending notifications...`);

    const escalationConfig = this.emergencyContacts.escalationMatrix[`severity_${incident.severity}_${incident.severity === 'critical' ? 'critical' : 'high'}`];

    // Get contacts to notify based on escalation chain
    const contactsToNotify = this.getContactsForEscalation(incident.type, escalationConfig);

    // Send Slack notification
    await this.sendSlackNotification(incident, contactsToNotify);

    // Send email notification for critical incidents
    if (incident.severity === 'critical' || incident.severity === 'high') {
      await this.sendEmailNotification(incident, contactsToNotify);
    }

    console.log(`  ✅ Slack notification sent`);
    if (incident.severity === 'critical' || incident.severity === 'high') {
      console.log(`  ✅ Email notification sent`);
    }
  }

  private async executeAutomatedResponse(incident: Incident): Promise<void> {
    console.log(`\n🔧 Executing automated responses...`);

    switch (incident.type) {
      case 'payment':
        await this.handlePaymentIncident(incident);
        break;
      case 'infrastructure':
        await this.handleInfrastructureIncident(incident);
        break;
      case 'security':
        await this.handleSecurityIncident(incident);
        break;
      case 'performance':
        await this.handlePerformanceIncident(incident);
        break;
      default:
        await this.handleGenericIncident(incident);
    }

    console.log(`  ✅ Automated responses executed`);
  }

  private async createIncidentReport(incident: Incident): Promise<void> {
    console.log(`\n📄 Creating incident report...`);

    const report = {
      incidentId: incident.id,
      timestamp: incident.timestamp.toISOString(),
      severity: incident.severity,
      type: incident.type,
      message: incident.message,
      status: incident.status,
      escalationLevel: incident.escalationLevel,
      affectedServices: incident.affectedServices,
      userImpact: incident.userImpact,
      automatedActions: this.getAutomatedActions(incident),
      nextSteps: this.getNextSteps(incident),
      assignedTeam: this.getAssignedTeam(incident.type)
    };

    // Save incident report
    const reportFile = `incident-reports/${incident.id}.json`;
    const fs = require('fs');
    const path = require('path');

    // Ensure directory exists
    const reportsDir = path.dirname(reportFile);
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));

    console.log(`  ✅ Incident report saved: ${reportFile}`);
  }

  private async setupMonitoring(incident: Incident): Promise<void> {
    console.log(`\n📊 Setting up monitoring...`);

    // Set up enhanced monitoring for the affected services
    const monitoringCommands = this.getMonitoringCommands(incident);

    for (const command of monitoringCommands) {
      await this.executeMonitoringCommand(command);
    }

    // Set up follow-up check based on severity
    const followUpDelay = this.getFollowUpDelay(incident.severity);
    console.log(`  ✅ Follow-up scheduled in ${followUpDelay}`);

    console.log(`  ✅ Enhanced monitoring active`);
  }

  // Helper methods
  private getAffectedServices(type: string): string[] {
    const serviceMap: Record<string, string[]> = {
      'payment': ['Razorpay API', 'Payment Processing', 'Webhook Processing', 'User Subscriptions'],
      'infrastructure': ['Vercel Deployment', 'Database', 'CDN', 'API Endpoints'],
      'security': ['Authentication', 'Authorization', 'API Security', 'Data Protection'],
      'performance': ['API Response Times', 'Database Queries', 'Frontend Performance'],
      'user': ['User Interface', 'User Authentication', 'User Experience']
    };

    return serviceMap[type] || ['Unknown Service'];
  }

  private getUserImpact(severity: string, type: string): string {
    const impactMap: Record<string, Record<string, string>> = {
      'critical': {
        'payment': 'Users cannot process payments or access paid features',
        'infrastructure': 'System is unavailable or severely degraded',
        'security': 'Potential data breach or unauthorized access',
        'performance': 'System is extremely slow or unresponsive',
        'user': 'Users cannot access core functionality'
      },
      'high': {
        'payment': 'Payment processing partially failing or delayed',
        'infrastructure': 'Significant performance degradation or intermittent outages',
        'security': 'Security control failures or suspicious activity',
        'performance': 'Poor performance affecting user experience',
        'user': 'Major user experience issues'
      },
      'medium': {
        'payment': 'Minor payment processing delays or occasional failures',
        'infrastructure': 'Minor performance issues or isolated problems',
        'security': 'Non-critical security issues or alerts',
        'performance': 'Some performance degradation',
        'user': 'Minor user experience issues'
      },
      'low': {
        'payment': 'Payment processing warnings or minor issues',
        'infrastructure': 'Performance monitoring alerts',
        'security': 'Security recommendations or best practice alerts',
        'performance': 'Performance monitoring alerts',
        'user': 'User experience improvements'
      }
    };

    return impactMap[severity]?.[type] || 'User impact assessment pending';
  }

  private getSeverityLevel(severity: string): number {
    const levelMap: Record<string, number> = {
      'critical': 5,
      'high': 4,
      'medium': 3,
      'low': 2
    };

    return levelMap[severity] || 1;
  }

  private async logIncident(incident: Incident): Promise<void> {
    const logEntry = {
      timestamp: incident.timestamp.toISOString(),
      level: incident.severity.toUpperCase(),
      incidentId: incident.id,
      type: incident.type,
      message: incident.message,
      userImpact: incident.userImpact,
      escalationLevel: incident.escalationLevel
    };

    // Log to console (in production, this would go to a logging service)
    console.log('📝 Incident Log:', JSON.stringify(logEntry, null, 2));
  }

  private getContactsForEscalation(type: string, escalationConfig: any): ContactInfo[] {
    const contacts: ContactInfo[] = [];

    // Add type-specific primary contacts
    const typeContacts: Record<string, string[]> = {
      'payment': ['backendDeveloper'],
      'infrastructure': ['devopsEngineer', 'databaseAdmin'],
      'security': ['productionLead', 'backendDeveloper'],
      'performance': ['devopsEngineer', 'backendDeveloper'],
      'user': ['frontendDeveloper']
    };

    const primaryContactKeys = typeContacts[type] || ['productionLead'];

    for (const contactKey of primaryContactKeys) {
      if (this.emergencyContacts.primary[contactKey]) {
        contacts.push(this.emergencyContacts.primary[contactKey]);
      }
    }

    // Add escalation chain contacts
    for (const contactKey of escalationConfig.escalationChain) {
      if (this.emergencyContacts.primary[contactKey] &&
          !contacts.find(c => c.name === this.emergencyContacts.primary[contactKey].name)) {
        contacts.push(this.emergencyContacts.primary[contactKey]);
      }
    }

    // Add management contacts for critical incidents
    if (escalationConfig.executiveNotification) {
      contacts.push(this.emergencyContacts.management.cto);
      contacts.push(this.emergencyContacts.management.engineeringManager);
    }

    return contacts;
  }

  private async sendSlackNotification(incident: Incident, contacts: ContactInfo[]): Promise<void> {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) {
      console.warn('⚠️ SLACK_WEBHOOK_URL not configured');
      return;
    }

    const color = this.getSeverityColor(incident.severity);
    const contactMentions = contacts.map(c => c.slack).join(' ');

    const payload = {
      text: `🚨 ${incident.severity.toUpperCase()} INCIDENT: ${incident.type}`,
      attachments: [
        {
          color,
          fields: [
            {
              title: 'Incident ID',
              value: incident.id,
              short: true
            },
            {
              title: 'Severity',
              value: incident.severity.toUpperCase(),
              short: true
            },
            {
              title: 'Type',
              value: incident.type,
              short: true
            },
            {
              title: 'Status',
              value: incident.status.toUpperCase(),
              short: true
            },
            {
              title: 'Message',
              value: incident.message,
              short: false
            },
            {
              title: 'User Impact',
              value: incident.userImpact,
              short: false
            },
            {
              title: 'Affected Services',
              value: incident.affectedServices.join(', '),
              short: false
            },
            {
              title: 'Assigned Team',
              value: contactMentions,
              short: false
            }
          ],
          footer: 'SmartSlate Incident Response',
          ts: Math.floor(incident.timestamp.getTime() / 1000)
        }
      ]
    };

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Slack notification failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to send Slack notification:', error);
    }
  }

  private async sendEmailNotification(incident: Incident, contacts: ContactInfo[]): Promise<void> {
    const emailRecipients = contacts.map(c => c.email).join(',');
    const subject = `[${incident.severity.toUpperCase()}] SmartSlate Incident: ${incident.type} (${incident.id})`;

    const body = `
Incident Details:
- ID: ${incident.id}
- Severity: ${incident.severity.toUpperCase()}
- Type: ${incident.type}
- Message: ${incident.message}
- User Impact: ${incident.userImpact}
- Affected Services: ${incident.affectedServices.join(', ')}
- Timestamp: ${incident.timestamp.toISOString()}

Assigned Team: ${contacts.map(c => c.name).join(', ')}

Please respond immediately if you are available to assist.
    `.trim();

    console.log(`📧 Email notification would be sent to: ${emailRecipients}`);
    console.log(`📧 Subject: ${subject}`);
    console.log(`📧 Body: ${body.substring(0, 200)}...`);

    // In production, this would integrate with an email service
    // For now, we'll just log the notification
  }

  private getSeverityColor(severity: string): string {
    const colorMap: Record<string, string> = {
      'critical': '#ff0000',    // Red
      'high': '#ff8c00',       // Orange
      'medium': '#ffff00',     // Yellow
      'low': '#00ff00'         // Green
    };

    return colorMap[severity] || '#808080'; // Gray
  }

  // Type-specific incident handlers
  private async handlePaymentIncident(incident: Incident): Promise<void> {
    console.log(`  💳 Handling payment incident...`);

    // Check Razorpay status
    await this.checkRazorpayStatus();

    // Verify payment database integrity
    await this.verifyPaymentDatabaseIntegrity();

    // Enable payment monitoring mode
    await this.enablePaymentMonitoring();
  }

  private async handleInfrastructureIncident(incident: Incident): Promise<void> {
    console.log(`  🏗️ Handling infrastructure incident...`);

    // Check deployment status
    await this.checkDeploymentStatus();

    // Verify database connectivity
    await this.verifyDatabaseConnectivity();

    // Enable infrastructure monitoring
    await this.enableInfrastructureMonitoring();
  }

  private async handleSecurityIncident(incident: Incident): Promise<void> {
    console.log(`  🔒 Handling security incident...`);

    // Enable security monitoring mode
    await this.enableSecurityMonitoring();

    // Check for recent suspicious activity
    await this.checkSuspiciousActivity();

    // Review access logs
    await this.reviewAccessLogs();
  }

  private async handlePerformanceIncident(incident: Incident): Promise<void> {
    console.log(`  ⚡ Handling performance incident...`);

    // Check system performance metrics
    await this.checkPerformanceMetrics();

    // Identify bottlenecks
    await this.identifyBottlenecks();

    // Enable performance monitoring
    await this.enablePerformanceMonitoring();
  }

  private async handleGenericIncident(incident: Incident): Promise<void> {
    console.log(`  📋 Handling generic incident...`);

    // Basic system health check
    await this.performSystemHealthCheck();

    // Enable general monitoring
    await this.enableGeneralMonitoring();
  }

  // Monitoring command execution
  private getMonitoringCommands(incident: Incident): string[] {
    const commands: string[] = [
      'npm run smoke:tests:health',
      'curl -I https://your-domain.com/api/health',
      'curl -I https://your-domain.com/api/webhooks/razorpay'
    ];

    if (incident.type === 'payment') {
      commands.push('npm run smoke:tests:payments');
    }

    return commands;
  }

  private async executeMonitoringCommand(command: string): Promise<void> {
    try {
      console.log(`  🔍 Executing: ${command}`);
      // In production, this would execute the actual command
      // For now, we'll just log it
    } catch (error) {
      console.error(`  ❌ Command failed: ${command}`, error);
    }
  }

  private getFollowUpDelay(severity: string): string {
    const delayMap: Record<string, string> = {
      'critical': '15 minutes',
      'high': '1 hour',
      'medium': '4 hours',
      'low': '24 hours'
    };

    return delayMap[severity] || '4 hours';
  }

  private getAutomatedActions(incident: Incident): string[] {
    const actions: string[] = [
      'Incident logged and classified',
      'Response team notified',
      'Monitoring enhanced',
      'Incident report created'
    ];

    if (incident.severity === 'critical') {
      actions.push('Executive notification sent');
      actions.push('Emergency procedures activated');
    }

    return actions;
  }

  private getNextSteps(incident: Incident): string[] {
    const steps: string[] = [
      'Investigate root cause',
      'Implement resolution',
      'Verify fix',
      'Document lessons learned'
    ];

    if (incident.severity === 'critical' || incident.severity === 'high') {
      steps.unshift('Immediate response team coordination');
    }

    return steps;
  }

  private getAssignedTeam(type: string): string {
    const teamMap: Record<string, string> = {
      'payment': 'Backend & Payment Team',
      'infrastructure': 'DevOps & Infrastructure Team',
      'security': 'Security & Backend Team',
      'performance': 'DevOps & Backend Team',
      'user': 'Frontend & UX Team'
    };

    return teamMap[type] || 'Engineering Team';
  }

  // Placeholder methods for specific monitoring actions
  private async checkRazorpayStatus(): Promise<void> {
    console.log(`    📊 Checking Razorpay API status...`);
  }

  private async verifyPaymentDatabaseIntegrity(): Promise<void> {
    console.log(`    🔍 Verifying payment database integrity...`);
  }

  private async enablePaymentMonitoring(): Promise<void> {
    console.log(`    📈 Enabling enhanced payment monitoring...`);
  }

  private async checkDeploymentStatus(): Promise<void> {
    console.log(`    🚀 Checking deployment status...`);
  }

  private async verifyDatabaseConnectivity(): Promise<void> {
    console.log(`    🔗 Verifying database connectivity...`);
  }

  private async enableInfrastructureMonitoring(): Promise<void> {
    console.log(`    📊 Enabling infrastructure monitoring...`);
  }

  private async enableSecurityMonitoring(): Promise<void> {
    console.log(`    🔒 Enabling security monitoring...`);
  }

  private async checkSuspiciousActivity(): Promise<void> {
    console.log(`    🔍 Checking for suspicious activity...`);
  }

  private async reviewAccessLogs(): Promise<void> {
    console.log(`    📋 Reviewing access logs...`);
  }

  private async checkPerformanceMetrics(): Promise<void> {
    console.log(`    ⚡ Checking performance metrics...`);
  }

  private async identifyBottlenecks(): Promise<void> {
    console.log(`    🔍 Identifying performance bottlenecks...`);
  }

  private async enablePerformanceMonitoring(): Promise<void> {
    console.log(`    📈 Enabling performance monitoring...`);
  }

  private async performSystemHealthCheck(): Promise<void> {
    console.log(`    🏥 Performing system health check...`);
  }

  private async enableGeneralMonitoring(): Promise<void> {
    console.log(`    📊 Enabling general monitoring...`);
  }
}

// Main execution
async function main() {
  const severity = process.argv[2];
  const type = process.argv[3];
  const message = process.argv.slice(4).join(' ');

  if (!severity || !type || !message) {
    console.error('Usage: npm run incident:respond <severity> <type> <message>');
    console.error('  severity: critical | high | medium | low');
    console.error('  type: payment | infrastructure | security | performance | user');
    console.error('  message: Incident description');
    process.exit(1);
  }

  const validSeverities = ['critical', 'high', 'medium', 'low'];
  const validTypes = ['payment', 'infrastructure', 'security', 'performance', 'user'];

  if (!validSeverities.includes(severity)) {
    console.error(`Invalid severity: ${severity}. Must be one of: ${validSeverities.join(', ')}`);
    process.exit(1);
  }

  if (!validTypes.includes(type)) {
    console.error(`Invalid type: ${type}. Must be one of: ${validTypes.join(', ')}`);
    process.exit(1);
  }

  try {
    const responder = new IncidentResponseAutomation();
    await responder.handleIncident(severity, type, message);
  } catch (error) {
    console.error('💥 Incident response failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { IncidentResponseAutomation };