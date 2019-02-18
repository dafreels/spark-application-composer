var stepLookup = {}; // TODO move this to a model?
var pipelineLookup = {}; // TODO move this to a model?

function loadSteps() {
    $.getJSON('/api/v1/pipeline-steps')
        .done(function(data) {
            var stepsContainer = $('#step-panel');
            _.forEach(data.steps, function(step) {
                $('<div id="' + step.id + '" class="step" draggable="true" ondragstart="drag(event)">' + step.displayName + '</div>')
                    .appendTo(stepsContainer);
                $('#' + step.id).fitText(1.50);
                stepLookup[step.id] = step;
            });
        });
}

function loadPipelines() {
    $.getJSON('/api/v1/pipelines')
        .done(function(data) {
            $("#pipelines").append($("<option />").val('none').text(''));
            $.each(data.pipelines, function(){
                $("#pipelines").append($("<option />").val(this.id).text(this.name));
                pipelineLookup[this.id] = this;
            });
        });
}
