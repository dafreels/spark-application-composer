import { Renderer2, OnInit } from '@angular/core';
export declare class SparkPipelineUiLibComponent implements OnInit {
    private renderer2;
    private document;
    constructor(renderer2: Renderer2, document: any);
    ngOnInit(): void;
    appendScriptTags(): void;
}
