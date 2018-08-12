var nodes, edges, network, max_flow = 0, paths = [], edges_ref = {}, path = [], edges_network, residual_edges, r_graph = [];

// steps variables
var steps = [], step = false, idx_steps = 0;

var source = "s", dest = "t";
var currentMousePos = { x: -1, y: -1 };

var physics = true;

var options = {
  layout: { randomSeed: 2 }, // just to make sure the layout is the same
  locale: "en",
  edges: {
    smooth: true
  },
  physics: {
    enabled: physics,
    solver: "repulsion"
  },
  manipulation: {
    addNode: function (data, callback) {
      $("#network-popUp").css('top', getMousePos()["y"]+100 + "px");
      $("#network-popUp").css('left', getMousePos()["x"]-150 + "px");

      $('#operation').html("Add Node");
      $('#node-label').val(data.label);
      document.getElementById('saveButton').onclick = saveData.bind(this, data, callback);
      document.getElementById('cancelButton').onclick = clearPopUp.bind();
      $('#network-popUp').show();
    },
    editNode: function (data, callback) {
      $("#network-popUp").css('top', getMousePos()["y"]+100 + "px");
      $("#network-popUp").css('left', getMousePos()["x"]-150 + "px");

      $('#operation').html("Edit Node");
      $('#node-label').val(data.label);
      document.getElementById('saveButton').onclick = saveData.bind(this, data, callback);
      document.getElementById('cancelButton').onclick = cancelEdit.bind(this,callback);
      $('#network-popUp').show();
    },
    addEdge: function (data, callback) {
      if (data.from == data.to)
        callback(data);

      data.id = (Object.keys(edges._data).length).toString();
      data.fill_capacity = 0;
      data.color = { color: "#2b7ce9" };
      data.arrows = "to";
      data.residual = false;

      $("#network-popUp-edge").css('top', getMousePos()["y"]+100 + "px");
      $("#network-popUp-edge").css('left', getMousePos()["x"]-150 + "px");

      $('#operation-edge').html("Add Edge");
      document.getElementById('saveButton-edge').onclick = saveDataEdge.bind(this, data, callback, true);
      document.getElementById('cancelButton-edge').onclick = clearPopUp.bind();
      $('#network-popUp-edge').show();
    }
  }
};

$(document).ready(function() {

  let h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
  let offset = $("#network").offset();
  $("#network").height(h - offset.top - 75);

  $("#c_p").hide();
  $("#error").hide();

  $("#start").hide();
  $("#back").hide();
  $("#next").hide();
  $("#finish").hide();

  loadGraph(deepCopy(graphs[0]));
});

$(document).mousemove(function(event) {
  let canvas = document.getElementsByTagName("canvas")[0];
  if (canvas != null) {
    let rect = canvas.getBoundingClientRect();
    currentMousePos.x = event.clientX - rect.left;
    currentMousePos.y = event.clientY - rect.top;
  }
});

$(window).resize(function() {
  let h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
  let offset = $("#network").offset();
  $("#network").height(h - offset.top - 75);
});

function getMousePos() {
  return currentMousePos;
}

function deepCopy(data) {
  return JSON.parse(JSON.stringify(data));
}

function toggleMenu(id, on_off) {
  $("#" + id).toggle("blind", {}, 500);

  if (on_off == "on") {
    $("#" + id + "-on").hide();
    $("#" + id + "-off").show();
  }
  else {
    $("#" + id + "-on").show();
    $("#" + id + "-off").hide();
  }
}

function saveGraph() {

  let tmp_edges = edges._data;

  for (let i in tmp_edges) {
    if (tmp_edges[i].residual)
      tmp_edges[i].color.color = "#4caf50";
    else
      tmp_edges[i].color.color = "#2b7ce9";
  }

  let save = { nodes: nodes._data, edges: tmp_edges };
  let name = $("#graph-name").val() + ".json";
  download(JSON.stringify(save), name, "json");
}

function readTextFile(input) {
  let fReader = new FileReader();
  fReader.readAsDataURL(input.files[0]);
  fReader.onloadend = function(event) {
    let graph = event.target.result;
    graph = graph.replace("data:application/json;base64,", "");
    graph = JSON.parse(atob(graph));
    loadGraph(graph);
    $("#saveModal").modal({ show: true });
  }
}

