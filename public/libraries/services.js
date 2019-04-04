
function loadSteps(callback) {
    $.getJSON('/api/v1/steps')
        .done(function(data) {
            const steps = [];
            _.forEach(data.steps, function(step) {
                delete step._id;
                steps.push(step);
            });
            stepsModel.setSteps(steps);
            callback(data.steps);
        });
}

function loadPipelines(callback) {
    $.getJSON('/api/v1/pipelines')
        .done(function(data) {
            pipelinesModel.setPipelines(data.pipelines);
            callback(data.pipelines);
        });
}

function loadApplications(callback) {
    $.getJSON('/api/v1/applications')
        .done(function(data) {
            applicationsModel.setApplications(data.applications);
            callback(data.applications);
        });
}

function saveApplication(application, callback) {
    let type = 'POST';
    let url = '/api/v1/applications/';
    if (application.id) {
        type = 'PUT';
        url = '/api/v1/applications/' + application.id;
    }
    $.ajax({
        type: type,
        url: url,
        contentType: "application/json",
        data: JSON.stringify(application),
        success: function(data) {
            callback(null, data);
        },
        error: function (req, status, error) {
            callback(error);
        }
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
        success: function(data) {
            callback(null, data);
        },
        error: function (req, status, error) {
            callback(error);
        }
    });
}

function deletePipeline(id, callback) {
    $.ajax({
        type: 'DELETE',
        url: '/api/v1/pipelines/' + id,
        success: function(data) {
            callback(null, data);
        },
        error: function (req, status, error) {
            callback({status: status, error: error});
        }
    });
}

function saveBulkSteps(steps, callback) {
    let body = steps;
    if (_.isObject(steps)) {
        body = JSON.stringify(steps);
    }
    $.ajax({
        type: 'POST',
        url: '/api/v1/steps/',
        contentType: "application/json",
        data: body,
        success: function(data) {
            callback(null, data);
        },
        error: function (req, status, error) {
            callback(error);
        }
    });
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
        success: function(data) {
            callback(null, data);
        },
        error: function (req, status, error) {
            callback(error);
        }
    });
}
function loadSchemas(callback) {
    $.getJSON('/api/v1/package-objects')
        .done(function(data) {
            schemasModel.setSchemas(data['package-objects']);
            if (callback) {
                callback();
            }
        });
}

function saveSchemas(schemas, callback) {
    let body = schemas;
    if (_.isObject(schemas)) {
        body = JSON.stringify(schemas);
    }
    $.ajax({
        type: 'POST',
        url: '/api/v1/package-objects/',
        contentType: "application/json",
        data: body,
        success: function(data) {
            callback(null, data);
        },
        error: function (req, status, error) {
            callback(error);
        }
    });
}

function validateObject(schemaId, obj, callback) {
    let body = obj;
    if (_.isObject(obj)) {
        body = JSON.stringify(obj);
    }
    $.ajax({
        type: 'PATCH',
        url: '/api/v1/package-objects/' + schemaId + '/validate-object',
        contentType: "application/json",
        data: body,
        success: function(data) {
            callback(null, data);
        },
        error: function (req, status, error) {
            callback(error);
        }
    });
}
