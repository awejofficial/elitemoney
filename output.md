shivanaidu@MacBook-Air Personal Expense & Income Tracker App % npm audit fix --force
npm warn using --force Recommended protections disabled.

up to date, audited 892 packages in 2s

166 packages are looking for funding
  run `npm fund` for details

# npm audit report

braces  <3.0.3
Severity: high
Uncontrolled resource consumption in braces - https://github.com/advisories/GHSA-grv7-fg5c-xmjg
fix available via `npm audit fix`
node_modules/watchpack-chokidar2/node_modules/braces
node_modules/webpack/node_modules/braces
  chokidar  1.3.0 - 2.1.8
  Depends on vulnerable versions of anymatch
  Depends on vulnerable versions of braces
  Depends on vulnerable versions of readdirp
  node_modules/watchpack-chokidar2/node_modules/chokidar
    watchpack-chokidar2  *
    Depends on vulnerable versions of chokidar
    node_modules/watchpack-chokidar2
      watchpack  1.7.2 - 1.7.5
      Depends on vulnerable versions of watchpack-chokidar2
      node_modules/watchpack
        webpack  2.0.0-beta - 5.1.0
        Depends on vulnerable versions of micromatch
        Depends on vulnerable versions of node-libs-browser
        Depends on vulnerable versions of terser-webpack-plugin
        Depends on vulnerable versions of watchpack
        node_modules/webpack
          terser-webpack-plugin  <=5.3.16
          Depends on vulnerable versions of serialize-javascript
          Depends on vulnerable versions of webpack
          node_modules/terser-webpack-plugin
          workbox-webpack-plugin  5.0.0-alpha.0 - 6.0.0-rc.0
          Depends on vulnerable versions of webpack
          Depends on vulnerable versions of workbox-build
          node_modules/workbox-webpack-plugin
            next-pwa  2.1.0 - 3.1.5
            Depends on vulnerable versions of workbox-webpack-plugin
            node_modules/next-pwa
  micromatch  <=4.0.7
  Depends on vulnerable versions of braces
  node_modules/watchpack-chokidar2/node_modules/micromatch
  node_modules/webpack/node_modules/micromatch
    anymatch  1.2.0 - 2.0.0
    Depends on vulnerable versions of micromatch
    node_modules/watchpack-chokidar2/node_modules/anymatch
    readdirp  2.2.0 - 2.2.1
    Depends on vulnerable versions of micromatch
    node_modules/watchpack-chokidar2/node_modules/readdirp

ejs  <=3.1.9
Severity: critical
ejs template injection vulnerability - https://github.com/advisories/GHSA-phwq-j96m-2c2q
ejs lacks certain pollution protection - https://github.com/advisories/GHSA-ghr5-ch3p-vcr6
fix available via `npm audit fix`
node_modules/ejs
  @surma/rollup-plugin-off-main-thread  <=2.1.0
  Depends on vulnerable versions of ejs
  node_modules/@surma/rollup-plugin-off-main-thread
    workbox-build  5.0.0-alpha.0 - 7.0.0
    Depends on vulnerable versions of @surma/rollup-plugin-off-main-thread
    Depends on vulnerable versions of rollup
    Depends on vulnerable versions of rollup-plugin-terser
    node_modules/workbox-build

elliptic  *
Elliptic Uses a Cryptographic Primitive with a Risky Implementation - https://github.com/advisories/GHSA-848j-6mx2-7j84
fix available via `npm audit fix`
node_modules/elliptic
  browserify-sign  >=2.4.0
  Depends on vulnerable versions of elliptic
  node_modules/browserify-sign
    crypto-browserify  >=3.4.0
    Depends on vulnerable versions of browserify-sign
    Depends on vulnerable versions of create-ecdh
    node_modules/crypto-browserify
      node-libs-browser  0.4.2 || >=1.0.0
      Depends on vulnerable versions of crypto-browserify
      node_modules/node-libs-browser
  create-ecdh  *
  Depends on vulnerable versions of elliptic
  node_modules/create-ecdh


rollup  <=2.79.2
Severity: high
DOM Clobbering Gadget found in rollup bundled scripts that leads to XSS - https://github.com/advisories/GHSA-gcx4-mw62-g8wm
Rollup 4 has Arbitrary File Write via Path Traversal - https://github.com/advisories/GHSA-mw96-cpmx-2vgc
fix available via `npm audit fix`
node_modules/rollup

serialize-javascript  <=7.0.2
Severity: high
Serialize JavaScript is Vulnerable to RCE via RegExp.flags and Date.prototype.toISOString() - https://github.com/advisories/GHSA-5c6j-r48x-rmvq
fix available via `npm audit fix`
node_modules/serialize-javascript
  rollup-plugin-terser  3.0.0 || >=4.0.4
  Depends on vulnerable versions of serialize-javascript
  node_modules/rollup-plugin-terser

22 vulnerabilities (5 low, 3 moderate, 11 high, 3 critical)

To address all issues, run:
  npm audit fix
shivanaidu@MacBook-Air Personal Expense & Income Tracker App % 