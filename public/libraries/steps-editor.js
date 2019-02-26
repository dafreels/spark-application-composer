var currentEditorStepId;

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
    codeEditorSaveFunction = function(code) {
        saveBulkSteps(code, function() {
            currentEditorStepId = null;
            loadStepsUI();
            clearStepForm(true);
        });
    };
    editScript('[]', 'ace/mode/json');
}

function editScript(code, mode) {
    showCodeEditorDialog(code, mode);
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
                loadStepsUI();
                clearStepForm(true);
                // Find an select the newly created step
                const selector = $('#step-selector');
                // TODO This doesn't always work, which could have something to do with async operations
                selector.children('li').each(function() {
                    if ($(this).text() === step.displayName) {
                        $(this).addClass('ui-selected');
                    }
                });
                populateStepForm(selector);
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
    if (stepNeedsSave()) {
        clearFormDialogClearFunction = function() {
            clearStepForm(false);
            populateStepForm(this);
            currentEditorStepId = $('#edit-stepId').text();
        };
        clearDialogCancelFunction = function() {
            $('#step-selector .ui-selected').removeClass('ui-selected');
            $('#step-selector').children('#' + currentEditorStepId).addClass('ui-selected');
        };
        showClearFormDialog();
    } else {
        clearStepForm(false);
        populateStepForm(this);
    }
}

/**
 * Populates the form
 */
