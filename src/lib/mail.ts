import nodemailer from 'nodemailer';

export interface InquiryEmailData {
  packageName: string;
  hospitalName: string;
  name: string;
  email: string;
  phone?: string | null;
  preferredDate?: string | null;
  message?: string | null;
}

function adminEmail(): string | undefined {
  return process.env.ADMIN_EMAIL;
}

export async function sendInquiryEmail(data: InquiryEmailData): Promise<{ ok: boolean; error?: string }> {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 465);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const to = adminEmail();

  if (!host || !user || !pass || !to) {
    return { ok: false, error: 'SMTP is not configured (SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS/ADMIN_EMAIL)' };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    const lines = [
      'New medical escort service inquiry (陪诊服务工单)',
      '',
      `Package: ${data.packageName}`,
      `Hospital: ${data.hospitalName}`,
      '',
      `Name: ${data.name}`,
      `Email: ${data.email}`,
      `Phone/WhatsApp: ${data.phone || '-'}`,
      `Preferred date: ${data.preferredDate || '-'}`,
      '',
      'Message:',
      data.message || '-',
    ];

    await transporter.sendMail({
      from: `"Shanghai HealthFinder" <${user}>`,
      to,
      replyTo: data.email,
      subject: `[Escort Inquiry] ${data.name} - ${data.packageName} (${data.hospitalName})`,
      text: lines.join('\n'),
    });
    return { ok: true };
  } catch (error: any) {
    console.error('sendInquiryEmail error:', error);
    return { ok: false, error: error?.message || 'Failed to send email' };
  }
}
