function annular(data, info){

  $("#info").show();
  $("#backToSankey").show();

  var width = document.getElementById("mainview").offsetWidth;
  var height = document.getElementById("mainview").offsetHeight-10;

  document.getElementById("sankey").style.display = "none";
  if(document.getElementById("annular") != null)
    document.getElementById("annular").remove();

  var svg = d3.select("#mainview").append("svg").attr("width", width).attr("height", height).attr("id", "annular");
  var g = svg.append("g").attr("transform","translate("+width/3+",25)");

  var bp=viz2.bP()
      .data(prepareData(data))
  		.min(12)
  		.pad(5)
  		.height(height-50)
      .width(width/3)
  		.barSize(35)
      .duration(500)
      .edgeOpacity(.5)
      .fill(function(d){
        return (d.part == "primary") ? "#8f7ab8" : "#46b477";
      });

  g.call(bp);





  g.selectAll(".mainBars")
    .on("mousemove",function(d){ updateToolTip(d3.event, d.key, format(d.value)) })
  	.on("mouseover",mouseover)
  	.on("mouseout",mouseout)
    .on("dblclick", invokeTableSelection)
    // .on("dblclick", invokeTableSelectiondbl)

  g.selectAll(".mainBars").append("text").attr("class","label")
  	.attr("x",d=>(d.part=="primary"? -30:30)) //10:-10
  	.attr("y",d=>+4) //-d.height-6
  	.text(label)
    .style("font-weight", labelWeight) //"bold"
    .style("fill", labelColor)
  	.attr("text-anchor",d=>(d.part=="primary"? "end": "start"))
    // .on("mousemove",function(d){ updateToolTip(d3.event, d.key, format(d.value)) });

  g.selectAll(".edges")
  	.on("mousemove", mousemoveEdge)
  	.on("mouseout",mouseoutEdge)

  function label(d){
    return d.key.trunc(width/4);//(d.key.indexOf("#")!=-1) ? ">>>CLUSTER "+d.key.split('#')[0]+"<<<" : d.key+" : "+format(d.value)
  }

  function labelColor(d){
    return bp.fill()(d);
  }

  function labelWeight(d){
    return "bold";//(d.key.indexOf("#")!=-1) ? "bold" : "normal";
  }

  function mousemoveEdge(d){
    g.selectAll(".edges")
      .style("fill-opacity", 0.05);
    this.style.fillOpacity = bp.edgeOpacity();
    updateToolTip(d3.event, d.primary+" \u2192 "+d.secondary, format(d.value)+" / "+format((100*d.value)/d.percent));
  }
  function mouseoutEdge(d){
    g.selectAll(".edges")
      .style("fill-opacity", bp.edgeOpacity());
    $("#tooltip").hide();
  }

  function mouseover(d){
    g.selectAll(".edges")
      .style("fill-opacity", function(e){
        if(d.part == "primary")
          return (e.primary == d.key) ? bp.edgeOpacity() : 0.05;
        else
          return (e.secondary == d.key) ? bp.edgeOpacity() : 0.05;
      });
  	// bp.mouseover(d);
  }
  function mouseout(d){
    // bp.mouseout(d);
    g.selectAll(".edges")
      .style("fill-opacity", bp.edgeOpacity());
    $("#tooltip").hide();
  }

  function invokeTableSelection(d){
    if(d.key.startsWith("Sonstige")) return;

    if(d.part == "primary"){
      mediumDim.filterAll();
      rechtstraegerDim.filter(d.key);
      var data = mediumDim.group().reduceSum(function(d){ return d.EURO; }).top(Infinity);
      data = data.filter(function(d){ return d.value >= 1; });
      updateAll();

      var row = rechtstraegerTable.row("#"+d.key.replace(/[()., ]/g,"")).data();
      var info = {name: row[0], sum: format(row[1]), type: "Rechtsträger"};
      annularchart = annular(data, info);

      rechtstraegerTable.row("#"+row[0].replace(/[()., ]/g,"")).scrollTo();
      setTimeout(function(){ rechtstraegerTable.row("#"+row[0].replace(/[()., ]/g,"")).select(); }, delay);
    }
    else{
      rechtstraegerDim.filterAll();
      mediumDim.filter(d.key);
      var data = rechtstraegerDim.group().reduceSum(function(d){ return d.EURO; }).top(Infinity);
      data = data.filter(function(d){ return d.value >= 1; });
      updateAll();

      var row = mediumTable.row("#"+d.key.replace(/[()., ]/g,"")).data();
      var info = {name: row[0], sum: format(row[1]), type: "Medium"};
      annularchart = annular(data, info);

      mediumTable.row("#"+row[0].replace(/[()., ]/g,"")).scrollTo();
      setTimeout(function(){ mediumTable.row("#"+row[0].replace(/[()., ]/g,"")).select(); }, delay);
    }
  }

  // function invokeTableSelection(d){
  //   setTimeout(function(f){
  //     if (alreadyclicked) return;
  //
  //     if(d.part == "primary" && !selectedRechtstraeger.some(e=>e==d.key))
  //       $("#tableOrganisations").find("tbody tr:eq("+rechtstraegerTable.rows("#"+d.key.replace(/['"()\\]/g, ""))[0][0]+")").trigger("click");
  //     else if(d.part == "secondary" && !selectedMedien.some(e=>e==d.key))
  //       $("#tableMedia").find("tbody tr:eq("+mediumTable.rows("#"+d.key.replace(/['"()\\]/g, ""))[0][0]+")").trigger("click");
  //     $("#tooltip").hide();
  //
  //   }, 300)
  // }
  //
  // function invokeTableSelectiondbl(d){
  //   if(d.key.startsWith("Sonstige")) return;
  //   spinner.spin(document.getElementById("mainview"));
  //   alreadyclicked = true;
  //
  //   if(d.part == "primary")
  //     $("#tableOrganisations").find("tbody tr:eq("+rechtstraegerTable.rows("#"+d.key.replace(/['"()\\]/g, ""))[0][0]+")").trigger("dblclick");
  //   else if(d.part == "secondary")
  //     $("#tableMedia").find("tbody tr:eq("+mediumTable.rows("#"+d.key.replace(/['"()\\]/g, ""))[0][0]+")").trigger("dblclick");
  //   $("#tooltip").hide();
  //
  //   alreadyclicked = false;
  // }






  function prepareData(data){
    // console.log("prepare",data)
    // console.log("info",info)
    var topRechtstraeger = d3.set();
    var topMedien = d3.set();
    var height = document.getElementById("mainview").offsetHeight;
    var totalSum = xf.groupAll().reduceSum(function(d){ return d.EURO }).value();

    // data.forEach(function(d,i){
    //   console.log("name", d.key, "size", d.value)
    // });

    selectedRechtstraeger = [];
    selectedMedien = [];

    if(info.type == "Rechtsträger")
      selectedRechtstraeger.push(info.name);
    else
      selectedMedien.push(info.name);


    // console.log("selectedRechtstraeger",selectedRechtstraeger)
    // console.log("selectedMedien",selectedMedien)

    topR = rechtstraegerDim.group().reduceSum(function(d){ return d.EURO }).top(Infinity);
    for(i=0;i<topR.length;i++){
      if(getHeight(topR[i].value) > 12){
        if(selectedRechtstraeger.length == 0 || selectedRechtstraeger.some(d=>d==topR[i].key))
          topRechtstraeger.add(topR[i].key);
      }
      else
        break;
    }

    topM = mediumDim.group().reduceSum(function(d){ return d.EURO }).top(Infinity);
    // console.log(topM)
    for(i=0;i<topM.length;i++){
      if(getHeight(topM[i].value) > 12){
        if(selectedMedien.length == 0 || selectedMedien.some(d=>d==topM[i].key))
          topMedien.add(topM[i].key);
      }
      else
        break;
    }

    // console.log("topRechtstraeger",topRechtstraeger)
    // console.log("topMedien",topMedien)

    returnData = [];
    // data = data.filter(function(d){
    //   var a=true,b=true;
    //   if(selectedRechtstraeger.length != 0)
    //     a = selectedRechtstraeger.some(f=>f==d.RECHTSTRAEGER);
    //   if(selectedMedien.length != 0)
    //     b = selectedMedien.some(f=>f==d.MEDIUM_MEDIENINHABER);
    //   return (a&&b)
    // });

    if(info.type == "Rechtsträger"){
      data.forEach(function(d){
        // r = topRechtstraeger.has(d.RECHTSTRAEGER) ? d.RECHTSTRAEGER : "Sonstige Rechtsträger";
        m = topMedien.has(d.key) ? d.key : "Sonstige Medien";
        returnData.push([info.name,m,d.value]);
      })
    }

    else{
      data.forEach(function(d){
        r = topRechtstraeger.has(d.key) ? d.key : "Sonstige Rechtsträger";
        // m = topMedien.has(d.MEDIUM_MEDIENINHABER) ? d.MEDIUM_MEDIENINHABER : "Sonstige Medien";
        returnData.push([r,info.name,d.value]);
      })
    }


    // data.forEach(function(d){
    //   r = topRechtstraeger.has(d.RECHTSTRAEGER) ? d.RECHTSTRAEGER : "Sonstige Rechtsträger";
    //   m = topMedien.has(d.MEDIUM_MEDIENINHABER) ? d.MEDIUM_MEDIENINHABER : "Sonstige Medien";
    //   returnData.push([r,m,d.value]);
    // })
    // console.log("returnData",returnData)
    return returnData
    function getHeight(s){
      return (height*s)/totalSum;
    }
  }

  function getInfo(){
    return info;
  }

  function chart() {
    getInfo()
  }
  chart.getInfo = getInfo;

  return chart;

}
