class ObjectEditor {
    constructor() {
        $('#edit-object-form-save').click(this.handleObjectEditorSave());
        $('#edit-object-form-cancel').click(this.handleObjectEditorCancel());
        $('#edit-object-form-close').click(this.handleObjectEditorCancel());
        this.currentObjectData = {};
        this.schemaId = null;
        this.editObjectSaveFunction = null;
        this.editObjectCancelFunction = null;
        this.editObjectForm = null;

        const parent = this;
        $('#objectEditorSchema').change(function () {
            parent.schemaId = $(this).val();
            parent.generateForm(schemasModel.getSchema(parent.schemaId).schema);
        });
    }

    showObjectEditor(data, schemaId, saveFunction, cancelFunction) {
        this.schemaId = schemaId;
        if (data && _.isString(data) && data.trim().length > 0) {
            this.currentObjectData = JSON.parse(data);
        } else if (data && _.isObject(data)) {
            this.currentObjectData = data;
        } else {
            this.currentObjectData = {};
        }
        this.editObjectSaveFunction = saveFunction;
        this.editObjectCancelFunction = cancelFunction;

        const schema = schemasModel.getSchema(this.schemaId);
        if (schema) {
            $('#objectEditorSchema').val(this.schemaId).change();
            this.generateForm(schema.schema);
        }
        $('#object-validation-errors').empty();
        $('#edit-object-form').modal('show');
    }

    generateForm(schema) {
        const form = $('#json-object-editor');
        form.alpaca('destroy');
        form.empty();
        const formSchema = cloneObject(schema);
        const options = this.generateOptions(formSchema, {fields: {}});
        this.editObjectForm = form.alpaca({
            "schema": formSchema,
            data: this.currentObjectData,
            options: options
        });
    }

    generateOptions(schema, options) {
        let obj;
        _.forEach(schema.properties, (property, key) => {
            obj = {
                label: key
            };
            switch (property.type) {
                case 'boolean':
                    obj.type = 'checkbox';
                    break;
                case 'integer':
                    obj.type = 'integer';
                    break;
                case 'array':
                    if (schema.properties[key].items.type === 'string') {
                        obj.type = 'token';
                        obj.id = key;
                    } else {
                        obj.type = 'array';
                        obj.items = {fields: {}};
                        this.generateOptions(schema.properties[key].items, obj.items);
                    }
                    break;
                case 'object':
                    obj.type = 'object';
                    if (schema.properties[key].properties) {
                        obj.fields = {};
                        this.generateOptions(schema.properties[key], obj);
                    } else {
                        schema.properties[key].type = 'array';
                        schema.properties[key].items = {
                            type: 'object',
                            properties: {
                                name: {
                                    type: 'string'
                                },
                                value: {
                                    type: 'string'
                                }
                            }
                        };
                        obj.type = "array";
                        obj.items = {
                            fields: {
                                name: {
                                    type: 'text',
                                    label: 'Name'
                                },
                                value: {
                                    type: 'text',
                                    label: 'Value'
                                }
                            }
                        };
                    }
                    break;
                default:
                    obj.type = 'text';
                    break;
            }
            options.fields[key] = obj;
        });
        return options;
    }

    updateSchemas() {
        const schemas = $('#objectEditorSchema');
        schemas.empty();
        $('<option value="none">').appendTo(schemas);
        _.forEach(schemasModel.getSchemas(), (schema) => {
            $('<option value="' + schema.id + '">' + schema.id + '</option>').appendTo(schemas);
        });
        schemas.change(this.handleSchemaChange);
    }

    handleSchemaChange() {
        const parent = this;
        return function () {
            parent.schemaId = $(this).val();
            const schema = schemasModel.getSchema(parent.schemaId);
            if (schema) {
                parent.generateForm(schema.schema);
            }
        };
    }

    handleObjectEditorSave() {
        const parent = this;
        return function () {
            const formData = parent.convertFormToJson();
            validateObject(parent.schemaId, formData, function (err) {
                if (err && err.length > 0) {
                    const validations = $('#object-validation-errors');
                    validations.empty();
                    // These are the failed validations
                    const list = $('<ul>');
                    list.appendTo(validations);
                    _.forEach(err, function (validation) {
                        $('<li>' + validation.message + '</li>').appendTo(list);
                    });
                } else {
                    if (parent.editObjectSaveFunction) {
                        parent.editObjectSaveFunction(formData, parent.schemaId);
                    }
                    $('#edit-object-form').modal('hide');
                }
            });
        };
    }

    handleObjectEditorCancel() {
        const parent = this;
        return function () {
            if (parent.editObjectCancelFunction) {
                parent.editObjectCancelFunction();
            }
            $('#edit-object-form').modal('hide');
        };
    }

    convertFormToJson() {
        const formData = this.editObjectForm.alpaca().getValue();
        const schema = schemasModel.getSchema(this.schemaId);
        const jsonData = {};
        // Perform conversions
        ObjectEditor.convertData(formData, jsonData, schema.schema);
        return jsonData;
    }

    static convertData(sourceData, targetData, schema) {
        _.forEach(schema.properties, (property, key) => {
            switch (property.type) {
                case 'boolean':
                    if (_.isBoolean(sourceData[key])) {
                        targetData[key] = sourceData[key];
                    } else if (_.isString(sourceData[key])) {
                        targetData[key] = sourceData[key] === 'true';
                    } else {
                        targetData[key] = sourceData[key];
                    }
                    break;
                case 'integer':
                    if (_.isInteger(sourceData[key])) {
                        targetData[key] = sourceData[key];
                    } else if (_.isString(sourceData[key])) {
                        targetData[key] = parseInt(sourceData[key]);
                    } else {
                        targetData[key] = sourceData[key];
                    }
                    break;
                case 'array':
                    targetData[key] = [];
                    if (_.isString(sourceData[key])) {
                        targetData[key] = sourceData[key].split(',');
                    } else {
                        let obj;
                        _.forEach(sourceData[key], (data) => {
                            obj = {};
                            targetData[key].push(obj);
                            ObjectEditor.convertData(data, obj, schema.properties[key].items);
                        });
                    }
                    break;
                case 'object':
                    targetData[key] = {};
                    if (_.isArray(sourceData[key])) {
                        _.forEach(sourceData[key], (data) => {
                            targetData[key][data.name] = data.value;
                        });
                    } else {
                        ObjectEditor.convertData(sourceData[key], targetData[key], schema.properties[key]);
                    }
                    break;
                default:
                    targetData[key] = sourceData[key];
            }
        });
    }
}
