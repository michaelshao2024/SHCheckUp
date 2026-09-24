interface PackageCardProps {
  id: string;
  name: string;
  price: number;
  duration: string | null;
  hospitalName: string;
  avgRating: number;
  tags: string[];
}

export function PackageCard({ id, name, price, duration, hospitalName, avgRating, tags }: PackageCardProps) {
  return (
    <a href={`/packages/${id}`} className="block p-6 rounded-lg border border-border hover:border-primary transition-colors">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold">{name}</h3>
        <span className="text-lg font-bold text-primary">¥{price.toLocaleString()}</span>
      </div>
      <p className="text-sm text-muted-foreground mb-1">{hospitalName}</p>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm text-yellow-500">{'★'.repeat(Math.round(avgRating))}</span>
        <span className="text-xs text-muted-foreground">({avgRating.toFixed(1)})</span>
        {duration && <span className="text-xs text-muted-foreground">· {duration}</span>}
      </div>
      <div className="flex gap-1 flex-wrap">
        {tags.map((tag) => (
          <span key={tag} className="px-2 py-0.5 bg-muted rounded text-xs text-muted-foreground capitalize">{tag}</span>
        ))}
      </div>
    </a>
  );
}