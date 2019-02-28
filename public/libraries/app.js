const parameterTypeOptions = '<option value="static">Static</option>' +
    '<option value="global">Global</option>' +
    '<option value="step">Step Response</option>' +
    '<option value="secondary">Secondary Step Response</option>' +
    '<option value="script">Script</option>';

function loadStepsUI() {
    loadSteps(() => {
        loadPipelineDesignerStepsUI();
        renderStepSelectionUI();
    });
}

function loadPipelinesUI() {
    loadPipelines(() => {
        renderPipelinesDesignerSelect();
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

    // Load the steps data from the API and render the UIs.
    loadStepsUI();
    // Load the pipelines data from the API and render the UIs.
    loadPipelinesUI();
});
