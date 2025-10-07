const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  async sendInvoiceEmail(emailData) {
    try {
      const { to, subject, customerName, billNumber, pdfPath, pdfBuffer } = emailData;

      // Read email template
      const templatePath = path.join(__dirname, '../templates/invoice-email.html');
      let htmlTemplate = fs.readFileSync(templatePath, 'utf8');

      // Compile template with handlebars
      const template = handlebars.compile(htmlTemplate);
      const htmlContent = template({
        customerName,
        billNumber,
        companyName: process.env.COMPANY_NAME || 'MERN Billing App',
        currentYear: new Date().getFullYear()
      });

      const mailOptions = {
        from: {
          name: process.env.COMPANY_NAME || 'MERN Billing App',
          address: process.env.SMTP_USER
        },
        to,
        subject: subject || `Invoice ${billNumber} from ${process.env.COMPANY_NAME || 'MERN Billing App'}`,
        html: htmlContent,
        attachments: [
          {
            filename: `invoice-${billNumber}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
          }
        ]
      };

      const result = await this.transporter.sendMail(mailOptions);
      return {
        success: true,
        messageId: result.messageId
      };
    } catch (error) {
      console.error('Error sending email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async sendEmail(emailData) {
    try {
      const { to, subject, html, text, attachments } = emailData;

      const mailOptions = {
        from: {
          name: process.env.FROM_NAME || 'MERN Billing App',
          address: process.env.SMTP_USER
        },
        to,
        subject,
        html,
        text
      };

      if (attachments && attachments.length > 0) {
        mailOptions.attachments = attachments;
      }

      const result = await this.transporter.sendMail(mailOptions);
      return {
        success: true,
        messageId: result.messageId
      };
    } catch (error) {
      console.error('Error sending email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async verifyConnection() {
    try {
      await this.transporter.verify();
      return { success: true, message: 'Email service connected successfully' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailService();
