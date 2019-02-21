var dropStep = null;
var selectedPipeline = 'none';
var currentSteps = {};
var diagramStepToStepMetaLookup = {};
var stepForms = {};
var currentPipeline;
var controlCharacters = ['!', '@', '#'];
var clearFunction;

var parameterTypeOptions = '<option value="static">Static</option>' +
    '<option value="global">Global</option>' +
    '<option value="step">Step Response</option>' +
    '<option value="secondary">Secondary Step Response</option>' +
    '<option value="script">Script</option>';

function allowDrop(ev) {
    ev.preventDefault();
}

function drag(ev) {
    ev.dataTransfer.setData("text", $(ev.target).text());
    ev.dataTransfer.setData("id", ev.target.id);
}

function drop(ev) {
    ev.preventDefault();
    const stepLookupElement = stepLookup[ev.dataTransfer.getData("id")];
    dropStep = {
        name: ev.dataTransfer.getData("text"),
        x: ev.offsetX,
        y: ev.offsetY,
        stepMetaData: stepLookupElement
    };
    addStepDialog.dialog('open');
}

var clearDesignerDialog;
var addStepDialog;
var addPipelineDialog;

/* Pipeline Designer tasks:
 *
 * TODO Need to handle branch steps (type == branch)
 * TODO Element removal
 * TODO Handle mixing step metadata with PipelineStep metadata on the element/model
 */

function clearPipelineDesigner() {
    graph.clear();
    currentSteps = {};
    diagramStepToStepMetaLookup = {};
    clearPropertiesPanel();
}

function verifyLoadPipeline() {
    if (currentPipeline || isDesignerPopulated()) {
        clearFunction = loadPipeline;
        showClearDesignerDialog();
    } else {
        loadPipeline();
    }
}

function loadPipeline() {
    var pipelineId = $("#pipelines").val();
    if (pipelineId !== 'none') {
        currentPipeline = pipelineLookup[pipelineId];
        $('#pipelineName').text(currentPipeline.name);
        var x = 50;
        var y = 50;
        var gstep;
        var stepIdLookup = {};
        // Add each step to the designer
        _.forEach(currentPipeline.steps, function (step) {
            // Add the steps to the designer
            gstep = addStepToDesigner(step.id, step.displayName, x, y, step.stepId);
            gstep.attributes.metaData.pipelineStepMetaData = step;
            y += 100;
            stepIdLookup[step.id] = step.stepId;
        });
        // Create the links between steps
        _.forEach(currentPipeline.steps, function (step) {
            if (step.nextStepId) {
                createLink(diagramStepToStepMetaLookup[step.id],
                    diagramStepToStepMetaLookup[step.nextStepId]);
            }
        });

        loadPropertiesPanel(diagramStepToStepMetaLookup[currentPipeline.steps[0].id].attributes.metaData);
    }
    /*
     * TODO:
     *  fit canvas content
     */
}

function addStepToDesigner(id, name, x, y, stepId) {
    var step = createStep(name, x, y, stepLookup[stepId]).addTo(graph);
    step.attributes.metaData.pipelineStepMetaData.id = id;
    if (!step.attributes.metaData.pipelineStepMetaData.params) {
        step.attributes.metaData.pipelineStepMetaData.params = [];
    }
    currentPipeline.steps.push(step.attributes.metaData.pipelineStepMetaData);
    loadPropertiesPanel(step.attributes.metaData);
    currentSteps[step.id] = step;
    diagramStepToStepMetaLookup[id] = step;
    return step;
}

/**
 * Called when the user clicks the step in the designer.
 * @param evt The event from the click.
 */
function handleElementSelect(evt) {
    // evt.highlight(); // TODO Make highlight better and ensure previous highlighted elements are removed
    loadPropertiesPanel(evt.model.attributes.metaData);
}

