let settingsDialog;
let settingsSaveFunction;
let settingsCancelFunction;
let kyroClassesSelect;
let kryoClasses;

function initializeSettingsDialog() {
    settingsDialog = $("#dialog-settings-form").dialog({
        autoOpen: false,
        resizable: false,
        height: "auto",
        width: 400,
        modal: true,
        buttons: {
            'Save': handleSettingsDialogSave,
            Cancel: handleSettingsDialogCancel
        }
    });

    kyroClassesSelect = $('#kyro-classes').selectize({
        plugins: ['remove_button', 'drag_drop'],
        delimiter: ',',
        persist: false,
        create: function (input) {
            return {
                value: input,
                text: input
            }
        },
        onChange: function (value) {
            kryoClasses = value.split(',');
        }
    })[0].selectize;
}

function handleSettingsDialogSave() {
    // TODO Gather the form data and pass it to the save function
    if (settingsSaveFunction) {
        settingsSaveFunction();
    }
    settingsDialog.dialog('close');
}

function handleSettingsDialogCancel() {
    if (settingsCancelFunction) {
        settingsCancelFunction();
    }
    settingsDialog.dialog('close');
}

// TODO Take in the data to populate the form
function showSettingsDialog(saveFunction, cancelFunction) {
    settingsSaveFunction = saveFunction;
    settingsCancelFunction = cancelFunction;
    settingsDialog.dialog("open");
}
