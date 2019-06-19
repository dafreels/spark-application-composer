
const forkStep = {
    id: 'fork',
    type: 'fork',
    displayName: 'Fork',
    description: 'A fork type step allows running a set of steps against a list of data simulating looping behavior',
    category: 'FlowControl',
    params: [
        {
            name: 'forkByValues',
            type: 'text',
            required: true
        },
        {
            name: 'forkMethod',
            type: 'text',
            required: true
        }
    ]
};
const joinStep = {
    id: 'join',
    type: 'join',
    displayName: 'Join',
    description: 'A join type step is used to join the executions of the fork step to continue processing in a linear manner.',
    category: 'FlowControl',
    params: []
};

class StepsModel {
    constructor(steps) {
        this.steps = steps;
    }

    setSteps(steps) {
        this.steps = steps;
    }

    getStep(id) {
        if (id === 'join') {
            return cloneObject(joinStep);
        } else if (id === 'fork') {
            return cloneObject(forkStep);
        }
        const step = _.find(this.steps, s => s.id === id);
        if (step) {
            return cloneObject(step);
        }
        return null;
    }

    getSteps(includeFlowControlSteps = false) {
        const newSteps = cloneObject(this.steps);
        if (includeFlowControlSteps) {
            newSteps.push(cloneObject(forkStep));
            newSteps.push(cloneObject(joinStep));
        }
        return newSteps;
    }

    count() {
        return this.steps.length;
    }
}
