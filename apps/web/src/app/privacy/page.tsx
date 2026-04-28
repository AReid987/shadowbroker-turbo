import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Shadowbroker Turbo",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 text-slate-900">
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
        <div className="space-y-4 text-slate-600">
          <p>
            Shadowbroker Turbo collects minimal data necessary to provide real-time
            intelligence dashboard services.
          </p>
          <h2 className="text-xl font-semibold text-slate-900 mt-6">Data Collection</h2>
          <p>
            We do not collect personal identifiable information. Session tokens are
            encrypted and stored securely in your browser.
          </p>
          <h2 className="text-xl font-semibold text-slate-900 mt-6">Third-Party APIs</h2>
          <p>
            Data displayed on the dashboard is sourced from public APIs and open
            intelligence feeds. No user data is shared with third parties.
          </p>
          <h2 className="text-xl font-semibold text-slate-900 mt-6">Contact</h2>
          <p>
            For privacy inquiries, contact the system administrator.
          </p>
        </div>
      </main>
    </div>
  );
}
