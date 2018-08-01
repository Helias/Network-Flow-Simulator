var nodes, edges, network, max_flow = 0, paths = [], edges_ref = {}, path = [], edges_network, residual_edges;

// steps variables
var steps = [], step = false, idx_steps = 0;

var graph = {}; // to load graph

$(document).ready(function() {

  $("#c_p").hide();
  $("#error").hide();

  $("#start").hide();
  $("#back").hide();
  $("#next").hide();
  $("#finish").hide();

  draw();
  load_paths();
});

var currentMousePos = { x: -1, y: -1 };
$(document).mousemove(function(event) {
    var canvas = document.getElementsByTagName("canvas")[0];
    if (canvas != null) {
      let rect = canvas.getBoundingClientRect();
      currentMousePos.x = event.clientX - rect.left;
      currentMousePos.y = event.clientY - rect.top;
    }
});


function saveGraph() {

  var tmp_edges = edges._data;

  for (var i in tmp_edges) {
    if (tmp_edges[i].residual)
      tmp_edges[i].color.color = "#4caf50";
    else
      tmp_edges[i].color.color = "#2b7ce9";
  }

  let save = { nodes: nodes._data, edges: tmp_edges };
  let name = document.getElementById("graph-name").value + ".json";
  download(JSON.stringify(save), name, "json");
}

function readTextFile(input) {
  var fReader = new FileReader();
  fReader.readAsDataURL(input.files[0]);
  fReader.onloadend = function(event) {
    graph = event.target.result;
    graph = graph.replace("data:application/json;base64,", "");
    graph = JSON.parse(atob(graph));
    loadGraph();
    $("#saveModal").modal({ show: true });
  }
}

function download(data, filename, type) {
    var file = new Blob([data], {type: type});
    if (window.navigator.msSaveOrOpenBlob) // IE10+
        window.navigator.msSaveOrOpenBlob(file, filename);
    else { // Others
        var a = document.createElement("a"),
                url = URL.createObjectURL(file);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function() {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 0);
    }
}

function loadGraph() {
  nodes = new vis.DataSet();
  nodes._data = graph.nodes;

  edges = new vis.DataSet();
  edges._data = graph.edges;

  max_flow = 0;
  $("#maxflow").html(max_flow);

  draw();
  load_paths();
}

// create an array with nodes
nodes = new vis.DataSet();

nodes.add([
  { id: 's', label: 'S'/*, color: { background: "#54b4eb" }, font: { color: "#fff" } */},
  { id: 'a', label: 'A'},
  { id: 'b', label: 'B'},
  { id: 'c', label: 'C'},
  { id: 'd', label: 'D'},
  { id: 't', label: 'T'}
]);

edges = new vis.DataSet();
edges.add([
  { id: "0", from:"s", to:"a", arrows: "to", capacity:20, fill_capacity:0, label:"0/20", color: { color: "#2b7ce9" }, residual: false },
  { id: "1", from:"s", to:"c", arrows: "to", capacity:30, fill_capacity:0, label:"0/30", color: { color: "#2b7ce9" }, residual: false },
  { id: "2", from:"a", to:"b", arrows: "to", capacity:10, fill_capacity:0, label:"0/10", color: { color: "#2b7ce9" }, residual: false },
  { id: "3", from:"a", to:"d", arrows: "to", capacity:20, fill_capacity:0, label:"0/20", color: { color: "#2b7ce9" }, residual: false },
  { id: "4", from:"b", to:"t", arrows: "to", capacity:15, fill_capacity:0, label:"0/15", color: { color: "#2b7ce9" }, residual: false },
  { id: "5", from:"c", to:"b", arrows: "to", capacity:20, fill_capacity:0, label:"0/20", color: { color: "#2b7ce9" }, residual: false },
  { id: "6", from:"d", to:"t", arrows: "to", capacity:30, fill_capacity:0, label:"0/30", color: { color: "#2b7ce9" }, residual: false }
]);
// console.log(edges._data);

function load_paths() {
  let src = "s";
  let dst = "t";
  paths = getEdges(src, dst);

  var paths_html = "";

  for (let i = 0; i < paths.length; i++) {
    if (getMaxFlow(paths[i].split(",")) > 0)
      paths_html += `- ${paths[i]} <button class="btn btn-xs btn-primary" OnClick="applyPath('${paths[i]}')" id="sabt"><i class="fas fa-arrow-circle-down"></i></button><br>\n`;
    else
      paths_html += `- ${paths[i]} <button class="btn btn-xs btn-success" id="sabt"><i class="fas fa-check"></i></button><br>\n`;
  }

  if (paths_html == "")
    paths_html ="No paths";

  $("#list-paths").html(paths_html);
}

