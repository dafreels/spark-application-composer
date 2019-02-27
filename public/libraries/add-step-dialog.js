let addStepDialog;

function initializeAddStepDialog() {
    addStepDialog = $("#dialog-step-form").dialog({
        autoOpen: false,
        height: 'auto',
        width: 350,
        modal: true,
        buttons: {
            "Add Step": function () {
                var idField = $('#add-step-id');
                // TODO Make sure the id isn't already being used in the pipeline
                addStepToDesigner(idField.val(), draggingStep.name, draggingStep.x, draggingStep.y, draggingStep.stepMetaDataId);
                idField.val('');
                draggingStep = null;
                $(this).dialog('close');
            },
            Cancel: function () {
                draggingStep = null;
                $('#add-step-id').val('');
                $(this).dialog('close');
            }
        }
    });
}

function showAddStepDialog() {
    addStepDialog.dialog('open');
}
