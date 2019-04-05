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
let objectEditorDialog;

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
                toggleContainerButton($(evt.target).find('i'));
            });
            button.find('i').click(function (evt) {
                toggleContainerButton($(evt.target));
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

function toggleContainerButton(icon) {
    icon.toggleClass('glyphicon-menu-right');
    icon.toggleClass('glyphicon-menu-down');
}

function showGlobalErrorMessage(msg, error) {
    let message = msg;
    let messages;
    if (error) {
        message = msg + ' (Status: ' + error.status + ' Error: ' + error.error + ')';
        if (error.response && error.response.errors) {
            messages = [];
            _.forEach(error.response.errors, (err) => {
                if (err.message) {
                    messages.push(err.message);
                }
            });
        }
    }
    showAlertDialog(message, messages);
}

function getCustomId(prefix) {
    return prefix +'_' + Math.floor(Math.random() * Math.floor(1000));
}

function loadStepsUI() {
    loadSteps(() => {
        loadPipelineDesignerStepsUI();
        renderStepSelectionUI();
        const count = stepsModel.count();
        if (count > 0) {
            const heading = $('#step-count-heading');
            heading.removeClass('panel-warning');
            heading.addClass('panel-success');
        }
        $('#step-counts').text(count);
    });
}

function loadPipelinesUI() {
    loadPipelines(() => {
        renderPipelinesDesignerSelect();
        const count = pipelinesModel.count();
        if (count > 0) {
            const heading = $('#pipeline-count-heading');
            heading.removeClass('panel-warning');
            heading.addClass('panel-success');
        }
        $('#pipeline-counts').text(count);
    });
}

function loadApplicationsUI() {
    loadApplications(() => {
        renderApplicationsSelect();
        const count = applicationsModel.count();
        if (count > 0) {
            const heading = $('#application-count-heading');
            heading.removeClass('panel-warning');
            heading.addClass('panel-success');
        }
        $('#application-counts').text(count);
    });
}

function loadSchemasUI() {
    loadSchemas(() => {
        objectEditorDialog.updateSchemas();
        const count = schemasModel.count();
        if (count > 0) {
            const heading = $('#schema-count-heading');
            heading.removeClass('panel-warning');
            heading.addClass('panel-success');
        }
        $('#schema-counts').text(count);
    });
}

function handleLoadContent() {
    showCodeEditorDialog('', 'json', function(value) {
        // TODO Wrap in a try and show an alert if the JSON is not valid
        const metadata = JSON.parse(value);
        if (metadata.steps && metadata.steps.length > 0) {
            saveBulkSteps(metadata.steps, function (err) {
                if(err) {
                    showGlobalErrorMessage('Steps load received an error', err);
                }
                loadStepsUI();
            });
        }
        if (metadata.pkgObjs && metadata.pkgObjs.length > 0) {
            saveSchemas(metadata.pkgObjs, function (err) {
                if (err) {
                    showGlobalErrorMessage('Schemas load received an error', err);
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
    objectEditorDialog = new ObjectEditor();

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
