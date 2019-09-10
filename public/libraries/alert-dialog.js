
function initializeAlertDialog() {
    $('#alert-dialog-ok').click(handleClose);
    $('#alert-dialog-close').click(handleClose);
}

function handleClose() {
    $('#dialog-alert').modal('hide');
}

function showAlertDialog(message, messages) {
    const alert = $('#dialog-alert-field');
    alert.empty();
    if (messages) {
        $('<h3>' + message + '</h3>').appendTo(alert);
        const list = $('<ul>');
        list.appendTo(alert);
        _.forEach(messages, msg => $('<li>' + msg + '</li>').appendTo(list));
    } else {
        $('#dialog-alert-field').text(message);
    }
    $('#dialog-alert').modal('show');
}

function showSuccessAlert() {
    const message = 'Save Successful';
    const messages = [];
    showAlertDialog(message, messages);
    setTimeout(() =>  $('#dialog-alert').modal('hide'), 2500);
}
