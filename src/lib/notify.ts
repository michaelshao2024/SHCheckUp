export interface InquiryNotifyData {
  packageName: string;
  hospitalName: string;
  name: string;
  email: string;
  phone?: string | null;
  preferredDate?: string | null;
  message?: string | null;
}

/**
 * Notify the admin about a new inquiry via a free webhook channel.
 * Supported providers (NOTIFY_PROVIDER env):
 *   - wecom    (企业微信群机器人, default): NOTIFY_WEBHOOK_URL = robot webhook URL
 *   - dingtalk (钉钉群机器人):            NOTIFY_WEBHOOK_URL = robot webhook URL
 *   - telegram (Telegram bot):            NOTIFY_WEBHOOK_URL = https://api.telegram.org/bot<token>/sendMessage
 *                                          NOTIFY_CHAT_ID = target chat id
 * Does nothing when NOTIFY_WEBHOOK_URL is not set.
 */
export async function notifyAdminInquiry(data: InquiryNotifyData): Promise<void> {
  const url = process.env.NOTIFY_WEBHOOK_URL;
  if (!url) return;

  const provider = (process.env.NOTIFY_PROVIDER || 'wecom').toLowerCase();
  const text = [
    '[新陪诊工单 / New Escort Inquiry]',
    `Package: ${data.packageName}`,
    `Hospital: ${data.hospitalName}`,
    `Name: ${data.name}`,
    `Email: ${data.email}`,
    `Phone/WhatsApp: ${data.phone || '-'}`,
    `Preferred date: ${data.preferredDate || '-'}`,
    `Message: ${data.message || '-'}`,
  ].join('\n');

  try {
    if (provider === 'telegram') {
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: process.env.NOTIFY_CHAT_ID, text }),
      });
    } else {
      // wecom & dingtalk share the same text message payload
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ msgtype: 'text', text: { content: text } }),
      });
    }
  } catch (error) {
    console.error('notifyAdminInquiry error:', error);
  }
}
