type PagePlaceholderProps = Readonly<{
  title: string;
  description: string;
}>;

export function PagePlaceholder({ title, description }: PagePlaceholderProps) {
  return (
    <main className="page-shell">
      <section className="page-heading">
        <p className="eyebrow">MVP scaffold</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </section>
    </main>
  );
}
