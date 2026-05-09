const fs = require('fs');
const path = require('path');
const { logger } = require('@librechat/data-schemas');

/**
 * MaestroEngine: The Core Dispatcher
 * Automatically discovers and mounts modules from the /modules directory.
 */
function loadMaestroModules(app) {
  const modulesPath = path.resolve(__dirname, '../../../modules');
  
  if (!fs.existsSync(modulesPath)) {
    logger.warn('[Maestro Engine] Modules directory not found at: ' + modulesPath);
    return;
  }

  const moduleFolders = fs.readdirSync(modulesPath);
  logger.info(`[Maestro Engine] Initializing dynamic module discovery...`);

  moduleFolders.forEach((folder) => {
    const modDir = path.join(modulesPath, folder);
    const manifestPath = path.join(modDir, 'maestro.json');

    if (fs.existsSync(manifestPath)) {
      try {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        logger.info(`[Maestro Engine] 🚀 Registering Module: ${manifest.label || folder} [v${manifest.version || '1.0.0'}]`);

        // Backend Integration: Dynamic Route Mounting
        if (manifest.backend && manifest.backend.routes) {
          const routesPath = path.join(modDir, 'backend', manifest.backend.routes);
          if (fs.existsSync(routesPath)) {
            const modRoutes = require(routesPath);
            const mountPath = manifest.backend.mount || `/api/${folder}`;
            app.use(mountPath, modRoutes);
            logger.info(`[Maestro Engine] Mounted backend routes for '${folder}' at ${mountPath}`);
          }
        }
        
        // Note: Frontend integration is handled via MaestroRegistry.ts during the build process
      } catch (err) {
        logger.error(`[Maestro Engine] Failed to load module '${folder}':`, err);
      }
    }
  });
  
  logger.info('[Maestro Engine] Module discovery complete.');
}

module.exports = { loadMaestroModules };
