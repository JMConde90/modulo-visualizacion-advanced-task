import * as d3 from "d3";
import * as topojson from "topojson-client";
const d3Composite = require("d3-composite-projections");
const europejson = require("./europe.json");
const spainjson = require("./spain.json")
import {statsBase} from "./stats"
import {stats22Marzo} from "./stats"
import {latLongCommunities} from"./communities"
 //Se calcula el numero maxima de afectados de todas
//las comunidades
let maxAffected =   statsBase.reduce(
  (max,item) => (item.value > max ? item.value : max),0
);

// creo los circulos para mostrar


const affectedRadiusBasedScale = d3
  .scaleQuantile()
  .domain([0, maxAffected])
  .range([5,10,15,25,30,35,40]); //rango de valores a asiganr
                            //para el domino, hace tantas
                            //particiones como rangos se le
                            //indique

//Inicializo la variable al valor del caso base
const calculateRadiusBasedOnAffectedCases = (comunidad: string, currentStats: any[]) => {
  let size = 0;
  const entry = currentStats.find(item => item.name === comunidad); 
  
  console.log(maxAffected)
        if(entry) {
            size = affectedRadiusBasedScale(entry.value);
                                      
        }
                                                                        
  return size;
};
// Esacala de colores para el numero de afectados por comunidad 

var color = d3
  .scaleThreshold<number, string>()
  .domain([10,50,70,100,500,1700,2000,2100,5000,10000])
  .range([
    "#ff850a",
    "#ff8e1e",
    "#ff9832",
    "#ffa245",
    "##ffac59",
    "#ffb66c",
    "#ffc080",
    "#ffc994",
    "#ffd3a7",
    "#ffddbb",
    "#ffe7ce",
    "#fff1e2",
    "#fffaf6"    
  ]);

  
/*
 var color = d3
 .scaleThreshold<number, string>()
 .domain([10,50,70,100,500,1700,2000,2100,5000,10000])
 .range([
  "#fffaf6",  
  "#fff1e2",
  "#ffe7ce",
  "#ffddbb",
  "#ffd3a7",
  "#ffc994",
  "#ffc080",
  "#ffb66c",
  "##ffac59",
  "#ffa245",
  "#ff9832",
  "#ff8e1e",
  "#ff850a",   
 ]);
 */
  console.log(color)

//funcion para asignar colores a las comunidades
const assignRegionBackgroundColor = (RegionName: string, currentStats: any[]) => {
  const item = currentStats.find(
    item => item.name === RegionName
  );
  /*
  if (item) {
    console.log(item.value);
  }
  */
   //lo pongo el ternario por si hay fallo me devuelve color 0
  return item ? color(item.value) : color(0);
};



const svg = d3
  .select("body")
  .append("svg")
  .attr("width", 1024)
  .attr("height", 800)
  .attr("style", "background-color: #FBFAF0");
/*

*/
const aProjection = d3Composite
  .geoConicConformalSpain()
  // Let's make the map bigger to fit in our resolution
  .scale(3300)
  // Let's center the map
  .translate([500, 400]);

const geoPath = d3.geoPath().projection(aProjection);


const geojson = topojson.feature(
  spainjson,
  spainjson.objects.ESP_adm1
);



svg
  .selectAll("path")
  .data(geojson["features"])
  .enter()
  .append("path")
  .attr("class", "country") //defino los bordes de las comunidades
  .style("fill", function(d: any) {
   // console.log(d.properties.geounit);
    return assignRegionBackgroundColor(d.properties.NAME_1, statsBase);
  })
  // data loaded from json file
  .attr("d", geoPath as any);
  svg
  .selectAll("circle")
  .data(latLongCommunities)
  .enter()
  .append("circle")
  //fracciono la opacidad en los circulos para que se vea el fondo
  .attr("class", "affected-marker") 
  .attr("r", d => calculateRadiusBasedOnAffectedCases(d.name,statsBase))
  .attr("cx", d => aProjection([d.long, d.lat])[0])
  .attr("cy", d => aProjection([d.long, d.lat])[1])
//Actualizo los circulos 
  const updateCircles = (data: any[]) => {
    const circles = svg.selectAll("circle");
    circles
      .data(latLongCommunities)
      .merge(circles as any)
      .transition()
      .duration(500)
      .attr("r", d => calculateRadiusBasedOnAffectedCases(d.name, data));
  };
//Actualizo el color de las comunidades en funcion de los afectados
  const updateBackgroundCircles = (data: any[])=>{
    const pathCollection = svg.selectAll('path');
    pathCollection.data(geojson["features"])
                  .enter()
                  .merge(pathCollection as any)
                  .style("fill", function(d: any) {
                    console.log(d);
                    return assignRegionBackgroundColor(d.properties.NAME_1, data);
                  })
                  .attr("d", geoPath as any)
  }
   // Actualizo el valor e la variable maxAffected                          
 const calculateMaxAffected = (currentStats: any[]) =>{
  maxAffected = currentStats.reduce(
    (max,item) => (item.value > max ? item.value : max),0
  )
}
 
  document
  .getElementById("base")
  .addEventListener("click", function handleResultsBase() {
    updateBackgroundCircles(statsBase)
    calculateMaxAffected(statsBase);
    updateCircles (statsBase );
  });

  document
  .getElementById("22marzo")
  .addEventListener("click", function handleResults22Marzo() {
    updateCircles (stats22Marzo);
    calculateMaxAffected(stats22Marzo);
    updateBackgroundCircles(stats22Marzo)
  });