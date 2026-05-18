# Evidence pití a močení

Jednoduchá zdravotní webová aplikace pro denní evidenci příjmu tekutin a močení. Motivace je praktická: při zdravotních potížích může být důležité rychle zaznamenat, kdy člověk pil, kolik tekutin přijal a kdy se objevilo močení se silným nebo slabým nutkáním.

## Funkce

- rychlé zadání: pivo 0,5 l, voda 0,5 l, káva 30 ml
- rychlé zadání močení: silné nutkání nebo slabé nutkání
- smazání omylem zadaného záznamu
- uložení do `localStorage` prohlížeče
- denní graf po hodinách 0-24
- kladná osa Y pro příjem tekutin, záporná osa Y pro počet močení
- export jen pro čtení přes krátký URL parametr `?d=...`
- Vite build pro nasazení na GitHub Pages

## Export dat

Export obsahuje pouze data pro vybraný den. Payload je binární a poté překódovaný do base64url:

- 2 bajty: index dne od `2020-01-01`
- 1 bajt na záznam: horní 3 bity typ události, dolních 5 bitů hodina 0-23

Odkaz jen pro čtení neukládá data do prohlížeče příjemce a skryje vstupní tlačítka.

## Spuštění

Pro lokální vývoj:

```bash
npm install
npm run dev
```

Produkce pro Pages hosting:

```bash
npm run build
npm run preview
```

Vite generuje statický výstup do `dist`, který je vhodný pro statický hosting.

Test komprese:

```bash
npm test
```

## GitHub Pages

Workflow `.github/workflows/pages.yml` při pushi do větve `main` spustí testy, build a nasadí obsah `dist` na GitHub Pages.
