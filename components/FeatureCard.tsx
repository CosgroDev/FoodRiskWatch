type FeatureCardProps = {
  title: string;
  description: string;
  icon?: React.ReactNode;
};

export function FeatureCard({ title, description, icon }: FeatureCardProps) {
  return (
    <div className="card p-5 hover:shadow-pop transition-shadow duration-200">
      {icon && <div className="mb-3 text-primary">{icon}</div>}
      <h3 className="text-lg font-bold text-text mb-2">{title}</h3>
      <p className="text-textMuted text-sm leading-relaxed">{description}</p>
    </div>
  );
}
