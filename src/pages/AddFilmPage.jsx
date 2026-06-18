import { useState } from 'react'
import BackLink from '../components/BackLink'
import FilmForm from '../components/FilmForm'
import { todayIso, validateFilmFields } from '../lib/filmUtils'

const initialValues = () => ({
  title: '',
  rating: '',
  poster: '',
  watchedDate: todayIso(),
  notes: '',
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
    <div className="mx-auto min-h-svh max-w-xl px-6 py-10 sm:max-w-2xl sm:px-8 sm:py-14 lg:max-w-3xl lg:px-12 lg:py-16">
      <BackLink onClick={onBack} />

      <header className="mt-8 mb-10">
        <h1 className="font-heading text-[clamp(2.25rem,7vw,3.5rem)] font-semibold leading-[0.95] tracking-tight text-balance text-text">
          Log a film
        </h1>
      </header>

      <FilmForm
        idPrefix="add"
        values={values}
        errors={errors}
        onChange={handleChange}
        onSubmit={handleSubmit}
        submitLabel="Save"
        isSubmitting={isSubmitting}
      />
    </div>
  )
}
