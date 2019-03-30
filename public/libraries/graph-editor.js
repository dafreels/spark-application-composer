
class GraphEditor {
    constructor(graphElement,
                createElementHandler,
                removeElementHandler,
                addPortHandler,
                elementSelectHandler) {
        const parent = this;
        this.createElementHandler = createElementHandler;
        this.removeHandler = removeElementHandler;
        this.addHandler = addPortHandler;
        this.elementSelectHandler = elementSelectHandler;
        this.elements = {};
        this.currentHighlightedElement = null;
        this.graphElement = graphElement;
        this.graph = new joint.dia.Graph;
        this.paper = new joint.dia.Paper({
            el: this.graphElement,
            model: this.graph,
            height: 800,
            width: '95%',
            gridSize: 1,
            defaultLink: new joint.dia.Link({
                attrs: {'.marker-target': {d: 'M 10 0 L 0 5 L 10 10 z'}}
            }),
            allowLink: GraphEditor.handleLinkEvent,
            validateConnection: function (cellViewS, magnetS, cellViewT, magnetT) {
                if (parent.getConnectedLinks(cellViewT.model, V(magnetT).attr('port'), parent.graph) > 0) return false;
                // Prevent linking from input ports.
                if (magnetS && magnetS.getAttribute('port-group') === 'in') return false;
                // Prevent linking from output ports to input ports within one element.
                if (cellViewS === cellViewT) return false;
                // Prevent linking to input ports.
                return magnetT && magnetT.getAttribute('port-group') === 'in';
            },
            validateMagnet: function (cellView, magnet) {
                if (parent.getConnectedLinks(cellView.model, V(magnet).attr('port'), parent.graph) > 0) return false;
                if (magnet.getAttribute('magnet') !== 'passive') return true;
            }
        });

        this.paper.on('cell:pointerclick', this.handleElementSelect());
        this.paper.on('cell:mouseover', GraphEditor.handleExecutionMouseOver);
        this.paper.on('cell:mouseout', GraphEditor.handleExecutionMouseOut);
        this.paper.on('close:button:pointerdown', function (evt) {
            parent.removeElement(evt);
            if (parent.removeHandler) {
                parent.removeHandler(evt);
            }
        });
        this.paper.on('add:button:pointerdown', function (evt) {
            if (parent.addHandler) {
                parent.addHandler(evt);
            }
        });
    }

    /**
     * Remove the element from the canvas and any links.
     * @param element The element to remove.
     */
    removeElement(element) {
        _.forEach(this.graph.getConnectedLinks(element), link => link.remove());
        this.elements[element.model.id].remove();
        delete this.elements[element.model.id];
    }

    /**
     * Find the next Y coordinate based on the
     * @returns {number}
     */
    getNextYCoordinate() {
        let elementY;
        let largestY = 0;
        _.forOwn(this.elements, (element) => {
            elementY = element.attributes.position.y;
            if (elementY >= largestY) {
                largestY = elementY;
            }
        });

        if (largestY > 0) {
            return largestY += 55;
        }

        return 50;
    }

    /**
     * Do an automatic layout on the elements of the canvas
     */
    performAutoLayout() {
        joint.layout.DirectedGraph.layout(this.graph, {
            setLinkVertices: false,
            marginX: 10,
            marginY: 10,
            nodeSep: 50,
            edgeSep: 50,
            rankDir: "TB"
        });
    }

    /**
     * Returns the elements of the graph as an array of JSON objects.
     * @returns {Array} An array of JSON objects representing the graph.
     */
    getGraphMetaData() {
        const executions = [];
        let links;
        _.forOwn(this.elements, (element) => {
            links = this.graph.getConnectedLinks(element);
            element.attributes.metaData.parents = [];
            _.forEach(links, (link) => {
                if (link.get('source').id !== element.id) {
                    element.attributes.metaData.parents.push(this.elements[link.get('source').id].attributes.metaData.id);
                }
            });
            executions.push({
                id: element.attributes.metaData.id,
                metaData: element.attributes.metaData,
            });
        });
        return executions;
    }

