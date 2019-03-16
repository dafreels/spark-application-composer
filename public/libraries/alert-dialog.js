
function initializeAlertDialog() {
    $('#alert-dialog-ok').click(handleClose);
    $('#alert-dialog-close').click(handleClose);
}

function handleClose() {
    $('#dialog-alert').modal('hide');
}

function showAlertDialog(message) {
    $('#dialog-alert-field').text(message);
    $('#dialog-alert').modal('show');
}
