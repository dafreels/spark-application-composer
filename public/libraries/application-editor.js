// The current application being edited
let currentApplication;
// The application level editors
let globals;
let classOverrides;

// The execution level editors
let executionGlobals;
let executionClassOverrides;

let graphEditor;

// The metadata for the currently selected execution
let executionMetaData;

// Save state
let saveApplicationId;
let saveApplicationName;

function initializeApplicationEditor() {
    const select = $('#applications');
    select.append($("<option />").val('none').text(''));
    select.change(handleSelectApplication);

    // TODO add the remove handler?
    graphEditor = new GraphEditor($('#executionDesigner'),
        createExecution,
        null,
        handleExecutionAddPort,
        null,
        function(metaData) {
            // Open the drawer
            loadExecutionEditorPanel(metaData);
            $('#execution-editor-drawer').drawer('show');
        });
    globals = new GlobalsEditor($('#globals'), {});
    classOverrides = new ClassOverridesEditor($('#application-setup-panel'), {});

    $('#export-application-button').click(handleExportApplication);
    $('#new-application-button').click(handleNewApplication);
    $('#save-application-button').click(handleSaveApplication);
    $('#reset-application-button').click(handleClearApplicationForm);
    $('#add-execution-button').click(handleAddExecution);
    $('#layout-executions-button').click(handleExecutionLayout);

    $('#kyro-classes').tokenfield()
        .on('tokenfield:createdtoken', handleKryoClassesChange)
        .on('tokenfield:removedtoken', handleKryoClassesChange);

    $('#add-spark-option-button').click(createStepOption);

    $('#step-packages').tokenfield()
        .on('tokenfield:createdtoken', handleStepPackagesChange)
        .on('tokenfield:removedtoken', handleStepPackagesChange);

    $('#required-parameters').tokenfield()
        .on('tokenfield:createdtoken', handleRequiredParametersChange)
        .on('tokenfield:removedtoken', handleRequiredParametersChange);

    executionClassOverrides = new ClassOverridesEditor($('#edit-execution-classes-form'), {});
    executionGlobals =  new GlobalsEditor($('#edit-execution-globals-form'), {});

    // Create the pipeline selection buttons
    $('#add-pipeline-button').click(function() {
        const option = $('#available-pipelines option:selected');
        option.remove();
        option.appendTo($('#selected-pipelines'));
        populateExecutionPipelineIds();
    });
    $('#remove-pipeline-button').click(function() {
        const option = $('#selected-pipelines option:selected');
        option.remove();
        option.appendTo($('#available-pipelines'));
        populateExecutionPipelineIds();
    });
    $('#move-pipeline-up-button').click(function() {
        const option = $('#selected-pipelines option:selected');
        option.prev().before(option);
        populateExecutionPipelineIds();
    });
    $('#move-pipeline-down-button').click(function() {
        const option = $('#selected-pipelines option:selected');
        option.next().after(option);
        populateExecutionPipelineIds();
    });
}

/*
 * Graph functions
 */
function handleAddExecution() {
    showNewDialog(function(name) {
        // TODO Use the locations of other executions on the canvas to place this execution
        const x = Math.round($('#executionDesigner').width() / 2);
        const y = graphEditor.getNextYCoordinate();
        graphEditor.addElementToCanvas(name, x, y, {
            id: name,
            pipelineIds: [],
            pipelines: [],
            parents: []
        });
    });
}

function handleExecutionLayout() {
    graphEditor.performAutoLayout();
}

/**
 * This function handles adding a new outport to the execution
 * @param evt The click event containing the element
 */
function handleExecutionAddPort(evt) {
    const port = _.assign({}, portTemplate);
    port.group = 'out';
    evt.model.addPorts([port]);
}

/**
 * Adds a new execution to the canvas.
 * @param name The id of the execution.
 * @param x The x coordinate.
 * @param y The y coordinate.
 * @param metadata The metadata to attach to the element.
 * @returns {joint.shapes.spark.Execution}
 */
