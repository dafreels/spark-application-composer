const stepSize = {
    width: 275,
    height: 50
};
const controlCharacters = ['!', '@', '#'];

let graph;
let paper;
// Contains the current list of step elements on the designer canvas. The id is the element id of the canvas element.
let currentSteps = {};
// Contains a lookup from the unique step id within the pipeline back to the designer canvas element
let diagramStepToStepMetaLookup = {};
// Contains the metadata from the pipeline
let currentPipeline;
// Contains information about the step being dragged to the canvas
let draggingStep;

/**
 * Initialize the pipeline designer drawing canvas
 */
function initializePipelineDesigner() {
    graph = new joint.dia.Graph;

    paper = new joint.dia.Paper({
        el: $('#pipeline-designer'),
        model: graph,
        height: 800,
        width: $('.right').width,
        gridSize: 1,
        defaultLink: new joint.dia.Link({
            attrs: {'.marker-target': {d: 'M 10 0 L 0 5 L 10 10 z'}}
        }),
        allowLink: handleLinkEvent,
        validateConnection: function (cellViewS, magnetS, cellViewT, magnetT) {
            if (getConnectedLinks(cellViewT.model, V(magnetT).attr('port')) > 0) return false;
            // Prevent linking from input ports.
            if (magnetS && magnetS.getAttribute('port-group') === 'in') return false;
            // Prevent linking from output ports to input ports within one element.
            if (cellViewS === cellViewT) return false;
            // Prevent linking to input ports.
            return magnetT && magnetT.getAttribute('port-group') === 'in';
        },
        validateMagnet: function (cellView, magnet) {
            if (getConnectedLinks(cellView.model, V(magnet).attr('port')) > 0) return false;
            if (magnet.getAttribute('magnet') !== 'passive') return true;
        }
    });

    paper.on('cell:pointerclick', handleElementSelect);

    // Pipeline Designer
    $('#save-button').click(handleSave);
    $('#new-button').click(handleNew);
    $('#reset-button').click(handleReset);
}

function allowStepDrop(ev) {
    ev.preventDefault();
}

// TODO Not sure how this is called, but it may be an issue when the application editor is in place
function drag(ev) {
    ev.dataTransfer.setData("text", $(ev.target).text());
    ev.dataTransfer.setData("id", ev.target.id);
}

function dropStep(ev) {
    ev.preventDefault();
    if (currentPipeline) {
        const stepLookupElement = stepLookup[ev.dataTransfer.getData("id")];
        draggingStep = {
            name: ev.dataTransfer.getData("text"),
            x: ev.offsetX,
            y: ev.offsetY,
            stepMetaData: stepLookupElement
        };
        showAddStepDialog();
    } else {
        showAlertDialog('Click new to create a new Pipeline!');
    }
}

/**
 * Called when the user clicks the step in the designer.
 * @param evt The event from the click.
 */
function handleElementSelect(evt) {
    // evt.highlight(); // TODO Make highlight better and ensure previous highlighted elements are removed
    loadPropertiesPanel(evt.model.attributes.metaData);
}

function handleNew() {
    if (currentPipeline || isDesignerPopulated()) {
        clearFormDialogClearFunction = function() {
            const select = $('#pipelines');
            select.val('none');
            select.selectmenu('refresh');
            clearPipelineDesigner();
            showNewPipelineDialog();
        };
        clearDialogCancelFunction = cancelClearPipelines;
        showClearFormDialog();
    } else {
        clearPipelineDesigner();
        showNewPipelineDialog();
    }
}

function cancelClearPipelines() {
    // Set the select back to the original value
    if (selectedPipeline) {
        const select = $('#pipelines');
        // select.val(selectedPipeline);
        select.selectmenu('refresh');
        // selectedPipeline = 'none';
    }
}

function handleReset() {
    if (currentPipeline || isDesignerPopulated()) {
        clearFormDialogClearFunction = function() {
            var select = $('#pipelines');
            select.val('none');
            select.selectmenu('refresh');
            $('#pipelineName').text('');
        };
        showClearFormDialog();
    } else {
        clearPipelineDesigner();
    }
}

