let copyPipelineDialog;
let copyPipelineSaveFunction;
let copyPipelineCancelFunction;

function initializeCopyPipelineDialog() {
    copyPipelineDialog = $("#dialog-copy-pipeline-form").dialog({
        autoOpen: false,
        resizable: false,
        height: "auto",
        width: 400,
        modal: true,
        buttons: {
            'Save': handleCopyPipelineDialogSave,
            Cancel: handleCopyPipelineDialogCancel
        }
    });
}

function handleCopyPipelineDialogSave() {
    if (copyPipelineSaveFunction) {
        copyPipelineSaveFunction();
    }
    $(this).dialog('close');
}

function handleCopyPipelineDialogCancel() {
    if (copyPipelineCancelFunction) {
        copyPipelineCancelFunction();
    }
    $(this).dialog('close');
}

function showCopyPipelineDialog(saveFunction, cancelFunction) {
    copyPipelineSaveFunction = saveFunction;
    copyPipelineCancelFunction = cancelFunction;
    const select = $('#source-pipelines');
    select.val('none');
    select.selectmenu('refresh');
    $('#copy-pipeline-id').val('');
    copyPipelineDialog.dialog("open");
}
