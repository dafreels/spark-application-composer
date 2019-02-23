const PipelineStepsModel = require(`../../../models/steps.model`);
const BaseRoutes = require('../../../lib/base.routes');

const baseRoutes = new BaseRoutes('step', 'steps', PipelineStepsModel);

module.exports = function (router) {
    baseRoutes.buildBasicCrudRoutes(router);

    // custom routes go here
};