function download(data, filename, type) {
    let file = new Blob([data], {type: type});
    if (window.navigator.msSaveOrOpenBlob) // IE10+
        window.navigator.msSaveOrOpenBlob(file, filename);
    else { // Others
        let a = document.createElement("a"),
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

function loadGraph(graph) {
  r_graph = [
    deepCopy(graph.nodes),
    deepCopy(graph.edges)
  ];

  nodes = new vis.DataSet();
  nodes._data = graph.nodes;

  edges = new vis.DataSet();
  edges._data = graph.edges;

  max_flow = 0;
  $("#maxflow").html(max_flow);

  draw(nodes, edges);
  load_paths();
}

function togglePhysics() {
  physics = !physics;
  network.setOptions( { physics: { enabled: physics } } );

  if (physics) {
    $("#p_off").hide();
    $("#p_on").show();
  }
  else {
    $("#p_off").show();
    $("#p_on").hide();
  }
}

function resetGraph() {
  max_flow = 0;
  $("#maxflow").html(max_flow);

  let graph = {
    nodes: deepCopy(r_graph[0]),
    edges: deepCopy(r_graph[1])
  };

  loadGraph(graph);
}

function changeGraph(idx) {
  max_flow = 0;
  $("#maxflow").html(max_flow);

  let graph = {
    nodes: deepCopy(graphs[idx].nodes),
    edges: deepCopy(graphs[idx].edges)
  };

  loadGraph(graph);
}

function newGraph() {
  $("#graphs").val("--");
  $("#list-paths").html("")

  r_graph = [];

  nodes = new vis.DataSet();
  edges = new vis.DataSet();

  max_flow = 0;
  $("#maxflow").html(max_flow);

  draw(nodes, edges);
}

function updateSourceDest() {

  // reset nodes colors
  for (let i in nodes._data)
    nodes.update({ id: i, color: { background: "#97c2fc" }, font: { color: "#000" } });

  source = $("#source").val();
  dest = $("#dest").val();

  let src = false, dst = false;

  // check if source and dest nodes exist
  for (let i in nodes._data) {
    if (i == source)
      src = true;

    if (i == dest)
      dst = true;
  }

  if (src) nodes.update({ id: source,  color: { background: "#73A839" }, font: { color: "#fff" } });
  if (dst) nodes.update({ id: dest,    color: { background: "#C71C22" }, font: { color: "#fff" } });

  load_paths();
}

function load_paths() {
  paths = getEdges(source, dest);

  let paths_html = "";

  for (let i = 0; i < paths.length; i++) {
    if (getMaxFlow(paths[i].split(",")) > 0)
      paths_html += `- <button class="btn btn-xs btn-primary" OnClick="applyPath('${paths[i]}')" id="sabt"><i class="fas fa-arrow-circle-down"></i></button> ${paths[i]} (${ getMaxFlow( paths[i].split(",") ) }) <br>`;
    else
      paths_html += `- <button class="btn btn-xs btn-success" id="sabt"><i class="fas fa-check"></i></button> ${paths[i]}<br>`;
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
  $('#network-popUp').hide();
  $('#network-popUp-edge').hide();
}

function cancelEdit(callback) {
  clearPopUp();
  callback(null);
}

function saveData(data, callback) {
  data.id = ($("#node-label").val()).toLowerCase();
  data.label = ($("#node-label").val()).toUpperCase();
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

function draw(_nodes, _edges) {

  let container = document.getElementById('network');
  let data = {
    nodes: _nodes,
    edges: _edges
  };
  network = new vis.Network(container, data, options);

  nodes = data.nodes;
  edges = data.edges;

  updateSourceDest();
}

// dfs recursive
function get_path(input, dst, current_path) {
  let res = "";

  if (edges_ref[input].to != null) {

    if (edges_ref[input].to.length > 1) {

      let multi = [];

      for (let i in edges_ref[input].to) {

        if (edges_ref[input].to[i] != dst) {

          // check for cycle
          let tmp_c = current_path.split(",");

          let cycle = false;
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
        let tmp_c = current_path.split(",");
        for (let j in tmp_c)
          if (edges_ref[input].to[0] == tmp_c[j])
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
  let _edges = edges._data;

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

  let tmp_paths = get_path(s, t, s);

  if (!Array.isArray(tmp_paths))
    tmp_paths = [s + "," + tmp_paths];

  let _paths = [];

  for (let i in tmp_paths) {
    if (tmp_paths[i].substr(tmp_paths[i].length-1) == t) {
      tmp_paths[i] = s + "," + tmp_paths[i];
      _paths.push(tmp_paths[i]);
    }
  }

  if (_paths.length == 1 && _paths[0].substr(2, 2) == _paths[0].substr(0, 2))
    return [_paths[0].substr(2, _paths[0].length)];

  return _paths;
}

// get max flow in path
function getMaxFlow(path) {

  let maxFlow = Number.MAX_VALUE;
  let _edges = edges._data;

  for (let i = 0; i < path.length-1; i++) {
    for (let j in _edges) {

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

  for (let i in graph) {

    let c = "#2b7ce9";

    if (graph[i].residual)
      c = "#4caf50";

    if (graph[i].from == path[idx_steps-1] && graph[i].to == path[idx_steps] && f != true)
      c = "#dd2c00";

    try {
      edges.update({
        id: graph[i].id,
        from: graph[i].from,
        to: graph[i].to,
        arrows: graph[i].arrows,
        capacity: graph[i].capacity,
        fill_capacity: graph[i].fill_capacity,
        label: graph[i].label,
        color: { color: c },
        residual: graph[i].residual
      });
    } catch (err) {
      console.log(err);
    }
  }
}

function applyPath(input) {
  pathsButtons("disable");

  // parsing input
  input = input.replace("(", "");
  input = input.replace(")", "");
  input = input.replace(/ /g, "");

  path = input.split(",");

  // checking if the path exists
  let available = false;
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

  let maxFlow = getMaxFlow(path);

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

  let _edges = deepCopy(edges._data);

  if (step)
    steps.push(deepCopy(_edges));

  for (let j in _edges) {
    try {
      edges.update({
        id: _edges[j].id,
        from: _edges[j].from,
        to: _edges[j].to,
        label: _edges[j].label,
        capacity: _edges[j].capacity,
        fill_capacity: _edges[j].fill_capacity,
        color: { color: (_edges[j].residual ? "#4caf50" : "#2b7ce9") },
        residual: _edges[j].residual
      });
    } catch (err) {
      console.log(err);
    }
  }

  for (let i = 0; i < path.length-1; i++) {
    let check_r_exist = false, counter = 0;
    for (let j in _edges) {

      if (_edges[j].from == path[i] && _edges[j].to == path[i+1]) {
        _edges[j].fill_capacity += maxFlow;
        _edges[j].label = _edges[j].fill_capacity + "/" + _edges[j].capacity;

        if (_edges[j].fill_capacity > 0) {

          if (!check_r_exist) {
            for (let k in _edges)
              if (_edges[k].from == path[i+1] && _edges[k].to == path[i]) {
                check_r_exist = true;
                break;
              }

            if (!check_r_exist) {
              _edges[parseInt(Object.keys(_edges).length) + counter] = {
                id: "" + (parseInt(Object.keys(_edges).length) + counter),
                from: _edges[j].to,
                to: _edges[j].from,
                arrows: "to",
                capacity: _edges[j].fill_capacity,
                fill_capacity: 0,
                label: "0/" + _edges[j].fill_capacity,
                color: { color: "#4caf50" },
                residual: true
              };
              counter++;
            }
          }
        }

        if (!step) {
          try {
            edges.update({
              id: _edges[j].id,
              from: _edges[j].from,
              to: _edges[j].to,
              capacity: _edges[j].capacity,
              fill_capacity: _edges[j].fill_capacity,
              label: _edges[j].label,
              color: { color: "#dd2c00" }
            });
          } catch (err) {
            console.log(err);
          }
        }
        else
          steps.push(deepCopy(_edges));

        break;
      }

    }
  }

  max_flow += maxFlow;
  $("#maxflow").html(max_flow);

  if (!step) {
    viewResidualNetwork();
    load_paths();
  }
}

function viewResidualNetwork() {
  edges_network = deepCopy(edges._data);
  residual_edges = [];

  let check_r_exist, counter = 0;

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

  let lastEdge = Object.keys(edges._data).length-1;
  if (edges._data[lastEdge].residual) {
    try {
      edges.remove({
        id: lastEdge
      });
    } catch (err) {
      console.log(err);
    }
  }

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

  pathsButtons("enable");
  load_paths();
}

function pathsButtons(enable_disable) {
  enable_disable = (enable_disable == "enable" ? true : false);
  let buttons = document.getElementById("list-paths").getElementsByTagName("button");
  for (let i = 0; i < buttons.length; i++)
    buttons[i].disabled = !enable_disable;
}
