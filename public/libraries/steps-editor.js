const stepContainerId = 'step-editor';

let currentEditorStepId;
let defaultValues;
let saveStepName;
let selectedStep;

function initializeStepsEditor() {
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
            saveBulkSteps(JSON.parse(code), function(err) {
                if (err) {
                    showAlertDialog('Status: ' + err.status + ' Error: ' + err.error);
                } else {
                    currentEditorStepId = null;
                    loadStepsUI();
                    clearStepForm(true);
                }
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
            saveStep(step, function (err) {
                if (err) {
                    showGlobalErrorMessage('Failed to save step', err);
                } else {
                    currentEditorStepId = null;
                    defaultValues = null;
                    saveStepName = step.displayName;
                    // This makes an asynchronous call to the server
                    loadStepsUI();
                }
            });
        }
    }
}

/**
 * Add a new parameter row to the parameters panel
 */
function addParameter() {
    var formDiv = createParameterForm();
    formDiv.appendTo($('#edit-step-parameters'));
}

/**
 * Populate the form with existing step data
 */
function handleStepSelection(selectedElement) {
    if (stepNeedsSave()) {
        showClearFormDialog(
            function () {
                clearStepForm(false);
                populateStepForm(selectedElement);
                currentEditorStepId = $('#edit-stepId').text();
                selectStep(selectedElement);
            }
        );
    } else {
        clearStepForm(false);
        populateStepForm(selectedElement);
        selectStep(selectedElement);
    }
}

function selectStep(selectedElement) {
    if (selectedStep) {
        selectedStep.toggleClass('step-selected');
    }
    selectedStep = selectedElement;
    selectedElement.toggleClass('step-selected');
}

/**
 * Populates the form
 */
function populateStepForm(el) {
    currentEditorStepId = el.attr('id').split('_')[1];
    defaultValues = {};
    const currentStep = stepsModel.getStep(currentEditorStepId);
    $('#edit-stepId').text(currentEditorStepId);
    $('#edit-displayName').val(currentStep.displayName);
    $('#edit-description').val(currentStep.description);
    $('#edit-category').val(currentStep.category);
    $('#edit-engineMeta').val(currentStep.engineMeta.spark);
    $('#step-creationDate').text(currentStep.creationDate);
    $('#step-modifiedDate').text(currentStep.modifiedDate);
    $('#' + currentStep.type.toLowerCase() + 'Radio').click();
    // Build the parameters panel
    const parametersDiv = $('#edit-step-parameters');
    parametersDiv.empty();
    let formDiv;
    let select;
    let requireButton;
    _.forEach(currentStep.params, (param) => {
        formDiv = createParameterForm();
        formDiv.appendTo(parametersDiv);
        // Decorate the components
        select = formDiv.find('select');
        requireButton = formDiv.find('#' + formDiv.attr('cbId'));
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
        if (param.required) {
            requireButton.button('toggle');
        }
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
    const select = $('<select class="form-control param-select">');
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
    const requiredButton = $('<button id="'+ getCustomId('cb') +'" type="button" class="btn btn-info" data-toggle="button" aria-pressed="false">Required</button>');
    column = $('<div class="col col-sm-2 cb-margin">');
    requiredButton.appendTo(column);
    column.appendTo(formDiv);
    $('<div class="col col-sm-1" style="margin-left: -20px;"><label>Default Value:</label></div>').appendTo(formDiv);
    column = $('<div class="col col-sm-2">');
    column.appendTo(formDiv);
    const defaultValueInput = $('<input name="stepParamDefaultValue" type="text"/>');
    defaultValueInput.appendTo(column);

    $('<div class="col col-sm-1" style="margin-left: 5px;"><label>Class Name:</label></div>').appendTo(formDiv);
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
                });
            $(this).prop('disabled', true);
        } else if (select.val() === 'object') {
            objectEditorDialog.showObjectEditor(defaultValues[formDiv.find('input[name="stepParamName"]').val()] || {},
                formDiv.find('input[name="stepParamClassName"]').val(),
                function(value, schemaName) {
                    defaultValues[formDiv.find('input[name="stepParamName"]').val()] = value;
                    defaultValueInput.val(JSON.stringify(value));
                    className.val(schemaName);
                });
        }
    });

    column = $('<div class="col col-sm-1" style="margin-left: 5px; margin-bottom: 5px;">');
    column.appendTo(formDiv);
    const button = $('<button class="btn btn-info" title="Remove Parameter">');
    button.appendTo(column);
    $('<i class="glyphicon glyphicon-minus-sign"></i>').appendTo(button);
    button.click(function() {
        formDiv.remove();
    });
    formDiv.attr('cbId', requiredButton.attr('id'));
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
        category: $('#edit-category').val(),
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
            required: $(this).find('#' + $(this).attr('cbId')).attr('aria-pressed') === 'true',
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
    $('#edit-category').val('');
    $('#edit-engineMeta').val('');
    $('#step-creationDate').text('');
    $('#step-modifiedDate').text('');
    $('#pipelineRadio').removeAttr('checked').change();
    $('#branchRadio').removeAttr('checked').change();
    if (clearSelection && selectedStep) {
        selectedStep.toggleClass('step-selected');
        selectedStep = null;
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
        const originalStep = stepsModel.getStep(step.id);
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
        } else if (step.category !== originalStep.category) {
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
    let changed = !_.isEmpty(step.engineMeta.spark);
    _.forEach(_.keys(step).filter(p => p !== 'engineMeta' && p !== 'type'), function(property) {
        if (!_.isEmpty(step[property])) {
            changed = true;
        }
    });
    return changed;
}

function renderStepSelectionUI() {
    const stepPanel = $('#main-steps-panel');
    stepPanel.empty();
    generateStepContainers(stepContainerId, stepPanel, function (evt) {
        handleStepSelection($(evt.target));
    });
    if (saveStepName) {
        clearStepForm(true);
        // Find and select the newly created step
        const currentEditorStep = _.find(stepsModel.getSteps(), s => s.displayName === saveStepName);
        if (currentEditorStep) {
            saveStepName = null;
            const selectedElement = $('#' + stepContainerId + '_' + currentEditorStep.id);
            populateStepForm(selectedElement);
            $('#btn' + stepContainerId + '_' + currentEditorStep.category).click();
            selectStep(selectedElement); // TODO Still not working
        }
    }
}
