import { useEffect, useId, useRef } from 'react'
import { motion, useDragControls, useReducedMotion } from 'motion/react'
import { shouldDismissSheet } from '../lib/gesture'

// Opening is tap-initiated, so it settles without overshoot (damping 1.0).
const OPEN_SPRING = { type: 'spring', bounce: 0, duration: 0.4 }

export default function Sheet({ title, onClose, children }) {
  const titleId = useId()
  const reduceMotion = useReducedMotion()
  const dragControls = useDragControls()
  const panelRef = useRef(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    panelRef.current?.focus()

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onCloseRef.current()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = overflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  const panelMotion = reduceMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.2 },
      }
    : {
        initial: { y: '100%' },
        animate: { y: 0 },
        exit: { y: '100%' },
        transition: OPEN_SPRING,
      }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <motion.div
        aria-hidden="true"
        className="sheet-scrim absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        onClick={onClose}
      />

      <motion.section
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="sheet relative flex max-h-[calc(100svh-2.5rem)] w-full max-w-2xl flex-col rounded-t-[1.75rem] outline-none"
        {...panelMotion}
        drag={reduceMotion ? false : 'y'}
        dragListener={false}
        dragControls={dragControls}
        dragConstraints={{ top: 0, bottom: 0 }}
        // 1:1 downwards, stiff rubber band upwards
        dragElastic={{ top: 0.04, bottom: 1 }}
        // a released sheet springs home with a little give (damping ~0.8)
        dragTransition={{ bounceStiffness: 420, bounceDamping: 34 }}
        onDragEnd={(_event, info) => {
          const height = panelRef.current?.offsetHeight || window.innerHeight
          const dismiss = shouldDismissSheet({
            offset: info.offset.y,
            velocity: info.velocity.y,
            height,
          })
          if (dismiss) onClose()
        }}
      >
        <div
          className="shrink-0 cursor-grab touch-none select-none px-4 pt-2 active:cursor-grabbing"
          onPointerDown={(event) => dragControls.start(event)}
        >
          <div
            aria-hidden="true"
            className="mx-auto h-[5px] w-9 rounded-full bg-text/25"
          />
          <div className="grid grid-cols-[1fr_auto_1fr] items-center pt-1">
            <button
              type="button"
              onClick={onClose}
              onPointerDown={(event) => event.stopPropagation()}
              className="press justify-self-start min-h-11 cursor-pointer px-2 text-base text-tint focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta"
            >
              Cancel
            </button>
            <h2
              id={titleId}
              className="text-[1.0625rem] font-semibold tracking-[-0.01em] text-text"
            >
              {title}
            </h2>
            <span />
          </div>
        </div>

        <div className="overflow-y-auto overscroll-contain px-6 pt-4 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-8">
          {children}
        </div>
      </motion.section>
    </div>
  )
}
