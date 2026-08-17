export type LoadingStateProps = {
  message?: string;
};

export function LoadingState({ message = "Loading..." }: LoadingStateProps) {
  return (
    <div className="preloading" role="status" aria-live="polite">
      {message}
    </div>
  );
}
