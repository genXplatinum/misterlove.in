// Runs automatically after `npm run build` (npm's "postbuild" lifecycle hook).
// Prepares the static output to work on GitHub Pages (and any static host):
//   - 404.html mirrors index.html so client-side routes resolve on deep links / refresh
//   - .nojekyll stops GitHub Pages from running Jekyll over the build output
import { copyFileSync, writeFileSync } from 'node:fs';

copyFileSync('dist/index.html', 'dist/404.html');
writeFileSync('dist/.nojekyll', '');
console.log('postbuild ✓  created dist/404.html and dist/.nojekyll');
