/*
* Copyright © 2024. Cloud Software Group, Inc.
* This file is subject to the license terms contained
* in the license file that is distributed with this file.
*/

//@ts-check
//@ts-ignore

// Manually import the array polyfills because the API is using functions not supported in IE11.
import "core-js/es/array";
//@ts-ignore
import { render } from "./render.ts"
//import Spotfire  from "../spotfire/spotfire-api-1-2";

import * as d3 from "d3";


import {
    DataView,
    ModProperty,
    Mod
} from "spotfire-api";

import {
    RenderState,
    Options} from "./definitions";


const Spotfire = window.Spotfire;
const DEBUG = true;

var _mod: Mod;

export function GenerateRoundedRectSvg(width: number, height: number, tl: number, tr: number, br: number, bl: number) {
    const top = width - tl - tr;
    const right = height - tr - br;
    const bottom = width - br - bl;
    const left = height - bl - tl;
    return `
    M${tl - 7},-7
    h${top}
    a${tr},${tr} 0 0 1 ${tr},${tr}
    v${right}
    a${br},${br} 0 0 1 -${br},${br}
    h-${bottom}
    a${bl},${bl} 0 0 1 -${bl},-${bl}
    v-${left}
    a${tl},${tl} 0 0 1 ${tl},-${tl}
    z
`;
}

const state: RenderState = { preventRender: false, disableAnimation: false };

Spotfire.initialize(async (mod) => {

    _mod = mod;
    /**
     * Read metadata and write mod version to DOM
     */
    const modMetaData = mod.metadata;
    console.log("Mod version:", modMetaData.version ? "v" + modMetaData.version : "unknown version");

    /**
     * Initialize render context - should show 'busy' cursor.
     * A necessary step for printing (another step is calling render complete)
     */
    const context = mod.getRenderContext();

    /**
     * Create reader function which is actually a one time listener for the provided values.
     * @type {Spotfire.Reader}
     */
    const reader = mod.createReader(
        mod.visualization.data(),
        mod.windowSize(),
        mod.property("isEditorShown"),
        mod.property("vegaSpec1"),
        mod.property("vegaSpec2"),
        mod.property("dataSpec1"),
        mod.property("dataSpec2"),
        mod.property("endAngle"),
        mod.property("padAngle"),
        mod.property("bandPadding"),
        mod.property("innerRadius"),
        mod.property("cornerRadius"),
        mod.property("offset")
    );

    /**
     * Create a persistent state used by the rendering code
     */
    const state = {};

    /**
     * Initiates the read-render loop
     */
    reader.subscribe(onChange);

    /**
     * The function that is part of the main read-render loop.
     * It checks for valid data and will print errors in case of bad data or bad renders.
     * It calls the listener (reader) created earlier and adds itself as a callback to complete the loop.
     * @param {Spotfire.DataView} dataView
     * @param {Spotfire.Size} windowSize
     * @param {Spotfire.ModProperty<string>} example
     */
    async function onChange(
        dataView: DataView,
        windowSize: Spotfire.Size,
        isEditorShown: ModProperty<boolean>,
        vegaSpec1: ModProperty<string>,
        vegaSpec2: ModProperty<string>,
        dataSpec1: ModProperty<string>,
        dataSpec2: ModProperty<string>
    ) {
        try {

            const config: Options = {
                startAngle: (await mod.property("startAngle")),
                endAngle: (await mod.property("endAngle")),
                padAngle: (await mod.property("padAngle")),
                bandPadding: (await mod.property("bandPadding")),
                innerRadius: (await mod.property("innerRadius")),
                cornerRadius: (await mod.property("cornerRadius")),
                offset: (await mod.property("offset"))
            };

            await render(
                mod,
                config,
                state,
                dataView,
                windowSize,                
                vegaSpec1
            );

            // Creating Appearance dropdown for visualisation settings
            d3.select("#dropdown-menu-link").on("click", function () {
                //Log.green(LOG_CATEGORIES.General)("click");
                d3.select(".dropdown-container");
                //.attr("height", "100%");
            });

            d3.select(".dropdown-container")
                .style("background-color", context.styling.general.backgroundColor)
                .attr("height", "10px");

            d3.select("#gear-icon").style("fill", context.styling.general.font.color);

            context.signalRenderComplete();

            // Everything went well this time. Clear any error.
            mod.controls.errorOverlay.hide("catch");
        } catch (e: any) {
            mod.controls.errorOverlay.show(
                e.message || e || "☹️ Something went wrong, check developer console",
                "catch"
            );
            if (DEBUG) {
                throw e;
            }
        }
    }
});
