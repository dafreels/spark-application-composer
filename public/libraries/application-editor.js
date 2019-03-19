let applicationGraph;
let applicationPaper;
// The current application being edited
let currentApplication;
// The current kryoClasses array
let kryoClasses;
// The step packages array
let stepPackages;
// The required parameters array
let requiredParameters;

let globals;
let classOverrides;
let executionEditor;

// This is a lookup for all of the executions on the paper
let currentExecutions = [];

function initializeApplicationEditor() {
    const select = $('#applications');
    select.append($("<option />").val('none').text(''));

    applicationGraph = new joint.dia.Graph;
    applicationPaper = new joint.dia.Paper({
        el: $('#executionDesigner'),
        model: applicationGraph,
        height: 800,
        width: '95%',
        gridSize: 1,
        defaultLink: new joint.dia.Link({
            attrs: {'.marker-target': {d: 'M 10 0 L 0 5 L 10 10 z'}}
        })
        // allowLink: handleLinkEvent,
        // validateConnection: function (cellViewS, magnetS, cellViewT, magnetT) {
        //     if (getConnectedLinks(cellViewT.model, V(magnetT).attr('port')) > 0) return false;
        //     // Prevent linking from input ports.
        //     if (magnetS && magnetS.getAttribute('port-group') === 'in') return false;
        //     // Prevent linking from output ports to input ports within one element.
        //     if (cellViewS === cellViewT) return false;
        //     // Prevent linking to input ports.
        //     return magnetT && magnetT.getAttribute('port-group') === 'in';
        // },
        // validateMagnet: function (cellView, magnet) {
        //     if (getConnectedLinks(cellView.model, V(magnet).attr('port')) > 0) return false;
        //     if (magnet.getAttribute('magnet') !== 'passive') return true;
        // }
    });

    applicationPaper.on('cell:mouseover', handleExecutionMouseOver);
    applicationPaper.on('cell:mouseout', handleExecutionMouseOut);
    // applicationPaper.on('close:button:pointerdown', handleExecutionRemove);
    applicationPaper.on('edit:button:pointerdown', handleExecutionEdit);

    globals = new GlobalsEditor($('#globals'), {});
    classOverrides = new ClassOverridesEditor($('#application-setup-panel'), {});

    executionEditor = new ExecutionEditor($('#edit-execution-form'));

    $('#new-application-button').click(handleNewApplication);
    $('#save-application-button').click(handleSaveApplication);
    $('#add-execution-button').click(handleAddExecution);
    // TODO Add in protection against clearing the form when there are changes present
    // TODO Create another function to clear all of the form elements
    $('#reset-application-button').click(clearExecutionGraph);

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
}

/*
 * Graph functions
 */

/**
 * Helper function that displays the close button when the mouse pointer is over the cell
 * @param evt The underlying cell
 */
function handleExecutionMouseOver(evt) {
    const close = getExecutionElements(evt);
    if (close.populated) {
        close.closeButton.setAttribute('visibility', 'visible');
        close.closeLabel.setAttribute('visibility', 'visible');
        close.editButton.setAttribute('visibility', 'visible');
        close.editLabel.setAttribute('visibility', 'visible');
    }
}

/**
 * Helper function that hides the close button when the mouse pointer leaves the cell
 * @param evt The underlying cell
 */
function handleExecutionMouseOut(evt) {
    const close = getExecutionElements(evt);
    if (close.populated) {
        close.closeButton.setAttribute('visibility', 'hidden');
        close.closeLabel.setAttribute('visibility', 'hidden');
        close.editButton.setAttribute('visibility', 'hidden');
        close.editLabel.setAttribute('visibility', 'hidden');
    }
}

/**
 * Utility function to locate the 'close button elements'
 */
