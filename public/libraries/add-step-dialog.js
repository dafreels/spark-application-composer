let addStepDialog;
// Contains information about the step being dragged to the canvas
let draggingStep;

function initializeAddStepDialog() {
    addStepDialog = $("#dialog-step-form").dialog({
        autoOpen: false,
        height: 'auto',
        width: 350,
        modal: true,
        buttons: {
            "Add Step": handleAddStep,
            Cancel: function () {
                draggingStep = null;
                $('#add-step-id').val('');
                $(this).dialog('close');
            }
        }
    });

    $('#add-step-id').keypress(function(e) {
        if (e.which === 13) {
            e.preventDefault();
            handleAddStep();
        }
    });
}

function handleAddStep() {
    const idField = $('#add-step-id');
    // TODO Make sure the id isn't already being used in the pipeline
    addStepToDesigner(idField.val(), draggingStep.name, draggingStep.x - (stepSize.width / 2), draggingStep.y, draggingStep.stepMetaDataId);
    idField.val('');
    draggingStep = null;
    addStepDialog.dialog('close');
}

function showAddStepDialog(step) {
    draggingStep = step;
    addStepDialog.dialog('open');
}
