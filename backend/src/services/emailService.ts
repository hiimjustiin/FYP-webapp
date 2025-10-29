import nodemailer, { type Transporter } from 'nodemailer';
import type { SendMailOptions } from 'nodemailer';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

interface SubmissionReceivedData {
  instructorName: string;
  studentName: string;
  projectTitle: string;
  courseName: string;
  submissionDate: string;
  dashboardUrl: string;
}

interface ScoringCompleteData {
  studentName: string;
  projectTitle: string;
  courseName: string;
  overallFeedback: string;
  dimensionScores: Array<{
    dimension: string;
    score: number;
    maxScore: number;
  }>;
  reviewUrl: string;
}

interface NotificationEmailData {
  recipientName: string;
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
}

class EmailService {
  private transporter: Transporter | null = null;
  private config: EmailConfig;
  private isConfigured: boolean = false;

  constructor() {
    this.config = {
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_PASSWORD || '',
      },
      from: process.env.EMAIL_FROM || 'ILA Platform <no-reply@ila.edu>',
    };

    this.initialize();
  }

  private initialize() {
    // Only configure if credentials are provided
    if (this.config.auth.user && this.config.auth.pass) {
      try {
        this.transporter = nodemailer.createTransport({
          host: this.config.host,
          port: this.config.port,
          secure: this.config.secure,
          auth: this.config.auth,
        });
        this.isConfigured = true;
        console.log('✅ Email service configured successfully');
      } catch (error) {
        console.warn('⚠️  Email service configuration failed:', error);
        this.isConfigured = false;
      }
    } else {
      console.warn('⚠️  Email service not configured (missing EMAIL_USER or EMAIL_PASSWORD)');
    }
  }

  private async sendEmail(options: SendMailOptions): Promise<boolean> {
    if (!this.isConfigured || !this.transporter) {
      console.warn('Email not sent: Email service not configured');
      return false;
    }

    try {
      await this.transporter.sendMail({
        from: this.config.from,
        ...options,
      });
      console.log(`✅ Email sent to ${options.to}`);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  private getBaseTemplate(title: string, content: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
          }
          .header {
            background: linear-gradient(135deg, #181C62 0%, #D71440 100%);
            padding: 30px 20px;
            text-align: center;
          }
          .header h1 {
            color: #ffffff;
            margin: 0;
            font-size: 24px;
            font-weight: 600;
          }
          .content {
            padding: 40px 30px;
          }
          .content h2 {
            color: #181C62;
            margin-top: 0;
            font-size: 20px;
          }
          .content p {
            margin: 16px 0;
          }
          .info-box {
            background-color: #f8f9fa;
            border-left: 4px solid #181C62;
            padding: 15px 20px;
            margin: 20px 0;
          }
          .info-box p {
            margin: 8px 0;
          }
          .info-label {
            font-weight: 600;
            color: #181C62;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #181C62;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
            font-weight: 600;
          }
          .button:hover {
            background-color: #252968;
          }
          .footer {
            background-color: #f8f9fa;
            padding: 20px 30px;
            text-align: center;
            font-size: 14px;
            color: #666;
          }
          .footer p {
            margin: 5px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🦉 ILA Platform</h1>
          </div>
          <div class="content">
            ${content}
          </div>
          <div class="footer">
            <p><strong>NTU DSAIR - Interdisciplinary Learning Analytics</strong></p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async sendSubmissionReceivedNotification(
    instructorEmail: string,
    data: SubmissionReceivedData
  ): Promise<boolean> {
    const content = `
      <h2>New Submission Received</h2>
      <p>Hello ${data.instructorName},</p>
      <p>A student has submitted their work for review.</p>
      
      <div class="info-box">
        <p><span class="info-label">Student:</span> ${data.studentName}</p>
        <p><span class="info-label">Project:</span> ${data.projectTitle}</p>
        <p><span class="info-label">Course:</span> ${data.courseName}</p>
        <p><span class="info-label">Submitted:</span> ${data.submissionDate}</p>
      </div>
      
      <p>You can now trigger AI analysis and review the submission from your instructor dashboard.</p>
      
      <a href="${data.dashboardUrl}" class="button">View Submission</a>
      
      <p>Best regards,<br>The ILA Team</p>
    `;

    return this.sendEmail({
      to: instructorEmail,
      subject: `New Submission: ${data.projectTitle} - ${data.courseName}`,
      html: this.getBaseTemplate('New Submission Received', content),
    });
  }

  async sendScoringCompleteNotification(
    studentEmail: string,
    data: ScoringCompleteData
  ): Promise<boolean> {
    const dimensionScoresHtml = data.dimensionScores
      .map(
        (dim) => `
        <p style="margin: 8px 0;">
          <span class="info-label">${dim.dimension}:</span> ${dim.score}/${dim.maxScore}
        </p>
      `
      )
      .join('');

    const content = `
      <h2>Your Submission Has Been Scored</h2>
      <p>Hello ${data.studentName},</p>
      <p>Your submission has been analyzed and scored. Here's a summary of your results:</p>
      
      <div class="info-box">
        <p><span class="info-label">Project:</span> ${data.projectTitle}</p>
        <p><span class="info-label">Course:</span> ${data.courseName}</p>
      </div>
      
      <h3 style="color: #181C62; margin-top: 24px;">Overall Feedback</h3>
      <p>${data.overallFeedback}</p>
      
      <h3 style="color: #181C62; margin-top: 24px;">Dimension Scores</h3>
      <div class="info-box">
        ${dimensionScoresHtml}
      </div>
      
      <p>View your detailed results and feedback in the platform.</p>
      
      <a href="${data.reviewUrl}" class="button">View Detailed Results</a>
      
      <p>Best regards,<br>The ILA Team</p>
    `;

    return this.sendEmail({
      to: studentEmail,
      subject: `Scoring Complete: ${data.projectTitle}`,
      html: this.getBaseTemplate('Scoring Complete', content),
    });
  }

  async sendGenericNotification(
    recipientEmail: string,
    data: NotificationEmailData
  ): Promise<boolean> {
    const actionButton = data.actionUrl
      ? `<a href="${data.actionUrl}" class="button">${data.actionText || 'View Details'}</a>`
      : '';

    const content = `
      <h2>${data.title}</h2>
      <p>Hello ${data.recipientName},</p>
      <p>${data.message}</p>
      
      ${actionButton}
      
      <p>Best regards,<br>The ILA Team</p>
    `;

    return this.sendEmail({
      to: recipientEmail,
      subject: data.title,
      html: this.getBaseTemplate(data.title, content),
    });
  }

  async verifyConnection(): Promise<boolean> {
    if (!this.isConfigured || !this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Email service verification failed:', error);
      return false;
    }
  }

  isEnabled(): boolean {
    return this.isConfigured;
  }
}

// Export a singleton instance
export const emailService = new EmailService();
