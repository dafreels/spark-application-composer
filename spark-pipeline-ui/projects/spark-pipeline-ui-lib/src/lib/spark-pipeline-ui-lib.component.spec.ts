import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SparkPipelineUiLibComponent } from './spark-pipeline-ui-lib.component';

describe('SparkPipelineUiLibComponent', () => {
  let component: SparkPipelineUiLibComponent;
  let fixture: ComponentFixture<SparkPipelineUiLibComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SparkPipelineUiLibComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SparkPipelineUiLibComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
