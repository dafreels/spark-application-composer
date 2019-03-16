let clearFormDialogClearFunction;
let clearFormDialogCancelFunction;

function initializeClearFormDialog() {
    $('#clear-form-clear').click(handleClearFormDialogClear);
    $('#clear-form-cancel').click(handleClearFormDialogCancel);
    $('#clear-form-close').click(handleClearFormDialogCancel);
}

function handleClearFormDialogClear() {
    if (clearFormDialogClearFunction) {
        clearFormDialogClearFunction();
    }
    $('#dialog-confirm').modal('hide');
}

function handleClearFormDialogCancel() {
    if (clearFormDialogCancelFunction) {
        clearFormDialogCancelFunction();
    }
    $('#dialog-confirm').modal('hide');
}

function showClearFormDialog(clearFunction, cancelFunction) {
    clearFormDialogClearFunction = clearFunction;
    clearFormDialogCancelFunction = cancelFunction;
    $('#dialog-confirm').modal('show');
}
