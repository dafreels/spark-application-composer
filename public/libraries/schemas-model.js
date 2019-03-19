let schemaData;

function initializeSchemas(schemas) {
    schemaData = _.map(schemas, (schema) => {
        delete schema._id;
        return schema;
    });
}

function getSchemas() {
    return cloneObject(schemaData);
}

function getSchema(name) {
    const schema = _.find(schemaData, s => s.id === name);
    return cloneObject(schema);
}
