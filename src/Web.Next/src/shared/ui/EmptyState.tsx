export type EmptyStateProps = {
  title: string;
  description?: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="esh-empty" role="status">
      <h2 className="esh-empty-title">{title}</h2>
      {description ? (
        <p className="esh-empty-description">{description}</p>
      ) : null}
    </div>
  );
}
