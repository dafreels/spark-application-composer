const stepSize = {
    width: 275,
    height: 50
};
const controlCharacters = ['!', '@', '#'];

let graph;
let paper;
// Contains the element information that the user has selected
let currentHighlightedElement;
// Contains the current list of step elements on the designer canvas. The id is the element id of the canvas element.
let currentSteps = {};
// Contains a lookup from the unique step id within the pipeline back to the designer canvas element
let diagramStepToStepMetaLookup = {};
// Contains the metadata from the pipeline
let currentPipeline;
// Contains information about the step being dragged to the canvas
let draggingStep;
// Only used during the save operation
let savedPipelineName;

/**
 * Initialize the pipeline designer drawing canvas
 */
function initializePipelineEditor() {
    graph = new joint.dia.Graph;
    paper = new joint.dia.Paper({
        el: $('#pipeline-designer'),
        model: graph,
        height: 800,
        width: '100%',
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
    paper.on('cell:mouseover', handleElementMouseOver);
    paper.on('cell:mouseout', handleElementMouseOut);
    paper.on('close:button:pointerdown', handleElementRemove);

    // Pipeline Designer
    $('#save-button').click(handleSave);
    $('#new-button').click(handleNew);
    $('#reset-button').click(handleReset);
}

function allowStepDrop(ev) {
    ev.preventDefault();
}

function dragStep(ev) {
    ev.dataTransfer.setData("text", $(ev.target).text());
    ev.dataTransfer.setData("id", ev.target.id);
}

function dropStep(ev) {
    ev.preventDefault();
    if (currentPipeline) {
        draggingStep = {
            name: ev.dataTransfer.getData("text"),
            x: ev.offsetX,
            y: ev.offsetY,
            stepMetaDataId: ev.dataTransfer.getData("id")
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
    if (currentHighlightedElement) {
        currentHighlightedElement.unhighlight();
    }
    currentHighlightedElement = evt;
    evt.highlight();
    loadPropertiesPanel(evt.model.attributes.metaData);
}

/**
 * Removes an element and any links from the designer canvas.
 * @param evt The element to remove
 */
function handleElementRemove(evt) {
    const id = evt.model.attributes.metaData.pipelineStepMetaData.id;
    const canvasElement = diagramStepToStepMetaLookup[id];
    _.forEach(graph.getConnectedLinks(canvasElement), link => link.remove());
    canvasElement.remove();
    delete currentSteps[canvasElement.id];
    delete diagramStepToStepMetaLookup[id];
}

/**
 * Helper function that displays the close button when the mouse pointer is over the cell
 * @param evt The underlying cell
 */
function handleElementMouseOver(evt) {
    const close = getCloseElements(evt);
    if (close.populated) {
        close.closeButton.setAttribute('visibility', 'visible');
        close.closeLabel.setAttribute('visibility', 'visible');
    }
}

/**
 * Helper function that hides the close button when the mouse pointer leaves the cell
 * @param evt The underlying cell
 */
function handleElementMouseOut(evt) {
    const close = getCloseElements(evt);
    if (close.populated) {
        close.closeButton.setAttribute('visibility', 'hidden');
        close.closeLabel.setAttribute('visibility', 'hidden');
    }
}

/**
 * Utility function to locate the 'close button elements'
 */
function getCloseElements(evt) {
    const elements = {
        populated: false
    };
    for (let i = 0; i < evt.el.children.length; i++) {
        if (evt.el.children[i].attributes && evt.el.children[i].attributes['joint-selector']) {
            if (evt.el.children[i].attributes['joint-selector'].value === 'link') {
                switch(evt.el.children[i].children[0].attributes['joint-selector'].value) {
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
            }
        }
    }

    return elements;
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
        clearFormDialogCancelFunction = cancelClearPipelines;
        showClearFormDialog();
    } else {
        clearPipelineDesigner();
        showNewPipelineDialog();
    }
}

/**
 * Handles the user clicking cancel on the clear form dialog.
 */
function cancelClearPipelines() {
    // Set the select back to the original value
    if (currentPipeline && currentPipeline.id) {
        const select = $('#pipelines');
        select.val(currentPipeline.id);
        select.selectmenu('refresh');
    }
}

/**
 * Handles the reset button being clicked
 */
function handleReset() {
    if (currentPipeline || isDesignerPopulated()) {
        clearFormDialogClearFunction = function() {
            const select = $('#pipelines');
            select.val('none');
            select.selectmenu('refresh');
            $('#pipelineName').text('');
            clearPipelineDesigner();
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
 * @param loadProperties Determines whether the loadProperties function should be called after the step has been added to the designer
 * @returns {*}
 */
function addStepToDesigner(id, name, x, y, stepId, loadProperties = true) {
    const step = createStep(name, x, y, getStep(stepId)).addTo(graph);
    step.attributes.metaData.pipelineStepMetaData.id = id;
    if (loadProperties) {
        loadPropertiesPanel(step.attributes.metaData);
    }
    currentSteps[step.id] = step;
    diagramStepToStepMetaLookup[id] = step;
    return step;
}

/**
 * Clears the canvas
 */
function clearPipelineDesigner() {
    graph.clear();
    currentPipeline = null;
    draggingStep = null;
    currentSteps = {};
    diagramStepToStepMetaLookup = {};
    clearPropertiesPanel();
}

/**
 * This function clears the step parameters from the properties panel
 */
function clearPropertiesPanel() {
    $('#stepId').text('');
    $('#displayName').text('');
    $('#description').text('');
    $('#step-parameters-form div').remove();
    const selectedPipelineId = $('#pipelines').val();
    if (isValidPipelineId(selectedPipelineId)) {
        $('#pipelineName').text(getPipelineName(selectedPipelineId).name);
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
    const inPort = _.assign({}, portTemplate);
    inPort.group = 'in';
    const ports = [inPort];
    let port;
    if (metadata.type === 'branch') {
        _.forEach(metadata.params, (p) => {
            if(p.type === 'result') {
                port = _.assign({}, portTemplate);
                port.group = 'out';
                port.attrs = {
                    text: {
                        text: p.name
                    }
                };
                ports.push(port);
            }
        });
    } else {
        port = _.assign({}, portTemplate);
        port.group = 'out';
        ports.push(port);
    }

    return new joint.shapes.spark.Step({
        position: {x: x - (stepSize.width / 2), y: y},
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
        metaData: {
            stepMetaData: metadata,
            pipelineStepMetaData: {
                params: []
            }
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
 * Helper function to return the special character for parameter values.
 * @param selectVal The value from the select.
 * @returns {string}
 */
function getLeadCharacter(selectVal) {
    let leadCharacter = '';
    switch(selectVal) {
        case 'global':
            leadCharacter = '!';
            break;
        case 'step':
            leadCharacter = '@';
            break;
        case 'secondary':
            leadCharacter = '#';
            break;
    }
    return leadCharacter;
}

/**
 * Generates a pipeline as JSON using the elements on the designer.
 */
function generatePipeline() {
    const steps = {};
    const ids = [];
    const nextStepIds = [];
    let pipelineStepMetaData;
    let stepMeta;
    let step;
    let links;
    // Create the steps array
    _.forOwn(currentSteps, function (value) {
        pipelineStepMetaData = value.attributes.metaData.pipelineStepMetaData;
        stepMeta = value.attributes.metaData.stepMetaData;
        step = _.assign({}, stepMeta);
        step.stepId = stepMeta.id;
        step.id = pipelineStepMetaData.id;
        step.executeIfEmpty = pipelineStepMetaData.executeIfEmpty;
        step.params = []; // pipelineStepMetaData.params;
        // Initialize the parameters
        let pipelineParam;
        _.forEach(stepMeta.params, (param) => {
            pipelineParam = _.find(pipelineStepMetaData.params, (p) => p.name === param.name) || {};
            step.params.push(_.merge(pipelineParam, param));
        });
        ids.push(step.id);
        // Get the links for this step
        links = _.filter(graph.getConnectedLinks(value), function (l) {
            return l.get('source').id === value.id;
        });
        // Find the next step id
        if (step.type !== 'branch' && links.length === 1) {
            step.nextStepId = currentSteps[links[0].get('target').id].attributes.metaData.pipelineStepMetaData.id;
            nextStepIds.push(step.nextStepId);
        } else if (step.type === 'branch') {
            let port;
            let param;
            _.forEach(links, function(link) {
                port = value.getPort(link.get('source').port).attrs.text.text;
                param = _.find(step.params, function(p) { return p.name === port }) || {};
                param.value = currentSteps[link.get('target').id].attributes.metaData.pipelineStepMetaData.id;
                nextStepIds.push(param.value);
            });
        }
        steps[step.id] = step;
    });

    // Order the steps in the array to force the first non-branch step to the top
    // Find the first step
    const initialSteps = _.filter(ids, function (id) {
        return nextStepIds.indexOf(id) === -1;
    });
    const pipelineSteps = [steps[initialSteps[0]]];
    // Build out the remainder of the array
    let stepIds = getNextStepIds(pipelineSteps[0]);
    let nextIds;
    do {
        nextIds = [];
        _.forEach(stepIds, function(id) {
            pipelineSteps.push(steps[id]);
            nextIds = _.union(nextIds, getNextStepIds(steps[id]))
        });
        stepIds = nextIds;
    } while(stepIds && stepIds.length > 0);

    return {
        id: currentPipeline.id,
        name: currentPipeline.name,
        steps: pipelineSteps
    };
}

/**
 * Helper function used to determine what the next step id(s) should be.
 * @param step
 * @returns {*}
 */
function getNextStepIds(step) {
    if (step.nextStepId && step.nextStepId.trim().length > 0) {
        return [step.nextStepId];
    }
    const ids = [];
    _.forEach(step.params, function(param) {
       if (param.type === 'result' && param.value) {
           ids.push(param.value);
       }
    });
    return ids;
}

/**
 * Given two models, create a link between them.
 * @param source The source model
 * @param target The target model
 * @param port An optional port name to link. Defaults to 'out'
 */
function createLink(source, target, port) {
    const outPorts = _.filter(source.getPorts(), p => p.group === 'out');
    let outPortId;
    if (port) {
        outPortId = _.find(outPorts, p => p.attrs.text.text === port).id;
    } else {
        outPortId = _.find(outPorts, p => p.group === 'out').id;
    }
    const inPortId = _.find(target.getPorts(), p => p.group === 'in').id;
    const link = new joint.dia.Link({
        attrs: {'.marker-target': {d: 'M 10 0 L 0 5 L 10 10 z'}},
        source: {
            id: source.id,
            port: outPortId
        },
        target: {
            id: target.id,
            port: inPortId
        }
    });
    graph.addCell(link);
}

/**
 * Loads the selected pipeline to the designer canvas
 */
function loadPipeline() {
    const pipelineId = $("#pipelines").val();
    if (pipelineId !== 'none') {
        currentPipeline = getPipeline(pipelineId);
        $('#pipelineName').text(currentPipeline.name);
        const centerX = Math.round($('#pipeline-designer').width() / 2);
        const x = centerX - Math.round(stepSize.width / 2);
        let y = 50;
        let gstep;
        let stepIdLookup = {}; // Only used to track the steps we have added to the designer canvas
        let pipelineStep;
        let childParams;
        let childX;
        // Add each step to the designer
        _.forEach(currentPipeline.steps, function (step) {
            if (!stepIdLookup[step.id]) {
                // Add the steps to the designer
                gstep = addStepToDesigner(step.id, step.displayName, x, y, step.stepId, false);
                gstep.attributes.metaData.pipelineStepMetaData = step;
                y += 100;
                stepIdLookup[step.id] = step.stepId;
                if (step.type === 'branch') {
                    childParams = _.filter(step.params, p => p.type === 'result');
                    // place the children side by side
                    childX = centerX - Math.round(((childParams.length * stepSize.width) + (childParams.length * 10)) / 2);
                    _.forEach(childParams, (param) => {
                        if (param.value) {
                            pipelineStep = getPipelineStep(currentPipeline.id, param.value);
                            gstep = addStepToDesigner(pipelineStep.id, pipelineStep.displayName, childX, y, pipelineStep.stepId, false);
                            gstep.attributes.metaData.pipelineStepMetaData = pipelineStep;
                            stepIdLookup[pipelineStep.id] = pipelineStep.stepId;
                            childX += (stepSize.width + 10);
                        }
                    });
                    y += 100;
                }
            }
        });
        // Create the links between steps
        _.forEach(currentPipeline.steps, (step) => {
            if (step.nextStepId) {
                createLink(diagramStepToStepMetaLookup[step.id],
                    diagramStepToStepMetaLookup[step.nextStepId]);
            } else if (step.type === 'branch') {
                _.forEach(_.filter(step.params, p => p.type === 'result' && p.value), (param) => {
                    createLink(diagramStepToStepMetaLookup[step.id],
                        diagramStepToStepMetaLookup[param.value], param.name);
                });
            }
        });

        loadPropertiesPanel(diagramStepToStepMetaLookup[currentPipeline.steps[0].id].attributes.metaData);
    }
    /*
     * TODO:
     *  fit canvas content
     */
}

/**
 * Responsible for populating the step editor form when the user selects a step on the designer canvas
 * @param metaData The metadata from the selected step.
 */
function loadPropertiesPanel(metaData) {
    const stepMetaData = metaData.stepMetaData;
    const pipelineMetaData = metaData.pipelineStepMetaData;
    $('#step-form #pipelineStepId').text(pipelineMetaData.id);
    $('#step-form #stepId').text(stepMetaData.id);
    $('#step-form #displayName').text(stepMetaData.displayName);
    $('#step-form #description').text(stepMetaData.description);
    $('#step-form #type').text(stepMetaData.type);
    // Get the parent step ids
    const stepIdCompletion = buildParentIdCompletionArray(pipelineMetaData.id);
    // load step form
    const stepForm = $('<div id="' + stepMetaData.id + '">');
    const formDiv = $('<div class="form-group dynamic-form">').appendTo(stepForm);
    let label = $('<label>');
    label.text('Execute If Empty:');
    label.appendTo(formDiv);
    let input = $('<input id="executeIfEmpty"/>');
    input.appendTo(formDiv);
    let select = $('<select id="executeIfEmptyType" size="1">').appendTo(formDiv);
    $(parameterTypeOptions).appendTo(select);
    input.focusin(function () {
        codeEditorCloseFunction = function () {
            select.focus();
            input.prop('disabled', false);
        };
        codeEditorSaveFunction = function (value) {
            pipelineMetaData.executeIfEmpty = value;
            input.val(value);
        };
        if (select.val() === 'script') {
            showCodeEditorDialog(pipelineMetaData.executeIfEmpty, 'scala');
            $(this).prop('disabled', true);
        }
    });
    input.autocomplete({
        source: function (request, response) {
            const type = $('#executeIfEmptyType').val();
            if (type === 'step' || type === 'secondary') {
                response(_.filter(stepIdCompletion, s => _.startsWith(s.toLowerCase(), request.term.toLowerCase())));
            }
        }
    });

    // Build out the parameters
    let paramRow;
    _.forEach(stepMetaData.params, (param) => {
        paramRow = $('<div class="form-group dynamic-form">').appendTo(stepForm);
        label = $('<label>');
        label.text(param.name + ':');
        label.appendTo(paramRow);
        input = $('<input id="' + param.name + '"/>');
        input.appendTo(paramRow);
        select = $('<select id="' + param.name + 'Type" size="1">').appendTo(paramRow);
        select.appendTo(paramRow);
        $(parameterTypeOptions).appendTo(select);
        input.focusin(function () {
            codeEditorCloseFunction = function () {
                select.focus();
                input.prop('disabled', false);
            };
            codeEditorSaveFunction = function (value) {
                _.find(pipelineMetaData.params, p => p.name = param.name).value = value;
                input.val(value);
            };
            if (select.val() === 'script') {
                showCodeEditorDialog(_.find(pipelineMetaData.params, p => p.name = param.name).value, 'scala');
                $(this).prop('disabled', true);
            }
        });
        input.autocomplete({
            source: function (request, response) {
                const type = $('#' + param.name + 'Type').val();
                if (type === 'step' || type === 'secondary') {
                    response(_.filter(stepIdCompletion, s => _.startsWith(s.toLowerCase(), request.term.toLowerCase())));
                }
            }
        });
    });
    // Clear the old form
    $('#step-parameters-form div').remove();
    // Add the new form
    $('#step-parameters-form').append('<div id="' + stepMetaData.id + 'DynamicForm" class="dynamic-form">').append(stepForm);
    // Setup the form
    let type = getType(pipelineMetaData.executeIfEmpty, 'static');
    let value;
    input = $('#executeIfEmpty');
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
    let defaultValue;
    let pipelineStepParam;
    _.forEach(stepMetaData.params, function (param) {
        defaultValue = param.defaultValue;
        value = defaultValue;
        // Get the pipeline step parameter
        pipelineStepParam = _.find(pipelineMetaData.params, function(p) { return p.name === param.name; });
        if (pipelineStepParam) {
            value = pipelineStepParam.value || defaultValue;
            pipelineStepParam.value = value;
        }
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
        // Prevent edits against the result fields
        if (param.type === 'result') {
            input.prop('disabled', true);
            select.selectmenu( "disable" );
        }
    });
}

function buildParentIdCompletionArray(stepId) {
    let links = getTargetLinks(diagramStepToStepMetaLookup[stepId]);
    const stepIds = [];
    let nextLinks;
    let currentStep;
    while(links && links.length > 0) {
        nextLinks = [];
        _.forEach(links, (l) => {
            currentStep = currentSteps[l.get('source').id];
            stepIds.push(currentStep.attributes.metaData.pipelineStepMetaData.id);
            nextLinks = _.union(nextLinks, getTargetLinks(currentStep))
        });
        links = nextLinks;
    }

    return _.uniq(stepIds);
}

function getTargetLinks(el) {
    if (el) {
        return _.filter(graph.getConnectedLinks(el), function (l) {
            return l.get('target').id === el.id;
        });
    }
    return [];
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

function loadPipelineDesignerStepsUI() {
    var stepsContainer = $('#step-panel');
    stepsContainer.empty();
    _.forEach(getSteps(), (step) => {
        // Build out the pipeline designer step control
        $('<div id="' + step.id + '" class="step ' + step.type + '" draggable="true" ondragstart="dragStep(event)">' + step.displayName + '</div>')
            .appendTo(stepsContainer);
        $('div #' + step.id).fitText(1.50);
    });
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
    if (inputId === 'executeIfEmpty' && selectVal !== 'script') {
        pipelineStepMetadata.executeIfEmpty = value;
    } else if (pipelineStepMetadata && pipelineStepMetadata.params) {
        let param = _.find(pipelineStepMetadata.params, function(p) { return p.name === inputId;});
        if (param) {
            param.type = selectVal === 'script' ? 'script' : param.type;
        } else {
            const stepParam = _.find(stepMetaData.params, function(p) { return p.name === inputId; });
            param = {
                type: selectVal === 'script' ? 'script' : stepParam.type,
                name: stepParam.name,
                required: stepParam.required
            };
            pipelineStepMetadata.params.push(param);
        }
        if (selectVal !== 'script') {
            param.value = value;
        }
    }
}

function handleTypeSelectChange(evt, ui) {
    const input = $('#' + evt.target.id.substring(0, evt.target.id.indexOf('Type')));
    const select = $(evt.target);
    handleValueChanges(input, select);
}

function handleSave() {
    const pipeline = generatePipeline();
    // Run validation of configured steps against step metadata
    const errors = [];
    let error;
    let currentStep;
    let stepParam;
    _.forEach(pipeline.steps, function(step) {
        currentStep = getStep(step.stepId);
        error = null;
        _.forEach(currentStep.params, function(param) {
            stepParam = _.find(step.params, function(p) { return  p.name === param.name});
            if (param.required && (!stepParam || !stepParam.value)) {
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
        // TODO Handle exceptions
        savePipeline(pipeline, function() {
            // Load the pipelines
            const select = $('#pipelines');
            select.empty();
            select.append($("<option />").val('none').text(''));
            savedPipelineName = pipeline.name;
            // This is an async call to the server
            loadPipelinesUI();
        });
    }
}

/**
 * This function populates the pipeline selection control
 */
function renderPipelinesDesignerSelect() {
    const pipelines = $("#pipelines");
    pipelines.empty();
    pipelines.append($("<option />").val('none').text(''));
    _.forEach(getPipelines(), (pipeline) => {
        pipelines.append($("<option/>").val(pipeline.id).text(pipeline.name));
    });
    pipelines.selectmenu({
        change: verifyLoadPipeline
    });
    if (savedPipelineName) {
        // Reselect the just saved pipeline
        const possibleMatches = $("#pipelines option").filter(function () { return $(this).text() === savedPipelineName });
        // Should have only matched one
        pipelines.val($(possibleMatches[0]).val());
        pipelines.selectmenu('refresh');
        savedPipelineName = null;
    }
}

/**
 * Loads the selected pipeline to the designer canvas
 */
function verifyLoadPipeline() {
    if (currentPipeline || isDesignerPopulated()) {
        clearFormDialogClearFunction = function() {
            clearPipelineDesigner();
            loadPipeline();
        };
        clearFormDialogCancelFunction = cancelClearPipelines;
        showClearFormDialog();
    } else {
        loadPipeline();
    }
}
