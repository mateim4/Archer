// ESM PostCSS configuration for Vite
import tailwindcss from '@tailwindcss/postcss'
import autoprefixer from 'autoprefixer'

// PostCSS configuration for Vite (ESM)
export default {
  plugins: [
    tailwindcss(),
    autoprefixer(),
  ],
};
