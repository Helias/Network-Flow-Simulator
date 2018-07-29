var nodes, edges, network, max_flow = 0, paths = [], edges_ref = {}, path = [];

// steps variables
var steps = [], step = false, idx_steps = 0;

// convenience method to stringify a JSON object
// function toJSON(obj) {
//   return JSON.stringify(obj, null, 4);
// }

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
  { id: "0", from:"s", to:"a", arrows: "to", capacity:20, fill_capacity:0, label:"0/20", color: { color: "#2b7ce9" } },
  { id: "1", from:"s", to:"c", arrows: "to", capacity:30, fill_capacity:0, label:"0/30", color: { color: "#2b7ce9" } },
  { id: "2", from:"a", to:"b", arrows: "to", capacity:10, fill_capacity:0, label:"0/10", color: { color: "#2b7ce9" } },
  { id: "3", from:"a", to:"d", arrows: "to", capacity:20, fill_capacity:0, label:"0/20", color: { color: "#2b7ce9" } },
  { id: "4", from:"b", to:"t", arrows: "to", capacity:15, fill_capacity:0, label:"0/15", color: { color: "#2b7ce9" } },
  { id: "5", from:"c", to:"b", arrows: "to", capacity:20, fill_capacity:0, label:"0/20", color: { color: "#2b7ce9" } },
  { id: "6", from:"d", to:"t", arrows: "to", capacity:30, fill_capacity:0, label:"0/30", color: { color: "#2b7ce9" } }
]);
// console.log(edges._data);

$(document).ready(function() {

  $("#c_p").hide();
  $("#error").hide();

  $("#start").hide();
  $("#back").hide();
  $("#next").hide();
  $("#finish").hide();

  draw();
  paths = getEdges("s", "t");
});

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
  data.id = document.getElementById('node-id').value;
  data.label = document.getElementById('node-label').value;
  clearPopUp();
  callback(data);
}

function saveDataEdge(data, callback) {
  data.capacity = document.getElementById("edge-capacity").value;
  data.label = "0/" + data.capacity;

  clearPopUp();
  callback(data);
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
        document.getElementById('operation').innerHTML = "Add Node";
        document.getElementById('node-id').value = data.id;
        document.getElementById('node-label').value = data.label;
        document.getElementById('saveButton').onclick = saveData.bind(this, data, callback);
        document.getElementById('cancelButton').onclick = clearPopUp.bind();
        document.getElementById('network-popUp').style.display = 'block';
      },
      editNode: function (data, callback) {
        document.getElementById('operation').innerHTML = "Edit Node";
        document.getElementById('node-id').value = data.id;
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

function updateEdges(graph, finished) {
  for (var i in graph) {

    var c = "#2b7ce9";

    if (graph[i].from == path[idx_steps-1] && graph[i].to == path[idx_steps] && finished != true)
      c = "#dd2c00";

    try {
      edges.update({
        id: graph[i].id,
        from: graph[i].from,
        to: graph[i].to,
        label: graph[i].label,
        color: { color: c }
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

  if ($("#stepbystep").is(':checked')) {
    $("#start").show();
    step = true;

    $("#apply_path").prop("disabled", true);
    $("#ap").prop("disabled", true);
    $("#stepbystep").prop("disabled", true);
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
        color: { color: "#2b7ce9" }
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
  document.getElementById("maxflow").innerHTML = max_flow;
}

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

  $("#back").hide();
  $("#finish").hide();
}
