export default function StorageErrorBanner({ message, onDismiss }) {
  if (!message) return null

  return (
    <div
      role="alert"
      className="border-b border-border/60 bg-secondary/80 px-6 py-3 text-sm text-text sm:px-8"
    >
      <div className="mx-auto flex max-w-xl items-center justify-between gap-4">
        <p>{message}</p>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 cursor-pointer text-muted transition-colors duration-200 hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta"
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}
