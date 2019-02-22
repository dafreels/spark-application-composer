const Ajv = require('ajv')
const schema = require('../schemas/applications.json');
const BaseModel = require('../lib/base.model');

class ApplicationsModel extends BaseModel {

    // override getValidator to add dependent schemas
    getValidator(schema) {
        const ajv = new Ajv({ allErrors: true, extendRefs: true });
        return ajv
            .addSchema(require('../schemas/pipeline-steps.json'))
            .addSchema(require('../schemas/pipelines.json'))
            .compile(schema);
    }


    // custom model logic goes here
}

const model = new ApplicationsModel('applications', schema);

module.exports = model;
