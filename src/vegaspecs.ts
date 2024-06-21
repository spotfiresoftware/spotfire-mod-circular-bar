/*
* Copyright © 2024. Cloud Software Group, Inc.
* This file is subject to the license terms contained
* in the license file that is distributed with this file.
*/

import * as vega from "vega";

const circularBarChart: vega.Spec = {
    "$schema": "https://vega.github.io/schema/vega/v5.json",
    "signals": [
        {
            "name": "startAngle",
            "value": -2.5
        },
        {
            "name": "endAngle",
            "value": 2.5
        },
        {
            "name": "padAngle",
            "value": 0
        },
        {
            "name": "bandPadding",
            "value": 0.15
        },
        {
            "name": "innerRadius",
            "value": 60
        },
        {
            "name": "cornerRadius",
            "value": 0
        },
        {
            "name": "offset",
            "value": "zero"
        }
    ],
    "scales": [
        {
            "name": "chbands",
            "type": "band",
            "paddingInner": {
                "signal": "bandPadding"
            },
            "range": [
                {
                    "signal": "innerRadius"
                },
                {
                    "signal": "width / 2 - 10"
                }
            ],
            "domain": {
                "data": "table",
                "field": "category"
            }
        },
        {
            "name": "angle",
            "type": "linear",
            "range": [
                {
                    "signal": "startAngle"
                },
                {
                    "signal": "endAngle"
                }
            ],
            "nice": true,
            "zero": true,
            "domain": {
                "data": "table",
                "field": "r1"
            }
        },
        {
            "name": "theta",
            "type": "linear",
            "domain": {
                "data": "table",
                "fields": [
                    "r0",
                    "r1"
                ]
            },
            "range": [
                {
                    "signal": "startAngle"
                },
                {
                    "signal": "endAngle"
                }
            ],
            "zero": true
        }
    ],
    "marks": [
        {
            "type": "arc",
            "name": "markable",
            "from": {
                "data": "table"
            },
            "encode": {
                "enter": {
                    "x": {
                        "signal": "width / 2"
                    },
                    "y": {
                        "signal": "height / 2"
                    }
                },
                "update": {
                    "fill": {
                        "field": "color"
                    },
                    "startAngle": {
                        "scale": "angle",
                        "field": "r0"
                    },
                    "endAngle": {
                        "scale": "angle",
                        "field": "r1"
                    },
                    "padAngle": {
                        "signal": "padAngle"
                    },
                    "innerRadius": {
                        "scale": "chbands",
                        "field": "category"
                    },
                    "outerRadius": {
                        "scale": "chbands",
                        "field": "category",
                        "offset": {
                            "scale": "chbands",
                            "band": 1
                        }
                    },
                    "cornerRadius": {
                        "signal": "cornerRadius"
                    },
                    "tooltip": {
                        "signal": "'Category: '+datum.category+'  '+datum.colorCategory+'  '+datum.amount+''"
                    }
                }
            }
        },
        {
            "type": "text",
            "name": "labels",
            "from": {
                "data": "table"
            },
            "encode": {
                "update": {
                    "radius": {
                        "signal": "scale('chbands', datum.category)"
                    },
                    "x": {
                        "signal": "width",
                        "mult": 0.5
                    },
                    "y": {
                        "signal": "height",
                        "mult": 0.5
                    },
                    "dx": {
                        "value": 0
                    },
                    "dy": {
                        "value": 0
                    },
                    "text": {
                        "signal": "isValid(datum['amount']) && datum['amount'] !== 0 ? datum['amount'] : ''"
                    },
                    "align": {
                        "value": "right"
                    },
                    "baseline": {
                        "value": "top"
                    },
                    "theta": {
                        "signal": "scale(\"theta\", 0.5 * datum[\"r0\"] + 0.5 * datum[\"r1\"])"
                    }
                }
            }
        }
    ],
    "width": 950,
    "height": 950
}

export { circularBarChart };