function getExecutionElements(evt) {
    const elements = {
        populated: false
    };
    for (let i = 0; i < evt.el.children.length; i++) {
        if (evt.el.children[i].attributes && evt.el.children[i].attributes['joint-selector']) {
            if (evt.el.children[i].attributes['joint-selector'].value === 'link') {
                switch (evt.el.children[i].children[0].attributes['joint-selector'].value) {
                    case 'closeButton':
                        elements.populated = true;
                        elements.closeButton = evt.el.children[i].children[0];
                        elements.closeLabel = evt.el.children[i].children[1];
                        break;
                    case 'closeLabel':
                        elements.populated = true;
                        elements.closeButton = evt.el.children[i].children[1];
                        elements.closeLabel = evt.el.children[i].children[0];
                        break;
                }
            } else if(evt.el.children[i].attributes['joint-selector'].value === 'editLink') {
                switch(evt.el.children[i].children[0].attributes['joint-selector'].value) {
                    case 'editLabel':
                        elements.populated = true;
                        elements.editButton = evt.el.children[i].children[1];
                        elements.editLabel = evt.el.children[i].children[0];
                        break;
                    case 'editButton':
                        elements.populated = true;
                        elements.editButton = evt.el.children[i].children[0];
                        elements.editLabel = evt.el.children[i].children[1];
                        break;
                }
            }
        }
    }

    return elements;
}

/**
 * Clears the canvas
 */
function clearExecutionGraph() {
    applicationGraph.clear();
    currentExecutions = [];
}

function handleAddExecution() {
    executionEditor.showExecutionEditor({}, function(data) {
        const x = Math.round($('#executionDesigner').width() / 2);
        const y = 50;
        addExecutionToCanvas(data.name, x, y, data);
    });
}

/**
 * Adds a new execution to the canvas
 * @param name The name to display
 * @param x The x coordinates on the canvas
 * @param y The y coordinates on the canvas
 * @param metadata The metadata to attach to this execution element
 * @returns {*}
 */
function addExecutionToCanvas(name, x, y, metadata) {
    const execution = createExecution(name, x, y, metadata || {}).addTo(applicationGraph);
    currentExecutions.push(execution);
    return execution;
}

function handleExecutionEdit(evt) {
    executionEditor.showExecutionEditor(evt.model.attributes.metaData);
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
    // const portTemplate = {
    //     magnet: true,
    //     label: {
    //         markup: '<text class="label-text" font-size="12" fill="black"/>'
    //     },
    //     attrs: {
    //         text: {
    //             text: ''
    //         }
    //     }
    // };
    // const inPort = _.assign({}, portTemplate);
    // inPort.group = 'in';
    // const ports = [inPort];
    // let port;
    // if (metadata.type === 'branch') {
    //     _.forEach(metadata.params, (p) => {
    //         if(p.type === 'result') {
    //             port = _.assign({}, portTemplate);
    //             port.group = 'out';
    //             port.attrs = {
    //                 text: {
    //                     text: p.name
    //                 }
    //             };
    //             ports.push(port);
    //         }
    //     });
    // } else {
    //     port = _.assign({}, portTemplate);
    //     port.group = 'out';
    //     ports.push(port);
    // }

    return new joint.shapes.spark.Execution({
        position: {x: x, y: y},
        size: stepSize,
        attrs: {
            label: {
                text: joint.util.breakText(name, stepSize, {'font-size': 12}, {ellipsis: true})
            }
        },
        // ports: {
        //     groups: {
        //         'in': {
        //             position: {
        //                 name: 'top'
        //             },
        //             attrs: {
        //                 circle: {
        //                     fill: 'ivory',
        //                     r: 6,
        //                     magnet: true
        //                 }
        //             },
        //             magnet: true
        //         },
        //         'out': {
        //             position: {
        //                 name: 'bottom'
        //             },
        //             attrs: {
        //                 circle: {
        //                     fill: 'ivory',
        //                     r: 4,
        //                     magnet: true
        //                 }
        //             },
        //             magnet: true
        //         }
        //     },
        //     items: ports
        // },
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
    $('#applicationName').text(currentApplication.name);
}

/*
 * Execution editor functions
 */

/*
 * End execution editor functions
 */

/*
 * Save functions
 */

function handleSaveApplication() {
    console.log(JSON.stringify(generateApplicationJson(), null, 4));
}

function generateApplicationJson() {
    const application = {
        sparkConf: {
            kryoClasses: kryoClasses,
        }
    };

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
        application.sparkConf.setOptions = setOptions;
    }

    application.stepPackages = stepPackages;
    application.requiredParameters = requiredParameters;
    application.globals = globals.getData();
    const classOverrideSettings = classOverrides.getValue();
    application.pipelineListener = classOverrideSettings.pipelineListener;
    application.securityManager = classOverrideSettings.securityManager;
    application.stepMapper = classOverrideSettings.stepMapper;

    return application;
}

/*
 * End save functions
 */
