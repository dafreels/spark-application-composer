import { Component, Renderer2, Inject, OnInit } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'spui-spark-pipeline-ui-lib',
  templateUrl: './spark-pipeline-ui-lib.component.html',
  styleUrls: [
            '../public/css/joint.css',
            '../public/css/bootstrap.min.css',
            '../public/css/bootstrap-drawer.min.css',
            '../public/css/bootstrap-tokenfield.css',
            '../public/css/alpaca.min.css',
            '../public/css/app.css'
          ]
})
export class SparkPipelineUiLibComponent implements OnInit {

  constructor(
    private renderer2: Renderer2,
    @Inject(DOCUMENT) private document: any
  ) { }

  ngOnInit() {
    this.appendScriptTags();
  }

  appendScriptTags() {
    const paths = [
      '../public/libraries/jquery-3.3.1.js',
      '../public/libraries/jquery.fittext.js',
      '../public/libraries/lodash/4.17.11/lodash.js',
      '../public/libraries/backbone/1.3.3/backbone.js',
      '../public/libraries/dagre/latest/dagre.min.js',
      '../public/libraries/graphlib/latest/graphlib.min.js',
      '../public/libraries/joint/2.2.1/joint.js',
      '../public/libraries/handlebars/4.0.5/handlebars.min.js',
      '../public/libraries/bootstrap/3.4.1/bootstrap.min.js',
      '../public/libraries/bootstrap/typeahead/typeahead.bundle.min.js',
      '../public/libraries/bootstrap/drawer/drawer.min.js',
      '../public/libraries/bootstrap/tokenfield/0.12.1/bootstrap-tokenfield.min.js',
      '../public/libraries/alpacajs/1.5.24/alpaca.min.js',
      '../public/libraries/applications-model.js',
      '../public/libraries/steps-model.js',
      '../public/libraries/pipelines-model.js',
      '../public/libraries/schemas-model.js',
      '../public/libraries/services.js',
      '../public/libraries/add-step-dialog.js',
      '../public/libraries/alert-dialog.js',
      '../public/libraries/clear-form-dialog.js',
      '../public/libraries/code-editor-dialog.js',
      '../public/libraries/copy-pipeline-dialog.js',
      '../public/libraries/new-dialog.js',
      '../public/libraries/object-editor-dialog.js',
      '../public/libraries/validation-error-dialog.js',
      '../public/libraries/steps-editor.js',
      '../public/libraries/pipeline-editor.js',
      '../public/libraries/globals-editor.js',
      '../public/libraries/class-override-editor.js',
      '../public/libraries/graph-editor.js',
      '../public/libraries/application-editor.js',
      '../public/libraries/app.js',
    ];
    const sTag = this.renderer2.createElement('script');
    sTag.type = 'text/javascript';
    sTag.charset = 'utf-8';
    sTag.src = '../public/libraries/aceeditor/1.4.3/ace.js';
    this.document.body.appendChild(sTag);
    console.log('Renderer:', this.renderer2);
    paths.forEach(path => {
      const tag = this.renderer2.createElement('script');
      tag.src = path;
      this.document.body.appendChild(tag);
    });
  }
}
