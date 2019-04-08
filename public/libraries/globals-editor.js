
class GlobalsEditor {
    constructor(parentContainer, data) {
        this.parent = parentContainer;
        this.data = data;
        this.buildNewDropDown();
        this.populateForm();
    }

    static setFieldValue(fieldName, value, data) {
        if (fieldName && fieldName.trim().length > 0) {
            data[fieldName] = value;
        }
    }

    static addRemoveButton(formDiv, data, nameInput) {
        const button = $('<button class="btn btn-info" style="margin-left: 5px;" title="Remove Parameter">');
        button.appendTo(formDiv);
        $('<i class="glyphicon glyphicon-minus-sign"></i>').appendTo(button);
        button.click(function() {
            delete data[nameInput.val()];
            formDiv.remove();
        });
    }

    clear() {
        this.parent.empty();
        this.data = {};
        this.buildNewDropDown();
    }

    getData() {
        return this.data;
    }

    setValue(data) {
        this.data = data;
        this.populateForm();
    }

    populateForm() {
        _.forOwn(this.data, (value, key) => {
            if (_.isNumber(this.data[key])) {
                this.buildNumberRow(this, key);
            } else if (_.isObject(this.data[key])) {
                this.buildEditorRow(this, !value.className, key);
            } else if (_.isBoolean(this.data[key])) {
                this.buildBooleanRow(this, key);
            } else {
                this.buildStringRow(this, key);
            }
        });
    }

    buildNewDropDown() {
        const formDiv = $('<div class="row">');
        formDiv.appendTo(this.parent);

        const dropDown = $('<div class="dropdown pull-right">');
        dropDown.appendTo(formDiv);

        const button = $('<button class="btn btn-default dropdown-toggle" type="button" id="dropdownMenu1" ' +
        'data-toggle="dropdown" aria-haspopup="true" aria-expanded="true">New</button>');
        $('<span class="caret"></span>').appendTo(button);
        button.appendTo(dropDown);

        const list = $('<ul class="dropdown-menu" aria-labelledby="dropdownMenu1">');
        list.appendTo(dropDown);

        // Add the new string link
        const newStringItem = $('<li>');
        newStringItem.appendTo(list);
        const newStringLink = $('<a>String</a>');
        newStringLink.appendTo(newStringItem);

        // Assign 'this' to a variable named parent because the function will have this set to the element that
        // triggered the click event
        const parent = this;
        newStringLink.click(function() {
            parent.buildStringRow(parent);
        });

        // Add the new boolean link
        const newBooleanItem = $('<li>');
        newBooleanItem.appendTo(list);
        const newBooleanLink = $('<a>Boolean</a>');
        newBooleanLink.appendTo(newBooleanItem);

        newBooleanLink.click(function() {
            parent.buildBooleanRow(parent);
        });

        // Add the new number link
        const newNumberItem = $('<li>');
        newNumberItem.appendTo(list);
        const newNumberLink = $('<a>Number</a>');
        newNumberLink.appendTo(newNumberItem);

        newNumberLink.click(function() {
            parent.buildNumberRow(parent);
        });

        // Add the new JSON link
        const newJsonItem = $('<li>');
        newJsonItem.appendTo(list);
        const newJsonLink = $('<a>JSON</a>');
        newJsonLink.appendTo(newJsonItem);

        newJsonLink.click(function() {
            parent.buildEditorRow(parent, true);
        });

        // Add the new object link
        const newObjectItem = $('<li>');
        newObjectItem.appendTo(list);
        const newObjectLink = $('<a>Object</a>');
        newObjectLink.appendTo(newObjectItem);

        newObjectLink.click(function() {
            parent.buildEditorRow(parent, false);
        });
    }

    buildStringRow(parent, propertyName) {
        const formDiv = $('<div class="form-group row">');
        formDiv.appendTo(parent.parent);
        $('<label class="col-sm-2">Name:</label>').appendTo(formDiv);
        const nameInput = $('<input class="col-sm-2" type="text"/>');
        nameInput.appendTo(formDiv);

        $('<label class="col-sm-2">Value:</label>').appendTo(formDiv);
        const valueInput = $('<input class="col-sm-4" type="text"/>');
        valueInput.appendTo(formDiv);

        let currentName;
        nameInput.blur(function() {
            GlobalsEditor.handleNameChange(currentName, nameInput, parent.data);
            currentName = nameInput.val();
            GlobalsEditor.setFieldValue(nameInput.val(), valueInput.val(), parent.data);
        });

        valueInput.blur(function() {
            GlobalsEditor.setFieldValue(nameInput.val(), valueInput.val(), parent.data);
        });

        GlobalsEditor.addRemoveButton(formDiv, parent.data, nameInput);

        if (parent.data && propertyName) {
            currentName = propertyName;
            nameInput.val(propertyName);
            valueInput.val(parent.data[propertyName]);
        }
    }

