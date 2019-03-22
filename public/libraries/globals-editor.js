
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

    static addRemoveButton(formDiv) {
        const button = $('<button class="btn btn-info" style="margin-left: 5px;" title="Remove Parameter">');
        button.appendTo(formDiv);
        $('<i class="glyphicon glyphicon-minus-sign"></i>').appendTo(button);
        button.click(function() {
            formDiv.remove();
        });
    }

    getData() {
        return this.data;
    }

    populateForm() {
        // TODO Use the provided data to fill out the form
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

    buildStringRow(parent) {
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
            currentName = nameInput.val();
            GlobalsEditor.setFieldValue(currentName, valueInput.val(), parent.data);
        });

        valueInput.blur(function() {
            GlobalsEditor.setFieldValue(currentName, valueInput.val(), parent.data);
        });

        GlobalsEditor.addRemoveButton(formDiv);
    }

    buildNumberRow(parent) {
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
            currentName = nameInput.val();
            GlobalsEditor.setFieldValue(currentName, valueInput.val(), parent.data);
        });

        valueInput.blur(function() {
            GlobalsEditor.setFieldValue(currentName, valueInput.val(), parent.data);
        });

        GlobalsEditor.addRemoveButton(formDiv);
    }

    buildBooleanRow(parent) {
        const formDiv = $('<div class="form-group row">');
        formDiv.appendTo(parent.parent);
        $('<label class="col-sm-2">Name:</label>').appendTo(formDiv);
        const nameInput = $('<input class="col-sm-2" type="text"/>');
        nameInput.appendTo(formDiv);
        $('<label class="col-sm-2">Value:</label>').appendTo(formDiv);

        const radioDiv = $('<div class="btn-group col-sm-4" data-toggle="buttons">');
        radioDiv.appendTo(formDiv);
        const trueLabel = $('<label class="btn btn-info">');
        trueLabel.appendTo(radioDiv);
        const trueInput = $('<input type="radio" value="true"/>');
        trueInput.appendTo(trueLabel);
        trueLabel.append('True');

        const falseLabel = $('<label class="btn btn-info">');
        falseLabel.appendTo(radioDiv);
        const falseInput = $('<input type="radio" value="false"/>');
        falseInput.appendTo(falseLabel);
        falseLabel.append('False');

        let currentName;
        nameInput.blur(function() {
            currentName = nameInput.val();
            // data[currentName] = radioDiv.find('input:checked').val();
        });

        trueInput.change(function() {
            console.log('True: ' + $(this).is(':checked'));
            // data[nameInput.val()] = true;
        });

        falseInput.change(function() {
            console.log('False: ' + $(this).is(':checked'));
            // data[nameInput.val()] = false;
        });

        GlobalsEditor.addRemoveButton(formDiv);
    }

    buildEditorRow(parent, code) {
        const formDiv = $('<div class="row">');
        formDiv.appendTo(parent.parent);
        $('<label class="col-sm-2">Name:</label>').appendTo(formDiv);
        const nameInput = $('<input class="col-sm-2" type="text"/>');
        nameInput.appendTo(formDiv);
        $('<span class="col-sm-4">').appendTo(formDiv);
        const button = $('<button class="btn btn-info" title="Add Parameter">');
        $('<i class="glyphicon glyphicon-edit"></i>').appendTo(button);
        button.appendTo(formDiv);

        if (code) {
            button.click(function() {
                showCodeEditorDialog(JSON.stringify(parent.data[nameInput.val()], null, 4) || '', 'json', function(value) {
                    GlobalsEditor.setFieldValue(nameInput.val(), JSON.parse(value), parent.data);
                });
            });
        } else {
            button.click(function() {
                const value = parent.data[nameInput.val()];
                let code = {};
                let className;
                if (value) {
                    code = value.object;
                    className = value.className;
                }
                showObjectEditor(code, className, function(value, cn) {
                    GlobalsEditor.setFieldValue(nameInput.val(), {className: cn, object: value}, parent.data);
                });
            });
        }

        GlobalsEditor.addRemoveButton(formDiv);
    }
}