    /**
     * Adds a new element to the canvas
     * @param name The name to display
     * @param x The x coordinates on the canvas
     * @param y The y coordinates on the canvas
     * @param metadata The metadata to attach to this execution element
     * @returns {*}
     */
    addElementToCanvas(name, x, y, metadata) {
        const element = this.createElementHandler(name, x, y, metadata || {});
        this.elements[element.id] = element.addTo(this.graph);
        return this.elements[element.id];
    }

    /**
     * Allows access to the element on the canvas
     * @param id The id of the canvas element
     * @returns {*}
     */
    getElement(id) {
        return this.elements[id];
    }

    /**
     * Given two models, create a link between them.
     * @param source The source model
     * @param target The target model
     * @param port An optional port name to link. Defaults to 'out'
     */
    createLink(source, target, port) {
        const outPorts = _.filter(source.getPorts(), p => p.group === 'out');
        let outPortId;
        if (port) {
            outPortId = _.find(outPorts, p => p.attrs.text.text === port).id;
        } else {
            const outport = _.find(outPorts, p => p.group === 'out');
            if (outport) {
                outPortId = outport.id;
            }
        }
        if (!outPortId) {
            port = _.assign({}, portTemplate);
            port.group = 'out';
            port.name = getCustomId('dynamicPort');
            source.addPorts([port]);
            outPortId = _.find(source.getPorts(), p => p.group === 'out' && p.name === port.name).id;
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
        this.graph.addCell(link);
    }

    /**
     * Given an element, retrieve the target links.
     * @param element The element to query
     * @returns {*}
     */
    getTargetLinks(element) {
        if (element) {
            return _.filter(this.graph.getConnectedLinks(element), function (l) {
                return l.get('target').id === element.id;
            });
        }
        return [];
    }

    /**
     * Returns the source links for an element
     * @param element The element
     * @returns {*} An array of source links
     */
    getSourceLinks(element) {
        return _.filter(this.graph.getConnectedLinks(element), function (l) {
            return l.get('source').id === element.id;
        });
    }

    /**
     * Clears the canvas
     */
    clear() {
        this.graph.clear();
    }

    /**
     * Determines the number of links already attached to the port.
     * @param cell The element.
     * @param portId The id of the port.
     * @param graph The graph where the links are stored
     * @returns {number} Number of links for the element and port.
     */
    getConnectedLinks(cell, portId, graph) {
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
    static handleLinkEvent(linkView) {
        return linkView.targetMagnet !== null;
    }

    /**
     * Returns true if there are elements on the designer canvas.
     * @returns {boolean}
     */
    isCanvasPopulated() {
        return this.graph.getCells().length > 0;
    }

    /**
     * Called when the user clicks the step in the designer.
     */
    handleElementSelect() {
        const parent = this;
        return function(evt) {
            if (parent.currentHighlightedElement) {
                parent.currentHighlightedElement.unhighlight();
            }
            parent.currentHighlightedElement = evt;
            evt.highlight();
            if (parent.elementSelectHandler) {
                parent.elementSelectHandler(evt.model.attributes.metaData);
            }
        };
    }

    /**
     * Helper function that displays the close button when the mouse pointer is over the cell
     * @param evt The underlying cell
     */
    static handleExecutionMouseOver(evt) {
        const close = GraphEditor.getExecutionElements(evt);
        if (close.populated) {
            close.closeButton.setAttribute('visibility', 'visible');
            close.closeLabel.setAttribute('visibility', 'visible');
            if (close.editButton) {
                close.editButton.setAttribute('visibility', 'visible');
                close.editLabel.setAttribute('visibility', 'visible');
            }
        }
    }

    /**
     * Helper function that hides the close button when the mouse pointer leaves the cell
     * @param evt The underlying cell
     */
    static handleExecutionMouseOut(evt) {
        const close = GraphEditor.getExecutionElements(evt);
        if (close.populated) {
            close.closeButton.setAttribute('visibility', 'hidden');
            close.closeLabel.setAttribute('visibility', 'hidden');
            if (close.editButton) {
                close.editButton.setAttribute('visibility', 'hidden');
                close.editLabel.setAttribute('visibility', 'hidden');
            }
        }
    }

    /**
     * Utility function to locate the 'close button elements'
     */
    static getExecutionElements(evt) {
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
}
