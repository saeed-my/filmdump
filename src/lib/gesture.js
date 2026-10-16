// Where a flick would come to rest, using Apple's deceleration projection
// from "Designing Fluid Interfaces" (WWDC 2018). Velocity is in px/s.
export function project(velocity, decelerationRate = 0.998) {
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate)
}

// Dismiss when the drag, carried forward by its momentum, would land past
// half the sheet. An upward flick projects backwards and keeps it open.
export function shouldDismissSheet({ offset, velocity, height }) {
  return offset + project(velocity) > height / 2
}
