export type ErrorStateProps = {
  title?: string;
  message?: string;
};

/**
 * Presentation-only error chrome mirroring `Views/Shared/Error.cshtml`.
 */
export function ErrorState({
  title = "Error.",
  message = "An error occurred while processing your request.",
}: ErrorStateProps) {
  return (
    <div className="esh-error" role="alert">
      <h1 className="text-danger">{title}</h1>
      <h2 className="text-danger">{message}</h2>
    </div>
  );
}