/**
 * Adds a new step to the designer canvas
 * @param id The unique id of the step within the pipeline
 * @param name The name to display
 * @param x The x coordiantes on the canvas
 * @param y The y coordinates on the canvas
 * @param stepId The id of the step metadata
 * @returns {*}
 */
function addStepToDesigner(id, name, x, y, stepId) {
    const step = createStep(name, x, y, stepLookup[stepId]).addTo(graph);
    step.attributes.metaData.pipelineStepMetaData.id = id;
    if (!step.attributes.metaData.pipelineStepMetaData.params) {
        step.attributes.metaData.pipelineStepMetaData.params = [];
    }
    currentPipeline.steps.push(step.attributes.metaData.pipelineStepMetaData);
    loadPropertiesPanel(step.attributes.metaData);
    currentSteps[step.id] = step;
    diagramStepToStepMetaLookup[id] = step;
    return step;
}

/**
 * Clears the canvas
 */
function clearPipelineDesigner() {
    graph.clear();
    currentSteps = {};
    diagramStepToStepMetaLookup = {};
    clearPropertiesPanel();
}

function clearPropertiesPanel() {
    $('#stepId').text('');
    $('#displayName').text('');
    $('#description').text('');
    $('#step-parameters-form div').remove();
    const selectedPipelineId = $('#pipelines').val();
    if (pipelineLookup[selectedPipelineId]) {
        $('#pipelineName').text(pipelineLookup[selectedPipelineId].name);
    }
}

/**
 * Adds a step to the designer.
 * @param name The display name of the step.
 * @param x The x coordinate.
 * @param y The y coordinate.
 * @param metadata The step metadata to attach to the element.
 * @returns {devs.Model|Model|Model}
 */
function createStep(name, x, y, metadata) {
    const outports = [];
    let labelMarkup;
    if (metadata.type === 'branch') {
        _.forEach(metadata.params, (p) => {
            if(p.type === 'result') {
                outports.push(p.name);
            }
        });
    } else {
        outports.push('out');
        labelMarkup = '<none/>';
    }
    return new joint.shapes.devs.Model({
        position: {
            x: x,
            y: y
        },
        size: stepSize,
        attrs: {
            '.body': {
                refWidth: '100%',
                refHeight: '100%',
                fill: '#e4f1fb',
                stroke: 'gray',
                strokeWidth: 2,
                rx: 10,
                ry: 10
            },
            '.label': {
                refY: '15',
                yAlignment: 'middle',
                xAlignment: 'middle',
                fontSize: 15,
                fill: '#2779aa',
                text: joint.util.breakText(name, stepSize, { 'font-size': 12 }, { ellipsis: true })
            }
        },
        inPorts: ['in'],
        outPorts: outports,
        ports: {
            groups: {
                'in': {
                    position: {
                        name: 'top'
                    },
                    attrs: {
                        '.port-body': {
                            fill: 'ivory',
                            magnet: 'passive',
                            r: 4
                        }
                    },
                    label: {
                        markup: '<none/>'
                    }
                },
                'out': {
                    position: {
                        name: 'bottom'
                    },
                    attrs: {
                        '.port-body': {
                            fill: 'ivory',
                            r: 4
                        }
                    },
                    label: {
                        position: {
                            name: 'left'
                        },
                        markup: labelMarkup
                    }
                }
            }
        },
        metaData: {
            stepMetaData: metadata,
            pipelineStepMetaData: {}
        }
    });
}

/**
 * Determines the number of links already attached to the port.
 * @param cell The element.
 * @param portId The id of the port.
 * @returns {number} Number of links for the element and port.
 */
function getConnectedLinks(cell, portId) {
    let source;
    return _.filter(graph.getConnectedLinks(cell), function (link) {
        source = link.get('source') || {};
        return source.id === cell.id && source.port === portId;
    }).length;
}

