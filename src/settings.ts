/*
* Copyright © 2024. Cloud Software Group, Inc.
* This file is subject to the license terms contained
* in the license file that is distributed with this file.
*/

import { Controls, Mod, ModProperty, PopoutComponent, ContextMenuItem, ModPropertyDataType } from "spotfire-api";

// @ts-ignore
import * as d3 from "d3";

import { GenerateRoundedRectSvg } from "./index";

// @ts-ignore
import { sliderHorizontal } from "d3-simple-slider";

import { Options } from "./definitions";

function AddSlider(
    label: string,
    property: ModProperty,
    container: HTMLElement,
    min: number,
    max: number,
    step: number,
    onChanged: (val: number) => any,
    tickValues: number[] = null,
    showTickNumbers = true): HTMLElement {
    const div = document.createElement("DIV");
    container.append(div);
    const labelElement = document.createElement("label");
    labelElement.classList.add("form-check-label");
    labelElement.classList.add("mt-2");
    labelElement.setAttribute("for", "textfield_" + property.name);
    labelElement.innerHTML = label;
    div.append(labelElement);
    const slider = sliderHorizontal()
        .min(min)
        .max(max)
        .step(step)
        .silentValue(property.value())
        .tickFormat(showTickNumbers ? null : () => { })
        .width(80)
        .displayValue(true)
        .on("end", (val: any) => {
            property.set(val);
            onChanged(val);
        });
    slider.handle(GenerateRoundedRectSvg(14, 14, 3, 3, 3, 3));

    if (tickValues != null) {
        slider.tickValues(tickValues);
    } else {
        slider.ticks((max - min) / step);
    }
    const element = d3.select(div).append("svg");

    element.attr("width", 120).attr("height", 50).append("g").attr("transform", "translate(15,10)").call(slider);

    return div;
}

function AddPlaceholder(container: HTMLElement): HTMLElement {
    const div = document.createElement("div");
    container.append(div);
    return div;
}

function AddSection(header: string, container: HTMLElement): HTMLElement {
    const div = document.createElement("div");
    div.classList.add("dropdown-header");
    div.innerHTML = header;
    div.addEventListener("click", (ev: MouseEvent) => ev.stopPropagation());
    container.append(div);

    const form = document.createElement("form");
    form.classList.add("px-4");
    form.classList.add("py-1");
    form.addEventListener("click", (ev: MouseEvent) => ev.stopPropagation());
    container.append(form);

    return form;
}

function AddRadioButton(property: ModProperty, values: any[], container: HTMLElement): HTMLElement {
    const radioContainer = document.createElement("div");
    values.forEach((element) => {
        const div = document.createElement("div");
        div.setAttribute("data-keepOpenOnClick", "");
        div.classList.add("form-check");
        div.addEventListener("click", (event) => {
            event.stopPropagation();
        });
        div.addEventListener("contextmenu", (event: Event) => event.stopPropagation());

        //div.classList.add("mt-2");

        const input = <HTMLInputElement>document.createElement("input");
        input.classList.add("form-check-input");
        input.setAttribute("type", "radio");
        input.setAttribute("name", property.name);
        input.setAttribute("value", element.value);
        if (element.value == property.value()) input.checked = true;
        input.id = "radio_" + property.name + "_" + element.value;

        input.addEventListener("change", (event) => {
            const target = event.currentTarget as HTMLInputElement;

            if (target.checked) property.set(target.getAttribute("value"));
            event.stopPropagation();
        });

        div.append(input);

        const labelElement = document.createElement("label");
        labelElement.classList.add("form-check-label");
        labelElement.setAttribute("for", "radio_" + property.name + "_" + element.value);
        labelElement.innerHTML = element.text;
        div.append(labelElement);
        radioContainer.append(div);
    });
    container.append(radioContainer);
    return radioContainer;
}

export function createSettingsPopout(config: Options, view: any, dropDownContainer: HTMLElement) {
    dropDownContainer.addEventListener("click", (ev: MouseEvent) => ev.stopPropagation());

    let section = AddSection("Appearance Settings", dropDownContainer);
    const circularPlotOptionsPlaceholder = AddPlaceholder(section);

    AddRadioButton(
        config.offset,
        [
            { text: "Stacked", value: "zero" },
            { text: "Centered", value: "center" },
            { text: "100% Stacked", value: "normalize" }
        ],
        circularPlotOptionsPlaceholder
    );
    AddSlider("Start Angle", config.startAngle, circularPlotOptionsPlaceholder, -3, 7, 0.01, (val: number) => { view.signal("startAngle", val); view.runAsync(); }, [-3, 0, 7]);
    AddSlider("End Angle", config.endAngle, circularPlotOptionsPlaceholder, -7, 3, 0.01, (val: number) => { view.signal("endAngle", val); view.runAsync(); }, [-7, 0, 3]);
    AddSlider("Pad Angle", config.padAngle, circularPlotOptionsPlaceholder, -0, 0.1, 0.01, (val: number) => { view.signal("padAngle", val); view.runAsync(); }, [-0, 0, 0.1]);
    AddSlider("Band Padding", config.bandPadding, circularPlotOptionsPlaceholder, 0, 1, 0.1, (val: number) => { view.signal("bandPadding", val); view.runAsync(); }, [0, 0, 1]);
    AddSlider("Inner Radius", config.innerRadius, circularPlotOptionsPlaceholder, 0, 90, 1, (val: number) => { view.signal("innerRadius", val); view.runAsync(); }, [0, 0, 90]);
    AddSlider("Corner Radius", config.cornerRadius, circularPlotOptionsPlaceholder, 0, 10, 0.5, (val: number) => { view.signal("cornerRadius", val); view.runAsync(); }, [0, 0, 10]);

}