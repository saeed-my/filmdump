export default function FabAdd({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Log a film"
      className="fixed bottom-6 right-6 z-40 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-cta text-lg font-semibold text-white shadow-md transition-opacity duration-200 hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta sm:bottom-8 sm:right-8"
    >
      +
    </button>
  )
}
