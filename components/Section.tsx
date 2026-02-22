import { ReactNode } from "react";

type SectionProps = {
  children: ReactNode;
  className?: string;
  id?: string;
};

export function Section({ children, className = "", id }: SectionProps) {
  return (
    <section id={id} className={`py-12 md:py-16 ${className}`}>
      {children}
    </section>
  );
}

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  centered?: boolean;
};

export function SectionHeader({ title, subtitle, centered = false }: SectionHeaderProps) {
  return (
    <div className={`mb-8 ${centered ? "text-center" : ""}`}>
      <h2 className="text-2xl md:text-3xl font-extrabold text-text">{title}</h2>
      {subtitle && <p className="mt-2 text-textMuted max-w-2xl mx-auto">{subtitle}</p>}
    </div>
  );
}
