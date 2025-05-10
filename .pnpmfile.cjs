// .pnpmfile.cjs

/**
 * This is a safe starter scaffold for pnpm dependency overrides.
 * Nothing is modified unless you uncomment and apply logic.
 */

module.exports = {
    hooks: {
      readPackage(pkg) {
        // 🔒 Example: Force a specific sub-dependency version
        // if (pkg.name === 'react-pdf') {
        //   pkg.dependencies['pdfjs-dist'] = '^3.11.174';
        // }
  
        // 📦 Example: Patch peerDependencies
        // if (pkg.name === 'some-legacy-lib') {
        //   pkg.peerDependencies = {
        //     ...pkg.peerDependencies,
        //     react: '^18.3.1',
        //   };
        // }
  
        return pkg;
      },
    },
  };
  