/**
 * Handles removal of links that cannot be connected.
 * @param linkView The link being drawn
 * @returns {boolean} true ig the link was properly connected
 */
function handleLinkEvent(linkView) {
    return linkView.targetMagnet !== null;
}

/**
 * Returns true if there are elements on the designer canvas.
 * @returns {boolean}
 */
function isDesignerPopulated() {
    return graph.getCells().length > 0;
}

/**
 * Generates a pipeline as JSON using the elements on the designer.
 */
function generatePipelineJson() {
    var steps = {};
    var ids = [];
    var nextStepIds = [];
    _.forOwn(currentSteps, function (value) {
        var pipelineStepMetaData = value.attributes.metaData.pipelineStepMetaData;
        var stepMeta = value.attributes.metaData.stepMetaData;
        var step = stepMeta;
        step.stepId = stepMeta.id;
        step.id = pipelineStepMetaData.id;
        step.executeIfEmpty = pipelineStepMetaData.executeIfEmpty;
        step.params = pipelineStepMetaData.params;
        ids.push(step.id);
        // Get the links for this step
        var links = _.filter(graph.getConnectedLinks(value), function (l) {
            return l.get('source').id === value.id;
        });
        // Find the next step id
        if (links.length === 1) {
            step.nextStepId = currentSteps[links[0].get('target').id].attributes.metaData.pipelineStepMetaData.id;
            nextStepIds.push(step.nextStepId);
        }
        steps[step.id] = step;
    });

    // Order the steps in the array to force the first non-branch step to the top
    // Find the first step
    var initialSteps = _.filter(ids, function (id) {
        return nextStepIds.indexOf(id) === -1;
    });
    var pipelineSteps = [steps[initialSteps[0]]];
    // Build out the remainder of the array
    var nextStepId = steps[initialSteps[0]].nextStepId;
    if (nextStepId) {
        do {
            pipelineSteps.push(steps[nextStepId]);
            nextStepId = steps[nextStepId].nextStepId;
        } while (nextStepId);
    }

    return {
        id: currentPipeline.id,
        name: currentPipeline.name,
        steps: pipelineSteps
    };
}

/**
 * Given two models, create a link between them.
 * @param source The source model
 * @param target The target model
 */
function createLink(source, target) {
    var link = new joint.dia.Link({
        attrs: {'.marker-target': {d: 'M 10 0 L 0 5 L 10 10 z'}},
        source: {
            id: source.id,
            port: 'out'
        },
        target: {
            id: target.id,
            port: 'in'
        }
    });
    graph.addCell(link);
}

function loadPropertiesPanel(metaData) {
    const stepMetaData = metaData.stepMetaData;
    const pipelineMetaData = metaData.pipelineStepMetaData;
    $('#step-form #pipelineStepId').text(pipelineMetaData.id);
    $('#step-form #stepId').text(stepMetaData.id);
    $('#step-form #displayName').text(stepMetaData.displayName);
    $('#step-form #description').text(stepMetaData.description);
    $('#step-form #type').text(stepMetaData.type);
    // load step form
    let stepForm = stepForms[stepMetaData.id];
    if (!stepForm) {
        stepForm = '<div id="' + stepMetaData.id + '">\n' +
            '<div class="form-group dynamic-form">' +
            '<label>Execute If Empty:</label>' +
            '<input id="executeIfEmpty"/>' +
            '<select id="executeIfEmptyType" size="1">' + parameterTypeOptions + '</select></div>\n';

        // Build out the parameters
        _.forEach(stepMetaData.params, function (param) {
            stepForm += '<div class="form-group dynamic-form"><label>' + param.name + ':' + '</label>' +
                '<input id="' + param.name + '"/><select id="' + param.name + 'Type" size="1">' + parameterTypeOptions +
                '</select></div>\n';
        });

        stepForm += '</div>';

        stepForms[stepMetaData.id] = stepForm;
    }
    // Clear the old form
    $('#step-parameters-form').empty();
    // Add the new form
    $('#step-parameters-form').append('<div id="' + stepMetaData.id + 'DynamicForm" class="dynamic-form">' + stepForm + '</div>');
    // Setup the form
    let type = getType(pipelineMetaData.executeIfEmpty, 'static');
    let value;
    let input = $('#executeIfEmpty');
    if (type !== 'static' && type !== 'script') {
        input.val(pipelineMetaData.executeIfEmpty.substring(1));
    }
    input.blur(handleInputChange);
    let el = $('#executeIfEmptyType');
    el.selectmenu({ change: handleTypeSelectChange });
    el.val(type);
    el.selectmenu('refresh');
    _.forEach(stepMetaData.params, function (param) {
        el = $('#' + param.name + 'Type');
        el.selectmenu({ change: handleTypeSelectChange });
        input = $('#' + param.name);
        input.blur(handleInputChange);
    });
    // Initialize the parameters form with existing values
    let select;
    _.forEach(pipelineMetaData.params, function (param) {
        value = param.value;
        // Handle script versus param.type
        type = getType(value, param.type === 'script' ? 'script' : 'static');
        if (type !== 'static' && type !== 'script') {
            value = value.substring(1);
        }
        input = $('#' + param.name);
        input.val(value);
        // set the select value
        select = $('#' + param.name + 'Type');
        select.val(type);
        select.selectmenu('refresh');
    });
}

