
function initializeValidationErrorDialog() {
    $('#validation-dialog-ok').click(handleValidationClose);
    $('#validation-dialog-close').click(handleValidationClose);
}

function handleValidationClose() {
    $('#dialog-validation-error').modal('hide');
}

function showValidationErrorDialog(validations) {
    const errorDiv = $('#dialog-validation-error-field');
    errorDiv.empty();
    lodash.forEach(validations, function(validation) {
        $('<h3>' + validation.header + '</h3>').appendTo(errorDiv);
        var list = $('<ul>');
        lodash.forEach(validation.messages, function(f) { $('<li>' + f + '</li>').appendTo(list); });
        $('</ul>').appendTo(list);
        list.appendTo(errorDiv);
    });
    $('#dialog-validation-error').modal('show');
}
