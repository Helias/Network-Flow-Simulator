var nodes, edges, network, max_flow = 0, paths = [], steps = [], step = false;
var edges_ref = {};

// convenience method to stringify a JSON object
// function toJSON(obj) {
//   return JSON.stringify(obj, null, 4);
// }

$(document).ready(function() {

  if ($("#stepbystep").is(':checked')) {
    $("#back").show();
    $("#next").show();
    step = true;
  }
  else {
    $("#back").hide();
    $("#next").hide();
  }

  draw();
  paths = get_edges("s", "t");
});

function ifStep() {
  step = !step;

  $("#back").toggle();
  $("#next").toggle();
}

function draw() {
  // create an array with nodes
  nodes = new vis.DataSet();

  nodes.add([
    { id: 's', label: 'S' /*, color: { background: "#54b4eb" }, font: { color: "#fff" }*/ },
    { id: 'a', label: 'A'},
    { id: 'b', label: 'B'},
    { id: 'c', label: 'C'},
    { id: 'd', label: 'D'},
    { id: 't', label: 'T'},
    // { id: 'x', label: 'X'},
  ]);

  // create an array with edges
  edges = new vis.DataSet();

  edges.add([
    { id: "0", from:"s", to:"a", arrows: "to", capacity:20, fill_capacity:0, label:"0/20", visited:false },
    { id: "1", from:"s", to:"c", arrows: "to", capacity:30, fill_capacity:0, label:"0/30", visited:false },
    { id: "2", from:"a", to:"b", arrows: "to", capacity:10, fill_capacity:0, label:"0/10", visited:false },
    { id: "3", from:"a", to:"d", arrows: "to", capacity:20, fill_capacity:0, label:"0/20", visited:false },
    { id: "4", from:"b", to:"t", arrows: "to", capacity:15, fill_capacity:0, label:"0/15", visited:false },
    { id: "5", from:"c", to:"b", arrows: "to", capacity:20, fill_capacity:0, label:"0/20", visited:false },
    { id: "6", from:"d", to:"t", arrows: "to", capacity:30, fill_capacity:0, label:"0/30", visited:false },
    // { id: "7", from:"c", to:"x", arrows: "to", flow:0, capacity:30, fill_capacity:0, c:30, label:"0/30", visited:false },
    // { id: "8", from:"x", to:"t", arrows: "to", flow:0, capacity:30, fill_capacity:0, c:30, label:"0/30", visited:false }
  ]);

  // console.log(edges._data);

  // create a network
  var container = document.getElementById('network');
  var data = {
    nodes: nodes,
    edges: edges
  };
  var options = {};
  network = new vis.Network(container, data, options);

}

// dfs recursive
function get_path(input) {
  var res = "";

  if (edges_ref[input].to != null) {

    if (edges_ref[input].to.length > 1) {

      var multi = [];

      for (var i in edges_ref[input].to) {

        res = get_path(edges_ref[input].to[i]); // s -> a

        if (Array.isArray(res))
          for (let j in res)
            multi.push(edges_ref[input].to[i] + "," + res[j]);
        else
          multi.push(edges_ref[input].to[i] + "," + res);

      }

      return multi;
    }
    else {
      res = get_path(edges_ref[input].to[0]);

      if (res == "")
        return edges_ref[input].to[0]; // b

      return edges_ref[input].to[0] + "," + res;
    }
  }
  else
    return "";
}

function get_edges(s, t) {

  var _edges = edges._data;

  // fill edges_ref
  for (let i in _edges) {
    if (edges_ref[_edges[i].from] == null) edges_ref[_edges[i].from] = {};
    if (edges_ref[_edges[i].from].to == null) edges_ref[_edges[i].from].to = [];
    edges_ref[_edges[i].from].to.push(_edges[i].to);

    if (edges_ref[_edges[i].to] == null) edges_ref[_edges[i].to] = {};
    if (edges_ref[_edges[i].to].from == null) edges_ref[_edges[i].to].from = [];
    edges_ref[_edges[i].to].from.push(_edges[i].from);
  }
  // console.log(edges_ref);

  var tmp_paths = get_path(s);

  for (let i in tmp_paths)
    tmp_paths[i] = s + "," + tmp_paths[i];

  return tmp_paths;
}

// get max flow in path
function getMaxFlow(path) {
  var maxFlow = Number.MAX_VALUE;
  var _edges = edges._data;

  for (var i = 0; i < path.length-1; i++) {
    for (var j in _edges) {

      if (_edges[j].from == path[i] && _edges[j].to == path[i+1]) {
        maxFlow = Math.min(maxFlow, _edges[j].capacity - _edges[j].fill_capacity);
        break;
      }

    }
  }

  return maxFlow;
}

function edges_by_steps() {
  console.log(steps);
  // try {
  //   edges.update({
  //     id: _edges[j].id,
  //     from: _edges[j].from,
  //     to: _edges[j].to,
  //     label: _edges[j].label
  //   });
  // } catch (err) {
  //   alert(err);
  // }
}

function applyPath(input) {

  // parsing input
  input = input.replace("(", "");
  input = input.replace(")", "");
  input = input.replace(/ /g, "");

  var path = input.split(",");

  // checking if the path exists
  var available = false;
  for (let i in paths) {
    if (paths[i] == input) {
      available = true;
      break;
    }
  }

  if (!available) {
    $("#c_p").html("The path is not present in the graph!");
    return;
  }

  var maxFlow = getMaxFlow(path);
  var _edges = edges._data;

  $("#c_p").html(input + " " + "(" + maxFlow + ")");

  for (var i = 0; i < path.length-1; i++) {
    for (var j in _edges) {

      if (_edges[j].from == path[i] && _edges[j].to == path[i+1]) {
        _edges[j].fill_capacity += maxFlow;
        _edges[j].label = _edges[j].fill_capacity + "/" + _edges[j].capacity;

        if (!step) {
          try {
            edges.update({
              id: _edges[j].id,
              from: _edges[j].from,
              to: _edges[j].to,
              label: _edges[j].label
            });
          } catch (err) {
            alert(err);
          }
        }
        else
          steps.push(jQuery.extend(true, {}, _edges)); // deep copy of the object

        break;
      }

    }
  }

  if (step)
    edges_by_steps();

  max_flow += maxFlow;
  document.getElementById("maxflow").innerHTML = max_flow;
}
