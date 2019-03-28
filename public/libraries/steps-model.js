
class StepsModel {
    constructor(steps) {
        this.steps = steps;
    }

    setSteps(steps) {
        this.steps = steps;
    }

    getStep(id) {
        const step = _.find(this.steps, s => s.id === id);
        if (step) {
            return cloneObject(step);
        }
        return null;
    }

    getSteps() {
        return cloneObject(this.steps);
    }

    count() {
        return this.steps.length;
    }
}
