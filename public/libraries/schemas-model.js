
class SchemasModel {
    constructor(schemas) {
        this.setSchemas(schemas);
    }

    setSchemas(schemas) {
        this.schemas = _.map(schemas, (schema) => {
            delete schema._id;
            return schema;
        });
    }

    getSchemas() {
        return cloneObject(this.schemas);
    }

    getSchema(name) {
        const schema = _.find(this.schemas, s => s.id === name);
        return cloneObject(schema);
    }

    count() {
        return this.schemas.length;
    }
}
