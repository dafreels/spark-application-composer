const ApplicationsModel = require(`../../../models/applications.model`);
const CommonRoutes = require('../../../lib/base.routes');

const commonRoutes = new CommonRoutes('application', 'applications', ApplicationsModel);

module.exports = function (router) {
    commonRoutes.buildBasicCrudRoutes(router);

    // custom routes go here
};
