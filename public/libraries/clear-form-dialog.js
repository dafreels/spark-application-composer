let clearFormDialog;
let clearFormDialogClearFunction;
let clearFormDialogCancelFunction;

function initializeClearFormDialog() {
    clearFormDialog = $("#dialog-confirm").dialog({
        autoOpen: false,
        resizable: false,
        height: "auto",
        width: 400,
        modal: true,
        buttons: {
            'Clear': handleClearFormDialogClear,
            Cancel: handleClearFormDialogCancel
        }
    });
}

function handleClearFormDialogClear() {
    if (clearFormDialogClearFunction) {
        clearFormDialogClearFunction();
    }
    $(this).dialog('close');
}

function handleClearFormDialogCancel() {
    if (clearFormDialogCancelFunction) {
        clearFormDialogCancelFunction();
    }
    $(this).dialog('close');
}

function showClearFormDialog(clearFunction, cancelFunction) {
    clearFormDialogClearFunction = clearFunction;
    clearFormDialogCancelFunction = cancelFunction;
    clearFormDialog.dialog("open");
}