function populateStepForm(el) {
    $('.ui-selected', el).each(function() {
        currentEditorStepId = $(this).attr('id');
        const currentStep = stepLookup[currentEditorStepId];
        $('#edit-stepId').text(currentEditorStepId);
        $('#edit-displayName').val(currentStep.displayName);
        $('#edit-description').val(currentStep.description);
        $('#edit-engineMeta').val(currentStep.engineMeta.spark);
        $('#step-creationDate').text(currentStep.creationDate);
        $('#step-modifiedDate').text(currentStep.modifiedDate);
        $('#' + currentStep.type.toLowerCase() + 'Radio').attr('checked', true).change();
        // Build the parameters panel
        var parametersDiv = $('#edit-step-parameters');
        parametersDiv.empty();
        var formDiv;
        _.forEach(currentStep.params, (param) => {
            formDiv = createParameterForm();
            formDiv.appendTo(parametersDiv);
            // Decorate the components
            var select = formDiv.find('select');
            select.selectmenu();
            var checkbox = formDiv.find('#' + formDiv.attr('cbId'));
            checkbox.checkboxradio();
            // Set the values
            formDiv.find('input[name="stepParamName"]').val(param.name);
            formDiv.find('input[name="stepParamDefaultValue"]').val(param.defaultValue);
            select.val(param.type);
            select.selectmenu('refresh');
            if (param.required) {
                checkbox.attr("checked","checked").change();
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
    var formDiv = $('<div class="form-group">');
    $('<label>Name:</label>').appendTo(formDiv);
    $('<input name="stepParamName" type="text"/>').appendTo(formDiv);
    var select = $('<select>');
    select.appendTo(formDiv);
    $('<option value="text">Text</option>').appendTo(select);
    $('<option value="boolean">Boolean</option>').appendTo(select);
    $('<option value="integer">Integer</option>').appendTo(select);
    $('<option value="script">Script</option>').appendTo(select);
    $('<option value="result">Branch Result</option>').appendTo(select);
    // Options
    $('</select>').appendTo(formDiv);
    var checkboxLabel = $('<label style="width: 100px; height: 15px; margin: 0 8px 0 8px;">Required</label>');
    var checkbox = $('<input name="stepParamRequire" type="checkbox">');
    checkbox.uniqueId();
    checkboxLabel.attr('for', checkbox.attr('id'));
    checkboxLabel.appendTo(formDiv);
    checkbox.appendTo(formDiv);
    $('<label>Default Value:</label>').appendTo(formDiv);
    var defaultValueInput = $('<input name="stepParamDefaultValue" type="text"/>');
    defaultValueInput.appendTo(formDiv);
    defaultValueInput.focusin(function() {
        codeEditorCloseFunction = function() {
            $('#add-step-parameter-button').focus();
            defaultValueInput.prop('disabled', false);
        };
        codeEditorSaveFunction = function(value) {
            defaultValueInput.val(value);
        };
        if (select.val() === 'script') {
            showCodeEditorDialog($(this).val(), 'scala');
            $(this).prop('disabled', true);
        }
    });
    var button = $('<button class="ui-button ui-widget ui-corner-all ui-button-icon-only" title="Remove Parameter">');
    button.appendTo(formDiv);
    $('<span class="ui-icon ui-icon-minus"></span>').appendTo(button);
    $('</button>').appendTo(formDiv);
    button.click(function() {
        formDiv.remove();
    });
    $('</div>').appendTo(formDiv);
    formDiv.attr('cbId', checkbox.attr('id'));
    return formDiv;
}

/**
 * Generate a JSON object based on the form data.
 * @returns The step json.
 */
function generateStepJson() {
    var step = {
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
    var param;
    $('#edit-step-parameters div').each(function() {
        param = {
            name: $(this).find('input[name="stepParamName"]').val(),
            type: $(this).find('select').val(),
            required: $(this).find('#' + $(this).attr('cbId')).is(':checked')
        };

        if ($(this).find('input[name="stepParamDefaultValue"]').val() !== '') {
            param.defaultValue = $(this).find('input[name="stepParamDefaultValue"]').val();
        }

        step.params.push(param);
    });

    return step;
}

/**
 * Handle the new button being clicked
 */
function handleNewStep() {
    if (stepNeedsSave()) {
        clearFormDialogClearFunction = function() { clearStepForm(true); };
        clearDialogCancelFunction = function() {
            $('#step-selector .ui-selected').removeClass('ui-selected');
            $('#step-selector').children('#' + currentEditorStepId).addClass('ui-selected');
        };
        showClearFormDialog();
    } else {
        clearStepForm(true);
    }
}

/**
 * Handle the reset button being clicked
 */
function handleResetStep() {
    if (stepNeedsSave()) {
        clearFormDialogClearFunction = function() { clearStepForm(true); };
        clearDialogCancelFunction = function() {
            $('#step-selector .ui-selected').removeClass('ui-selected');
            $('#step-selector').children('#' + currentEditorStepId).addClass('ui-selected');
        };
        showClearFormDialog();
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
    $('#pipelineRadio').attr('checked', false).change();
    $('#branchRadio').attr('checked', false).change();
    if (clearSelection) {
        $('#step-selector .ui-selected').removeClass('ui-selected');
    }
    $('#edit-step-parameters').empty();
}

/**
 * Determines if the form has unsaved changes
 * @returns {boolean}
 */
function stepNeedsSave() {
    var step = generateStepJson();
    if (step.id) {
        // Compare the objects
        return getObjectDiff(step, stepLookup[step.id]).length > 0;
    }
    var changed = !_.isEmpty(step.engineMeta.spark);
    _.forEach(_.keys(step).filter(p => p !== 'engineMeta' && p !== 'type'), function(property) {
        if (!_.isEmpty(step[property])) {
            changed = true;
        }
    });
    return changed;
}

/**
 * Helper function to perform a deep comparison
 * @param obj1 First object to be compared
 * @param obj2 Second object to be compared
 * @returns {string[]}
 */
function getObjectDiff(obj1, obj2) {
    return Object.keys(obj1).reduce((result, key) => {
        if (!obj2.hasOwnProperty(key)) {
            result.push(key);
        } else if (_.isEqual(obj1[key], obj2[key])) {
            const resultKeyIndex = result.indexOf(key);
            result.splice(resultKeyIndex, 1);
        }
        return result;
    }, Object.keys(obj2));
}

function setStringValue(val) {
    return val && val.trim().length > 0 ? val : undefined;
}