function clearPopUp() {
  document.getElementById('saveButton-edge').onclick = null;
  document.getElementById('saveButton').onclick = null;
  document.getElementById('cancelButton').onclick = null;
  document.getElementById('cancelButton-edge').onclick = null;
  document.getElementById('network-popUp').style.display = 'none';
  document.getElementById('network-popUp-edge').style.display = 'none';
}

function cancelEdit(callback) {
  clearPopUp();
  callback(null);
}

function saveData(data, callback) {
  data.id = $("#node-label").val().toLowerCase();
  data.label = $("#node-label").val().toUpperCase();
  clearPopUp();
  callback(data);
}

function saveDataEdge(data, callback) {
  data.capacity = $("#edge-capacity").val();
  data.label = "0/" + data.capacity;

  clearPopUp();
  callback(data);
  load_paths();
}

function draw() {
  // create a network
  var container = document.getElementById('network');
  var data = {
    nodes: nodes,
    edges: edges
  };

  var options = {
    layout: { randomSeed: 2 }, // just to make sure the layout is the same
    locale: "en",
    manipulation: {
      addNode: function (data, callback) {
        $("#network-popUp").css('top', currentMousePos.y-100 + "px");
        $("#network-popUp").css('left', currentMousePos.x-150 + "px");

        document.getElementById('operation').innerHTML = "Add Node";
        document.getElementById('node-label').value = data.label;
        document.getElementById('saveButton').onclick = saveData.bind(this, data, callback);
        document.getElementById('cancelButton').onclick = clearPopUp.bind();
        document.getElementById('network-popUp').style.display = 'block';
      },
      editNode: function (data, callback) {
        $("#network-popUp").css('top', currentMousePos.y-100 + "px");
        $("#network-popUp").css('left', currentMousePos.x-150 + "px");

        document.getElementById('operation').innerHTML = "Edit Node";
        document.getElementById('node-label').value = data.label;
        document.getElementById('saveButton').onclick = saveData.bind(this, data, callback);
        document.getElementById('cancelButton').onclick = cancelEdit.bind(this,callback);
        document.getElementById('network-popUp').style.display = 'block';
      },
      addEdge: function (data, callback) {
        if (data.from == data.to) {
          var r = confirm("Do you want to connect the node to itself?");
          if (r == true) {
            callback(data);
          }
        }
        data.id = (Object.keys(edges._data).length).toString();
        data.fill_capacity = 0;
        data.color = { color: "#2b7ce9" };
        data.arrows = "to";
        data.residual = false;

        $("#network-popUp-edge").css('top', currentMousePos.y-100 + "px");
        $("#network-popUp-edge").css('left', currentMousePos.x-150 + "px");

        document.getElementById('operation-edge').innerHTML = "Add Edge";
        document.getElementById('saveButton-edge').onclick = saveDataEdge.bind(this, data, callback, true);
        document.getElementById('cancelButton-edge').onclick = clearPopUp.bind();
        document.getElementById('network-popUp-edge').style.display = 'block';
      }
    }
  };

  network = new vis.Network(container, data, options);
}

// dfs recursive
function get_path(input, dst, current_path) {
  var res = "";

  if (edges_ref[input].to != null) {

    if (edges_ref[input].to.length > 1) {

      var multi = [];

      for (var i in edges_ref[input].to) {

        if (edges_ref[input].to[i] != dst) {

          // check for cycle
          var tmp_c = current_path.split(",");

          var cycle = false;
          for (let j in tmp_c) {
            if (edges_ref[input].to[i] == tmp_c[j]) {
              cycle = true;
              break;
            }
          }

          if (cycle)
            continue;

          res = get_path(edges_ref[input].to[i], dst, current_path + "," + input);

          if (Array.isArray(res))
            for (let j in res)
              multi.push(edges_ref[input].to[i] + "," + res[j]);
          else if (res != "cycle")
            multi.push(edges_ref[input].to[i] + "," + res);
        }
        else
          multi.push(edges_ref[input].to[i]);
      }

      return multi;
    }
    else {
      if (edges_ref[input].to[0] != dst) {

        // check for cycle
        var tmp_c = current_path.split(",");
        for (let j in tmp_c)
          if (edges_ref[input].to[i] == tmp_c[j])
            return "cycle";

        res = get_path(edges_ref[input].to[0], dst, current_path + "," + input);

        if (res == "")
          return edges_ref[input].to[0];
        else if (res == "cycle")
          return "";
        else if (Array.isArray(res)) {
          for (let j in res)
            res[j] = edges_ref[input].to[0] + "," + res[j];

          return res;
        }

        return edges_ref[input].to[0] + "," + res;
      }
      else
        return edges_ref[input].to[0];
    }
  }
  else
    return "";
}

