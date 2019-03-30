
class PipelinesModel {
    constructor(pipelines) {
        this.pipelines = pipelines;
    }

    setPipelines(pipelines) {
        this.pipelines = pipelines;
    }

    getPipeline(id) {
        return cloneObject(_.find(this.pipelines, p => p.id === id));
    }

    getPipelines() {
        return cloneObject(this.pipelines);
    }

    isValidPipelineId(id) {
        const pipeline = this.getPipeline(id)
        return pipeline !== undefined && pipeline !== null;
    }

    getPipelineName(id) {
        const pipeline = this.getPipeline(id);
        if(pipeline) {
            return pipeline.name;
        }
        return null;
    }

    count() {
        return this.pipelines.length;
    }
}
