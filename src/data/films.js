// Posters are left empty so they're looked up automatically.
export const films = [
  { id: 1, title: 'The Godfather', rating: 9.2, poster: '' },
  { id: 2, title: 'Parasite', rating: 8.5, poster: '' },
  { id: 3, title: 'Blade Runner 2049', rating: 8.0, poster: '' },
  { id: 4, title: 'Spirited Away', rating: 8.6, poster: '' },
  { id: 5, title: 'Mad Max: Fury Road', rating: 8.1, poster: '' },
  { id: 6, title: 'Moonlight', rating: 7.4, poster: '' },
  { id: 7, title: 'Arrival', rating: 7.9, poster: '' },
  { id: 8, title: 'The Grand Budapest Hotel', rating: 8.1, poster: '' },
  { id: 9, title: 'Dune: Part Two', rating: 8.4, poster: '' },
  { id: 10, title: 'Past Lives', rating: 8.0, poster: '' },
]

// Poster links shipped with the first version of the sample films. Most now
// 404 and Moonlight's pointed at the wrong film, so saved copies are cleared
// and refilled.
export const retiredSeedPosters = new Set(
  [
    '3bhodj131nE4FTzw6ZTDL9cBh3aa',
    '7IiTTgloJzvGI1TAYXlTkzx2sdu',
    'gajva2L0rPYkEWjzgFl3X0FUx4',
    '39wmItIWsg5sZMyRUHLkWBcuVCM',
    'hA2ple9q4qnwxp3hKVkAuvqsAuo',
    '49WJfeN0moxb9IPfGn8AIqMGskD',
    'x2FJsf1ElAgr63Y3PNPtLRCxsOD',
    'eWdyYQreja4JGCzqAJpQb2Da2h4',
    '1pdfLvkbp9I5szKDjNtmV47x9R',
    'kSX6er0S4i4G4sLNaVLm6uk2A6L',
  ].map((path) => `https://image.tmdb.org/t/p/w500/${path}.jpg`),
)
