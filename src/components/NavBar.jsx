export default function NavBar({ title, collapsed, left = null, right = null }) {
  return (
    <div
      className={[
        'nav-bar sticky top-0 z-30 -mx-6 flex h-14 items-center gap-2 px-4 sm:-mx-8 sm:px-6 lg:-mx-12 lg:px-10',
        collapsed ? 'nav-bar--material' : '',
      ].join(' ')}
    >
      {left ? <div className="flex shrink-0 items-center">{left}</div> : null}
      <p
        aria-hidden="true"
        className={[
          'min-w-0 flex-1 truncate text-[1.0625rem] font-semibold tracking-[-0.01em] text-text transition-opacity duration-200',
          left ? 'text-center' : 'pl-2',
          collapsed ? 'opacity-100' : 'opacity-0',
        ].join(' ')}
      >
        {title}
      </p>
      <div className="flex shrink-0 items-center justify-end gap-1">{right}</div>
    </div>
  )
}