function createExecution(name, x, y, metadata) {
    const inPort = _.assign({}, portTemplate);
    inPort.group = 'in';
    const ports = [inPort];

    return new joint.shapes.spark.Execution({
        position: {x: x, y: y},
        size: stepSize,
        attrs: {
            label: {
                text: joint.util.breakText(name, stepSize, {'font-size': 12}, {ellipsis: true})
            }
        },
        ports: {
            groups: {
                'in': {
                    position: {
                        name: 'top'
                    },
                    attrs: {
                        circle: {
                            fill: 'ivory',
                            r: 6,
                            magnet: true
                        }
                    },
                    magnet: true
                },
                'out': {
                    position: {
                        name: 'bottom'
                    },
                    attrs: {
                        circle: {
                            fill: 'ivory',
                            r: 4,
                            magnet: true
                        }
                    },
                    magnet: true
                }
            },
            items: ports
        },
        metaData: metadata
    });
}
/*
 * End graph functions
 */

/*
 * These functions are only for the SparkConf editor section
 */
function handleKryoClassesChange() {
    if (!currentApplication.sparkConf) {
        currentApplication.sparkConf = {}
    }
    currentApplication.sparkConf.kryoClasses = $('#kyro-classes').tokenfield('getTokensList').split(',').map(token => token.trim());
    if (currentApplication.sparkConf.kryoClasses.length === 0) {
        delete currentApplication.sparkConf.kryoClasses;
    }
}

function createStepOption(data) {
    const formDiv = $('<div class="row">');
    $('<label>Name:</label>').appendTo(formDiv);
    const name = $('<input name="stepOptionName" type="text"/>');
    name.appendTo(formDiv);
    $('<label>Value:</label>').appendTo(formDiv);
    const value = $('<input name="stepOptionValue" type="text"/>');
    value.appendTo(formDiv);
    const button = $('<button class="btn btn-info" title="Remove Parameter">');
    button.appendTo(formDiv);
    $('<i class="glyphicon glyphicon-minus-sign"></i>').appendTo(button);
    button.click(function() {
        formDiv.remove();
    });
    formDiv.appendTo($('#spark-conf-options'));

    if (data) {
        name.val(data.name);
        value.val(data.value);
    }
}
/*
 * End SparkConf Editor functions
 */

/*
 * These functions are only for the application settings editor section
 */
function handleStepPackagesChange() {
    currentApplication.stepPackages = $('#step-packages').tokenfield('getTokensList').split(',').map(token => token.trim());
}

function handleRequiredParametersChange() {
    currentApplication.requiredParameters = $('#required-parameters').tokenfield('getTokensList').split(',').map(token => token.trim());
}
/*
 * End application editor settings
 */

function renderApplicationsSelect() {
    const applications = $('#applications');
    applications.empty();
    applications.append($('<option />').val('none').text(''));
    _.forEach(applicationsModel.getApplications(), (application) => {
        if (application.name === saveApplicationName) {
            saveApplicationId = application.id;
        }
        applications.append($("<option/>").val(application.id).text(application.name));
    });
    // Select the previously saved application
    if (saveApplicationId) {
        clearApplicationForm();
        applications.val(saveApplicationId);
        populateApplicationForm(saveApplicationId);
        saveApplicationId = null;
        saveApplicationName = null;
    }
}

function handleNewApplication() {
    if (currentApplication) {
        showClearFormDialog(function() {
            showNewDialog(setupNewApplication);
        });
    } else {
        showNewDialog(setupNewApplication);
    }
}

function handleSelectApplication() {
    const selectedApplication = $(this).val();
    if (currentApplication) {
        const previouslySelected = currentApplication.id || 'none';
        showClearFormDialog(function () {
            clearApplicationForm();
            $("#applications").val(selectedApplication);
            populateApplicationForm(selectedApplication);
        }, function () {
            $('#applications').val(previouslySelected);
            $('#export-application-button').removeClass('disabled');
        });
    } else {
        $('#export-application-button').removeClass('disabled');
        clearApplicationForm();
        $("#applications").val(selectedApplication);
        populateApplicationForm(selectedApplication);
    }
}

