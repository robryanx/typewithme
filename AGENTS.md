# Project agent guidance

## PHP style

Always wrap PHP control-structure bodies (`if`/`elseif`/`else`, `for`, `foreach`, `while`) in braces, even single-line bodies. Pretty PHP reports braceless bodies as `body has no enclosing braces` problems but still exits 0, so this is machine-enforced by `bun run lint:php` (fails on any `^` problem line), which runs as part of `bun run check`. Do not introduce new violations.

## OpenAI integration

The OpenAI API key lives only in the gitignored `.env` (`OPENAI_API_KEY`, `OPENAI_TRANSCRIBE_MODEL`). The browser never sees it: the React app records audio and posts it to `/api/transcribe`, and the PHP API forwards it to OpenAI. Never log or return the key, and never call OpenAI directly from frontend code.

## Finish-up workflow for test and code tasks

When completing any task that involves tests or code changes:

1. Run the full verification gate first: `bun run check` (oxfmt check, Pretty PHP check, Pretty PHP problem lint, oxlint, Stylelint, JS + PHP tests, PHPStan, production build). `package.json` scripts are the single entry point — use `bun run <script>`, never call composer/vendor binaries directly.
2. `bun run fix` auto-fixes what it can (oxlint + oxfmt + Pretty PHP); the rest needs a manual edit, then re-run `bun run check`.
3. Only commit when everything is green. Stage only the intended files and never commit secrets; inspect `git status` and `git diff` before committing.
4. End every task by committing and pushing: once the work is verified, commit it on the current branch and run `git push` so the remote stays in sync with local work. Do not leave completed work uncommitted.
