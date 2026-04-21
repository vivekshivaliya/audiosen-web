# Tailwind PostCSS Fallback

Use this only if you move away from the Vite plugin path.

## Install

```bash
npm install tailwindcss @tailwindcss/postcss postcss
```

## postcss.config.mjs

```js
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

## CSS entry

```css
@import "tailwindcss";
```
