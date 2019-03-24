// The current application being edited
let currentApplication;
// The current kryoClasses array
let kryoClasses;
// The step packages array
let stepPackages;
// The required parameters array
let requiredParameters;

// The application level editors
let globals;
let classOverrides;

// The execution level editors
let executionGlobals;
let executionClassOverrides;

let graphEditor;

// The metadata for the currently selected execution
let executionMetaData;

function initializeApplicationEditor() {
    const select = $('#applications');
    select.append($("<option />").val('none').text(''));

    // TODO add the remove handler?
    graphEditor = new GraphEditor($('#executionDesigner'),
        createExecution,
        null,
        handleExecutionAddPort,
        loadExecutionEditorPanel);
    globals = new GlobalsEditor($('#globals'), {});
    classOverrides = new ClassOverridesEditor($('#application-setup-panel'), {});

    $('#new-application-button').click(handleNewApplication);
    $('#save-application-button').click(handleSaveApplication);
    $('#add-execution-button').click(handleAddExecution);
    $('#reset-application-button').click(handleClearApplicationForm);

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

    executionGlobals = new ClassOverridesEditor($('#edit-execution-classes-form'), {});
    executionClassOverrides =  GlobalsEditor($('#edit-execution-globals-form'), {});

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
/**
 * Clears the canvas
 */
function handleAddExecution() {
    showNewDialog(function(name) {
        // TODO Use the locations of other executions on the canvas to place this execution
        const x = Math.round($('#executionDesigner').width() / 2);
        const y = 50;
        graphEditor.addElementToCanvas(name, x, y, {
            id: name,
            pipelineIds: [],
            pipelines: [],
            parents: []
        });
    });
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
    kryoClasses = $('#kyro-classes').tokenfield('getTokensList').split(',').map(token => token.trim());
}

function createStepOption() {
    const formDiv = $('<div class="row">');
    $('<label>Name:</label>').appendTo(formDiv);
    $('<input name="stepOptionName" type="text"/>').appendTo(formDiv);
    $('<label>Value:</label>').appendTo(formDiv);
    $('<input name="stepOptionValue" type="text"/>').appendTo(formDiv);
    const button = $('<button class="btn btn-info" title="Remove Parameter">');
    button.appendTo(formDiv);
    $('<i class="glyphicon glyphicon-minus-sign"></i>').appendTo(button);
    button.click(function() {
        formDiv.remove();
    });
    formDiv.appendTo($('#spark-conf-options'));
}
/*
 * End SparkConf Editor functions
 */

/*
 * These functions are only for the application settings editor section
 */
function handleStepPackagesChange() {
    stepPackages = $('#step-packages').tokenfield('getTokensList').split(',').map(token => token.trim());
}

function handleRequiredParametersChange() {
    requiredParameters = $('#required-parameters').tokenfield('getTokensList').split(',').map(token => token.trim());
}
/*
 * End application editor settings
 */

function renderApplicationsSelect() {
    const applications = $("#applications");
    applications.empty();
    applications.append($("<option />").val('none').text(''));
    _.forEach(applicationsModel.getApplications(), (application) => {
        applications.append($("<option/>").val(application.id).text(application.name));
    });
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

function setupNewApplication(name) {
    currentApplication = {
        name: name
    };
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

function clearApplicationForm() {
    graphEditor.clear();
    currentApplication = null;
    kryoClasses = null;
    stepPackages = null;
    requiredParameters = null;
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
    $('#application-form-div').toggle();
}

/*
 * Execution editor functions
 */
function loadExecutionEditorPanel(metaData) {
    executionMetaData = metaData;
    const pipelines = pipelinesModel.getPipelines();
    // TODO Filter pipelines by what is already in the execution list/application list
    const availableSelect = $('#available-pipelines');
    availableSelect.empty();
    const selectedPipelines = $('#selected-pipelines');
    selectedPipelines.empty();
    _.forEach(pipelines, pipeline => $('<option value="' + pipeline.id + '">' + pipeline.name + '</option>').appendTo(availableSelect));
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
    // TODO handle validation
    saveApplication(application, function() {
        // TODO Reload the application drop down and select the just saved application
        console.log(JSON.stringify(application, null, 4));
    });

}

function generateApplicationJson() {
    if (kryoClasses && kryoClasses.length > 0) {
        currentApplication.sparkConf = {
            kryoClasses: kryoClasses
        }
    }

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

    if (setOptions.length > 0) {
        if (!currentApplication.sparkConf) {
            currentApplication.sparkConf = {};
        }
        currentApplication.sparkConf.setOptions = setOptions;
    }

    currentApplication.stepPackages = stepPackages;
    currentApplication.requiredParameters = requiredParameters;
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