    buildNumberRow(parent, propertyName) {
        const formDiv = $('<div class="form-group row">');
        formDiv.appendTo(parent.parent);
        $('<label class="col-sm-2">Name:</label>').appendTo(formDiv);
        const nameInput = $('<input class="col-sm-2" type="text"/>');
        nameInput.appendTo(formDiv);

        $('<label class="col-sm-2">Value:</label>').appendTo(formDiv);
        const valueInput = $('<input class="col-sm-4" type="number"/>');
        valueInput.appendTo(formDiv);

        let currentName;
        nameInput.blur(function() {
            GlobalsEditor.handleNameChange(currentName, nameInput, parent.data);
            currentName = nameInput.val();
            GlobalsEditor.setFieldValue(currentName, valueInput.val(), parent.data);
        });

        valueInput.blur(function() {
            GlobalsEditor.setFieldValue(nameInput.val(), valueInput.val(), parent.data);
        });

        GlobalsEditor.addRemoveButton(formDiv, parent.data, nameInput);

        if (parent.data && propertyName) {
            currentName = propertyName;
            nameInput.val(propertyName);
            valueInput.val(parent.data[propertyName]);
        }
    }

    buildBooleanRow(parent, propertyName) {
        const formDiv = $('<div class="form-group row">');
        formDiv.appendTo(parent.parent);
        $('<label class="col-sm-2">Name:</label>').appendTo(formDiv);
        const nameInput = $('<input class="col-sm-2" type="text"/>');
        nameInput.appendTo(formDiv);

        const radioId = getCustomId('globalsRadio');

        const radioDiv = $('<div class="col-sm-4">');
        radioDiv.appendTo(formDiv);
        const trueLabel = $('<label class="radio-inline">');
        const trueInput = $('<input name="' + radioId + '" type="radio" value="true"/>');
        trueInput.appendTo(trueLabel);
        trueLabel.append('True');
        trueLabel.appendTo(radioDiv);

        const falseLabel = $('<label class="radio-inline">');
        const falseInput = $('<input name="' + radioId + '" type="radio" value="false"/>');
        falseInput.appendTo(falseLabel);
        falseLabel.append('False');
        falseLabel.appendTo(radioDiv);

        let currentName;
        nameInput.blur(function() {
            GlobalsEditor.handleNameChange(currentName, nameInput, parent.data);
            currentName = nameInput.val();
            parent.data[currentName] = $('input[name="' + radioId + '"]:checked').val() === 'true';
        });

        trueInput.change(function() {
            parent.data[nameInput.val()] = $(this).val() === 'true';
        });

        falseInput.change(function() {
            parent.data[nameInput.val()] = $(this).val() === 'true';
        });

        GlobalsEditor.addRemoveButton(formDiv, parent.data, nameInput);

        if (parent.data && propertyName) {
            currentName = propertyName;
            nameInput.val(propertyName);
            $('input[name="' + radioId + '"]').filter('[value='+ parent.data[propertyName] +']').prop('checked', true);
        }
    }

    buildEditorRow(parent, code, propertyName) {
        const formDiv = $('<div class="row">');
        formDiv.appendTo(parent.parent);
        $('<label class="col-sm-2">Name:</label>').appendTo(formDiv);
        const nameInput = $('<input class="col-sm-2" type="text"/>');
        nameInput.appendTo(formDiv);
        $('<span class="col-sm-4">').appendTo(formDiv);
        const button = $('<button class="btn btn-info" title="Add Parameter">');
        $('<i class="glyphicon glyphicon-edit"></i>').appendTo(button);
        button.appendTo(formDiv);

        let currentName;
        nameInput.blur(function() {
            GlobalsEditor.handleNameChange(currentName, nameInput, parent.data);
            currentName = nameInput.val();
        });

        if (code) {
            button.click(function() {
                showCodeEditorDialog(JSON.stringify(parent.data[nameInput.val()], null, 4) || '', 'json', function(value) {
                    GlobalsEditor.setFieldValue(nameInput.val(), JSON.parse(value), parent.data);
                });
            });
        } else {
            button.click(function() {
                const value = parent.data[nameInput.val()];
                let codeObject = {};
                let className;
                if (value) {
                    codeObject = value.object;
                    className = value.className;
                }
                objectEditorDialog.showObjectEditor(codeObject, className, function(value, cn) {
                    GlobalsEditor.setFieldValue(nameInput.val(), {className: cn, object: value}, parent.data);
                });
            });
        }

        GlobalsEditor.addRemoveButton(formDiv, parent.data, nameInput);

        if (parent.data && propertyName) {
            currentName = propertyName;
            nameInput.val(propertyName);
        }
    }

    static handleNameChange(currentName, nameInput, data) {
        if (currentName && currentName !== nameInput.val()) {
            const value = data[currentName];
            delete data[currentName];
            data[nameInput.val()] = value;
        }
    }
}