function setupNewApplication(name) {
    currentApplication = {
        name: name
    };
    $('#export-application-button').removeClass('disabled');
    $('#application-form-div').toggle();
    $('#applicationName').text(currentApplication.name);
}

function handleClearApplicationForm() {
    if (currentApplication) {
        showClearFormDialog(function() {
            clearApplicationForm();
        });
    }
}

function populateApplicationForm(applicationId) {
    if (applicationId === 'none') {
        return;
    }

    currentApplication = applicationsModel.getApplication(applicationId);
    const $applicationFormDiv = $('#application-form-div');
    if ($applicationFormDiv.css('display') === 'none') {
        $applicationFormDiv.toggle();
    }
    $('#applicationName').text(currentApplication.name);
    let kryoClasses = [];
    if (currentApplication.sparkConf) {
        kryoClasses = currentApplication.sparkConf.kryoClasses || [];
        // Populate any parameters
        _.forEach(currentApplication.sparkConf.setOptions, (option) => createStepOption(option));
    }
    $('#kyro-classes').tokenfield('setTokens', kryoClasses);
    $('#step-packages').tokenfield('setTokens', currentApplication.stepPackages || []);
    $('#required-parameters').tokenfield('setTokens', currentApplication.requiredParameters || []);

    classOverrides.setValue(currentApplication);
    globals.setValue(currentApplication.globals || {});

    const addedElements = [];
    const elements = {};
    let children;
    // Add all executions to the canvas
    _.forEach(currentApplication.executions, (execution) => {
        if (addedElements.indexOf(execution.id) === -1) {
            elements[execution.id] = graphEditor.addElementToCanvas(execution.id, 0, 0, execution);
            addedElements.push(execution.id);
            // Link to children
            children = _.filter(currentApplication.executions, child => child.parents && child.parents.indexOf(execution.id) !== -1);
            _.forEach(children, (child) => {
                if (addedElements.indexOf(child.id) === -1) {
                    elements[child.id] = graphEditor.addElementToCanvas(child.id, 0, 0, child);
                    addedElements.push(child.id);
                }
                // Create a link between this child and the parent
                graphEditor.createLink(elements[execution.id], elements[child.id]);
            });
        }
    });
    // Perform a layout
    graphEditor.performAutoLayout();
}

function clearApplicationForm() {
    // Handle drawer being open since 'hide' does not work
    const drawer = $('#execution-editor-drawer');
    if (drawer.hasClass('open')) {
        drawer.drawer('toggle');
    }
    graphEditor.clear();
    currentApplication = null;
    executionMetaData = null;
    $('#kyro-classes').tokenfield('setTokens', []);
    $('#step-packages').tokenfield('setTokens', []);
    $('#required-parameters').tokenfield('setTokens', []);
    $('#applicationName').text('');
    $("#applications").val('none');
    $('#spark-conf-options').empty();
    classOverrides.clear();
    globals.clear();
    executionClassOverrides.clear();
    executionGlobals.clear();
    $('#available-pipelines').empty();
    $('#selected-pipelines').empty();
    $('#application-form-div').toggle();
    $('#export-application-button').addClass('disabled');
}

/*
 * Execution editor functions
 */
function loadExecutionEditorPanel(metaData) {
    executionMetaData = metaData;
    const pipelines = pipelinesModel.getPipelines();
    const availableSelect = $('#available-pipelines');
    availableSelect.empty();
    const selectedPipelines = $('#selected-pipelines');
    selectedPipelines.empty();
    _.forEach(_.filter(pipelines, p => metaData.pipelineIds.indexOf(p.id) === -1), pipeline => $('<option value="' + pipeline.id + '">' + pipeline.name + '</option>').appendTo(availableSelect));
    _.forEach(_.filter(pipelines, p => metaData.pipelineIds.indexOf(p.id) !== -1), pipeline => $('<option value="' + pipeline.id + '">' + pipeline.name + '</option>').appendTo(selectedPipelines));
    // Populate the class overrides and globals
    executionClassOverrides.clear();
    executionClassOverrides.setValue(metaData);
    executionGlobals.clear();
    if (!metaData.globals) {
        metaData.globals = {};
    }
    executionGlobals.setValue(metaData.globals);
}

