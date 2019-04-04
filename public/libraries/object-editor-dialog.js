
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
        $('#objectEditorSchema').change(function() {
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
        this.editObjectForm = form.alpaca({
            "schema": schema,
            data: this.currentObjectData,
            options: this.generateOptions(schema, { fields: {}})
        });
    }

    generateOptions(schema, options) {
        let obj;
        _.forEach(schema.properties, (property, key) => {
            obj = {
                label: key
            };
            switch(property.type) {
                case 'boolean':
                    obj.type = 'checkbox';
                    break;
                case 'integer':
                    obj.type = 'integer';
                    break;
                case 'array':
                    // if (schema.properties[key].items.type === 'string') {
                    //     obj.type = 'token';
                    //     obj.id = key;
                    // TODO capture that we have a token field so we can convert to an array on save
                    // } else {
                    obj.type = 'array';
                    obj.items = { fields: {}};
                    this.generateOptions(schema.properties[key].items, obj.items);
                    // }
                    break;
                case 'object':
                    obj.type = 'object';
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
            $('<option value="'+ schema.id +'">' + schema.id + '</option>').appendTo(schemas);
        });
        schemas.change(this.handleSchemaChange);
    }

    handleSchemaChange() {
        const parent = this;
        return function() {
            parent.schemaId = $(this).val();
            const schema = schemasModel.getSchema(parent.schemaId);
            if (schema) {
                parent.generateForm(schema.schema);
            }
        };
    }

    handleObjectEditorSave() {
        const parent =  this;
        return function() {
            const formData = parent.editObjectForm.alpaca().getValue();
            validateObject(parent.schemaId, formData, function(err) {
                if (err && err.length > 0) {
                    const validations = $('#object-validation-errors');
                    validations.empty();
                    // These are the failed validations
                    const list = $('<ul>');
                    list.appendTo(validations);
                    _.forEach(err, function(validation) {
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
        const parent =  this;
        return function() {
            if (parent.editObjectCancelFunction) {
                parent.editObjectCancelFunction();
            }
            $('#edit-object-form').modal('hide');
        };
    }
}
