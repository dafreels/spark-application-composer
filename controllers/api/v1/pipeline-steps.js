const PipelineStepsModel = require(`../../../models/pipeline-steps.model`);
const CommonRoutes = require('../../../lib/base.routes');

const commonRoutes = new CommonRoutes('pipeline-step', 'pipeline-steps', PipelineStepsModel);

module.exports = function (router) {
    commonRoutes.buildBasicCrudRoutes(router);

    // custom routes go here
};
