const Ajv = require('ajv');
const schema = require('../schemas/pipelines.json');
const BaseModel = require('../lib/base.model');


class PipelinesModel extends BaseModel {
    // override getValidator to add dependent schemas
    getValidator(schema) {
        const ajv = new Ajv({ allErrors: true, extendRefs: true });
        return ajv
            .addSchema(require('../schemas/pipeline-steps.json'))
            .compile(schema);
    }

    // custom model logic goes here
}

var model = new PipelinesModel('pipelines', schema);

module.exports = model;
