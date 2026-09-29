import Link from 'next/link';

/**
 * Registration incentive shown to anonymous visitors in place of gated content.
 */
export function SignUpPrompt({
  message = 'Create a free account to unlock full details.',
}: {
  message?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/40 p-6 sm:p-8 text-center">
      <h2 className="text-lg font-semibold mb-2">Members-only details</h2>
      <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">{message}</p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/register"
          className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
        >
          Create free account →
        </Link>
        <Link
          href="/login"
          className="inline-flex items-center justify-center rounded-lg border border-border px-5 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
        >
          Sign in
        </Link>
      </div>
      <p className="text-xs text-muted-foreground mt-4">
        Free to register · full prices, packages and hospital contacts included.
      </p>
    </div>
  );
}
