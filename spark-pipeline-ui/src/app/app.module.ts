import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { SparkPipelineUiLibModule } from 'spark-pipeline-ui-lib';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    SparkPipelineUiLibModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
