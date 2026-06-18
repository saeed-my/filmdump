export default function PosterImage({ src, featured = false }) {
  const sizeClass = featured
    ? 'h-[4.5rem] w-[3rem] sm:h-24 sm:w-16'
    : 'h-[4.5rem] w-[3rem]'

  if (!src) {
    return (
      <div
        className={`relative shrink-0 overflow-hidden bg-secondary ${sizeClass}`}
        aria-hidden="true"
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
      />
    </div>
  )
}

export function PosterHero({ src }) {
  if (!src) {
    return (
      <div
        className="aspect-[2/3] w-full max-w-[12rem] bg-secondary sm:max-w-[14rem]"
        aria-hidden="true"
      />
    )
  }

  return (
    <img
      src={src}
      alt=""
      className="aspect-[2/3] w-full max-w-[12rem] object-cover sm:max-w-[14rem]"
    />
  )
}
