const parameterTypeOptions = '<option value="static">Static</option>' +
    '<option value="global">Global</option>' +
    '<option value="step">Step Response</option>' +
    '<option value="secondary">Secondary Step Response</option>' +
    '<option value="script">Script</option>' +
    '<option value="object">Object</option>';

const portTemplate = {
    magnet: true,
    label: {
        markup: '<text class="label-text" font-size="12" fill="black"/>'
    },
    attrs: {
        text: {
            text: ''
        }
    }
};

const stepSize = {
    width: 275,
    height: 50
};

const applicationsModel = new ApplicationsModel(null);
const stepsModel = new StepsModel(null);
const pipelinesModel = new PipelinesModel(null);
const schemasModel = new SchemasModel(null);

function generateStepContainers(containerId, parentContainer, stepSelectHandler, dragHandler) {
    const steps = _.sortBy(stepsModel.getSteps(), ['category']);
    let panel;
    let heading;
    let button;
    let category;
    let stepSection;
    let stepField;
    let buttonSpan;
    let categoryId;
    _.forEach(steps, (step) => {
        if (step.category !== category) {
            category = step.category;
            categoryId = containerId + '_' + category;
            panel = $('<div class="panel panel-info">');
            panel.appendTo(parentContainer);
            heading = $('<div class="panel-heading" style="display: inline-block; width: 100%;">');
            heading.appendTo(panel);
            $('<span style="font-size: 25px;">' + category + '</span>').appendTo(heading);
            button = $('<button id="btn' + categoryId + '" class="btn btn-info" type="button" data-toggle="collapse" data-target="#' + categoryId + '"' +
                '                            aria-expanded="false" aria-controls="' + categoryId + '">\n' +
                '                        <i class="glyphicon glyphicon-menu-right"></i>\n' +
                '                    </button>');
            buttonSpan = $('<span class="pull-right">');
            buttonSpan.appendTo(heading);
            button.appendTo(buttonSpan);
            button.click(function (evt) {
                const icon = $(evt.target).find('i');
                icon.toggleClass('glyphicon-menu-right');
                icon.toggleClass('glyphicon-menu-down');
            });
            stepSection = $('<div id="' + categoryId + '" class="collapse" style="max-height: 250px; overflow: auto;">');
            stepSection.appendTo(panel);
        }
        stepField = $('<div id="' + containerId + '_' + step.id + '" class="step ' + step.type + '" stepType="'+ step.type +'" ' +
            'title="' + step.description + '" data-toggle="tooltip" data-placement="right">' + step.displayName + '</div>');
        if (dragHandler) {
            // draggable="true" ondragstart="dragStep(event)"
            stepField.attr('draggable', 'true');
            stepField.attr('ondragstart', dragHandler);
        }
        stepField.appendTo(stepSection);
        stepField.click(stepSelectHandler);
    });
}

/**
 * Determines the number of links already attached to the port.
 * @param cell The element.
 * @param portId The id of the port.
 * @param graph The graph where the links are stored
 * @returns {number} Number of links for the element and port.
 */
function getConnectedLinks(cell, portId, graph) {
    let source;
    return _.filter(graph.getConnectedLinks(cell), function (link) {
        source = link.get('source') || {};
        return source.id === cell.id && source.port === portId;
    }).length;
}

function getCustomId(prefix) {
    return prefix +'_' + Math.floor(Math.random() * Math.floor(1000));
}

function loadStepsUI() {
    loadSteps(() => {
        loadPipelineDesignerStepsUI();
        renderStepSelectionUI();
        $('#step-counts').text(stepsModel.count());
    });
}

function loadPipelinesUI() {
    loadPipelines(() => {
        renderPipelinesDesignerSelect();
        $('#pipeline-counts').text(pipelinesModel.count());
    });
}

function loadApplicationsUI() {
    loadApplications(() => {
        renderApplicationsSelect();
        $('#application-counts').text(applicationsModel.count());
    });
}

function loadSchemasUI() {
    loadSchemas(() => {
        renderSchemaUI();
        $('#schema-counts').text(schemasModel.count());
    });
}

function handleLoadContent() {
    showCodeEditorDialog('', 'json', function(value) {
        // TODO Wrap in a try and show an alert if the JSON is not valid
        const metadata = JSON.parse(value);
        if (metadata.steps && metadata.steps.length > 0) {
            saveBulkSteps(metadata.steps, function (err) {
                if(err) {
                    console.log('Steps load received an error: ' + err);
                }
                loadStepsUI();
            });
        }
        if (metadata.pkgObjs && metadata.pkgObjs.length > 0) {
            const pkgObjs = [];
            // Convert the string schema to a JSON object
            _.forEach(metadata.pkgObjs, pkg => pkgObjs.push({id: pkg.id, schema: JSON.parse(pkg.schema)}));
            saveSchemas(pkgObjs, function (err) {
                if (err) {
                    console.log('Schemas load received an error: ' + err);
                }
                loadSchemasUI();
            });
        }
    });
}

