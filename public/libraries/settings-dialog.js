let settingsDialog;
let settingsSaveFunction;
let settingsCancelFunction;
let kryoClassesSelect;
let kryoClasses;
let stepPackagesSelect;
let stepPackages;
let requiredParametersSelect;
let requiredParameters;

function initializeSettingsDialog() {
    settingsDialog = $("#dialog-settings-form").dialog({
        autoOpen: false,
        resizable: false,
        height: "auto",
        width: 600,
        modal: true,
        buttons: {
            'Save': handleSettingsDialogSave,
            Cancel: handleSettingsDialogCancel
        }
    });

    kryoClassesSelect = $('#kyro-classes').selectize({
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

    stepPackagesSelect = $('#step-packages').selectize({
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
            stepPackages = value.split(',');
        }
    })[0].selectize;

    requiredParametersSelect = $('#required-parameters').selectize({
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
            requiredParameters = value.split(',');
        }
    })[0].selectize;

    $('#add-spark-option-button').click(createStepOption);
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

function createStepOption() {
    const formDiv = $('<div class="form-group">');
    $('<label>Name:</label>').appendTo(formDiv);
    $('<input name="stepOptionName" type="text"/>').appendTo(formDiv);
    $('<label>Value:</label>').appendTo(formDiv);
    $('<input name="stepOptionValue" type="text"/>').appendTo(formDiv);
    const button = $('<button class="ui-button ui-widget ui-corner-all ui-button-icon-only" title="Remove Parameter">');
    button.appendTo(formDiv);
    $('<span class="ui-icon ui-icon-minus"></span>').appendTo(button);
    button.click(function() {
        formDiv.remove();
    });
    formDiv.appendTo($('#spark-conf-options'));
}
