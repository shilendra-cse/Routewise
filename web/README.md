# Routewise website

Product site and documentation for [Routewise](https://github.com/shilendra-cse/Routewise).

Built with Next.js, Tailwind CSS, and the App Router.

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build

```bash
npm run build
npm start
```

## Docs structure

Documentation lives in `app/docs/` as Next.js pages. Navigation is defined in `lib/navigation.ts`.

When adding a Routewise feature, update:

1. Root `README.md` (developer reference)
2. The matching page under `app/docs/`
3. `lib/navigation.ts` if adding a new section
