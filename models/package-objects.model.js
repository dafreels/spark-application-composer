const schema = require('../schemas/package-objects.json');
const BaseModel = require('../lib/base.model');


class PackageObjectsModel extends BaseModel {
    constructor() {
        super('package-objects', schema);
    }
    // custom model logic goes here
}

module.exports = PackageObjectsModel;
