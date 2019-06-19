let copyPipelineSaveFunction;
let copyPipelineCancelFunction;

function initializeCopyPipelineDialog() {
    $('#copy-pipeline-form-save').click(handleCopyPipelineDialogSave);
    $('#copy-pipeline-form-cancel').click(handleCopyPipelineDialogCancel);
    $('#copy-pipeline-form-close').click(handleCopyPipelineDialogCancel);
    $('#copy-pipeline-id').keypress(function(e) {
        if (e.which === 13) {
            e.preventDefault();
            handleAddStep();
        }
    });
}

function handleCopyPipelineDialogSave() {
    if (copyPipelineSaveFunction) {
        copyPipelineSaveFunction($('#copy-pipeline-id').val(), $('#source-pipelines').val());
    }
    $('#dialog-copy-pipeline-form').modal('hide');
}

function handleCopyPipelineDialogCancel() {
    if (copyPipelineCancelFunction) {
        copyPipelineCancelFunction();
    }
    $('#dialog-copy-pipeline-form').modal('hide');
}

function showCopyPipelineDialog(saveFunction, cancelFunction) {
    copyPipelineSaveFunction = saveFunction;
    copyPipelineCancelFunction = cancelFunction;
    const select = $('#source-pipelines');
    select.val('none').change();
    // select.selectmenu('refresh');
    $('#copy-pipeline-id').val('');
    $('#dialog-copy-pipeline-form').modal('show');
}
