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

function loadStepsUI() {
    var stepsContainer = $('#step-panel');
    var stepSelector = $('#step-selector');
    stepsContainer.empty();
    stepSelector.empty();
    // TODO Convert to using a steps model that is populated by the service. The callback should just notify that the model is loaded
    loadSteps(function (steps) {
        _.forEach(steps, function(step) {
            // Build out the pipeline designer step control
            $('<div id="' + step.id + '" class="step ' + step.type + '" draggable="true" ondragstart="drag(event)">' + step.displayName + '</div>')
                .appendTo(stepsContainer);
            $('div #' + step.id).fitText(1.50);
            // Build out the step editor control
            $('<li id="' + step.id + '" stepType="' + step.type + '" class="ui-widget-content">' + step.displayName + '</li>').appendTo(stepSelector);
            $('li #' + step.id).fitText(1.50);
        });
    });
    stepSelector.selectable({
        stop: handleStepSelection,
        selected: function (event, ui) {
            $(ui.selected).addClass("ui-selected").siblings().removeClass("ui-selected");
        }
    });
}

function cloneObject(obj) {
    if (!obj) {
        return null;
    }
    return JSON.parse(JSON.stringify(obj));
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
    loadPipelines(handleLoadPipelines);

    $("#pipelines").selectmenu({
        change: verifyLoadPipeline
    });
});
