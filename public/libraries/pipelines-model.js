let pipelineData;

function initializePipelines(pipelines) {
    pipelineData = pipelines;
}

function getPipeline(id) {
    return cloneObject(_.find(pipelineData, p => p.id === id));
}

function getPipelines() {
    return cloneObject(pipelineData);
}

function getPipelineStep(id, stepId) {
    const pipeline = _.find(pipelineData, p => p.id === id);
    if(pipeline) {
       return cloneObject(_.find(pipeline.steps, step => step.id === stepId));
    }
    return null;
}

function isValidPipelineId(id) {
    return _.findIndex(pipelineData, p => p.id === id) !== -1
}

function getPipelineName(id) {
    const pipeline = _.find(pipelineData, p => p.id === id);
    if(pipeline) {
        return pipeline.name;
    }
    return null;
}
