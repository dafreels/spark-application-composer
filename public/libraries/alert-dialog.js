let alertDialog;

function initializeAlertDialog() {
    alertDialog = $("#dialog-alert").dialog({
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

function showAlertDialog(message) {
    $('#dialog-alert-field').text(message);
    alertDialog.dialog('open');
}
