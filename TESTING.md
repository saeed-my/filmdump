# Testing

100% test coverage is the key to great vibe coding. Tests let you move fast, trust your instincts, and ship with confidence. Without them, vibe coding is just yolo coding. With tests, it's a superpower.

## Stack

- Vitest 5 (runner, configured in `vite.config.js` under `test`)
- jsdom (browser environment, including `localStorage`)
- Testing Library: `@testing-library/react`, `user-event`, `jest-dom`

## Running

```bash
npm test            # run once
npm run test:watch  # re-run on change
```

## Layers

- **Unit**: pure functions in `src/lib`. Test file sits beside the source: `filmUtils.test.js`, `storage.test.js`.
- **Integration**: `src/App.test.jsx` renders the whole app and drives it like a user (search, add a film, validation).
- **Smoke / E2E**: none yet. Check real layouts with `/qa` or `/design-review` against `npm run dev`.

## Conventions

- Name tests `<source>.test.js` or `.test.jsx`, next to the file they cover.
- `describe`, `it`, `expect` and `vi` are imported explicitly from `vitest`.
- Query by role or label, the way a user finds things. Avoid test IDs and class names.
- `src/test/setup.js` clears `localStorage` and unmounts after every test, so each test starts from the seed data.
- Set the starting route with `window.history.pushState(null, '', '/path')` before `render(<App />)`.
- Assert on what the code does. Never `expect(x).toBeDefined()`.
