import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Privacy Policy' };

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 prose prose-sm">
      <h1>Privacy Policy</h1>
      <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

      <h2>1. Data Controller</h2>
      <p>Shanghai HealthFinder operates this website. All data is processed and stored on servers in the European Union (阿里云 eu-central-1, Frankfurt).</p>

      <h2>2. Data We Collect</h2>
      <ul>
        <li><strong>Account data:</strong> Name, email, Google account ID (if you sign in with Google)</li>
        <li><strong>Profile data:</strong> Your reviews, ratings, and service inquiries</li>
        <li><strong>Usage data:</strong> Anonymous search queries, page visits (with consent)</li>
      </ul>

      <h2>3. Purpose & Legal Basis</h2>
      <ul>
        <li>Provide search and comparison services (performance of contract)</li>
        <li>Communicate about your service inquiries (legitimate interest)</li>
        <li>Improve our service with analytics (consent)</li>
      </ul>

      <h2>4. Data Sharing</h2>
      <p>We do not sell your data. We may share your inquiry data with the hospital you selected, only with your explicit consent.</p>

      <h2>5. Your Rights (GDPR)</h2>
      <ul>
        <li><strong>Access:</strong> Request a copy of your data</li>
        <li><strong>Rectification:</strong> Correct inaccurate data</li>
        <li><strong>Erasure:</strong> Request deletion of your data</li>
        <li><strong>Portability:</strong> Export your data in JSON format</li>
        <li><strong>Withdraw consent:</strong> At any time, without affecting lawfulness of prior processing</li>
      </ul>
      <p>To exercise these rights, contact us through the inquiry form on the site.</p>

      <h2>6. Cookies</h2>
      <p>Essential cookies are required for authentication and basic site functionality. Analytics cookies are only placed with your consent via the cookie banner.</p>

      <h2>7. Data Retention</h2>
      <p>Account data is retained until you request deletion. Inactive accounts are anonymized after 2 years.</p>

      <h2>8. Contact</h2>
      <p>For privacy-related inquiries, please submit a request through our service inquiry form.</p>
    </div>
  );
}