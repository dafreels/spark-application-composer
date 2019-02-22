var stepLookup = {}; // TODO move this to a model?
var pipelineLookup = {}; // TODO move this to a model?

function loadSteps(render) {
    $.getJSON('/api/v1/pipeline-steps')
        .done(function(data) {
            _.forEach(data.steps, function(step) {
                render(step);
                stepLookup[step.id] = step;
            });
        });
}

function loadPipelines(render) {
    $.getJSON('/api/v1/pipelines')
        .done(function(data) {
            $.each(data.pipelines, function(){
                render(this);
                pipelineLookup[this.id] = this;
            });
        });
}

function savePipeline(pipelineJson) {
    // TODO Add service call to 'api/v1/pipelines' here
}
