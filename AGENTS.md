# AGENTS.md

## Projekt

Statická zdravotní webová aplikace pro evidenci pití a močení. Cílem je jednoduché použití na telefonu a nasazení na Pages hosting. Pro lokální vývoj a build je k dispozici Vite.

## Technicke pokyny

- Nepoužívat UI framework, pokud není důvod: aplikace je čistě `index.html`, `styles.css`, `app.js` a moduly ve `src`.
- Zachovat data v `localStorage` pod klíčem `health-fluid-log-v1`.
- Exportní formát v `src/codec.mjs` musí zůstat zpětně kompatibilní, pokud existují sdílené odkazy jen pro čtení.
- Viditelný text držet v češtině.
- Pro změny komprese nejdříve upravit nebo přidat testy v `tests/codec.test.mjs`.
- Pro změny mazání nebo identifikace záznamů nejdříve upravit nebo přidat testy v `tests/events.test.mjs`.

## Ověření

```bash
npm test
npm run build
```
