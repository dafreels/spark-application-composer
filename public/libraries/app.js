const parameterTypeOptions = '<option value="static">Static</option>' +
    '<option value="global">Global</option>' +
    '<option value="step">Step Response</option>' +
    '<option value="secondary">Secondary Step Response</option>' +
    '<option value="script">Script</option>';

function loadStepsUI() {
    loadSteps(() => {
        loadPipelineDesignerStepsUI();
        renderStepSelectionUI();
    });
}

function loadPipelinesUI() {
    loadPipelines(() => {
        renderPipelinesDesignerSelect();
    });
}

function loadSchemasUI() {
    loadSchemas(() => {
        renderSchemaUI();
    });
}

function cloneObject(obj) {
    if (!obj) {
        return null;
    }
    return JSON.parse(JSON.stringify(obj));
}

$(document).ready(function () {
    // Setup the tabbed interface
    $('#tabs').tabs();

    // Generate custom diagram shape
    createCustomElement();

    // Initialize dialogs
    initializeClearFormDialog();
    initializeCodeEditorDialog();
    initializeValidationErrorDialog();
    initializeAddStepDialog();
    initializeNewDialog();
    initializeAlertDialog();
    initializeCopyPipelineDialog();
    initializeSettingsDialog();
    initializeObjectEditor();

    // Initialize the editors
    initializeStepsEditor();
    initializePipelineEditor();
    initializeApplicationEditor();

    // Load the steps data from the API and render the UIs.
    loadStepsUI();
    // Load the pipelines data from the API and render the UIs.
    loadPipelinesUI();

    // Load the known object schemas
    loadSchemasUI();
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
