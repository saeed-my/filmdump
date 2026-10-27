import { usePublicRecs } from '../hooks/usePublicRecs'
import RecsPage from './RecsPage'

export default function PublicRecsPage({ onSignIn }) {
  const { films, loading, error } = usePublicRecs()

  return (
    <RecsPage films={films} loading={loading} error={error} onSignIn={onSignIn} />
  )
}
