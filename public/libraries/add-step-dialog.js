// Contains information about the step being dragged to the canvas
let draggingStep;

function initializeAddStepDialog() {
    $('#add-step-form-save').click(handleAddStep);
    $('#add-step-form-cancel').click(handleAddStepCancel);
    $('#add-step-form-close').click(handleAddStepCancel);
    $('#add-step-id').keypress(function(e) {
        if (e.which === 13) {
            e.preventDefault();
            handleAddStep();
        }
    });
    $('#dialog-step-form').on('shown.bs.modal', function () {
        $('#add-step-id').focus();
    });
}

function handleAddStepCancel() {
    draggingStep = null;
    $('#dialog-step-form').modal('hide');
}

function handleAddStep() {
    const idField = $('#add-step-id');
    // TODO Make sure the id isn't already being used in the pipeline
    const id = idField.val();
    const step = pipelineGraphEditor.addElementToCanvas(draggingStep.name,
        draggingStep.x - (stepSize.width / 2),
        draggingStep.y,
        stepsModel.getStep(draggingStep.stepMetaDataId));
    step.attributes.metaData.id = id;
    step.attributes.metaData.pipelineStepMetaData.id = id;
    loadPropertiesPanel(step.attributes.metaData);
    // currentSteps[step.id] = step;
    diagramStepToStepMetaLookup[id] = step;
    idField.val('');
    draggingStep = null;
    $('#dialog-step-form').modal('hide');
}

function showAddStepDialog(step) {
    draggingStep = step;
    $('#add-step-id').val('');
    $('#dialog-step-form').modal('show');
}
