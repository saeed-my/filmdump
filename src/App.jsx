import { useEffect, useMemo } from 'react'
import { useRouter } from './hooks/useRouter'
import { useFilms } from './hooks/useFilms'
import StorageErrorBanner from './components/StorageErrorBanner'
import FilmListPage from './pages/FilmListPage'
import FilmDetailPage from './pages/FilmDetailPage'
import AddFilmPage from './pages/AddFilmPage'
import BackLink from './components/BackLink'

function NotFoundPage({ onBack }) {
  return (
    <div className="mx-auto min-h-svh max-w-xl px-6 py-10 sm:px-8 sm:py-14">
      <BackLink onClick={onBack} />
      <div className="mt-16 text-center">
        <p className="text-base text-text">Film not found.</p>
        <button
          type="button"
          onClick={onBack}
          className="mt-4 cursor-pointer text-sm text-cta transition-opacity duration-200 hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta"
        >
          Back to Films
        </button>
      </div>
    </div>
  )
}

function FilmNotFoundPage({ onBack }) {
  return (
    <div className="mx-auto min-h-svh max-w-xl px-6 py-10 sm:px-8 sm:py-14">
      <BackLink onClick={onBack} />
      <div className="mt-16 text-center">
        <p className="text-base text-text">Film not found.</p>
        <p className="mt-2 text-sm text-muted">
          It may have been removed or the link is wrong.
        </p>
      </div>
    </div>
  )
}

export default function App() {
  const { route, navigate } = useRouter()
  const {
    films,
    saveError,
    clearSaveError,
    addFilm,
    updateFilm,
    getFilmById,
  } = useFilms()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [route.view, route.id])

  const film = useMemo(() => {
    if (route.view !== 'detail') return null
    return getFilmById(route.id)
  }, [route, getFilmById])

  return (
    <>
      <StorageErrorBanner message={saveError} onDismiss={clearSaveError} />

      {route.view === 'list' ? (
        <FilmListPage
          films={films}
          onSelectFilm={(id) => navigate(`/films/${id}`)}
          onAddFilm={() => navigate('/add')}
        />
      ) : null}

      {route.view === 'add' ? (
        <AddFilmPage
          onBack={() => navigate('/')}
          onSave={(values) => addFilm(values)}
        />
      ) : null}

      {route.view === 'detail' && film ? (
        <FilmDetailPage
          key={film.id}
          film={film}
          onBack={() => navigate('/')}
          onSave={(id, values) => updateFilm(id, values)}
        />
      ) : null}

      {route.view === 'detail' && !film ? (
        <FilmNotFoundPage onBack={() => navigate('/')} />
      ) : null}

      {route.view === 'not-found' ? (
        <NotFoundPage onBack={() => navigate('/')} />
      ) : null}
    </>
  )
}
