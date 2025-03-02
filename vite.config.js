import { defineConfig } from 'vite';
import { resolve } from 'path';
import fs from 'fs';

export default defineConfig(({ mode }) => {
  const isFirefox = mode === 'firefox';
  const manifestVersion = isFirefox ? 'v2' : 'v3';
  const outDir = isFirefox ? 'dist-firefox' : 'dist-chrome';

  return {
    build: {
      outDir,
      emptyOutDir: true,
      rollupOptions: {
        input: {
          popup: resolve(__dirname, 'src/popup.ts'),
          background: resolve(__dirname, 'src/background.ts'),
        },
        output: {
          entryFileNames: '[name].js',
        },
      },
    },
    plugins: [
      {
        name: 'copy-manifest-and-assets',
        closeBundle: async () => {
          // Ensure the output directory exists
          if (!fs.existsSync(resolve(__dirname, outDir))) {
            fs.mkdirSync(resolve(__dirname, outDir), { recursive: true });
          }

          // Copy the appropriate manifest
          const manifestPath = resolve(__dirname, `src/manifest.${manifestVersion}.json`);
          if (fs.existsSync(manifestPath)) {
            const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
            fs.writeFileSync(
              resolve(__dirname, `${outDir}/manifest.json`),
              manifestContent
            );
          } else {
            console.error(`Manifest file not found: ${manifestPath}`);
          }

          // Copy HTML files
          const htmlPath = resolve(__dirname, 'src/popup.html');
          if (fs.existsSync(htmlPath)) {
            const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
            // Update script reference to avoid Vite trying to bundle it directly from HTML
            const updatedHtmlContent = htmlContent.replace(
              /<script src=".*popup.js".*><\/script>/,
              '<script src="popup.js" type="module"></script>'
            );
            fs.writeFileSync(
              resolve(__dirname, `${outDir}/popup.html`),
              updatedHtmlContent
            );
          } else {
            console.error(`HTML file not found: ${htmlPath}`);
          }

          // Copy icons
          if (!fs.existsSync(resolve(__dirname, `${outDir}/icons`))) {
            fs.mkdirSync(resolve(__dirname, `${outDir}/icons`), { recursive: true });
          }

          const iconDir = resolve(__dirname, 'src/icons');
          if (fs.existsSync(iconDir)) {
            const iconFiles = fs.readdirSync(iconDir);
            for (const file of iconFiles) {
              fs.copyFileSync(
                resolve(__dirname, `src/icons/${file}`),
                resolve(__dirname, `${outDir}/icons/${file}`)
              );
            }
          } else {
            console.error(`Icons directory not found: ${iconDir}`);
          }
        },
      },
    ],
  };
});
