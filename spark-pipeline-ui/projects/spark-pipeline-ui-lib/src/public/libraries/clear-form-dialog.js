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

function showClearFormDialog(clearFunction, cancelFunction, title, buttonText) {
    clearFormDialogClearFunction = clearFunction;
    clearFormDialogCancelFunction = cancelFunction;
    const label = $('#clearFormModalLabel');
    label.empty();
    label.text(title || 'Clear Form?');
    const button = $('#clear-form-clear');
    button.empty();
    button.text(buttonText || 'Clear');

    $('#dialog-confirm').modal('show');
}