function getEdges(s, t) {

  edges_ref = {};
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

  var tmp_paths = get_path(s, t, s);

  if (!Array.isArray(tmp_paths))
    tmp_paths = [s + "," + tmp_paths];

  var _paths = [];

  for (var i in tmp_paths) {
    if (tmp_paths[i].substr(tmp_paths[i].length -1) == t) {
      tmp_paths[i] = s + "," + tmp_paths[i];
      _paths.push(tmp_paths[i]);
    }
  }

  return _paths;
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

  if (maxFlow == Number.MAX_VALUE)
    maxFlow = 0;

  return maxFlow;
}

function updateEdges(graph, f) {
  for (var i in graph) {

    var c = "#2b7ce9";

    if (graph[i].residual)
      c = "#4caf50";

    if (graph[i].from == path[idx_steps-1] && graph[i].to == path[idx_steps] && f != true)
      c = "#dd2c00";

    try {
      edges.update({
        id: graph[i].id,
        from: graph[i].from,
        arrows: graph[i].arrows,
        to: graph[i].to,
        label: graph[i].label,
        color: { color: c },
        residual: graph[i].residual
      });
    } catch (err) {
      alert(err);
    }
  }
}

function applyPath(input) {
  // parsing input
  input = input.replace("(", "");
  input = input.replace(")", "");
  input = input.replace(/ /g, "");

  path = input.split(",");

  // checking if the path exists
  var available = false;
  for (let i in paths) {
    if (paths[i] == input) {
      available = true;
      break;
    }
  }

  if (!available) {
    $("#c_p").hide();
    $("#error").show();
    $("#error").html("The path is not present in the graph!");
    return;
  }

  var maxFlow = getMaxFlow(path);

  if (maxFlow == 0) {
    $("#c_p").hide();
    $("#error").show();
    $("#error").html("The current flow for this path is 0!");
    return;
  }

  $("#error").hide();
  $("#c_p").show();
  $("#c_p").html(input + " " + "(" + maxFlow + ")");

  if ($("#stepbystep").is(':checked') || $("#stepbystep_").is(':checked')) {
    $("#start").show();
    step = true;

    $("#apply_path").prop("disabled", true);
    $("#ap").prop("disabled", true);

    $("#stepbystep").prop("disabled", true);
    $("#stepbystep_").prop("disabled", true);
  }

  var _edges = edges._data;

  if (step)
    steps.push(jQuery.extend(true, {}, _edges));

  for (var j in _edges) {
    try {
      edges.update({
        id: _edges[j].id,
        from: _edges[j].from,
        to: _edges[j].to,
        label: _edges[j].label,
        color: { color: (_edges[j].residual ? "#4caf50" : "#2b7ce9") },
        residual: _edges[j].residual
      });
    } catch (err) {
      alert(err);
    }
  }

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
              label: _edges[j].label,
              color: { color: "#dd2c00" }
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

  max_flow += maxFlow;
  $("#maxflow").html(max_flow);

  load_paths();
}

function viewResidualNetwork() {
  edges_network = jQuery.extend(true, {}, edges._data);
  residual_edges = [];

  var check_r_exist, counter = 0;

  for (let i in edges_network) {
    if (edges_network[i].fill_capacity > 0) {

      check_r_exist = false;
      for (let j in edges_network)
        if (edges_network[j].from == edges_network[i].to && edges_network[j].to == edges_network[i].from) {
          check_r_exist = true;
          break;
        }

      if (!check_r_exist) {
        residual_edges.push({
          id: parseInt(Object.keys(edges_network).length) + counter,
          from: edges_network[i].to,
          to: edges_network[i].from,
          arrows: "to",
          capacity: edges_network[i].fill_capacity,
          fill_capacity: 0,
          label: "0/" + edges_network[i].fill_capacity,
          residual: true
        });
        counter++;
      }
    }
  }

  edges.add(residual_edges);
  updateEdges(edges._data);
  load_paths();
}

// Steps functions
function start() {
  $("#start").hide();
  $("#next").show();

  next();
}

function next() {
  idx_steps++;

  updateEdges(steps[idx_steps]);

  if (idx_steps > 0)
    $("#back").show();

  if (idx_steps == steps.length-1) {
    $("#next").hide();
    $("#finish").show();
  }
}

function back() {
  idx_steps--;

  if (idx_steps == 0) {
    $("#next").hide();
    $("#start").show();
    $("#back").hide();
  }

  if (idx_steps < steps.length) {
    if (idx_steps != 0)
      $("#next").show();

    $("#finish").hide();
  }

  updateEdges(steps[idx_steps]);
}

function finish() {
  updateEdges(steps[idx_steps], true);

  step = false;
  idx_steps = 0;
  steps = [];

  $("#apply_path").prop("disabled", false);
  $("#ap").prop("disabled", false);
  $("#stepbystep").prop("disabled", false);
  $("#stepbystep_").prop("disabled", false);

  $("#back").hide();
  $("#finish").hide();
}
