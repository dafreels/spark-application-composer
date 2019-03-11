let editor;
let codeEditorDialog;
let codeEditorSaveFunction;
let codeEditorCancelFunction;
let codeEditorCloseFunction;

function initializeCodeEditorDialog() {
    codeEditorDialog = $("#dialog-editor").dialog({
        autoOpen: false,
        resizable: false,
        height: 500,
        width: 800,
        modal: true,
        closeOnEscape: true,
        close: handleCodeEditorClose,
        buttons: {
            'Save': handleCodeEditorSave,
            Cancel: handleCodeEditorCancel
        }
    });

    $('#codeEditorSyntax').selectmenu({
        change: function() {
            editor.session.setMode('ace/mode/' + $(this).val());
        }
    });

    editor = ace.edit('code-editor');
    editor.setTheme('ace/theme/solarized_light');
}

function showCodeEditorDialog(code, mode) {
    if (!mode) {
        mode = 'javascript';
    }
    const select = $('#codeEditorSyntax');
    select.val(mode);
    select.selectmenu('refresh');
    editor.session.setMode('ace/mode/' + mode);
    codeEditorDialog.dialog("open");
    editor.session.setValue(code);

}

function handleCodeEditorSave() {
    if (codeEditorSaveFunction) {
        codeEditorSaveFunction(editor.session.getValue(), $('#codeEditorSyntax').val());
    }
    codeEditorDialog.dialog('close');
}

function handleCodeEditorCancel() {
    if (codeEditorCancelFunction) {
        codeEditorCancelFunction();
    }
    codeEditorDialog.dialog('close');
}

function handleCodeEditorClose() {
    if (codeEditorCloseFunction) {
        codeEditorCloseFunction();
    }
}