function loadPropertiesPanel(metaData) {
    var stepMetaData = metaData.stepMetaData;
    var pipelineMetaData = metaData.pipelineStepMetaData;
    $('#step-form #pipelineStepId').text(pipelineMetaData.id);
    $('#step-form #stepId').text(stepMetaData.id);
    $('#step-form #displayName').text(stepMetaData.displayName);
    $('#step-form #description').text(stepMetaData.description);
    $('#step-form #type').text(stepMetaData.type);
    // load step form
    var stepForm = stepForms[stepMetaData.id];
    if (!stepForm) {
        stepForm = '<div id="' + stepMetaData.id + '">\n' +
            '<div class="form-group dynamic-form">' +
            '<label>Execute If Empty:</label>' +
            '<input id="executeIfEmpty"/>' +
            '<select id="executeIfEmptyType" size="1">' + parameterTypeOptions + '</select></div>\n';

        // Build out the parameters
        _.forEach(stepMetaData.params, function (param) {
            stepForm += '<div class="form-group dynamic-form"><label>' + param.name + ':' + '</label>' +
                '<input id="' + param.name + '"/><select id="' + param.name + 'Type" size="1">' + parameterTypeOptions +
                '</select></div>\n';
        });

        stepForm += '</div>';

        stepForms[stepMetaData.id] = stepForm;
    }
    // Clear the old form
    $('#step-parameters-form div').remove();
    // Add the new form
    $('#step-parameters-form').append('<div id="' + stepMetaData.id + 'DynamicForm" class="dynamic-form">' + stepForm + '</div>');
    // Setup the form
    var type = getType(pipelineMetaData.executeIfEmpty, 'static');
    var value;
    var input = $('#executeIfEmpty');
    if (type !== 'static' && type !== 'script') {
        input.val(pipelineMetaData.executeIfEmpty.substring(1));
    }
    input.blur(handleInputChange);
    var el = $('#executeIfEmptyType');
    el.selectmenu({ change: handleTypeSelectChange });
    el.val(type);
    el.selectmenu('refresh');
    _.forEach(stepMetaData.params, function (param) {
        el = $('#' + param.name + 'Type');
        el.selectmenu({ change: handleTypeSelectChange });
        input = $('#' + param.name);
        input.blur(handleInputChange);
    });
    // Initialize the parameters form with existing values
    var select;
    _.forEach(pipelineMetaData.params, function (param) {
        value = param.value;
        // Handle script versus param.type
        type = getType(value, param.type === 'script' ? 'script' : 'static');
        if (type !== 'static' && type !== 'script') {
            value = value.substring(1);
        }
        input = $('#' + param.name);
        input.val(value);
        // set the select value
        select = $('#' + param.name + 'Type');
        select.val(type);
        select.selectmenu('refresh');
    });
}

function handleTypeSelectChange(evt, ui) {
    var input = $('#' + evt.target.id.substring(0, evt.target.id.indexOf('Type')));
    var select = $(evt.target);
    handleValueChanges(input, select);
}

function handleInputChange(evt) {
    var input = $(evt.target);
    var select = $('#' + evt.target.id + 'Type');
    handleValueChanges(input, select);
}

function handleValueChanges(input, select) {
    var inputId = input.attr('id');
    var stepId = $('#pipelineStepId').text();
    var selectVal = select.val();
    var value = getLeadCharacter(selectVal) + input.val();
    var step = diagramStepToStepMetaLookup[stepId];
    var stepMetaData = step.attributes.metaData.stepMetaData;
    var pipelineStepMetadata = step.attributes.metaData.pipelineStepMetaData;
    if (inputId === 'executeIfEmpty') {
        pipelineStepMetadata.executeIfEmpty = value;
    } else if (pipelineStepMetadata && pipelineStepMetadata.params) {
        var param = _.find(pipelineStepMetadata.params, function(p) { return p.name === inputId;});
        if (param) {
            param.value = value;
            param.type = selectVal === 'script' ? 'script' : param.type;
        } else {
            var stepParam = _.find(stepMetaData.params, function(p) { return p.name === inputId; });
            var newParam = {
                value: value,
                type: selectVal === 'script' ? 'script' : stepParam.type,
                name: stepParam.name,
                required: stepParam.required
            };
            pipelineStepMetadata.params.push(newParam);
        }
    }
}

