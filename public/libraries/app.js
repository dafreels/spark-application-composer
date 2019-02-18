var dropStep = null;
var selectedPipeline = 'none';

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

/* Pipeline Designer tasks:
 *
 * TODO Need to handle branch steps (type == branch)
 * TODO Element removal
 * TODO Handle mixing step metadata with PipelineStep metadata on the element/model
 *
 * Pipeline Step Properties:
 *
 * Common (read-only except for id):
 *  id -> The unique id within the pipeline of this step
 *  stepId -> The step id: taken from step metadata
 *  displayName -> taken from step metadata
 *  description -> taken from step metadata
 *  type -> taken from step metadata: Currently always Pipeline, but in the future maybe something else that can be used for grouping?
 *  nextStepId -> This should be set when a link is created between nodes
 *  engineMeta -> taken from step metadata
 *
 * Custom:
 *  params -> An array of form elements generated from the step metadata
 *
 *  Types:
 *      boolean: make this a check box
 *      text:
 *          A select component should be displayed with the following options:
 *
 *              static - the entered text
 *              global - prepend ! to the entered text
 *              step - prepend @ to the entered text
 *              secondary step - prepend # to the entered text
 *              script - set the type of the parameter to 'script' and use the entered text. Should this become a textarea?
 *              object - need a way to allow users to pick an object and add it as a parameter
 */

function loadForms() {
}

function clearPipelineDesigner() {
    graph.clear();
    clearPropertiesPanel();
}

function loadPipeline(event, data) {
    if (data.item.value !== 'none') {
        console.log(pipelineLookup[data.item.value].name);
    }
    showClearDesignerDialog();
    /*
     * TODO:
     *  If there is a diagram on the designer and changes have been made, prompt the user
     *  Iterate pipeline
     *  Add step to canvas
     *  add links to elements
     *  select first element
     *  fit canvas content
     */
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
    $('#pipelineStepId').text(pipelineMetaData.id);
    $('#stepId').text(stepMetaData.id);
    $('#displayName').text(stepMetaData.displayName);
    $('#description').text(stepMetaData.description);
}

function clearPropertiesPanel() {
    $('#stepId').text('');
    $('#displayName').text('');
    $('#description').text('');
    var selectedPipelineId = $('#pipelines').val();
    if (pipelineLookup[selectedPipelineId]) {
        $('#pipelineName').text(pipelineLookup[selectedPipelineId].name);
    }
}

function showClearDesignerDialog() {
    selectedPipeline = $('#pipelines').val();
    clearDesignerDialog.dialog( "open" );
}

$(document).ready(function () {
    $('#tabs').tabs();
    createDesignerPanel();
    loadSteps();
    loadPipelines();
    loadForms();

    $("#pipelines").selectmenu({
        change: loadPipeline
    });

    clearDesignerDialog = $("#dialog-confirm").dialog({
        autoOpen: false,
        resizable: false,
        height: "auto",
        width: 400,
        modal: true,
        buttons: {
            "Clear": function () {
                clearPipelineDesigner();
                $(this).dialog('close');
            },
            Cancel: function () {
                // TODO Set the select back to the original value
                if (selectedPipeline) {
                    $("#pipelines").val(selectedPipeline);
                    selectedPipeline = 'none';
                }
                $(this).dialog('close');
            }
        }
    });

    addStepDialog = $( "#dialog-step-form" ).dialog({
        autoOpen: false,
        height: 'auto',
        width: 350,
        modal: true,
        buttons: {
            "Add Step": function() {
                var idField = $('#add-step-id');
                var step = createStep(dropStep.name, dropStep.x, dropStep.y, dropStep.stepMetaData).addTo(graph);
                step.attributes.metaData.pipelineStepMetaData.id = idField.val();
                loadPropertiesPanel(step.attributes.metaData);
                currentSteps[step.id] = step;
                idField.val('');
                $(this).dialog('close');
            },
            Cancel: function() {
                dropStep = null;
                $('#add-step-id').val('');
                $(this).dialog('close');
            }
        }
    });

    $('#save-button').click(generatePipelineJson);
});
