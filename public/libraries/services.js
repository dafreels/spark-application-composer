
function loadSteps(callback) {
    $.getJSON('/api/v1/steps')
        .done(function(data) {
            const steps = [];
            _.forEach(data.steps, function(step) {
                delete step._id;
                steps.push(step);
            });
            initializeSteps(steps);
            callback(data.steps);
        });
}

function loadPipelines(callback) {
    $.getJSON('/api/v1/pipelines')
        .done(function(data) {
            initializePipelines(data.pipelines);
            callback(data.pipelines);
        });
}

function loadApplications(callback) {
    $.getJSON('/api/v1/applications')
        .done(function(data) {
            // initializePipelines(data.applications);
            callback(data.applications);
        });
}

function savePipeline(pipeline, callback) {
    let type = 'POST';
    let url = '/api/v1/pipelines/';
    if (pipeline.id) {
        type = 'PUT';
        url = '/api/v1/pipelines/' + pipeline.id;
    }
    $.ajax({
        type: type,
        url: url,
        contentType: "application/json",
        data: JSON.stringify(pipeline),
        success: callback
    });
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
        success: callback
    });
}
function loadSchemas(callback) {
    $.getJSON('/api/v1/package-objects')
        .done(function(data) {
            initializeSchemas(data['package-objects']);
            if (callback) {
                callback();
            }
        });
}
