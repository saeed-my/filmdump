import { useState } from 'react'
import FilmForm from '../components/FilmForm'
import Sheet from '../components/Sheet'
import { todayIso, validateFilmFields } from '../lib/filmUtils'

const initialValues = () => ({
  title: '',
  rating: '',
  poster: '',
  watchedDate: todayIso(),
  notes: '',
  recommended: false,
  recommendNote: '',
})

export default function AddFilmPage({ onBack, onSave }) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (field, value) => {
    setValues((current) => ({ ...current, [field]: value }))
    if (errors[field]) {
      setErrors((current) => {
        const next = { ...current }
        delete next[field]
        return next
      })
    }
  }

  const handleSubmit = async () => {
    const { errors: nextErrors, values: normalized } = validateFilmFields(values)
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setIsSubmitting(true)
    const savedId = await onSave(normalized)
    setIsSubmitting(false)

    if (savedId) {
      onBack()
    }
  }

  return (
    <Sheet title="Log a film" onClose={onBack}>
      <FilmForm
        idPrefix="add"
        values={values}
        errors={errors}
        onChange={handleChange}
        onSubmit={handleSubmit}
        submitLabel="Save"
        isSubmitting={isSubmitting}
      />
    </Sheet>
  )
}
