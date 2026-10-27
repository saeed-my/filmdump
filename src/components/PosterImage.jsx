import { useState } from 'react'

function usePosterFailed(src) {
  const [failedSrc, setFailedSrc] = useState(null)
  return [!src || failedSrc === src, () => setFailedSrc(src)]
}

function PosterFallback({ title, className }) {
  return (
    <div
      className={`flex items-center justify-center bg-secondary font-heading text-text/60 ${className}`}
      aria-hidden="true"
    >
      {title?.trim().charAt(0).toUpperCase()}
    </div>
  )
}

export default function PosterImage({ src, title, featured = false }) {
  const [failed, onError] = usePosterFailed(src)
  const sizeClass = featured
    ? 'h-[4.5rem] w-[3rem] sm:h-24 sm:w-16'
    : 'h-[4.5rem] w-[3rem]'

  if (failed) {
    return (
      <PosterFallback
        title={title}
        className={`shrink-0 text-2xl ${sizeClass}`}
      />
    )
  }

  return (
    <div className={`relative shrink-0 overflow-hidden bg-secondary ${sizeClass}`}>
      <img
        src={src}
        alt=""
        className="h-full w-full object-cover"
        loading="lazy"
        onError={onError}
      />
    </div>
  )
}

export function PosterHero({ src, title }) {
  const [failed, onError] = usePosterFailed(src)

  if (failed) {
    return (
      <PosterFallback
        title={title}
        className="aspect-[2/3] w-full max-w-[12rem] text-7xl sm:max-w-[14rem]"
      />
    )
  }

  return (
    <img
      src={src}
      alt=""
      className="aspect-[2/3] w-full max-w-[12rem] bg-secondary object-cover sm:max-w-[14rem]"
      onError={onError}
    />
  )
}