function getType(value, defaultType) {
    let type = defaultType;
    if (value && controlCharacters.indexOf(value[0]) !== -1) {
        switch (value[0]) {
            case '!':
                type = 'global';
                break;
            case '@':
                type = 'step';
                break;
            case '#':
                type = 'secondary';
                break;
        }
    }

    return type;
}

/****************************************
 *
 * Event handlers
 *
 ****************************************/
function handleInputChange(evt) {
    const input = $(evt.target);
    const select = $('#' + evt.target.id + 'Type');
    handleValueChanges(input, select);
}

function handleValueChanges(input, select) {
    const inputId = input.attr('id');
    const stepId = $('#pipelineStepId').text();
    const selectVal = select.val();
    const value = getLeadCharacter(selectVal) + input.val();
    const step = diagramStepToStepMetaLookup[stepId];
    const stepMetaData = step.attributes.metaData.stepMetaData;
    const pipelineStepMetadata = step.attributes.metaData.pipelineStepMetaData;
    if (inputId === 'executeIfEmpty') {
        pipelineStepMetadata.executeIfEmpty = value;
    } else if (pipelineStepMetadata && pipelineStepMetadata.params) {
        const param = _.find(pipelineStepMetadata.params, function(p) { return p.name === inputId;});
        if (param) {
            param.value = value;
            param.type = selectVal === 'script' ? 'script' : param.type;
        } else {
            const stepParam = _.find(stepMetaData.params, function(p) { return p.name === inputId; });
            const newParam = {
                value: value,
                type: selectVal === 'script' ? 'script' : stepParam.type,
                name: stepParam.name,
                required: stepParam.required
            };
            pipelineStepMetadata.params.push(newParam);
        }
    }
}

function handleTypeSelectChange(evt, ui) {
    const input = $('#' + evt.target.id.substring(0, evt.target.id.indexOf('Type')));
    const select = $(evt.target);
    handleValueChanges(input, select);
}

function handleSave() {
    const pipelineJson = generatePipelineJson();
    console.log(JSON.stringify(pipelineJson, null, 4));
    // Run validation of configured steps against step metadata
    const errors = [];
    let error;
    let currentStep;
    _.forEach(pipelineJson.steps, function(step) {
        currentStep = stepLookup[step.stepId];
        error = null;
        _.forEach(currentStep.params, function(param) {
            if (param.required && !_.find(step.params, function(p) { return  p.name === param.name})) {
                if (!error) {
                    error = {
                        header: step.id,
                        messages: []
                    };
                    errors.push(error);
                }
                error.messages.push(param.name + ' is required');
            }
        });
    });
    if (errors.length > 0) {
        showValidationErrorDialog(errors);
    } else {
        savePipeline(pipelineJson);
    }
}
