const PackageObjectsModel = require('../../../models/package-objects.model');
const BaseRoutes = require('../../../lib/base.routes');

const baseRoutes = new BaseRoutes('package-object', 'package-objects', PackageObjectsModel);

module.exports = function (router) {
    baseRoutes.buildBasicCrudRoutes(router);

    // custom routes go here
};
