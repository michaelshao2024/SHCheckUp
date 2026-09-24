import { prisma } from './prisma';

/**
 * Agent Mail (agent.qq.com) integration.
 * Token pair is stored in the DB `settings` table (key: 'agentmail_tokens')
 * because refresh tokens rotate on every use — Vercel env vars alone would go stale.
 * Recipient is ADMIN_EMAIL env var; when unset, email sending is skipped.
 */

const AUTH_URL = 'https://auth.agent.qq.com/oauth/token';
const API_BASE = 'https://api.agent.qq.com';
const CLIENT_ID = 'cli_002e8cd156e0a788';
const SETTING_KEY = 'agentmail_tokens';

interface TokenPair {
  access_token: string;
  refresh_token: string;
  expires_at: number; // unix seconds
}

interface MailData {
  packageName: string;
  hospitalName: string;
  name: string;
  email: string;
  phone?: string | null;
  preferredDate?: string | null;
  message?: string | null;
}

async function loadTokens(): Promise<TokenPair | null> {
  if (!prisma) return null;
  const row = await prisma.setting.findUnique({ where: { key: SETTING_KEY } });
  if (!row) return null;
  try {
    return JSON.parse(row.value) as TokenPair;
  } catch {
    return null;
  }
}

async function saveTokens(tokens: TokenPair): Promise<void> {
  if (!prisma) return;
  await prisma.setting.upsert({
    where: { key: SETTING_KEY },
    update: { value: JSON.stringify(tokens) },
    create: { key: SETTING_KEY, value: JSON.stringify(tokens) },
  });
}

async function getAccessToken(): Promise<string | null> {
  const tokens = await loadTokens();
  if (!tokens) return null;
  // Refresh when expiring within 5 minutes
  if (tokens.expires_at - 300 > Date.now() / 1000) {
    return tokens.access_token;
  }
  const res = await fetch(AUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: tokens.refresh_token,
      client_id: CLIENT_ID,
    }).toString(),
  });
  const data = await res.json();
  if (!res.ok || !data.access_token) {
    console.error('Agent Mail token refresh failed:', res.status, JSON.stringify(data).slice(0, 200));
    return null;
  }
  const next: TokenPair = {
    access_token: data.access_token,
    refresh_token: data.refresh_token || tokens.refresh_token,
    expires_at: Math.floor(Date.now() / 1000) + (data.expires_in || 3600),
  };
  await saveTokens(next);
  return next.access_token;
}

/** Generic transactional email via Agent Mail. */
export async function sendMail(to: string, subject: string, body: string): Promise<{ ok: boolean; error?: string }> {
  const accessToken = await getAccessToken();
  if (!accessToken) return { ok: false, error: 'Agent Mail token unavailable' };

  try {
    const meRes = await fetch(`${API_BASE}/v1/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const me = await meRes.json();
    const aliasId = me?.data?.aliases?.[0]?.alias_id;
    if (!aliasId) return { ok: false, error: 'No mail alias found' };

    const url = `${API_BASE}/v1/aliases/${aliasId}/messages/send`;
    const payload = { to: [{ email: to }], subject, body };
    const headers = { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

    // Step 1: request send -> 428 with confirmation_token
    const r1 = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) });
    const d1 = await r1.json();
    const confirmationToken = d1?.error?.details?.confirmation_token || d1?.data?.confirmation_token;
    if (r1.status !== 428 || !confirmationToken) {
      if (r1.ok) return { ok: true };
      return { ok: false, error: `send step1 failed: ${r1.status} ${JSON.stringify(d1).slice(0, 200)}` };
    }

    // Step 2: confirm
    const r2 = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...payload, confirmation_token: confirmationToken }),
    });
    const d2 = await r2.json();
    if (!r2.ok || !d2?.queued) {
      return { ok: false, error: `send step2 failed: ${r2.status} ${JSON.stringify(d2).slice(0, 200)}` };
    }
    return { ok: true };
  } catch (error: any) {
    console.error('sendMail error:', error);
    return { ok: false, error: error?.message || 'Failed to send email' };
  }
}

export async function sendInquiryEmail(data: MailData): Promise<{ ok: boolean; error?: string }> {
  const to = process.env.ADMIN_EMAIL;
  if (!to) return { ok: false, error: 'ADMIN_EMAIL not configured' };

  const subject = `[Escort Inquiry] ${data.name} - ${data.packageName} (${data.hospitalName})`;
  const body = [
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
    '',
    'View in admin: https://www.sanensheng.com/admin/inquiries',
  ].join('\n');

  return sendMail(to, subject, body);
}
