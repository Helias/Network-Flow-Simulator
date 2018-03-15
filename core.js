var nodes, edges, network, max_flow = 0, edges_dst = {};

// convenience method to stringify a JSON object
// function toJSON(obj) {
//   return JSON.stringify(obj, null, 4);
// }

function addNode(_id, _label) {
  try {
    nodes.add({
      id: _id,
      label: _label
    });
  } catch (err) {
    alert(err);
  }
}

function updateNode(_id, _label) {
  try {
    nodes.update({
      id: _id,
      label: _label
    });
  } catch (err) {
    alert(err);
  }
}

function removeNode(_id) {
  try {
    nodes.remove({
      id: _id
    });
  } catch (err) {
    alert(err);
  }
}

function addEdge(_id, _from, _to) {
  try {
    edges.add({
      id: _id,
      from: _from,
      to: _to,
      arrows: "to"
    });
  } catch (err) {
    alert(err);
  }
}

function updateEdge(_id, _from, _to, _arrows) {
  try {
    edges.update({
      id: _id,
      from: _from,
      to: _to,
      arrows: _arrows != null ? arrows : "to"
    });
  } catch (err) {
    alert(err);
  }
}

function removeEdge(_id) {
  try {
    edges.remove({
      id: _id
    });
  } catch (err) {
    alert(err);
  }
}

function draw() {
  // create an array with nodes
  nodes = new vis.DataSet();

  // nodes.on('*', function() {
  //   document.getElementById('nodes').innerHTML = JSON.stringify(nodes.get(), null, 4);
  // });

  nodes.add([
    { id: 's', label: 'S' /*, color: { background: "#54b4eb" }, font: { color: "#fff" }*/ },
    { id: 'a', label: 'A'},
    { id: 'b', label: 'B'},
    { id: 'c', label: 'C'},
    { id: 'd', label: 'D'},
    { id: 't', label: 'T'},
  ]);

  // create an array with edges
  edges = new vis.DataSet();

  // edges.on('*', function() {
  //   document.getElementById('edges').innerHTML = JSON.stringify(edges.get(), null, 4);
  // });

  edges.add([
    { id: "0", flow:0, from:"s", to:"a", arrows: "to", capacity:20, c:20, label:"0/20", visited:false },
    { id: "1", flow:0, from:"s", to:"c", arrows: "to", capacity:30, c:30, label:"0/30", visited:false },
    { id: "2", flow:0, from:"a", to:"b", arrows: "to", capacity:10, c:10, label:"0/10", visited:false },
    { id: "3", flow:0, from:"a", to:"d", arrows: "to", capacity:20, c:20, label:"0/20", visited:false },
    { id: "4", flow:0, from:"b", to:"t", arrows: "to", capacity:15, c:15, label:"0/15", visited:false },
    { id: "5", flow:0, from:"c", to:"b", arrows: "to", capacity:20, c:20, label:"0/20", visited:false },
    { id: "6", flow:0, from:"d", to:"t", arrows: "to", capacity:30, c:30, label:"0/30", visited:false }
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

function fordFulkerson(input) {

  // update label button
  var str = input.replace("(", "");
  str = str.replace(")", "");
  str = str.replace(/,/g, "");
  if (document.getElementById(str) != null)
    document.getElementById(str).innerHTML = '<i class="fas fa-check"></i>';

  var _edges = edges._data;

  // parsing input
  input = input.replace("(", "");
  input = input.replace(")", "");
  var order = input.split(",");

  var minCut = Number.MAX_VALUE;
  var condition_flow = false;

  for (var i = 0; i < order.length-1; i++) {
    for (var j in _edges) {

      condition_flow = (_edges[j].flow > 0 && _edges[j].to == order[i] && _edges[j].from == order[i+1]);

      if ((_edges[j].from == order[i] && _edges[j].to == order[i+1]) || condition_flow) {

        if (condition_flow)
          minCut = Math.min(minCut, _edges[j].flow);
        else
          minCut = Math.min(minCut, _edges[j].capacity);

        break;
      }
    }
  }

  // console.log(minCut);

  for (var i = 0; i < order.length-1; i++) {
    for (var j in _edges) {

      if ((_edges[j].from == order[i] && _edges[j].to == order[i+1]) || (_edges[j].flow > 0 && _edges[j].capacity <= 0 && _edges[j].to == order[i] && _edges[j].from == order[i+1])) {
        _edges[j].capacity -= minCut;
        _edges[j].flow += minCut;
        break;
      }
    }
  }

  max_flow += minCut;
  document.getElementById("maxflow").innerHTML = max_flow;

  // update labels
  for (var i in _edges) {
    _edges[i].label = _edges[i].flow + "/" + _edges[i].c;
    try {
      edges.update({
        id: _edges[i].id,
        from: _edges[i].from,
        to: _edges[i].to,
        label: _edges[i].label
      });
    } catch (err) {
      alert(err);
    }
  }

  // update_edges_dst();
}

// recursive function
function findPath(current_path, current_node, current_capacity) {

  if (current_node == "t")
    return { capacity: current_capacity, node: current_node, path: current_path };

  var compare_paths = new Array(edges_dst[current_node].length);
  var c_path, c_capacity;

  var tmp_c = Number.MAX_VALUE;
  var tmp_index = 0;

  for (let i in edges_dst[current_node]) {

    c_path = current_path + "," + edges_dst[current_node][i].to;
    c_capacity = current_capacity + edges_dst[current_node][i].capacity;

    if (edges_dst[current_node][i].flow != edges_dst[current_node][i].c) {

      let obj = findPath(c_path, edges_dst[current_node][i].to, c_capacity);

      if (obj != null) {
        compare_paths[i] = obj;

        if (tmp_c > compare_paths[i].capacity) {
          tmp_c = compare_paths[i].capacity;
          tmp_index = i;
        }
      }
    }

  }

  if (compare_paths[tmp_index] != null)
    return compare_paths[tmp_index];
}

function update_edges_dst() {
  console.log(edges._data);
  var _edges = edges._data;

  for (var i in _edges) {
    if (_edges[i].flow > 0 && edges_dst[_edges[i].to]) {

      var flag = false;
      for (var j in edges_dst[_edges[i].to]) {
        if (edges_dst[_edges[i].to][j].to == _edges[i].to && edges_dst[_edges[i].to][j].from == _edges[i].from) {
          flag = true;
          break;
        }
      }

      if (!flag) {
        edges_dst[_edges[i].to].push({
          from: _edges[i].to,
          to: _edges[i].from,
          capacity: _edges[i].flow,
          flow: 0,
          c: _edges[i].c,
        });
      }

    }
  }
}

function edmondsKarp() {
  var _edges = edges._data;

  for (var i in _edges) {

    if (edges_dst[_edges[i].from] == null)
      edges_dst[_edges[i].from] = [];

    edges_dst[_edges[i].from].push(_edges[i]);
  }

  var paths;
  while (paths = findPath("s", "s", 0)) {
    findPath("s", "s", 0);
    fordFulkerson(paths.path);
  }
}
