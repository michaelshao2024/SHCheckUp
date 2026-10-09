import { JciBadge } from './jci-badge';

interface HospitalCardProps {
  id: string;
  name: string;
  description?: string;
  address: string;
  jciAccredited?: boolean;
}

export function HospitalCard({ id, name, description, address, jciAccredited }: HospitalCardProps) {
  return (
    <a href={`/hospitals/${id}`} className="block p-6 rounded-lg border border-border hover:border-primary transition-colors">
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="text-lg font-semibold">{name}</h3>
        {jciAccredited && <JciBadge size="sm" />}
      </div>
      {description && <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{description}</p>}
      <p className="text-xs text-muted-foreground">{address}</p>
    </a>
  );
}