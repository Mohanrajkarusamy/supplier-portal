import nodemailer from 'nodemailer';

export interface EmailResult {
  success: boolean;
  error?: string;
  isSimulation?: boolean;
}

export async function sendServerEmail(
  to: string,
  subject: string,
  text: string,
  html?: string
): Promise<EmailResult> {
  const host = process.env.SMTP_HOST ? process.env.SMTP_HOST.trim() : undefined;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT.trim(), 10) : 587;
  const user = process.env.SMTP_USER ? process.env.SMTP_USER.trim() : undefined;
  const pass = process.env.SMTP_PASS ? process.env.SMTP_PASS.trim() : undefined;
  const from = process.env.SMTP_FROM ? process.env.SMTP_FROM.trim() : 'no-reply@company.com';
  const secure = (process.env.SMTP_SECURE ? process.env.SMTP_SECURE.trim() : 'false') === 'true' || port === 465;

  if (!host || !user || !pass) {
    console.warn(`SMTP credentials not fully configured in environment variables. SMTP_HOST=${host || 'undefined'}, SMTP_PORT=${port}, SMTP_USER=${user || 'undefined'}, SMTP_PASS=${pass ? 'present' : 'undefined'}. Running in EMAIL SIMULATION MODE.`);
    console.log(`\n================= EMAIL SIMULATION =================`);
    console.log(`To:      ${to}`);
    console.log(`CC:      sqasakthi@gmail.com`);
    console.log(`From:    ${from}`);
    console.log(`Subject: ${subject}`);
    console.log(`Content:\n${text}`);
    console.log(`====================================================\n`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true, isSimulation: true };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });

    const mailOptions = {
      from: `"${process.env.SMTP_FROM_NAME || 'SAKTHI Partner Hub'}" <${from}>`,
      to,
      cc: 'sqasakthi@gmail.com',
      subject,
      text,
      html: html || text.replace(/\n/g, '<br>'),
    };

    console.log(`Sending real email via SMTP to: ${to}...`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully: ${info.messageId}`);
    return { success: true, isSimulation: false };
  } catch (error: any) {
    console.error("SMTP Email sending failed:", error);
    return { success: false, error: error.message || "Unknown SMTP error occurred" };
  }
}
