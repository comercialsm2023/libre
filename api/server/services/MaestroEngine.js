const fs = require('fs');
const path = require('path');
const { logger } = require('@librechat/data-schemas');

function loadMaestroModules(app) {
  const modsPath = path.resolve(__dirname, '../../../mods');
  if (!fs.existsSync(modsPath)) {
    logger.info('[Maestro] No modules folder found.');
    return;
  }

  const modules = fs.readdirSync(modsPath);
  logger.info(`[Maestro] Discovering modules in ${modsPath}...`);

  modules.forEach((modName) => {
    const modDir = path.join(modsPath, modName);
    const manifestPath = path.join(modDir, 'maestro.json');

    if (fs.existsSync(manifestPath)) {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      logger.info(`[Maestro] Registering module: ${manifest.label} (${manifest.version})`);

      // Register Backend Routes
      if (manifest.backend && manifest.backend.routes) {
        const routesPath = path.join(modDir, 'backend', manifest.backend.routes);
        if (fs.existsSync(routesPath)) {
          const modRoutes = require(routesPath);
          app.use(manifest.backend.mount || `/api/${modName}`, modRoutes);
          logger.info(`[Maestro] Mounted routes for ${modName} at ${manifest.backend.mount || `/api/${modName}`}`);
        }
      }
    }
  });
}

module.exports = { loadMaestroModules };
