import { TestBed } from '@angular/core/testing';

import { SparkPipelineUiLibService } from './spark-pipeline-ui-lib.service';

describe('SparkPipelineUiLibService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: SparkPipelineUiLibService = TestBed.get(SparkPipelineUiLibService);
    expect(service).toBeTruthy();
  });
});
