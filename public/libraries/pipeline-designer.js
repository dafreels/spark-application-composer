var stepSize = {
    width: 275,
    height: 50
};

/**
 * Adds a step to the designer.
 * @param name The display name of the step.
 * @param x The x coordinate.
 * @param y The y coordinate.
 * @param metadata The step metadata to attach to the element.
 * @returns {devs.Model|Model|Model}
 */
function createStep(name, x, y, metadata) {
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
                text: joint.util.breakText(name, stepSize)
            }
        },
        inPorts: ['in'],
        outPorts: ['out'],
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
                            r: 10
                        }
                    }
                },
                'out': {
                    position: {
                        name: 'bottom'
                    },
                    attrs: {
                        '.port-body': {
                            fill: 'ivory',
                            r: 12
                        }
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
 * Determines the numbe of links already attached to the port.
 * @param cell The element.
 * @param portId The id of the port.
 * @returns {number} Number of links for the element and port.
 */
function getConnectedLinks(cell, portId) {
    return _.filter(graph.getConnectedLinks(cell), function(link) {
        var source = link.get('source') || {};
        var target = link.get('target') || {};
        return source.id === cell.id && source.port === portId ||
            target.id === cell.id && target.port === portId;
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

var graph;
var paper;
var currentSteps = {};

function generatePipelineJson() {
    var steps = {};
    var ids = [];
    var nextStepIds = [];
    _.forOwn(currentSteps, function(value) {
        var pipelineStepMetaData = value.attributes.metaData.pipelineStepMetaData;
        var stepMeta = value.attributes.metaData.stepMetaData;
        var step = {
            id: pipelineStepMetaData.id,
            stepId: stepMeta.id
        };
        ids.push(step.id);
        // Get the links for this step
        var links = _.filter(graph.getConnectedLinks(value), function(l) { return l.get('source').id === value.id;});
        // Find the next step id
        if (links.length === 1) {
            step.nextStepId = currentSteps[links[0].get('target').id].attributes.metaData.pipelineStepMetaData.id;
            nextStepIds.push(step.nextStepId);
        }
        steps[step.id] = step;
    });

    // Order the steps in the array to force the first non-branch step to the top
    // Find the first step
    var initialSteps = _.filter(ids, function(id) { return nextStepIds.indexOf(id) === -1; });
    var pipelineSteps = [steps[initialSteps[0]]];
    // Build out the remainder of the array
    var nextStepId = steps[initialSteps[0]].nextStepId;
    do {
        pipelineSteps.push(steps[nextStepId]);
        nextStepId = steps[nextStepId].nextStepId;
    } while(nextStepId);

    // TODO Get the pipeline name and id
    console.log(JSON.stringify({
        steps: pipelineSteps
    }, null, 4));
}

function createDesignerPanel() {
    graph = new joint.dia.Graph;

    paper = new joint.dia.Paper({
        el: $('#pipeline-designer'),
        model: graph,
        height: 800,
        gridSize: 1,
        defaultLink: new joint.dia.Link({
            attrs: { '.marker-target': { d: 'M 10 0 L 0 5 L 10 10 z' } }
        }),
        allowLink: handleLinkEvent,
        validateConnection: function(cellViewS, magnetS, cellViewT, magnetT, end, linkView) {
            if (getConnectedLinks(cellViewT.model, V(magnetT).attr('port')) > 0) return false;
            // Prevent linking from input ports.
            if (magnetS && magnetS.getAttribute('port-group') === 'in') return false;
            // Prevent linking from output ports to input ports within one element.
            if (cellViewS === cellViewT) return false;
            // Prevent linking to input ports.
            return magnetT && magnetT.getAttribute('port-group') === 'in';
        },
        validateMagnet: function(cellView, magnet) {
            if(getConnectedLinks(cellView.model, V(magnet).attr('port')) > 0) return false;
            if(magnet.getAttribute('magnet') !== 'passive') return true;

        }
    });

    paper.on('cell:pointerclick', handleElementSelect);
}