function populateExecutionPipelineIds() {
    if (executionMetaData) {
        executionMetaData.pipelineIds = [];
        $('#selected-pipelines').children('option').each(function () {
            executionMetaData.pipelineIds.push($(this).val());
        });
    }
}
/*
 * End execution editor functions
 */

/*
 * Save functions
 */
function handleSaveApplication() {
    const application = generateApplicationJson();
    const validations = validateApplication(application);
    if (validations.length === 0) {
        saveApplicationId = application.id;
        saveApplicationName = application.name;
        saveApplication(application, function (err) {
            if (err) {
                showGlobalErrorMessage('Failed to save application', err);
            } else {
                clearApplicationForm();
                loadApplicationsUI();
            }
        });
    } else {
        showValidationErrorDialog(validations);
    }
}

function handleExportApplication() {
    const application = generateApplicationJson();
    const fileName = application.name.replace(' ', '_') + '.json';
    // Remove unused data
    delete application._id;
    delete application.id;
    delete application.name;
    delete application.creationDate;
    delete application.modifiedDate;
    const link = document.createElement('a');
    link.setAttribute('href', 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(application)));
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
}

function validateApplication(application) {
    const validations = [];

    if (!application.name || application.name.trim().length < 3) {
        validations.push({
            header: 'Name',
            messages: ['Name is required to be at least 3 characters!']
        });
    }
    // validate the executions
    let executionValidation;
    _.forEach(application.executions, (execution) => {
        if ((!execution.pipelineIds || execution.pipelineIds.length === 0) &&
            (!execution.pipelines || execution.pipelines.length === 0))  {
            if (!executionValidation) {
                executionValidation = {
                    header: 'Executions',
                    messages: []
                };
                validations.push(executionValidation);
            }
            executionValidation.messages.push('Execution named ' + execution.id + ' needs to define at least one pipeline!');
        }
    });
    // TODO Add additional validations
    return validations;
}

function generateApplicationJson() {
    let name;
    let value;
    const setOptions = [];
    $('#spark-conf-options').children('div').each(function() {
        name = $(this).find('input[name="stepOptionName"]').val();
        value = $(this).find('input[name="stepOptionValue"]').val();
        if (name && name.trim().length > 0) {
            setOptions.push({
                name: name,
                value: value
            });
        }
    });

    delete currentApplication._id;

    if (!currentApplication.sparkConf) {
        currentApplication.sparkConf = {};
    }

    if (setOptions.length > 0) {
        currentApplication.sparkConf.setOptions = setOptions;
    } else {
        delete currentApplication.sparkConf.setOptions;
    }

    if (!currentApplication.sparkConf.setOptions && !currentApplication.sparkConf.kryoClasses) {
        delete currentApplication.sparkConf;
    }

    currentApplication.globals = globals.getData();
    const classOverrideSettings = classOverrides.getValue();
    currentApplication.pipelineListener = classOverrideSettings.pipelineListener;
    currentApplication.securityManager = classOverrideSettings.securityManager;
    currentApplication.stepMapper = classOverrideSettings.stepMapper;

    // Get the executions
    const executions = graphEditor.getGraphMetaData();
    currentApplication.executions = [];
    currentApplication.pipelines = [];
    const pipelineIds = [];
    _.forEach(executions, (execution) => {
        if (execution.metaData.parents && execution.metaData.parents.length === 0) {
            delete execution.metaData.parents;
        }
        currentApplication.executions.push(execution.metaData);
        _.forEach(execution.metaData.pipelineIds, (id) => {
            if(pipelineIds.indexOf(id) === -1) {
                pipelineIds.push(id);
                currentApplication.pipelines.push(pipelinesModel.getPipeline(id));
            }
        });
    });

    return currentApplication;
}

/*
 * End save functions
 */
