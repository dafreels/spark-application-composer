const schema = require('../schemas/pipeline-steps.json');
const BaseModel = require('../lib/base.model');


class PipelineStepsModel extends BaseModel {
    // custom model logic goes here
}

const model = new PipelineStepsModel('pipeline-steps', schema);

module.exports = model;
