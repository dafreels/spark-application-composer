const pipelinesContainerId = 'pipelines-editor';

const controlCharacters = ['!', '@', '#'];

// Contains a lookup from the unique step id within the pipeline back to the designer canvas element
let diagramStepToStepMetaLookup = {};
// Contains the metadata from the pipeline
let currentPipeline;
// Only used during the save operation
let savedPipelineName;

let pipelineGraphEditor;

/**
 * Initialize the pipeline designer drawing canvas
 */
function initializePipelineEditor() {
    pipelineGraphEditor = new GraphEditor($('#pipelineDesigner'),
        createStep,
        handleElementRemove,
        null,
        loadPropertiesPanel);

    // Pipeline Designer
    $('#save-button').click(handleSave);
    $('#new-button').click(handleNew);
    $('#copy-button').click(handleCopy);
    $('#reset-button').click(handleReset);
    $('#delete-button').click(handleDelete);
    $('#layout-pipeline-button').click(function() {
        pipelineGraphEditor.performAutoLayout();
    });
}

function allowStepDrop(ev) {
    ev.preventDefault();
}

/**
 * This function is called when a step is being dragged to the canvas. Even though it shows no references, it is being
 * called by HTML code.
 * @param ev The element being dragged.
 */
function dragStep(ev) {
    ev.dataTransfer.setData("text", $(ev.target).text());
    ev.dataTransfer.setData("id", ev.target.id.split('_')[1]);
}

function dropStep(ev) {
    ev.preventDefault();
    if (currentPipeline) {
        showAddStepDialog({
            name: ev.dataTransfer.getData("text"),
            x: ev.offsetX,
            y: ev.offsetY,
            stepMetaDataId: ev.dataTransfer.getData("id")
        });
    } else {
        showAlertDialog('Please select or create a pipeline!');
    }
}

/**
 * Removes an element and any links from the designer canvas.
 * @param evt The element to remove
 */
function handleElementRemove(evt) {
    const id = evt.model.attributes.metaData.pipelineStepMetaData.id;
    delete diagramStepToStepMetaLookup[id];
}

function handleNew() {
    if (currentPipeline || pipelineGraphEditor.isCanvasPopulated()) {
        showClearFormDialog(function() {
            const select = $('#pipelines');
            select.val('none');
            clearPipelineDesigner();
            showNewDialog(setupNew);
        }, cancelClearPipelines);
    } else {
        clearPipelineDesigner();
        showNewDialog(setupNew);
    }
}

function setupNew(name) {
    currentPipeline = {
        name: name,
        steps: []
    };
    $('#pipelineName').text(currentPipeline.name);
}

/**
 * Handles the user clicking cancel on the clear form dialog.
 */
function cancelClearPipelines() {
    // Set the select back to the original value
    if (currentPipeline && currentPipeline.id) {
        const select = $('#pipelines');
        select.val(currentPipeline.id);
    }
}

function handleCopy() {
    if (currentPipeline || pipelineGraphEditor.isCanvasPopulated()) {
        showClearFormDialog(displayCopyPipelineDialog);
    } else {
        displayCopyPipelineDialog();
    }
}

function displayCopyPipelineDialog() {
    showCopyPipelineDialog(function(name, pipelineId) {
        const select = $('#pipelines');
        select.val('none');
        $('#pipelineName').text('');
        clearPipelineDesigner();
        // Get a cloned copy of the data
        const pipeline = pipelinesModel.getPipeline(pipelineId);
        // Remove the original id
        delete pipeline.id;
        delete pipeline._id;
        // Use the updated name
        pipeline.name = name;
        populatePipelineData(pipeline);
    });
}

/**
 * Handles the reset button being clicked
 */
function handleReset() {
    if (currentPipeline || pipelineGraphEditor.isCanvasPopulated()) {
        showClearFormDialog(function() {
            const select = $('#pipelines');
            select.val('none');
            clearPipelineDesigner();
        });
    } else {
        clearPipelineDesigner();
    }
}

/**
 * Handles the deletion of a pipeline
 */
function handleDelete() {
    if (currentPipeline && currentPipeline.id) {
        showClearFormDialog(function() {
            deletePipeline(currentPipeline.id, function(err) {
                if (err) {
                    showGlobalErrorMessage('Failed to delete pipeline', err);
                } else {
                    clearPipelineDesigner();
                    loadPipelinesUI();
                }
            });
        }, null, 'Delete Pipeline?', 'Delete');
    }
}

