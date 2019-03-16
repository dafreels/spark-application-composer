let schemaData;

function initializeSchemas(schemas) {
    // TODO Refactor after API has been built
    schemaData = [{
        name: 'com.acxiom.pipeline.steps.Transformations',
        schema: schemas
    }];
}

function getSchemas() {
    return cloneObject(schemaData);
}

function getSchema(name) {
    const schema = _.find(schemaData, s => s.name === name);
    return cloneObject(schema);
}
