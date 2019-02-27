let stepData;

function initializeSteps(steps) {
    stepData = steps;
}

function getStep(id) {
    const step = _.find(stepData, s => s.id === id);
    if (step) {
        return cloneObject(step);
    }
    return null;
}
