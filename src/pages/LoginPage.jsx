import { useState } from 'react'
import BackLink from '../components/BackLink'
import { supabase } from '../lib/supabase'

const fieldClass =
  'w-full rounded-md border border-border bg-background px-3 py-2.5 text-base text-text transition-colors duration-200 placeholder:text-muted focus:border-cta focus:outline-none focus:ring-2 focus:ring-cta/30'

const labelClass = 'mb-1.5 block text-sm font-medium text-text'

export default function LoginPage({ onBack, onSignedIn }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    setIsSubmitting(false)

    if (signInError) {
      setError('Wrong email or password.')
      return
    }
    onSignedIn()
  }

  return (
    <div className="mx-auto min-h-svh max-w-xl px-6 py-10 sm:px-8 sm:py-14">
      <BackLink onClick={onBack} label="Recommendations" />

      <header className="mt-8 mb-10">
        <h1 className="font-heading text-[clamp(2.25rem,7vw,3.5rem)] font-semibold leading-[0.95] tracking-tight text-text">
          Sign in
        </h1>
      </header>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div>
          <label htmlFor="login-email" className={labelClass}>
            Email
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="login-password" className={labelClass}>
            Password
          </label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={fieldClass}
          />
        </div>

        {error ? (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="min-h-11 cursor-pointer rounded-md bg-cta px-5 py-2.5 text-sm font-semibold text-white transition-opacity duration-200 hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cta disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
