/*
* Copyright © 2024. Cloud Software Group, Inc.
* This file is subject to the license terms contained
* in the license file that is distributed with this file.
*/

import { 
    ModProperty} from "spotfire-api";

// @ts-ignore
import * as d3 from "d3";
export type D3_SELECTION = d3.Selection<SVGGElement, unknown, HTMLElement, any>;


export interface RenderState {
    preventRender: boolean;
    disableAnimation: boolean;
}

export interface RenderedPanel {
    name: String,
    boundingClientRect: DOMRect,
    getBoundingClientRect(): DOMRect,
    mark(x: number, y: number, width: number, height: number, ctrlKey: boolean): void
}

export interface Options {

    startAngle?: ModProperty<number>;
    endAngle?: ModProperty<number>;
    padAngle?: ModProperty<number>;
    bandPadding?: ModProperty<number>;
    innerRadius?: ModProperty<number>;
    cornerRadius?: ModProperty<number>;
    offset?:ModProperty<string>;
}