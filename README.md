# filmdump

A personal log of the films and shows you've watched, with ratings and notes, plus a public recommendations page you can send to friends.

- `/` is your log. Add a film, rate it out of 10, write what you thought.
- Tick **Recommend to friends** on any film and add one line on why.
- `/recs` is the public page. It shows only recommended films, their rating and that one line. Your notes and watch dates never appear there.

## Run it locally

```bash
npm install
npm run dev
```

With no setup the app runs in **local mode**: films are saved in this browser only, and `/recs` is visible only on this device.

## Connect sharing (one time, about 10 minutes)

The public page needs a database. This uses Supabase's free tier.

1. Create a project at https://supabase.com.
2. In **SQL Editor**, paste the contents of `supabase/schema.sql` and run it.
3. In **Authentication > Users**, click **Add user** and create your own email and password. This is the only account that can edit the log.
4. In **Authentication > Sign In / Providers**, turn off **Allow new users to sign up**. Skipping this lets strangers create accounts and add films to your public page.
5. In **Project Settings > API**, copy the Project URL and the `anon` public key into a new `.env.local` file (see `.env.example`).
6. Restart `npm run dev`. You now see a sign-in page; your log lives in Supabase and follows you across devices.

The log starts empty once connected. Films saved earlier in local mode stay in that browser and are not uploaded.

## Send a film to a friend

Open a film and tap **Send to a friend**. Type their name, add a note, and send the link however you like (the share sheet opens on phones). Each friend gets one private link, `/f/<code>`, that collects every film you send them. They can answer each one with **Watched it**, **Seen it before** or **Not for me**, plus a score and one line, without signing in. Their answers show under the film, and the list marks films with new replies.

Needs sharing connected. If you connected sharing before this feature existed, run the friends/sends part of `supabase/schema.sql` once more in the SQL editor. Set `VITE_OWNER_NAME` so friends see who the picks are from.

Anyone holding a friend's link can see that friend's picks and answer as them, so share it only with them. To check that strangers can't read your data, run these in the SQL editor after `set role anon;` (then `reset role;`): `select * from friends;`, `select * from sends;` and `select * from films;` should all fail with "permission denied", and `select get_friend_page('00000000000000000000000000000000');` should return null.

## Put it online

Any static host works. On Vercel:

1. Import this GitHub repo at https://vercel.com/new.
2. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` under Environment Variables.
3. Deploy. Your shareable link is `https://<your-site>/recs`.

`vercel.json` already routes every path to the app. On another host, add the equivalent "serve index.html for all paths" rule.

## Develop

```bash
npm test        # Vitest + Testing Library
npm run lint
npm run build
```

See `TESTING.md` for test conventions. Stack: React 19, Vite, Tailwind 4, Supabase.
