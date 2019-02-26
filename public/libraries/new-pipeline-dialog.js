let newPipelineDialog;

function initializeNewPipeineDialog() {
    newPipelineDialog = $("#dialog-pipeline-form").dialog({
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
}

function showNewPipelineDialog() {
    newPipelineDialog.dialog('open');
}
