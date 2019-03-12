let currentEditorStepId;
let defaultValues;
let saveStepName;

function initializeStepsEditor() {
    $('#branch-type input').checkboxradio({
        icon: false
    });
    $('#branch-type fieldset').controlgroup();

    $('#new-step-button').click(handleNewStep);
    $('#reset-step-button').click(handleResetStep);
    $('#save-step-button').click(saveStepChanges);
    $('#add-step-parameter-button').click(addParameter);
    $('#bulk-step-button').click(handleBulkAdd);

    $('#edit-displayName').focus();
}

function handleBulkAdd() {
    showCodeEditorDialog('[]', 'json',
        function(code) {
            saveBulkSteps(code, function() {
                currentEditorStepId = null;
                loadStepsUI();
                clearStepForm(true);
            });
        });
}

function saveStepChanges() {
    if (stepNeedsSave()) {
        const step = generateStepJson();
        if (step.id && step.id.trim().length === 0) {
            delete step.id;
        }
        // Ensure the step type has been set
        if (!step.type) {
            showValidationErrorDialog([
                {
                    header: 'Type',
                    messages: ['Type must be selected!']
                }
            ]);
        } else if (step.type === 'branch' && !_.find(step.params, (p => p.type === 'result'))) {
            // Validate the branch step to ensure that at least 1 result parameter exists
            showValidationErrorDialog([
                {
                    header: 'Parameters',
                    messages: ['At least one parameter of type Branch Result is required when step type is Branch!']
                }
            ]);
        } else {
            saveStep(step, function () {
                currentEditorStepId = null;
                defaultValues = null;
                saveStepName = step.displayName;
                // This makes an asynchronous call to the server
                loadStepsUI();
            });
        }
    }
}

/**
 * Add a new parameter row to the parameters panel
 */
function addParameter() {
    var formDiv = createParameterForm();
    formDiv.find('select').selectmenu();
    formDiv.find('#' + formDiv.attr('cbId')).checkboxradio();
    formDiv.appendTo($('#edit-step-parameters'));
}

/**
 * Populate the form with existing step data
 */
function handleStepSelection() {
    const selectedElement = this;
    if (stepNeedsSave()) {
        showClearFormDialog(
            function () {
                clearStepForm(false);
                populateStepForm(selectedElement);
                currentEditorStepId = $('#edit-stepId').text();
            },
            function () {
                $('#step-selector .ui-selected').removeClass('ui-selected');
                $('#step-selector').children('#' + currentEditorStepId).addClass('ui-selected');
            }
        );
    } else {
        clearStepForm(false);
        populateStepForm(selectedElement);
    }
}

/**
 * Populates the form
 */
function populateStepForm(el) {
    $('.ui-selected', el).each(function() {
        currentEditorStepId = $(this).attr('id');
        defaultValues = {};
        const currentStep = getStep(currentEditorStepId);
        $('#edit-stepId').text(currentEditorStepId);
        $('#edit-displayName').val(currentStep.displayName);
        $('#edit-description').val(currentStep.description);
        $('#edit-engineMeta').val(currentStep.engineMeta.spark);
        $('#step-creationDate').text(currentStep.creationDate);
        $('#step-modifiedDate').text(currentStep.modifiedDate);
        $('#' + currentStep.type.toLowerCase() + 'Radio').attr('checked', true).change();
        // Build the parameters panel
        const parametersDiv = $('#edit-step-parameters');
        parametersDiv.empty();
        let formDiv;
        let select;
        let checkbox;
        _.forEach(currentStep.params, (param) => {
            formDiv = createParameterForm();
            formDiv.appendTo(parametersDiv);
            // Decorate the components
            select = formDiv.find('select');
            select.selectmenu();
            checkbox = formDiv.find('#' + formDiv.attr('cbId'));
            checkbox.checkboxradio();
            // Set the values
            defaultValues[param.name] = param.defaultValue;
            formDiv.find('input[name="stepParamName"]').val(param.name);
            formDiv.find('input[name="stepParamDefaultValue"]').val(param.defaultValue);
            formDiv.find('input[name="stepParamClassName"]').val(param.className);
            if (param.type.indexOf('script') === 0) {
                select.val(param.type + '-' + (param.language || 'scala'));
            } else {
                select.val(param.type);
            }
            select.selectmenu('refresh');
            if (param.required) {
                checkbox.attr('checked', true).change();
            }
        });
    });
}

/**
 * Generate a new parameter row.
 *
 * @returns Create the parameter row that can be appended to the parameters form.
 */
