let newSaveFunction;
let newCancelFunction;

function initializeNewDialog() {
    $('#new-form-save').click(handleNewDialogSave);
    $('#new-form-cancel').click(handleNewDialogCancel);
    $('#new-form-close').click(handleNewDialogCancel);
    $('#add-new-id').keypress(function(e) {
        if (e.which === 13) {
            e.preventDefault();
            handleNewDialogSave();
        }
    });
    $('#dialog-new-form').on('shown.bs.modal', function () {
        $('#add-new-id').focus();
    });
}

function handleNewDialogSave() {
    if (newSaveFunction) {
        newSaveFunction($('#add-new-id').val());
    }
    $('#dialog-new-form').modal('hide');
}

function handleNewDialogCancel() {
    if (newCancelFunction) {
        newCancelFunction();
    }
    $('#dialog-new-form').modal('hide');
}

function showNewDialog(saveFunction, cancelFunction) {
    newSaveFunction = saveFunction;
    newCancelFunction = cancelFunction;
    $('#add-new-id').val('');
    $('#dialog-new-form').modal('show');
}
