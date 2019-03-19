
class ClassOverridesEditor {
    constructor(parentContainer, data) {
        this.parent = parentContainer;
        this.data = data || {};
        this.buildForm();
    }

    getValue() {
        return this.data;
    }

    buildForm() {
        const pipelineListenerdiv = $('<div class="form-group settings-form"><label>Pipeline Listener</label></div>');
        const pipelineListenerInput = $('<input type="text"/>');
        pipelineListenerInput.appendTo(pipelineListenerdiv);
        pipelineListenerdiv.appendTo(this.parent);

        const securityManagerdiv = $('<div class="form-group settings-form"><label>Security Manager</label></div>');
        const securityManagerInput = $('<input type="text"/>');
        securityManagerInput.appendTo(securityManagerdiv);
        securityManagerdiv.appendTo(this.parent);

        const stepMapperdiv = $('<div class="form-group settings-form"><label>Step Mapper</label></div>');
        const stepMapperInput = $('<input type="text"/>');
        stepMapperInput.appendTo(stepMapperdiv);
        stepMapperdiv.appendTo(this.parent);

        const parent = this;
        pipelineListenerInput.blur(function() {
            parent.data.pipelineListener = {
                className: setStringValue(pipelineListenerInput.val())
            };
        });

        securityManagerInput.blur(function() {
            parent.data.securityManager = {
                className: setStringValue(securityManagerInput.val())
            };
        });

        stepMapperInput.blur(function() {
            parent.data.stepMapper = {
                className: setStringValue(stepMapperInput.val())
            };
        });
    }
}