function createParameterForm() {
    const formDiv = $('<div class="row">');
    $('<div class="col col-sm-1"><label>Name:</label></div>').appendTo(formDiv);
    $('<div class="col col-sm-3"><input name="stepParamName" type="text"/></div>').appendTo(formDiv);
    const select = $('<select>');
    let column = $('<div class="col col-sm-2">');
    select.appendTo(column);
    column.appendTo(formDiv);
    $('<option value="text">Text</option>').appendTo(select);
    $('<option value="boolean">Boolean</option>').appendTo(select);
    $('<option value="integer">Integer</option>').appendTo(select);
    $('<option value="script-scala">Scala Script</option>').appendTo(select);
    $('<option value="script-sql">SQL Script</option>').appendTo(select);
    $('<option value="script-json">JSON Script</option>').appendTo(select);
    $('<option value="script-javascript">Javascript Script</option>').appendTo(select);
    $('<option value="result">Branch Result</option>').appendTo(select);
    $('<option value="object">Object</option>').appendTo(select);
    const checkboxLabel = $('<label>Required</label>');
    const checkbox = $('<input name="stepParamRequire" type="checkbox">');
    checkbox.uniqueId();
    checkboxLabel.attr('for', checkbox.attr('id'));
    column = $('<div class="col col-sm-2 cb-margin">');
    checkboxLabel.appendTo(column);
    checkbox.appendTo(column);
    column.appendTo(formDiv);
    $('<div class="col col-sm-1"><label>Default Value:</label></div>').appendTo(formDiv);
    column = $('<div class="col col-sm-2">');
    column.appendTo(formDiv);
    const defaultValueInput = $('<input name="stepParamDefaultValue" type="text"/>');
    defaultValueInput.appendTo(column);

    $('<div class="col col-sm-1"><label>Class Name:</label></div>').appendTo(formDiv);
    column = $('<div class="col col-sm-2">');
    const className = $('<input name="stepParamClassName" type="text"/>');
    className.appendTo(column);
    column.appendTo(formDiv);

    defaultValueInput.focusin(function() {
        if (select.val().indexOf('script') === 0) {
            showCodeEditorDialog(defaultValues[formDiv.find('input[name="stepParamName"]').val()] || '',
                select.val().split('-')[1],
                function(value, lang) {
                    defaultValues[formDiv.find('input[name="stepParamName"]').val()] = value;
                    defaultValueInput.val(value);
                    const s = formDiv.find('select');
                    s.val('script-' + lang);
                    s.selectmenu('refresh');
                });
            $(this).prop('disabled', true);
        } else if (select.val() === 'object') {
            showObjectEditor(defaultValues[formDiv.find('input[name="stepParamName"]').val()] || {},
                formDiv.find('input[name="stepParamClassName"]').val(),
                function(value, schemaName) {
                    defaultValues[formDiv.find('input[name="stepParamName"]').val()] = value;
                    defaultValueInput.val(JSON.stringify(value));
                    className.val(schemaName);
                });
        }
    });

    column = $('<div class="col col-sm-1">');
    column.appendTo(formDiv);
    const button = $('<button class="ui-button ui-widget ui-corner-all ui-button-icon-only" title="Remove Parameter">');
    button.appendTo(column);
    $('<span class="ui-icon ui-icon-minus"></span>').appendTo(button);
    button.click(function() {
        formDiv.remove();
    });
    formDiv.attr('cbId', checkbox.attr('id'));
    return formDiv;
}

/**
 * Generate a JSON object based on the form data.
 * @returns The step json.
 */
function generateStepJson() {
    const step = {
        id: setStringValue($('#edit-stepId').text()),
        displayName: $('#edit-displayName').val(),
        description: $('#edit-description').val(),
        type: $('input[name=stepTypeRadio]:checked').val(),
        engineMeta: {
            spark: $('#edit-engineMeta').val()
        },
        params: [],
        creationDate: setStringValue($('#step-creationDate').text()),
        modifiedDate: setStringValue($('#step-modifiedDate').text())
    };

    // Gather parameters
    let param;
    let selectionType;
    let scriptLanguage;
    $('#edit-step-parameters .row').each(function() {
        selectionType = $(this).find('select').val();
        if (selectionType.indexOf('script') === 0) {
            scriptLanguage = selectionType.split('-')[1];
            selectionType = selectionType.split('-')[0];
        } else {
            scriptLanguage = null;
        }
        param = {
            type: selectionType,
            name: $(this).find('input[name="stepParamName"]').val(),
            required: $(this).find('#' + $(this).attr('cbId')).is(':checked'),
            language: scriptLanguage,
            className: setStringValue($(this).find('input[name="stepParamClassName"]').val())
        };

        if (param.language === null) { delete param.language; }

        if ($(this).find('input[name="stepParamDefaultValue"]').val() !== '') {
            switch (param.type) {
                case 'integer':
                    param.defaultValue = parseInt($(this).find('input[name="stepParamDefaultValue"]').val());
                    break;
                case 'boolean':
                    param.defaultValue = $(this).find('input[name="stepParamDefaultValue"]').val().toLowerCase() === 'true';
                    break;
                case 'object':
                case 'script':
                    param.defaultValue = defaultValues[param.name];
                    break;
                default:
                    param.defaultValue = $(this).find('input[name="stepParamDefaultValue"]').val();
            }
        }

        step.params.push(param);
    });

    return step;
}

