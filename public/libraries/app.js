var selectedPipeline = 'none';
var stepForms = {};

var parameterTypeOptions = '<option value="static">Static</option>' +
    '<option value="global">Global</option>' +
    '<option value="step">Step Response</option>' +
    '<option value="secondary">Secondary Step Response</option>' +
    '<option value="script">Script</option>';

/* Pipeline Designer tasks:
 *
 * TODO Need to handle branch steps (type == branch)
 * TODO Element removal
 * TODO Handle mixing step metadata with PipelineStep metadata on the element/model
 */

function verifyLoadPipeline() {
    if (currentPipeline || isDesignerPopulated()) {
        clearFormDialogClearFunction = loadPipeline;
        showClearFormDialog();
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

function loadStepsUI() {
    var stepsContainer = $('#step-panel');
    var stepSelector = $('#step-selector');
    stepsContainer.empty();
    stepSelector.empty();
    loadSteps(function (step) {
        // Build out the pipeline designer step control
        $('<div id="' + step.id + '" steptype="' + step.type +'" class="step" draggable="true" ondragstart="drag(event)">' + step.displayName + '</div>')
            .appendTo(stepsContainer);
        $('div #' + step.id).fitText(1.50);
        // Build out the step editor control
        $('<li id="' + step.id + '" stepType="' + step.type +'" class="ui-widget-content">' + step.displayName + '</li>').appendTo(stepSelector);
        $('li #' + step.id).fitText(1.50);
    });
    stepSelector.selectable({
        stop: handleStepSelection,
        selected: function (event, ui) {
            $(ui.selected).addClass("ui-selected").siblings().removeClass("ui-selected");
        }
    });
}

$(document).ready(function () {
    // Setup the tabbed interface
    $('#tabs').tabs();

    // Initialize dialogs
    initializeClearFormDialog();
    initializeCodeEditorDialog();
    initializeValidationErrorDialog();
    initializeAddStepDialog();
    initializeNewPipeineDialog();
    initializeAlertDialog();

    // Initialize the editors
    initializeStepsEditor();
    initializePipelineDesigner();

    loadStepsUI();
    $("#pipelines").append($("<option />").val('none').text(''));
    loadPipelines(function(pipeline) {
        $("#pipelines").append($("<option />").val(pipeline.id).text(pipeline.name));
    });

    $("#pipelines").selectmenu({
        change: verifyLoadPipeline
    });
});
