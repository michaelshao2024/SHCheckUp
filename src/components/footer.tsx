import { ExchangeRate } from './exchange-rate';

export function Footer() {
  return (
    <footer className="border-t mt-16">
      <div className="max-w-7xl mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Shanghai HealthFinder. Helping expats find the right medical checkup.</p>
        <p className="mt-2 text-xs">All prices are in CNY (¥).</p>
        <ExchangeRate />
        <div className="mt-2 flex justify-center gap-4">
          <a href="/privacy" className="underline">Privacy Policy</a>
        </div>
      </div>
    </footer>
  );
}