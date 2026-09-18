interface HospitalCardProps {
  id: string;
  name: string;
  description: string;
  address: string;
}

export function HospitalCard({ id, name, description, address }: HospitalCardProps) {
  return (
    <a href={`/hospitals/${id}`} className="block p-6 rounded-lg border border-border hover:border-primary transition-colors">
      <h3 className="text-lg font-semibold mb-2">{name}</h3>
      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{description}</p>
      <p className="text-xs text-muted-foreground">{address}</p>
    </a>
  );
}