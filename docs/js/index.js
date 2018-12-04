(function () {

    let colors = {
        one: "#77FFFF",
        two: "#0DAAAA",
        three: "#0D4D4D"
    }
    let w = 700
    let h = 300
    let boundaries = {
        bottom: h - 90,
        top: 40,
        left: 70,
        right: w - 150
    }
    let innerPadding = 0.1

    let choroWidth = 800
    let choroHeight = 600

    //GENERAL VARIABLE INITIALIZATION
    let timelineWidth = 1000
    let timelineHeight = 150
    let timelineBoundaries = {
        bottom: timelineHeight - 60,
        top: 20,
        left: 60,
        right: timelineWidth - 20
    }

    let LAYERED_HIST_DATA, INCIDENTS_HIST_DATA, CHORO_COLOR_SCALE, NESTED_CHORO_DATA;
    let tooltipChoropleth = d3.select("#tooltipChoropleth").classed("hidden", true)
    let tooltipInjured = d3.select("#tooltipInjured").classed("hidden", true)
    let tooltipIncident = d3.select("#tooltipIncident").classed("hidden", true)

    let setPeriod = (start, end) => {
        let period = start.toISOString().substring(0, 10) + " to " + end.toISOString().substring(0, 10)
        d3.select("body").select("#period")
            .text(period)
    }

    let mouseOverChoro = (element, d) => {
        // Use mouse coordinates for tooltipChoropleth position
        let xPos = d3.event.pageX
        let yPos = d3.event.pageY

        //Update the tooltipChoropleth position
        tooltipChoropleth.style("left", xPos + "px").style("top", yPos + "px")

        let zipCode = d.properties.postalCode
        let borough = d.properties.borough
        let datapoint = NESTED_CHORO_DATA.find(x => x.key == d.properties.postalCode)
        let incidentCount = datapoint ? datapoint.value.zipIncidents : "No data"

        // Update the tooltipChoropleth information
        d3.select("#zipCode").text(zipCode)
        d3.select("#incidentCount").text(incidentCount)
        d3.select("#borough").text(borough)

        // Show the tooltipChoropleth
        tooltipChoropleth.classed("hidden", false)

        // Highlight the current element
        d3.select(element).style("stroke-width", "4")
    }

    let mouseOutChoro = element => {
        //Hide the tooltipChoropleth again
        tooltipChoropleth.classed("hidden", true)

        // Remove highlight from the element
        d3.select(element).style("stroke-width", "1")
    }

    let mouseOverInjuredHistogram = (element, d) => {
        let xPos = d3.event.pageX
        let yPos = d3.event.pageY

        //Update the tooltipChoropleth position
        tooltipInjured.style("left", xPos + "px").style("top", yPos + "px").classed("hidden", false)

        // Update the tooltipChoropleth information
        let timeInterval = d.key + "-" + (+d.key + 1)
        d3.select("#hourOfDayInjured").text(timeInterval)
        d3.select("#motorists").text(d.value.motorists)
        d3.select("#pedestrians").text(d.value.pedestrians)
        d3.select("#cyclists").text(d.value.cyclists)

        d3.select(element).attr("fill", "orange")
    }

    let mouseOutInjuredHistogram = element => {
        tooltipInjured.classed("hidden", true)
        let type = d3.select(element).attr("class")
        let color;
        if (type == "motorist") {
            color = colors.three
        } else if (type == "pedestrian") {
            color = colors.two
        } else if (type == "cyclist") {
            color = colors.one
        }
        d3.select(element).attr("fill", color)
    }

    let mouseOverIncidentHistogram = (element, d) => {
        let xPos = d3.event.pageX
        let yPos = d3.event.pageY

        //Update the tooltipChoropleth position
        tooltipIncident.style("left", xPos + "px").style("top", yPos + "px").classed("hidden", false)

        // Update the tooltipChoropleth information
        let timeInterval = d.key + "-" + (+d.key + 1)
        d3.select("#hourOfDayIncident").text(timeInterval)
        d3.select("#incidents").text(d.value.count)

        d3.select(element).attr("fill", "orange")
    }

    let mouseOutIncidentHistogram = element => {
        tooltipIncident.classed("hidden", true)
        d3.select(element).attr("fill", colors.three)
    }

    let histogramInjured = d3.select("body").select("#containerHistogram")
        .append("svg")
        .attr("width", w)
        .attr("height", h)

    let histogramIncidents = d3.select("body").select("#incidentCountBox")
        .append("svg")
        .attr("width", w)
        .attr("height", h)

    let histogramFactors = d3.select("body").select("#factorsBox")
        .append("svg")
        .attr("width", w)
        .attr("height", h)

    let svgTimeline = d3.select("#containerTimeline")
        .append("svg")
        .attr("width", timelineWidth)
        .attr("height", timelineHeight)

    let svgGeo = d3.select("#containerGeo")
        .append("svg")
        .attr("width", choroWidth)
        .attr("height", choroHeight)

    let makeFactorsHistogram = (factorsData) => {
        let yMax = d3.max(factorsData, d => d.value)

        // x Scale
        let xScale = d3.scaleBand()
            .domain(factorsData.map(d => d.key))
            .rangeRound([boundaries.left, boundaries.right])
            .paddingInner(innerPadding)

        let xAxis = d3.axisBottom(xScale)

        // y Scale
        let yScale = d3.scaleLinear()
            .domain([0, yMax])
            .range([boundaries.bottom, boundaries.top])

        let yAxis = d3.axisLeft(yScale).ticks(5)

        // Bars
        histogramFactors.selectAll(".factor")
            .data(factorsData)
            .enter()
            .append("rect").attr("class", "factor")
            .attr("x", d => xScale(d.key))
            .attr("y", d => yScale(d.value))
            .attr("width", xScale.bandwidth())
            .attr("height", d => boundaries.bottom - yScale(d.value))
            .attr("fill", colors.two)

        // Make x axis with a g-element
        histogramFactors.append("g")
            .attr("transform", "translate(0, " + (boundaries.bottom) + ")")
            .call(xAxis)
            .selectAll("text")

        // Make y axis with another g-element
        histogramFactors.append("g")
            .attr("id", "yAxis")
            .attr("transform", "translate(" + boundaries.left + ", 0)")
            .call(yAxis)

        // Text label for the Y axis
        histogramFactors.append("text")
            .attr("transform", "rotate(-90)")
            .style("text-anchor", "middle")
            .attr("y", boundaries.left / 2 - 20)
            .attr("x", -h / 2)
            .text("Incidents (2012-2018)")

        // Text label for the X axis
        histogramFactors.append("text")
            // .attr("transform", "rotate(-90)")
            .style("text-anchor", "middle")
            .attr("y", boundaries.top - 20)
            .attr("x", w / 2)
            .text("Frequently Reported Causes for Motor Vehicle Incidents (2012-2018)")
    }

    let plotIncidentHistogram = histogramData => {
        let yMax = d3.max(histogramData, d => d.value.count)
        console.log("y max: " + yMax)
        // x Scale
        let xScale = d3.scaleBand()
            .domain(histogramData.map(d => d.key))
            .rangeRound([boundaries.left, boundaries.right])
            .paddingInner(innerPadding)

        let xAxis = d3.axisBottom(xScale)

        // y Scale
        let yScale = d3.scaleLinear()
            .domain([0, yMax])
            .range([boundaries.bottom, boundaries.top])

        let yAxis = d3.axisLeft(yScale).ticks(5)

        // Bars
        histogramIncidents.selectAll(".incident")
            .data(histogramData)
            .enter()
            .append("rect").attr("class", "incident")
            .attr("x", d => xScale(d.key))
            .attr("y", d => yScale(d.value.count))
            .attr("width", xScale.bandwidth())
            .attr("height", d => boundaries.bottom - yScale(d.value.count))
            .attr("fill", colors.three)
            .on("mouseover", function (d) {
                mouseOverIncidentHistogram(this, d)
            })
            .on("mouseout", function () {
                mouseOutIncidentHistogram(this)
            })

        // Make x axis with a g-element
        histogramIncidents.append("g")
            .attr("transform", "translate(0, " + (boundaries.bottom) + ")")
            .call(xAxis)

        // Make y axis with another g-element
        histogramIncidents.append("g")
            .attr("id", "yAxis")
            .attr("transform", "translate(" + boundaries.left + ", 0)")
            .call(yAxis)

        // Text label for the Y axis
        histogramIncidents.append("text")
            .attr("transform", "rotate(-90)")
            .style("text-anchor", "middle")
            .attr("y", boundaries.left / 2 - 20)
            .attr("x", -boundaries.bottom / 1.7)
            .text("Incidents")

        // Text label for the X axis
        histogramIncidents.append("text")
            // .attr("transform", "rotate(-90)")
            .style("text-anchor", "middle")
            .attr("y", boundaries.bottom + 40)
            .attr("x", w / 2)
            .text("Hour of the Day")

        histogramIncidents.append("text")
            // .attr("transform", "rotate(-90)")
            .style("text-anchor", "middle")
            .attr("y", boundaries.top - 20)
            .attr("x", w / 2)
            .text("Number of Reported Incidents for the Period")
    }

    let drawInjuredHistogram = (histogramData) => {
        let pMax = d3.max(histogramData, d => d.value.pedestrians)
        let cMax = d3.max(histogramData, d => d.value.cyclists)
        let mMax = d3.max(histogramData, d => d.value.motorists)
        let yMax = d3.max([pMax, cMax, mMax])

        // x Scale
        let xScale = d3.scaleBand()
            .domain(histogramData.map(d => d.key))
            .rangeRound([boundaries.left, boundaries.right])
            .paddingInner(innerPadding)

        let xAxis = d3.axisBottom(xScale)

        // y Scale
        let yScale = d3.scaleLinear()
            .domain([0, yMax])
            .range([boundaries.bottom, boundaries.top])

        let yAxis = d3.axisLeft(yScale).ticks(5)

        // Bars
        histogramInjured.selectAll(".motorist")
            .data(histogramData)
            .enter()
            .append("rect").attr("class", "motorist")
            .attr("x", d => xScale(d.key))
            .attr("y", d => yScale(d.value.motorists))
            .attr("width", xScale.bandwidth())
            .attr("height", d => boundaries.bottom - yScale(d.value.motorists))
            .attr("fill", colors.three)
            .on("mouseover", function (d) {
                mouseOverInjuredHistogram(this, d)
            })
            .on("mouseout", function () {
                mouseOutInjuredHistogram(this)
            })

        histogramInjured.selectAll(".pedestrian")
            .data(histogramData)
            .enter()
            .append("rect").attr("class", "pedestrian")
            .attr("x", d => xScale(d.key) + xScale.bandwidth() / 4)
            .attr("y", d => yScale(d.value.pedestrians))
            .attr("width", xScale.bandwidth() / 2)
            .attr("height", d => boundaries.bottom - yScale(d.value.pedestrians))
            .attr("fill", colors.two)
            .on("mouseover", function (d) {
                mouseOverInjuredHistogram(this, d)
            })
            .on("mouseout", function () {
                mouseOutInjuredHistogram(this)
            })

        histogramInjured.selectAll(".cyclist")
            .data(histogramData)
            .enter()
            .append("rect").attr("class", "cyclist")
            .attr("x", d => xScale(d.key) + (xScale.bandwidth() / 2.6))
            .attr("y", d => yScale(d.value.cyclists))
            .attr("width", xScale.bandwidth() / 4)
            .attr("height", d => boundaries.bottom - yScale(d.value.cyclists))
            .attr("fill", colors.one)
            .on("mouseover", function (d) {
                mouseOverInjuredHistogram(this, d)
            })
            .on("mouseout", function () {
                mouseOutInjuredHistogram(this)
            })

        // Make x axis with a g-element
        histogramInjured.append("g")
            .attr("transform", "translate(0, " + (boundaries.bottom) + ")")
            .call(xAxis)

        // Make y axis with another g-element
        histogramInjured.append("g")
            .attr("id", "yAxis")
            .attr("transform", "translate(" + boundaries.left + ", 0)")
            .call(yAxis)

        // Text label for the Y axis
        histogramInjured.append("text")
            .attr("transform", "rotate(-90)")
            .style("text-anchor", "middle")
            .attr("y", boundaries.left / 2 - 20)
            .attr("x", -h / 2.5)
            .text("Injured or Killed")

        // Text label for the X axis
        histogramInjured.append("text")
            // .attr("transform", "rotate(-90)")
            .style("text-anchor", "middle")
            .attr("y", boundaries.bottom + 40)
            .attr("x", w / 2)
            .text("Hour of the Day")

        let rectSize = 20


        let legendInfo = [{
                title: "Motorists",
                color: colors.three
            },

            {
                title: "Pedestrians",
                color: colors.two
            },
            {
                title: "Cyclists",
                color: colors.one
            },
        ]

        let legend = histogramInjured.append("g")
            .attr("transform", (d, i) => ("translate(0," + 0.2 * h + ")"))
            .attr("font-family", "sans-serif")
            .attr("font-size", 14)
            .attr("text-anchor", "end")
            .selectAll("g")
            .data(legendInfo)
            .enter()
            .append("g")
            .attr("transform", (d, i) => ("translate(" + 0 + "," + i * 1.05 * rectSize + ")"))

        legend.append("rect")
            .attr("x", boundaries.right + 90)
            .attr("width", rectSize)
            .attr("height", rectSize)
            .attr("fill", d => d.color)
            .on("mouseover", function (d) {
                let selector = "none"

                if (d.title == "Pedestrians") {
                    selector = ".pedestrian"
                } else if (d.title == "Cyclists") {
                    selector = ".cyclist"
                } else if (d.title == "Motorists") {
                    selector = ".motorist"
                }
                histogramInjured.selectAll(selector)
                    .attr("fill", "orange")

            })
            .on("mouseout", function (d) {
                if (d.title == "Pedestrians") {
                    histogramInjured.selectAll(".pedestrian")
                        .attr("fill", colors.two)
                } else if (d.title == "Motorists") {
                    histogramInjured.selectAll(".motorist")
                        .attr("fill", colors.three)
                } else if (d.title == "Cyclists") {
                    histogramInjured.selectAll(".cyclist")
                        .attr("fill", colors.one)
                }

            })

        legend.append("text")
            .attr("x", boundaries.right + 80)
            .style("text-anchor", "end")
            .attr("y", rectSize / 2)
            .attr("dy", "0.32em")
            .text(d => d.title)

        // Text label for the X axis
        histogramInjured.append("text")
            // .attr("transform", "rotate(-90)")
            .style("text-anchor", "middle")
            .attr("y", boundaries.top - 20)
            .attr("x", w / 2)
            .text("Reported Injured/Killed People as Result of an Incident")
    }

    let parseInjuredRow = row => ({
        "hour": row.hour,
        "ymDate": new Date(20 + row.ym.slice(0, 2), +row.ym.slice(3, 5) - 1),
        "total_injured": +row.total_injured,
        "total_killed": +row.total_killed,
        "pedestrians_injured": +row.pedestrians_injured,
        "pedestrians_killed": +row.pedestrians_killed,
        "cyclists_injured": +row.cyclists_injured,
        "cyclists_killed": +row.cyclists_killed,
        "motorists_injured": +row.motorists_injured,
        "motorists_killed": +row.motorists_killed
    })

    let parseIncidentRow = row => ({
        "hour": row.hour,
        "ymDate": new Date(row.ym),
        "count": +row.count
    })

    // _____ READ DATA FILES ________

    d3.json("data/data_factors.json", factorsData => {
        makeFactorsHistogram(factorsData)
    })

    d3.csv("data/data_incident_histogram.csv", parseIncidentRow, data => {
        INCIDENTS_HIST_DATA = data

        let nested = d3.nest()
            .key(d => d.hour)
            .sortKeys((a, b) => a - b)
            .rollup(leaves => ({
                "count": d3.sum(leaves, d => d.count)
            }))
            .entries(data)

        plotIncidentHistogram(nested)
    })

    d3.csv("data/data_injured_histogram.csv", parseInjuredRow, data => {
        LAYERED_HIST_DATA = data

        let nested = d3.nest()
            .key(d => d.hour)
            .sortKeys((a, b) => a - b) // Sort the hour key numerically, instead of lexicographically
            .rollup(leaves => ({
                "pedestrians": d3.sum(leaves, d => d.pedestrians_injured + d.pedestrians_killed),
                "cyclists": d3.sum(leaves, d => d.cyclists_injured + d.cyclists_killed),
                "motorists": d3.sum(leaves, d => d.motorists_injured + d.motorists_killed)
            }))
            .entries(data)

        drawInjuredHistogram(nested)
    })


    // _____________CHOROPLETH________________

    //Load in GeoJSON data
    d3.json("data/zipcodes.geojson", (error, json) => {
        if (error) {
            console.log("error fetching data")
        }

        // Create projection
        let offset = [choroWidth / 2, choroHeight / 2] //Center projection in the middle of SVG
        let scale = 70 * 1000
        let center = d3.geoCentroid(json)
        let projection = d3.geoMercator()
            .scale(scale) // scaling is changed later with scaling factor s
            .center(center)
            .translate(offset)

        // Define path generator and calculate scaling factor, s
        let path = d3.geoPath()
            .projection(projection)

        let bounds = path.bounds(json)
        let boundWidth = (bounds[1][0] - bounds[0][0]) / choroWidth
        let boundHeight = (bounds[1][1] - bounds[0][1]) / choroHeight
        let s = .85 / Math.max(boundWidth, boundHeight)
        projection.scale(s * scale)

        // ______Loading collision data______
        let rowConverterCollisions = d => ({
            ym: +d.ym.slice(0, 2) + d.ym.slice(3, 5), // Removing '-' and parseInt
            ymDate: new Date(20 + d.ym.slice(0, 2), +d.ym.slice(3, 5) - 1), // Needed for filtering after brushing
            zip: +d.zip_code,
            incidentCount: +d.incident_count // Total number of registered collisions for ym
        })

        d3.csv("data/data_timeline.csv", rowConverterCollisions, collisionData => {

            // Nest collisionData on ym summing up number of incidents - needed for timeline
            let nestData = d3.nest()
                .key(d => d.ym)
                .sortKeys(d3.ascending)
                .rollup(leaves => ({
                    "ymIncidents": d3.sum(leaves, d => d.incidentCount)
                }))
                .entries(collisionData)

            // Nest collisionData on zip code summing up number of incidents - needed for choropleth coloring
            NESTED_CHORO_DATA = d3.nest()
                .key(d => d.zip)
                .rollup(leaves => ({
                    "zipIncidents": d3.sum(leaves, d => d.incidentCount)
                }))
                .entries(collisionData)

            // _____Timeline_________

            // Timeline x-scale
            let xMinTimeline = d3.min(collisionData, d => d.ymDate) //Perhaps compute in advance?
            let xMaxTimeline = d3.max(collisionData, d => d.ymDate) //Perhaps compute in advance?

            setPeriod(xMinTimeline, xMaxTimeline)

            let xScaleTimeline = d3.scaleTime()
                .domain([xMinTimeline, xMaxTimeline])
                .range([timelineBoundaries.left, timelineBoundaries.right])

            // Timeline y-scale
            let yMinTimeline = 0
            let yMaxTimeline = d3.max(nestData, d => d.value.ymIncidents)
            let yScaleTimeline = d3.scaleLinear()
                .domain([yMinTimeline, yMaxTimeline])
                .range([timelineBoundaries.bottom, timelineBoundaries.top])


            // Draw timeline
            let area = d3.area()
                .x(d => xScaleTimeline(new Date(20 + d.key.slice(0, 2), parseInt(d.key.slice(2, 4)) - 1)))
                .y0(d => yScaleTimeline.range()[0])
                .y1(d => yScaleTimeline(d.value.ymIncidents))

            let timelinePath = svgTimeline.append("path")
                .datum(nestData)
                .attr("class", "area")
                .attr("fill", colors.three)
                .attr("d", area)

            //Timeline axes
            let xAxis = d3.axisBottom()

            xAxis.scale(xScaleTimeline)

            svgTimeline.append("g")
                .attr("transform", "translate(" + 0 + "," + timelineBoundaries.bottom + ")")
                .attr("class", "axis")
                .call(xAxis)

            let yAxis = d3.axisLeft().ticks(3)

            yAxis.scale(yScaleTimeline)

            svgTimeline.append("g")
                .attr("transform", "translate(" + timelineBoundaries.left + "," + 0 + ")")
                .attr("class", "axis")
                .call(yAxis)

            // Choropleth function definitions

            // Prepare paths variable
            let paths = svgGeo.selectAll("path")
                .data(json.features)
                .enter()
                .append("path")
                .attr("d", path)
                .on("mouseover", function (d) {
                    mouseOverChoro(this, d)
                })
                .on("mouseout", function () {
                    mouseOutChoro(this)
                })

            let initChoropleth = () => {
                // Color scale for coloring zip codes
                CHORO_COLOR_SCALE = d3.scaleLinear()
                    .domain([0, yMaxTimeline])
                    .range(['white', colors.three])

                // set styling of zip codes
                paths.style("fill", (d, i) => {
                        let datapoint = NESTED_CHORO_DATA.find(x => x.key == d.properties.postalCode)
                        return datapoint ? CHORO_COLOR_SCALE(datapoint.value.zipIncidents) : "white"
                    })
                    .style("stroke", "black")

                let quantiles = [
                    0,
                    0.2 * yMaxTimeline,
                    0.4 * yMaxTimeline,
                    0.6 * yMaxTimeline,
                    0.8 * yMaxTimeline,
                    yMaxTimeline,
                ]

                let rectSize = 20

                let legend = svgGeo.append("g").attr("id", "choroLegend")
                    .attr("transform", (d, i) => ("translate(0," + 0.2 * h + ")"))
                    .attr("font-family", "sans-serif")
                    .attr("font-size", 14)
                    .attr("text-anchor", "end")
                    .selectAll("g")
                    .data(quantiles)
                    .enter()
                    .append("g")
                    .attr("transform", (d, i) => ("translate(" + 0 + "," + i * 1.05 * rectSize + ")"))

                legend.append("rect").attr("class", "choroLegendRect")
                    .attr("x", choroWidth - 175)
                    .attr("width", rectSize)
                    .attr("height", rectSize)
                    .attr("fill", d => CHORO_COLOR_SCALE(d))
                    .attr("stroke", "black")
                    .attr("stroke-width", "0.2")

                legend.append("text").attr("class", "choroLegendText")
                    .attr("x", choroWidth - 150)
                    .style("text-anchor", "start")
                    .attr("y", rectSize / 2)
                    .attr("dy", "0.32em")
                    .text(d => parseInt(d)  + " incidents")
                // console.log(quantiles)

            }

            initChoropleth()

            let updateChoropleth = () => {
                if (!d3.event.selection) {
                    return
                }

                // Reverse engineer the time interval based on brush coordinates
                let startInterval = xScaleTimeline.invert(d3.event.selection[0])
                let endInterval = xScaleTimeline.invert(d3.event.selection[1])

                setPeriod(startInterval, endInterval)
                // Get collisionData in selected time interval
                let tempDataChoro = collisionData.filter(d => (d.ymDate >= startInterval) && (d.ymDate <= endInterval))

                // Nest tempDataChoro on zip code
                NESTED_CHORO_DATA = d3.nest()
                    .key(d => d.zip)
                    .rollup(leaves => ({
                        "zipIncidents": d3.sum(leaves, d => d.incidentCount)
                    }))
                    .entries(tempDataChoro)

                // Dynamic color scale
                let choroMax = d3.max(NESTED_CHORO_DATA, d => d.value.zipIncidents)

                let quantiles = [
                    0,
                    0.2 * choroMax,
                    0.4 * choroMax,
                    0.6 * choroMax,
                    0.8 * choroMax,
                    choroMax,
                ]

                let legend = svgGeo.select("#choroLegend").selectAll("g")

                legend.data(quantiles)

                // console.log(legend)
                legend.select(".choroLegendText").data() // It doesnt work without this line of code for some reason

                legend.selectAll(".choroLegendText").text(d => parseInt(d) + " incidents")

                // console.log(legend.select(".choroLegendText").data())
                // legend.selectAll("g")
                //     .enter()
                //     .selectAll(".choroLegendText")
                //     .text(d => parseInt(d))

                console.log()

                // legend.append("rect").attr("class", "choroLegendRect")
                //     .attr("x", choroWidth - 175)
                //     .attr("width", rectSize)
                //     .attr("height", rectSize)
                //     .attr("fill", d => CHORO_COLOR_SCALE(d))
                //     .attr("stroke", "black")
                //     .attr("stroke-width", "0.2")

                // legend.append("text").attr("class", "choroLegendText")
                //     .attr("x", choroWidth - 140)
                //     .style("text-anchor", "start")
                //     .attr("y", rectSize / 2)
                //     .attr("dy", "0.32em")
                //     .text(d => parseInt(d))


                CHORO_COLOR_SCALE.domain([0, choroMax])


                // Update choropleth colors
                paths.style("fill", (d, i) => {
                        let datapoint = NESTED_CHORO_DATA.find(x => x.key == d.properties.postalCode)
                        return datapoint ? CHORO_COLOR_SCALE(datapoint.value.zipIncidents) : "white"
                    })
                    .style("stroke", "black")
                
            }

            let redrawLayeredHistogram = (histogramData) => {
                let pMax = d3.max(histogramData, d => d.value.pedestrians)
                let cMax = d3.max(histogramData, d => d.value.cyclists)
                let mMax = d3.max(histogramData, d => d.value.motorists)
                let yMax = d3.max([pMax, cMax, mMax])

                // x Scale
                let xScale = d3.scaleBand()
                    .domain(histogramData.map(d => d.key))
                    .rangeRound([boundaries.left, boundaries.right])
                    .paddingInner(innerPadding)

                let xAxis = d3.axisBottom(xScale)

                // y Scale
                let yScale = d3.scaleLinear()
                    .domain([0, yMax])
                    .range([boundaries.bottom, boundaries.top])

                let yAxis = d3.axisLeft(yScale).ticks(5)

                // Bars
                histogramInjured.selectAll(".motorist")
                    .data(histogramData)
                    .transition()
                    .attr("x", d => xScale(d.key))
                    .attr("y", d => yScale(d.value.motorists))
                    .attr("width", xScale.bandwidth())
                    .attr("height", d => boundaries.bottom - yScale(d.value.motorists))

                histogramInjured.selectAll(".pedestrian")
                    .data(histogramData)
                    .transition()
                    .attr("x", d => xScale(d.key) + xScale.bandwidth() / 4)
                    .attr("y", d => yScale(d.value.pedestrians))
                    .attr("width", xScale.bandwidth() / 2)
                    .attr("height", d => boundaries.bottom - yScale(d.value.pedestrians))

                histogramInjured.selectAll(".cyclist")
                    .data(histogramData)
                    .transition()
                    .attr("x", d => xScale(d.key) + (xScale.bandwidth() / 2.6))
                    .attr("y", d => yScale(d.value.cyclists))
                    .attr("width", xScale.bandwidth() / 4)
                    .attr("height", d => boundaries.bottom - yScale(d.value.cyclists))

                // Make y axis with another g-element
                histogramInjured.select("#yAxis")
                    .transition()
                    .call(yAxis)
            }

            let updateLayeredHistogram = () => {
                if (!d3.event.selection) {
                    return
                }

                // Reverse engineer the time interval based on brush coordinates
                let startInterval = xScaleTimeline.invert(d3.event.selection[0])
                let endInterval = xScaleTimeline.invert(d3.event.selection[1])

                // filter out non-selected points
                let filteredData = LAYERED_HIST_DATA.filter(d => (d.ymDate >= startInterval) && (d.ymDate <= endInterval))


                let nested = d3.nest()
                    .key(d => d.hour)
                    .sortKeys((a, b) => a - b) // Sort the hour key numerically, instead of lexicographically
                    .rollup(leaves => ({
                        "pedestrians": d3.sum(leaves, d => d.pedestrians_injured + d.pedestrians_killed),
                        "cyclists": d3.sum(leaves, d => d.cyclists_injured + d.cyclists_killed),
                        "motorists": d3.sum(leaves, d => d.motorists_injured + d.motorists_killed)
                    }))
                    .entries(filteredData)

                redrawLayeredHistogram(nested)

            }

            let redrawIncidentHistogram = (histogramData) => {
                let yMax = d3.max(histogramData, d => d.value.count)

                // x Scale
                let xScale = d3.scaleBand()
                    .domain(histogramData.map(d => d.key))
                    .rangeRound([boundaries.left, boundaries.right])
                    .paddingInner(innerPadding)

                let xAxis = d3.axisBottom(xScale)

                // y Scale
                let yScale = d3.scaleLinear()
                    .domain([0, yMax])
                    .range([boundaries.bottom, boundaries.top])

                let yAxis = d3.axisLeft(yScale).ticks(5)

                // Bars
                histogramIncidents.selectAll(".incident")
                    .data(histogramData)
                    .transition()
                    .attr("x", d => xScale(d.key))
                    .attr("y", d => yScale(d.value.count))
                    .attr("width", xScale.bandwidth())
                    .attr("height", d => boundaries.bottom - yScale(d.value.count))

                // Make y axis with another g-element
                histogramIncidents.select("#yAxis")
                    .transition()
                    .call(yAxis)
            }

            let updateIncidentHistogram = () => {
                if (!d3.event.selection) {
                    return
                }

                // Reverse engineer the time interval based on brush coordinates
                let startInterval = xScaleTimeline.invert(d3.event.selection[0])
                let endInterval = xScaleTimeline.invert(d3.event.selection[1])

                // filter out non-selected points
                let filteredData = INCIDENTS_HIST_DATA.filter(d => (d.ymDate >= startInterval) && (d.ymDate <= endInterval))

                // console.log(filteredData)
                let nested = d3.nest()
                    .key(d => d.hour)
                    .sortKeys((a, b) => a - b)
                    .rollup(leaves => ({
                        "count": d3.sum(leaves, d => d.count)
                    }))
                    .entries(filteredData)


                redrawIncidentHistogram(nested)

            }

            //Create brush
            let brush = d3.brushX()
                .extent([
                    [timelineBoundaries.left, 0],
                    [timelineBoundaries.right, timelineBoundaries.bottom]
                ])
                .on("end", function () {
                    updateChoropleth()
                    updateLayeredHistogram()
                    updateIncidentHistogram()
                })


            svgTimeline.append("g")
                .call(brush)

        }) //End of d3.csv for collision data
    }) //End of D3.csv for geodata
})() //End of anonymous function call