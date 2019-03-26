
class ClassOverridesEditor {
    constructor(parentContainer, data) {
        this.parent = parentContainer;
        this.data = data || {};
        this.buildForm();
        this.populateForm();
    }

    getValue() {
        return this.data;
    }

    setValue(data) {
        this.data = data;
        this.populateForm();
    }

    clear() {
        this.data = {};
        this.pipelineListenerInput.val('');
        this.securityManagerInput.val('');
        this.stepMapperInput.val('');
    }

    populateForm() {
        if (this.data.pipelineListener && this.data.pipelineListener.className) {
            this.pipelineListenerInput.val(this.data.pipelineListener.className);
        }
        if (this.data.securityManager && this.data.securityManager.className) {
            this.securityManagerInput.val(this.data.securityManager.className);
        }
        if (this.data.stepMapper && this.data.stepMapper.className) {
            this.stepMapperInput.val(this.data.stepMapper.className);
        }
    }

    buildForm() {
        const pipelineListenerDiv = $('<div class="form-group settings-form"><label>Pipeline Listener</label></div>');
        this.pipelineListenerInput = $('<input type="text"/>');
        this.pipelineListenerInput.appendTo(pipelineListenerDiv);
        pipelineListenerDiv.appendTo(this.parent);

        const securityManagerDiv = $('<div class="form-group settings-form"><label>Security Manager</label></div>');
        this.securityManagerInput = $('<input type="text"/>');
        this.securityManagerInput.appendTo(securityManagerDiv);
        securityManagerDiv.appendTo(this.parent);

        const stepMapperDiv = $('<div class="form-group settings-form"><label>Step Mapper</label></div>');
        this.stepMapperInput = $('<input type="text"/>');
        this.stepMapperInput.appendTo(stepMapperDiv);
        stepMapperDiv.appendTo(this.parent);

        const parent = this;
        this.pipelineListenerInput.blur(function() {
            const val = setStringValue(parent.pipelineListenerInput.val());
            if (val) {
                parent.data.pipelineListener = {
                    className: val
                };
            }
        });

        this.securityManagerInput.blur(function() {
            const val = setStringValue(parent.securityManagerInput.val());
            if (val) {
                parent.data.securityManager = {
                    className: val
                };
            }
        });

        this.stepMapperInput.blur(function() {
            const val = setStringValue(parent.stepMapperInput.val());
            if (val) {
                parent.data.stepMapper = {
                    className: val
                };
            }
        });
    }
}
