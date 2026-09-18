export function Navbar() {
  return (
    <nav className="border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <a href="/" className="text-xl font-bold text-primary">Shanghai HealthFinder</a>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <a href="/login" className="hover:text-foreground">Sign In</a>
        </div>
      </div>
    </nav>
  );
}