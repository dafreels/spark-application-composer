
function initializeStepsEditor() {
    $('#branch-type input').checkboxradio({
        icon: false
    });
    $('#branch-type fieldset').controlgroup();

    $('#new-step-button').click(handleNewStep);
    $('#reset-step-button').click(handleResetStep);
    $('#save-step-button').click(saveStepChanges);
    $('#add-step-parameter-button').click(addParameter);
}

function saveStepChanges() {
    if (stepNeedsSave()) {
        const step = generateStepJson();
        saveStep(step, function() {
            loadStepsUI();
            clearStepForm();
        });
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
        clearFunction = function() {
            clearStepForm(false);
            populateStepForm(this);
        };
        showClearDesignerDialog();
    } else {
        populateStepForm(this);
    }
}

/**
 * Populates the form
 */
function populateStepForm(el) {
    $('.ui-selected', el).each(function() {
        var stepId = $(this).attr('id');
        var currentStep = stepLookup[stepId];
        $('#edit-stepId').text(stepId);
        $('#edit-displayName').val(currentStep.displayName);
        $('#edit-description').val(currentStep.description);
        $('#edit-engineMeta').val(currentStep.engineMeta.spark);
        $('#' + currentStep.type.toLowerCase() + 'Radio').attr("checked","checked").change();
        // Build the parameters panel
        var parametersDiv = $('#edit-step-parameters');
        parametersDiv.empty();
        var formDiv;
        _.forEach(currentStep.params, function(param) {
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
        // TODO Add special handling for branch steps since params are used to represent stepIds based on conditions
        // TODO Create a dialog that allows code editing when script is the type
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
    // Options
    $('</select>').appendTo(formDiv);
    var checkboxLabel = $('<label style="width: 100px; height: 15px; margin: 0 8px 0 8px;">Required</label>');
    var checkbox = $('<input name="stepParamRequire" type="checkbox">');
    checkbox.uniqueId();
    checkboxLabel.attr('for', checkbox.attr('id'));
    checkboxLabel.appendTo(formDiv);
    checkbox.appendTo(formDiv);
    $('<label>Default Value:</label>').appendTo(formDiv);
    $('<input name="stepParamDefaultValue" type="text"/>').appendTo(formDiv);
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
        id: $('#edit-stepId').text(),
        displayName: $('#edit-displayName').val(),
        description: $('#edit-description').val(),
        type: $('input[name=stepTypeRadio]:checked').val(),
        engineMeta: {
            spark: $('#edit-engineMeta').val()
        },
        params: []
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
        clearFunction = function() { clearStepForm(true); };
        showClearDesignerDialog();
    } else {
        clearStepForm(true);
    }
}

/**
 * Handle the reset button being clicked
 */
function handleResetStep() {
    if (stepNeedsSave()) {
        clearFunction = function() { clearStepForm(true); };
        showClearDesignerDialog();
    } else {
        clearStepForm(true);
    }
}

/**
 * Reset the editor form to a clean state.
 */
function clearStepForm(clearSelection) {
    $('#edit-stepId').empty();
    $('#edit-displayName').val('');
    $('#edit-description').val('');
    $('#edit-engineMeta').val('');
    $('#pipelineRadio').attr("checked","checked").change();
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
        return !_.isEqual(step, stepLookup[step.id]);
    }
    var changed = !_.isEmpty(step.engineMeta.spark);
    _.forEach(_.keys(step).filter(p => p !== 'engineMeta' && p !== 'type'), function(property) {
        if (!_.isEmpty(step[property])) {
            changed = true;
        }
    });
    return changed;
}