/**
 * Clears the canvas
 */
function clearPipelineDesigner() {
    $('#pipelineName').text('');
    pipelineGraphEditor.clear();
    currentPipeline = null;
    diagramStepToStepMetaLookup = {};
    clearPropertiesPanel();
    $('#delete-button').addClass('disabled');
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
    if (pipelinesModel.isValidPipelineId(selectedPipelineId)) {
        $('#pipelineName').text(pipelinesModel.getPipelineName(selectedPipelineId).name);
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
        metaData: {
            stepMetaData: metadata,
            pipelineStepMetaData: {
                params: []
            }
        }
    });
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
    const currentSteps = pipelineGraphEditor.getGraphMetaData();
    _.forOwn(currentSteps, function (value) {
        pipelineStepMetaData = value.metaData.pipelineStepMetaData;
        stepMeta = value.metaData.stepMetaData;
        step = _.assign({}, stepMeta);
        step.stepId = stepMeta.id;
        step.id = pipelineStepMetaData.id;
        step.executeIfEmpty = pipelineStepMetaData.executeIfEmpty;
        step.params = [];
        // Initialize the parameters
        let pipelineParam;
        _.forEach(stepMeta.params, (param) => {
            pipelineParam = _.find(pipelineStepMetaData.params, (p) => p.name === param.name) || {};
            step.params.push(_.merge(pipelineParam, param));
        });
        ids.push(step.id);
        // Get the links for this step
        links = pipelineGraphEditor.getSourceLinks(diagramStepToStepMetaLookup[pipelineStepMetaData.id]);
        // Find the next step id
        if (step.type !== 'branch' && links.length === 1) {
            step.nextStepId = pipelineGraphEditor.getElement(links[0].get('target').id).attributes.metaData.pipelineStepMetaData.id;
            nextStepIds.push(step.nextStepId);
        } else if (step.type === 'branch') {
            let port;
            let param;
            _.forEach(links, function(link) {
                port = value.getPort(link.get('source').port).attrs.text.text;
                param = _.find(step.params, function(p) { return p.name === port }) || {};
                param.value = pipelineGraphEditor.getElement(link.get('target').id).attributes.metaData.pipelineStepMetaData.id;
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

function populatePipelineData(pipeline) {
    currentPipeline = pipeline;
    $('#pipelineName').text(currentPipeline.name);
    const centerX = Math.round($('#pipelineDesigner').width() / 2);
    const x = centerX - Math.round(stepSize.width / 2);
    let y = 50;
    let gstep;
    let stepIdLookup = {}; // Only used to track the steps we have added to the designer canvas
    let pipelineStep;
    let childParams;
    let childX;
    let displayName;
    // Add each step to the designer
    _.forEach(currentPipeline.steps, function (step) {
        if (!stepIdLookup[step.id]) {
            displayName = step.displayName;
            if (step.id) {
                displayName = step.id + ' - (' + step.displayName + ')';
            }
            // Add the steps to the designer
            gstep = pipelineGraphEditor.addElementToCanvas(displayName, x, y, stepsModel.getStep(step.stepId));
            diagramStepToStepMetaLookup[step.id] = gstep;
            gstep.attributes.metaData.pipelineStepMetaData = step;
            y += 100;
            stepIdLookup[step.id] = step.stepId;
            if (step.type === 'branch') {
                childParams = _.filter(step.params, p => p.type === 'result');
                // place the children side by side
                childX = centerX - Math.round(((childParams.length * stepSize.width) + (childParams.length * 10)) / 2);
                _.forEach(childParams, (param) => {
                    if (param.value) {
                        pipelineStep = cloneObject(_.find(currentPipeline.steps, step => step.id === param.value));
                        displayName = pipelineStep.displayName;
                        if (pipelineStep.id) {
                            displayName = pipelineStep.id + ' - (' + pipelineStep.displayName + ')';
                        }
                        gstep = pipelineGraphEditor.addElementToCanvas(displayName, childX, y, pipelineStep.stepId);
                        diagramStepToStepMetaLookup[pipelineStep.id] = gstep;
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
            pipelineGraphEditor.createLink(diagramStepToStepMetaLookup[step.id],
                diagramStepToStepMetaLookup[step.nextStepId]);
        } else if (step.type === 'branch') {
            _.forEach(_.filter(step.params, p => p.type === 'result' && p.value), (param) => {
                pipelineGraphEditor.createLink(diagramStepToStepMetaLookup[step.id],
                    diagramStepToStepMetaLookup[param.value], param.name);
            });
        }
    });

    loadPropertiesPanel(diagramStepToStepMetaLookup[currentPipeline.steps[0].id].attributes.metaData);

    pipelineGraphEditor.performAutoLayout();
}

/**
 * Loads the selected pipeline to the designer canvas
 */
function loadPipeline() {
    const pipelineId = $("#pipelines").val();
    if (pipelineId !== 'none') {
        $('#delete-button').removeClass('disabled');
        populatePipelineData(pipelinesModel.getPipeline(pipelineId));
    }
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
    const formDiv = $('<div class="form-group row">').appendTo(stepForm);
    let label = $('<label class="col-sm-3">');
    label.text('Execute If Empty:');
    label.appendTo(formDiv);
    let input = $('<input id="executeIfEmpty" class="form-control"/>');
    let inputDiv = $('<div class="col-sm-4">');
    inputDiv.appendTo(formDiv);
    input.appendTo(inputDiv);
    let select = $('<select id="executeIfEmptyType" size="1" class="form-control">');
    let selectDiv = $('<div class="col-sm-4" style="margin-left: 5px;">');
    selectDiv.appendTo(formDiv);
    select.appendTo(selectDiv);
    $(parameterTypeOptions).appendTo(select);
    input.focusin(function () {
        // TODO Never thought about doing this
        const selectVal = $('#executeIfEmptyType').val();
        if (selectVal === 'script') {
            showCodeEditorDialog(pipelineMetaData.executeIfEmpty, 'scala',
                function (value) {
                    pipelineMetaData.executeIfEmpty = value;
                    input.val(value);
                });
            $(this).prop('disabled', true);
        } else if (selectVal === 'object') {
            // showObjectEditor(pipelineMetaData.executeIfEmpty || {},
            //     null,
            //     function(value, schemaName) {
            //         defaultValues[formDiv.find('input[name="stepParamName"]').val()] = value;
            //         defaultValueInput.val(JSON.stringify(value));
            //         className.val(schemaName);
            //     });
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
        paramRow = $('<div class="form-group row">').appendTo(stepForm);
        label = $('<label class="col-sm-3">');
        label.text(param.name + ':');
        label.appendTo(paramRow);
        input = $('<input id="' + param.name + '" class="form-control"/>');
        inputDiv = $('<div class="col-sm-4">');
        inputDiv.appendTo(paramRow);
        input.appendTo(inputDiv);
        select = $('<select id="' + param.name + 'Type" size="1" class="form-control">').appendTo(paramRow);
        selectDiv = $('<div class="col-sm-4" style="margin-left: 5px;">');
        selectDiv.appendTo(paramRow);
        select.appendTo(selectDiv);
        $(parameterTypeOptions).appendTo(select);
        input.focusin(function () {
            let tempParam = _.find(pipelineMetaData.params, p => p.name === param.name);
            const selectVal = $('#' + param.name + 'Type').val();
            if (!tempParam) {
                tempParam = {
                    name: param.name,
                    type: selectVal
                };
                pipelineMetaData.params.push(tempParam);
            }
            if (selectVal === 'script') {
                showCodeEditorDialog(tempParam.value || '', param.language || 'scala',
                    function (value, lang) {
                        tempParam.value = value;
                        tempParam.language = lang;
                        $('#' + tempParam.name).val(value);
                    });
                $(this).prop('disabled', true);
            } else if (selectVal === 'object') {
                const val = _.isString(tempParam.value) ? setStringValue(tempParam.value) : tempParam.value;
                objectEditorDialog.showObjectEditor(val || {},
                    param.className,
                    function(value, schemaName) {
                        $('#' + tempParam.name).val(JSON.stringify(value));
                        tempParam.value = value;
                        tempParam.className = schemaName;
                    });
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
    $('#step-parameters-form').append(stepForm);
    // Setup the form
    let type = getType(pipelineMetaData.executeIfEmpty, 'static','static');
    let value;
    input = $('#executeIfEmpty');
    if (type !== 'static' && type !== 'script') {
        input.val(pipelineMetaData.executeIfEmpty.substring(1));
    }
    input.blur(handleInputChange);
    let el = $('#executeIfEmptyType');
    el.change(handleTypeSelectChange);
    el.val(type);
    _.forEach(stepMetaData.params, function (param) {
        el = $('#' + param.name + 'Type');
        el.change(handleTypeSelectChange);
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
        type = getType(value, param.type, param.type === 'script' ? 'script' : 'static');
        if (value && (type === 'global' || type === 'step' || type === 'secondary')) {
            value = value.substring(1);
        } else if (value && type === 'object') {
            value = JSON.stringify(value);
        }
        input = $('#' + param.name);
        input.val(value);
        // set the select value
        select = $('#' + param.name + 'Type');
        select.val(type);
        // Prevent edits against the result fields
        if (param.type === 'result') {
            input.prop('disabled', true);
            select.prop('disabled', 'disabled');
        }
    });
}

/**
 * This function is used to build up the step name suggestion list.
 * @param stepId The id of the step.
 * @returns {Array|*}
 */
function buildParentIdCompletionArray(stepId) {
    let links = pipelineGraphEditor.getTargetLinks(diagramStepToStepMetaLookup[stepId]);
    const stepIds = [];
    let nextLinks;
    let currentStep;
    while(links && links.length > 0) {
        nextLinks = [];
        _.forEach(links, (l) => {
            currentStep = pipelineGraphEditor.getElement(l.get('source').id);
            stepIds.push(currentStep.attributes.metaData.pipelineStepMetaData.id);
            nextLinks = _.union(nextLinks, pipelineGraphEditor.getTargetLinks(currentStep))
        });
        links = nextLinks;
    }

    return _.uniq(stepIds);
}

function getType(value, paramType, defaultType) {
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

    if (paramType === 'object' && type === defaultType) {
        type = paramType;
    }

    return type;
}

function loadPipelineDesignerStepsUI() {
    var stepsContainer = $('#test-panel');
    stepsContainer.empty();
    generateStepContainers(pipelinesContainerId, stepsContainer, null, 'dragStep(event)');
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
        if (selectVal !== 'script'&& selectVal !== 'object') {
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
        currentStep = stepsModel.getStep(step.stepId);
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
        savePipeline(pipeline, function(err) {
            if (err) {
                showGlobalErrorMessage('Failed to save pipeline', err);
            } else {
                // Load the pipelines
                const select = $('#pipelines');
                select.empty();
                select.append($("<option />").val('none').text(''));
                savedPipelineName = pipeline.name;
                // This is an async call to the server
                loadPipelinesUI();
            }

        });
    }
}

/**
 * This function populates the pipeline selection control
 */
function renderPipelinesDesignerSelect() {
    const pipelines = $("#pipelines");
    const sourcePipelines = $('#source-pipelines');
    pipelines.empty();
    sourcePipelines.empty();
    pipelines.append($("<option />").val('none').text(''));
    sourcePipelines.append($("<option />").val('none').text(''));
    _.forEach(pipelinesModel.getPipelines(), (pipeline) => {
        pipelines.append($("<option/>").val(pipeline.id).text(pipeline.name));
        sourcePipelines.append($("<option/>").val(pipeline.id).text(pipeline.name));
    });
    pipelines.change(verifyLoadPipeline);
    sourcePipelines.change(function () {
        $('#copy-pipeline-id').val($('#source-pipelines :selected').text() + '-1');
    });
    if (savedPipelineName) {
        // Reselect the just saved pipeline
        const possibleMatches = $("#pipelines option").filter(function () { return $(this).text() === savedPipelineName });
        // Should have only matched one
        pipelines.val($(possibleMatches[0]).val());
        savedPipelineName = null;
    }
}

/**
 * Loads the selected pipeline to the designer canvas
 */
function verifyLoadPipeline(evt) {
    if (currentPipeline || pipelineGraphEditor.isCanvasPopulated()) {
        showClearFormDialog(function() {
            clearPipelineDesigner();
            loadPipeline();
        }, cancelClearPipelines);
    } else {
        // Prevent calling this function multiple times
        evt.preventDefault();
        loadPipeline();
    }
}
