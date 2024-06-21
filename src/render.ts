/*
* Copyright © 2024. Cloud Software Group, Inc.
* This file is subject to the license terms contained
* in the license file that is distributed with this file.
*/

//@ts-check
import * as d3 from "d3";

import * as vega from "vega";
//@ts-ignore
import { invalidateTooltip } from "./extended-api.js";

import {
    circularBarChart
    //@ts-ignore
} from "./vegaspecs.ts";

// import { gzip, ungzip } from "node-gzip";
import { DataView, ModProperty, Mod, Size } from "spotfire-api";
import { Options } from "./definitions";
import { createSettingsPopout } from "./settings";

/**
 * @typedef {{
 *          colorIndex: number;
 *          markedColor: string;
 *          unmarkedColor: string;
 *          markedSegments: number[][]
 *          name: string;
 *          sum: number;
 *          }} RenderGroup;
 */

/**
 * Prepare some dom elements that will persist  throughout mod lifecycle
 */
const modContainer = d3.select("#mod-container");

/**
 * Main svg container
 */
const svg = modContainer.append("svg").attr("xmlns", "http://www.w3.org/2000/svg");


//const JSONEditor = require("fix-esm").require("vanilla-jsoneditor");

/**
 * Renders the chart
 * @param {Spotfire.Mod} mod
 * @param {any} state
 * @param {Spotfire.DataView} dataView - dataView
 * @param {Spotfire.Size} windowSize - windowSize
 * @param {Spotfire.ModProperty<string>} example - an example property
 */
export async function render(
    mod: Mod,
    config: Options,
    state: any,
    dataView: DataView,
    windowSize: Size,
    vegaSpec1: ModProperty<string>) {
    if (state.preventRender) {
        // Early return if the state currently disallows rendering.
        return;
    }
    console.log("in render");

    // let dragSelectActive = false;
    // const onSelection = ({ dragSelectActive }) => {
    //     state.preventRender = dragSelectActive;
    // };

    const styling = mod.getRenderContext().styling;
    const { tooltip, popout } = mod.controls;
    const { radioButton, checkbox } = popout.components;
    const { section } = popout;

    invalidateTooltip(tooltip);

    const allRows = await dataView.allRows();

    if (allRows == null) {
        // Return and wait for next call to render when reading data was aborted.
        // Last rendered data view is still valid from a users perspective since
        // a document modification was made during a progress indication.
        return;
    }


    //const xLeaves = (await xHierarchy.root()).leaves();
    // const colorLeaves = (await colorHierarchy.root()).leaves();

    const xAxisMeta = await mod.visualization.axis("X");
    const colorAxisMeta = await mod.visualization.axis("Color");
    const groupByAxisMeta = await mod.visualization.axis("GroupBy");

    const margin = { top: 0, right: 0, bottom: 0, left: 0 };

    //@ts-ignore
    let values = [];
    let transformedData: any = [];

    /**
     * @param node
     * @param indent
     * @returns
     */

    /**
     * DATA SPEC
     */
    for (const row of allRows) {
        let xValue;
        if (xAxisMeta.expression == "<>") {
            xValue = "(None)";
        } else {
            xValue = xAxisMeta.isCategorical ? row.categorical("X").formattedValue() : row.continuous("X").value();
        }
        let colorValue = "";
        if (colorAxisMeta.expression == "<>" || colorAxisMeta.expression == "") {
            colorValue = "All Values";
        } else {
            colorValue = colorAxisMeta.isCategorical
                ? row.categorical("Color").formattedValue()
                : row.continuous("Color").value();
        }
        values.push({
            category: xValue,
            amount: row.continuous("Y").value(),
            color: row.color().hexCode,
            colorCategory: colorValue,
            groupBy: groupByAxisMeta.expression == "<>" ? undefined : row.categorical("GroupBy")?.formattedValue(),
            row: row,
            isMarked: row.isMarked()
        });
    }

    let modContainerSize = {
        width: "100%",
        height: windowSize.height
    };

    /**
     * Sets the viewBox to match windowSize
     */
    svg.attr("viewBox", [0, 0, windowSize.width, windowSize.height]);
    svg.selectAll("*").remove();

    /**
     * The DataView can contain errors which will cause rowCount method to throw.
     */
    let errors = await dataView.getErrors();
    if (errors.length > 0) {
        svg.selectAll("*").remove();
        mod.controls.errorOverlay.show(errors, "dataView");
        return;
    }

    mod.controls.errorOverlay.hide("dataView");

    var view = await renderVega(values);
    if (view == null) {
        return;
    }

    // Editing or viewing mode?
    if (mod.getRenderContext().isEditing) {
        d3.select("#settings-menu").selectAll("*").remove();
        d3.selectAll(".dropdown-container").style("visibility", "visible");
        createSettingsPopout(config, view, document.getElementById("settings-menu"));
    } else {
        d3.selectAll(".dropdown-container").style("visibility", "hidden");
    }

    // Click marking for circular bar plot.
    view.addEventListener('click', function (event: any, item: any) {
        if (!item) {
            dataView.clearMarking();
            return;
        }
        dataView.mark([item.datum.row], event.ctrlKey ? "ToggleOrAdd" : "Replace");
    });

    // Adding styles to visualisation on mouse hover. 
    view.addEventListener('mouseover', function (event: any) {
        if (event.target.tagName == "path") {

            event.target.style.stroke = "black";
        }
    });

    // Clearing hover styles
    view.addEventListener('mouseout', function (event: any) {
        if (event.target.tagName == "path") {
            event.target.style.stroke = 'none';
        }
    });

    // Binding Vega View signals to Mod Property for changing visualisations appearance.
    view.signal("offset", config.offset.value());
    view.signal("startAngle", config.startAngle.value());
    view.signal("endAngle", config.endAngle.value());
    view.signal("padAngle", config.padAngle.value());
    view.signal("bandPadding", config.bandPadding.value());
    view.signal("innerRadius", config.innerRadius.value());
    view.signal("cornerRadius", config.cornerRadius.value());
    view.runAsync();

    async function renderVega(data: any) {
        let vegaSpec: vega.Spec = circularBarChart;

        try {
            vegaSpec = vegaSpec1.value() == "" ? undefined : JSON.parse(vegaSpec1.value());
        } catch (e) {
            return;
        }

        //@ts-ignore
        vegaSpec.data[0].values = data;

        let width = windowSize.width - margin.left - margin.right;
        let height = modContainerSize.height - margin.top - margin.bottom;

        vegaSpec.width = Math.min(width, height);
        vegaSpec.height = Math.min(width, height);

        let runtime;
        try {
            runtime = vega.parse(vegaSpec);
        } catch (error: any) {
            console.log(error);
            return null;
        }

        try {
            var view = await new vega.View(runtime, {
                logLevel: vega.Warn,
                renderer: "svg",
                container: "#mod-container",
                hover: true // , // enable hover event processing,
            })
                .background(styling.general.backgroundColor)
                .runAsync(); // evaluate and render the view

        } catch (error: any) {
            console.log(error);
        }

        transformedData = [];

        return view;
    }
}
