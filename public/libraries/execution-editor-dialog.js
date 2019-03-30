
class AddExecutionDialog {
    constructor(parentContainer) {
        this.parent = parentContainer;

        const execution = this;
        $('#execution-name').blur(function() {
            if (execution.data) {
                execution.data.name = $(this).val();
            }
        });

        $('#edit-execution-form-save').click(this.handleObjectEditorSave());
        $('#edit-execution-form-cancel').click(this.handleObjectEditorCancel());
        $('#edit-execution-form-close').click(this.handleObjectEditorCancel());
    }

    handleObjectEditorSave() {
        const parent = this;
        return function() {
            if (parent.saveFunction) {
                parent.saveFunction(parent.data);
            }
            $('#execution-editor-form').modal('hide');
        };
    }

    handleObjectEditorCancel() {
        const parent = this;
        return function() {
            if (parent.cancelFunction) {
                parent.cancelFunction();
            }
            $('#execution-editor-form').modal('hide');
        };
    }

    showExecutionEditor(data, saveFunction, cancelFunction) {
        this.saveFunction = saveFunction;
        this.cancelFunction = cancelFunction;

        this.parent.empty();
        this.data = data || {};
        $('#execution-name').val(data.name || '');

        $('#execution-editor-form').modal('show');
    }
}
