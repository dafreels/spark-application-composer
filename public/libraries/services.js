var stepLookup = {}; // TODO move this to a model?
var pipelineLookup = {}; // TODO move this to a model?

function loadSteps(render) {
    $.getJSON('/api/v1/steps')
        .done(function(data) {
            _.forEach(data.steps, function(step) {
                render(step);
                delete step._id;
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

function saveBulkSteps(steps, callback) {
    if (_.isArray(JSON.parse(steps))) {
        $.ajax({
            type: 'POST',
            url: '/api/v1/steps/',
            contentType: "application/json",
            data: steps,
            success: callback
        });
    }
}

function saveStep(step, callback) {
    let type = 'POST';
    let url = '/api/v1/steps/';
    if (step.id) {
        type = 'PUT';
        url = '/api/v1/steps/' + step.id;
    }
    $.ajax({
        type: type,
        url: url,
        contentType: "application/json",
        data: JSON.stringify(step),
        success: callback,
        error: function(jqXHR, status, errorThrown) {
            console.log(status + ' --> ' + errorThrown);
        }
    });
}
