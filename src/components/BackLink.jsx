export default function BackLink({ onClick, label = 'Films' }) {
  return (
    <a
      href="/"
      onClick={(event) => {
        event.preventDefault()
        onClick()
      }}
      className="inline-flex min-h-11 min-w-11 items-center gap-1.5 text-sm text-muted transition-colors duration-200 hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta"
    >
      <span aria-hidden="true">←</span>
      {label}
    </a>
  )
}