function cloneObject(obj) {
    if (!obj) {
        return null;
    }
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Helper function that converts an empty string to undefined.
 * @param val The value to check.
 * @returns {undefined}
 */
function setStringValue(val) {
    return val && val.trim().length > 0 ? val : undefined;
}

$(document).ready(function () {
    // Setup the tabbed interface
    $('#tabs a').click(function (e) {
        e.preventDefault();
        $(this).tab('show');
    });

    // Generate custom diagram shape
    createCustomElement();
    createExecutionShape();

    // Initialize dialogs
    initializeClearFormDialog();
    initializeCodeEditorDialog();
    initializeValidationErrorDialog();
    initializeAddStepDialog();
    initializeNewDialog();
    initializeAlertDialog();
    initializeCopyPipelineDialog();
    initializeObjectEditor();

    // Initialize the editors
    initializeStepsEditor();
    initializePipelineEditor();
    initializeApplicationEditor();

    // Load the steps data from the API and render the UIs.
    loadStepsUI();
    // Load the pipelines data from the API and render the UIs.
    loadPipelinesUI();
    // Load the applications data from the API and rendere the UIs
    loadApplicationsUI();

    // Load the known object schemas
    loadSchemasUI();

    // Register the load content button
    $('#load-content-button').click(handleLoadContent);
});

/**
 * Define the custom shape we use on the designer canvas
 */
function createCustomElement() {
    joint.dia.Element.define('spark.Step', {
        attrs: {
            body: {
                refWidth: '100%',
                refHeight: '100%',
                fill: '#e4f1fb',
                stroke: 'gray',
                strokeWidth: 2,
                rx: 10,
                ry: 10
            },
            label: {
                textVerticalAnchor: 'middle',
                textAnchor: 'middle',
                refX: '50%',
                refY: '50%',
                yAlignment: 'middle',
                xAlignment: 'middle',
                fontSize: 12,
                fill: '#2779aa'
            },
            closeButton: {
                r: 7,
                fill: '#d21502',
                x: 0,
                y: 0,
                visibility: 'hidden'
            },
            closeLabel: {
                textVerticalAnchor: 'middle',
                textAnchor: 'middle',
                x: 0,
                y: 0,
                z: 0,
                text: 'x',
                visibility: 'hidden',
                fill: 'white'
            },
            link: {
                xlinkShow: 'new',
                cursor: 'pointer',
                event: 'close:button:pointerdown',
            }
        }
    }, {
        markup: [{
            tagName: 'rect',
            selector: 'body',
        }, {
            tagName: 'text',
            selector: 'label'
        }, {
            tagName: 'a',
            selector: 'link',
            children: [{
                tagName: 'circle',
                selector: 'closeButton',

            },
                {
                    tagName: 'text',
                    selector: 'closeLabel'
                }]
        }]
    });
}

function createExecutionShape() {
    joint.dia.Element.define('spark.Execution', {
        attrs: {
            body: {
                refWidth: '100%',
                refHeight: '100%',
                fill: '#e4f1fb',
                stroke: 'gray',
                strokeWidth: 2,
                rx: 10,
                ry: 10
            },
            label: {
                textVerticalAnchor: 'middle',
                textAnchor: 'middle',
                refX: '50%',
                refY: '50%',
                yAlignment: 'middle',
                xAlignment: 'middle',
                fontSize: 12,
                fill: '#2779aa'
            },
            closeButton: {
                r: 7,
                fill: '#d21502',
                x: 0,
                y: 0,
                visibility: 'hidden'
            },
            closeLabel: {
                textVerticalAnchor: 'middle',
                textAnchor: 'middle',
                x: 0,
                y: 0,
                z: 0,
                text: 'x',
                visibility: 'hidden',
                fill: 'white'
            },
            link: {
                xlinkShow: 'new',
                cursor: 'pointer',
                event: 'close:button:pointerdown',
            },
            editButton: {
                r: 7,
                fill: 'green',
                transform: 'translate(15, 0)',
                visibility: 'hidden'
            },
            editLabel: {
                textVerticalAnchor: 'middle',
                textAnchor: 'middle',
                transform: 'translate(15, 0)',
                text: '+',
                visibility: 'hidden',
                fill: 'white'
            },
            editLink: {
                xlinkShow: 'new',
                cursor: 'pointer',
                event: 'add:button:pointerdown',
            }
        }
    }, {
        markup: [{
            tagName: 'rect',
            selector: 'body',
        }, {
            tagName: 'text',
            selector: 'label'
        }, {
            tagName: 'a',
            selector: 'link',
            children: [{
                tagName: 'circle',
                selector: 'closeButton',

            },
                {
                    tagName: 'text',
                    selector: 'closeLabel'
                }]
        }, {
            tagName: 'a',
            selector: 'editLink',
            children: [{
                tagName: 'circle',
                selector: 'editButton',

            },
                {
                    tagName: 'text',
                    selector: 'editLabel'
                }]
        }]
    });
}
