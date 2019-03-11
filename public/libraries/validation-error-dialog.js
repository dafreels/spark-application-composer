let validationErrorDialog;

function initializeValidationErrorDialog() {
    validationErrorDialog = $("#dialog-validation-error").dialog({
        autoOpen: false,
        resizable: false,
        height: "auto",
        width: 400,
        modal: true,
        buttons: {
            Ok: function() {
                $(this).dialog( "close" );
            }
        }
    });
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
    validationErrorDialog.dialog('open');
}
