import { useEffect, useId, useState } from 'react'
import { searchTitles } from '../lib/posterSearch'

const SEARCH_DELAY_MS = 400

export default function TitleField({
  id,
  value,
  onChange,
  onPick,
  className,
  ...inputProps
}) {
  const listId = useId()
  const [results, setResults] = useState({ query: '', items: [] })
  const [open, setOpen] = useState(false)
  const query = value.trim()

  useEffect(() => {
    if (!open || query.length < 2) return
    const controller = new AbortController()
    const timer = setTimeout(() => {
      searchTitles(query, { signal: controller.signal }).then((items) => {
        if (!controller.signal.aborted) setResults({ query, items })
      })
    }, SEARCH_DELAY_MS)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query, open])

  // Only show results that belong to what is typed right now.
  const items = open && results.query === query ? results.items : []

  return (
    <div className="relative">
      <input
        id={id}
        type="text"
        autoComplete="off"
        value={value}
        onChange={(event) => {
          onChange(event.target.value)
          setOpen(true)
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && items.length > 0) {
            event.stopPropagation()
            setOpen(false)
          }
        }}
        onBlur={() => setOpen(false)}
        aria-controls={items.length > 0 ? listId : undefined}
        aria-expanded={items.length > 0}
        className={className}
        {...inputProps}
      />

      {items.length > 0 ? (
        <ul
          id={listId}
          aria-label="Suggestions"
          className="suggestions absolute inset-x-0 top-full z-20 mt-1.5 max-h-80 overflow-y-auto rounded-xl p-1"
        >
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                aria-label={`${item.title}, ${item.subtitle}`}
                // keep focus in the field so the list doesn't close before the tap lands
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onPick(item)
                  setOpen(false)
                }}
                className="press flex w-full cursor-pointer items-center gap-3 rounded-lg p-2 text-left hover:bg-text/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cta"
              >
                <img
                  src={item.poster}
                  alt=""
                  loading="lazy"
                  className="h-14 w-10 shrink-0 rounded-[3px] bg-primary object-cover"
                />
                <span className="min-w-0">
                  <span className="block truncate text-[0.9375rem] font-medium text-text">
                    {item.title}
                  </span>
                  <span className="block truncate text-xs tracking-[0.01em] text-muted">
                    {item.subtitle}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
