let clearFormDialog;
let clearFormDialogClearFunction;
let clearDialogCancelFunction;

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
    if (clearDialogCancelFunction) {
        clearDialogCancelFunction();
    }
    $(this).dialog('close');
}

function showClearFormDialog() {
    clearFormDialog.dialog("open");
}