function getLeadCharacter(selectVal) {
    var leadCharacter = '';
    switch(selectVal) {
        case 'global':
            leadCharacter = '!';
            break;
        case 'step':
            leadCharacter = '@';
            break;
        case 'secondary':
            leadCharacter = '#';
            break;
    }
    return leadCharacter;
}

function getType(value, defaultType) {
    var type = defaultType;
    if (value && controlCharacters.indexOf(value[0]) !== -1) {
        switch (value[0]) {
            case '!':
                type = 'global';
                break;
            case '@':
                type = 'step';
                break;
            case '#':
                type = 'secondary';
                break;
        }
    }

    return type;
}

function clearPropertiesPanel() {
    $('#stepId').text('');
    $('#displayName').text('');
    $('#description').text('');
    $('#step-parameters-form div').remove();
    var selectedPipelineId = $('#pipelines').val();
    if (pipelineLookup[selectedPipelineId]) {
        $('#pipelineName').text(pipelineLookup[selectedPipelineId].name);
    }
}

function showClearDesignerDialog() {
    selectedPipeline = $('#pipelines').val();
    clearDesignerDialog.dialog("open");
}

function handleNew() {
    if (currentPipeline || isDesignerPopulated()) {
        clearFunction = function() {
            var select = $('#pipelines');
            select.val('none');
            select.selectmenu('refresh');
            addPipelineDialog.dialog("open");
        };
        showClearDesignerDialog();
    } else {
        clearPipelineDesigner();
        addPipelineDialog.dialog("open");
    }
}

function handleReset() {
    if (currentPipeline || isDesignerPopulated()) {
        clearFunction = function() {
            var select = $('#pipelines');
            select.val('none');
            select.selectmenu('refresh');
            $('#pipelineName').text('');
        };
        showClearDesignerDialog();
    } else {
        clearPipelineDesigner();
    }
}

function handleClear() {
    clearPipelineDesigner();
    clearFunction();
    $(this).dialog('close');
}

function handleSave() {
    var pipelineJson = generatePipelineJson();
    console.log(JSON.stringify(pipelineJson, null, 4));
    // TODO Run validation of configured steps against step metadata
    _.forEach(pipelineJson.steps, function(step) {
    });
}

$(document).ready(function () {
    $('#tabs').tabs();
    createDesignerPanel();
    loadSteps();
    loadPipelines();

    $("#pipelines").selectmenu({
        change: verifyLoadPipeline
    });

    clearDesignerDialog = $("#dialog-confirm").dialog({
        autoOpen: false,
        resizable: false,
        height: "auto",
        width: 400,
        modal: true,
        buttons: {
            'Clear': handleClear,
            Cancel: function () {
                // Set the select back to the original value
                if (selectedPipeline) {
                    var select = $('#pipelines');
                    select.val(selectedPipeline);
                    select.selectmenu('refresh');
                    selectedPipeline = 'none';
                }
                $(this).dialog('close');
            }
        }
    });

    addStepDialog = $("#dialog-step-form").dialog({
        autoOpen: false,
        height: 'auto',
        width: 350,
        modal: true,
        buttons: {
            "Add Step": function () {
                var idField = $('#add-step-id');
                addStepToDesigner(idField.val(), dropStep.name, dropStep.x, dropStep.y, dropStep.stepMetaData.id);
                idField.val('');
                $(this).dialog('close');
            },
            Cancel: function () {
                dropStep = null;
                $('#add-step-id').val('');
                $(this).dialog('close');
            }
        }
    });

    addPipelineDialog = $("#dialog-pipeline-form").dialog({
        autoOpen: false,
        height: 'auto',
        width: 350,
        modal: true,
        buttons: {
            "New Pipeline": function () {
                var idField = $('#add-pipeline-id');
                currentPipeline = {
                    name: idField.val(),
                    steps: []
                };
                $('#pipelineName').text(currentPipeline.name);
                idField.val('');
                $(this).dialog('close');
            },
            Cancel: function () {
                dropStep = null;
                $('#add-step-id').val('');
                $(this).dialog('close');
            }
        }
    });

    $('#save-button').click(handleSave);
    $('#new-button').click(handleNew);
    $('#reset-button').click(handleReset);
});
