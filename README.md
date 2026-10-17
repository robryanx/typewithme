# typewithme

A typing-practice site for kids: speak your text (OpenAI `gpt-transcribe` turns it into writing), then type it out — correct characters turn green, mistakes turn red — and copy only the correctly typed part into your game chat.

Built with React + Vite + TypeScript on the front and a small PHP JSON API on the back, same stack as [iknowthings](../iknowthings).

## How it works

1. Tap the microphone and speak (e.g. "good game everyone, well played"). The browser records and posts the audio to `/typewithme/api/transcribe`.
2. The PHP API forwards the audio to OpenAI's speech-to-text endpoint using the server-side key, and returns the transcript.
3. The transcript appears greyed-out. Every keystroke is compared character by character: green means correct, red means a mistake (fix it with backspace).
4. **Copy my correct text** copies only the contiguous correctly-typed prefix — the part the kid actually got right — ready to paste into an online game.

The OpenAI key never reaches the browser; only `.env` on the server holds it.

## Run locally (recommended)

Install dependencies:

```bash
bun install
composer install
```

Add the OpenAI key:

```bash
cp .env.example .env   # then edit .env and paste your key
```

Build React and serve the complete site from PHP:

```bash
bun run serve
```

Open `http://localhost:8000`.

## Frontend development

For Vite hot reload, start the PHP API in one terminal:

```bash
bun run api
```

Then run `bun run dev` in another and open `http://localhost:5173` (API calls are proxied).

## Linting and static analysis

TypeScript is typechecked with `tsc --noEmit` (strict) and unit-tested with `bun test` (no transform step — Bun runs TS natively).

JS is linted with Oxlint and formatted with Oxfmt (single quotes, width 120). CSS is linted with Stylelint (`stylelint-config-standard`) and also formatted with Oxfmt. PHP is formatted with Pretty PHP (versioned PHAR at `bin/pretty-php.phar`, v0.4.95), typechecked with PHPStan (level 5), and tested with PHPUnit 12. All tasks run through `package.json` — `bun run <script>` is the single entry point:

```bash
bun run lint          # oxlint: JS lint
bun run lint:css      # stylelint: stylesheet lint
bun run lint:php      # Pretty PHP: braceless-body problem lint
bun run format        # oxfmt: reformat JS/CSS in place
bun run format:php    # Pretty PHP: reformat PHP in place
bun run stan          # PHPStan level 5
bun run fix           # auto-fix what oxlint + oxfmt + Pretty PHP can
```

The full verification gate is a single command:

```bash
bun run check
```

That runs oxfmt check, Pretty PHP check, oxlint, Stylelint, JS + PHP tests, PHPStan, and the production build.

## End-to-end sanity test

Cypress drives the full practice flow by injecting text through the Cypress-only `typewithme:practice` event (the app registers the listener only when Cypress is driving the browser): green characters, mistakes fixed with backspace, and copying only the correct prefix. No OpenAI call is involved.

```bash
bun run test:e2e:ci
```

For an interactive run, serve the app (`bun run serve`) and use `bun run test:e2e:open`.

Cypress needs browser system libraries. On Arch:

```bash
sudo pacman -S --needed gtk3 nss alsa-lib libxss libxtst xorg-server-xvfb
```

## Deployment (nginx under robserver.me)

The site lives at `https://robserver.me/typewithme` (no trailing slash — requests with one are redirected) inside the existing managed vhost. One command as root installs the location blocks:

```bash
sudo ./ops/install-nginx-site.sh
```

That copies `ops/nginx/robserver.me-typewithme.conf` to `/etc/nginx/typewithme.conf`, adds a single include line to `/var/www/vhosts/servers.conf` (backing it up first), grants the `http` user traversal via ACLs, and reloads nginx. The TLS certificate is the one already configured for robserver.me. After any frontend change, run `bun run build`.

Voice uploads raise body-size limits inside the API location (`client_max_body_size 26m`, plus `upload_max_filesize`/`post_max_size` via `PHP_VALUE`), so recordings up to 25 MB — OpenAI's own cap — pass through.

## API routes

- `GET /typewithme/api/health` — liveness check.
- `POST /typewithme/api/transcribe` — multipart field `audio` (webm/wav/mp3 recording); returns `{"text": "..."}` or `{"error": "..."}` with a 4xx/5xx status.