function displayClearFormDialog() {
    showClearFormDialog(function () {
            clearStepForm(true);
        },
        function () {
            $('#step-selector .ui-selected').removeClass('ui-selected');
            $('#step-selector').children('#' + currentEditorStepId).addClass('ui-selected');
        });
}

/**
 * Handle the new button being clicked
 */
function handleNewStep() {
    if (stepNeedsSave()) {
        displayClearFormDialog();
    } else {
        clearStepForm(true);
    }
}

/**
 * Handle the reset button being clicked
 */
function handleResetStep() {
    if (stepNeedsSave()) {
        displayClearFormDialog();
    } else {
        clearStepForm(true);
    }
}

/**
 * Reset the editor form to a clean state.
 */
function clearStepForm(clearSelection) {
    currentEditorStepId = null;
    $('#edit-stepId').empty();
    $('#edit-displayName').val('');
    $('#edit-description').val('');
    $('#edit-engineMeta').val('');
    $('#step-creationDate').text('');
    $('#step-modifiedDate').text('');
    $('#pipelineRadio').removeAttr('checked').change();
    $('#branchRadio').removeAttr('checked').change();
    if (clearSelection) {
        $('#step-selector .ui-selected').removeClass('ui-selected');
    }
    defaultValues = {};
    $('#edit-step-parameters').empty();
}

/**
 * Determines if the form has unsaved changes
 * @returns {boolean}
 */
function stepNeedsSave() {
    const step = generateStepJson();
    if (step.id) {
        // Compare the objects
        const originalStep = getStep(step.id);
        if (_.difference(_.keys(step), _.keys(originalStep)).length > 0) {
            return true;
        } else if (step.id !== originalStep.id) {
            return true;
        } else if (step.displayName !== originalStep.displayName) {
            return true;
        } else if (step.description !== originalStep.description) {
            return true;
        } else if (step.type !== originalStep.type) {
            return true;
        } else if (step.engineMeta.spark !== originalStep.engineMeta.spark) {
            return true;
        } else {
            if (step.params.length !== originalStep.params.length) {
                return true;
            }
            let diff = false;
            let param1;
            _.forEach(step.params, (param) => {
                param1 = _.find(originalStep.params, p => p.name === param.name);
                if (!param1) {
                    diff = true;
                    return false;
                } else if (param.type !== param1.type) {
                    diff = true;
                    return false;
                } else if (param.required !== param1.required) {
                    diff = true;
                    return false;
                }  else if (param.language !== param1.language) {
                    diff = true;
                    return false;
                } else if (param.className !== param1.className) {
                    diff = true;
                    return false;
                } else {
                    let dv1;
                    let dv2;
                    if (_.isObject(param.defaultValue)) {
                        dv1 = JSON.stringify(param.defaultValue);
                        dv2 = JSON.stringify(param1.defaultValue)
                    } else {
                        dv1 = param.defaultValue;
                        dv2 = param1.defaultValue;
                    }

                    if (dv1 !== dv2) {
                        diff = true;
                        return false;
                    }
                }
            });
            return diff;
        }
    }
    var changed = !_.isEmpty(step.engineMeta.spark);
    _.forEach(_.keys(step).filter(p => p !== 'engineMeta' && p !== 'type'), function(property) {
        if (!_.isEmpty(step[property])) {
            changed = true;
        }
    });
    return changed;
}

function renderStepSelectionUI() {
    const stepSelector = $('#step-selector');
    stepSelector.empty();
    _.forEach(getSteps(), (step) => {
        // Build out the step editor control
        $('<li id="' + step.id + '" stepType="' + step.type + '" class="ui-widget-content">' + step.displayName + '</li>').appendTo(stepSelector);
        $('li #' + step.id).fitText(1.50);
    });
    stepSelector.selectable({
        stop: handleStepSelection,
        selected: function (event, ui) {
            $(ui.selected).addClass("ui-selected").siblings().removeClass("ui-selected");
        }
    });
    if (saveStepName) {
        clearStepForm(true);
        // Find an select the newly created step
        stepSelector.children('li').each(function() {
            if ($(this).text() === saveStepName) {
                $(this).addClass('ui-selected');
            }
        });
        populateStepForm(stepSelector);
        saveStepName = null;
    }
}
