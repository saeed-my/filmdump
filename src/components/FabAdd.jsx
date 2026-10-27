export default function FabAdd({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Log a film"
      className="fixed right-6 bottom-[max(1.5rem,env(safe-area-inset-bottom))] z-40 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-cta text-2xl font-semibold text-white fab press hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta sm:bottom-8 sm:right-8"
    >
      +
    </button>
  )
}
