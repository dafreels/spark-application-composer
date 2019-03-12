let editor;
let codeEditorSaveFunction;
let codeEditorCancelFunction;

function initializeCodeEditorDialog() {
    $('#edit-code-form-save').click(handleCodeEditorSave);
    $('#edit-code-form-cancel').click(handleCodeEditorCancel);
    $('#edit-code-form-close').click(handleCodeEditorCancel);
    $('#codeEditorSyntax').change(function () {
        editor.session.setMode('ace/mode/' + $(this).val());
    });

    editor = ace.edit('code-editor', {
        maxLines: 25,
        minLines: 25
    });
    editor.setTheme('ace/theme/solarized_light');
}

function showCodeEditorDialog(code, mode, saveFunction, cancelFunction) {
    codeEditorSaveFunction = saveFunction;
    codeEditorCancelFunction = cancelFunction;

    if (!mode) {
        mode = 'javascript';
    }
    $('#codeEditorSyntax').val(mode).change();
    editor.session.setMode('ace/mode/' + mode);
    editor.session.setValue(code);
    $('#dialog-editor').modal('show');
}

function handleCodeEditorSave() {
    if (codeEditorSaveFunction) {
        codeEditorSaveFunction(editor.session.getValue(), $('#codeEditorSyntax').val());
    }
    $('#dialog-editor').modal('hide');
}

function handleCodeEditorCancel() {
    if (codeEditorCancelFunction) {
        codeEditorCancelFunction();
    }
    $('#dialog-editor').modal('hide');
}

