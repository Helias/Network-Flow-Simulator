class NetworkGraph {
  constructor() {

    this.nodes = new vis.DataSet();
    this.edges = new vis.DataSet();

    this.edges_ref = {};

    // residual network variables
    this.edges_network;
    this.residual_edges;

    this.source;
    this.dest;

    this.r_graph = []; // variable to reset the graph

    this.max_flow = 0;

    this.focus_path = [];
    this.paths = [];

    this.order;

    this.physics = true;

    // steps variables
    this.steps = [];
    this.step = false
    this.idx_steps = 0;
  }

  updateSourceDest() {

    // reset nodes colors
    for (let i in this.nodes._data)
      this.nodes.update({ id: i, color: { background: "#97c2fc" }, font: { color: "#000" } });

    this.source = $("#source").val();
    this.dest = $("#dest").val();

    let src = false, dst = false;

    // check if source and dest nodes exist
    for (let i in this.nodes._data) {
      if (i == this.source)
        src = true;

      if (i == this.dest)
        dst = true;
    }

    if (src) this.nodes.update({ id: this.source,  color: { background: "#73A839" }, font: { color: "#fff" } });
    if (dst) this.nodes.update({ id: this.dest,    color: { background: "#C71C22" }, font: { color: "#fff" } });

    this.load_paths();
  }

  orderPaths(_paths) {

    if (this.order == "lexicographical")
      return _paths.sort()

    if (this.order == "edmonds") {
      let pathFlows = [];

      for (let i in _paths)
        pathFlows.push([_paths[i], this.getMaxFlow(_paths[i].split(",")), _paths[i].length]);

      // sort per flow (desc) and path length (asc)
      pathFlows.sort((a, b) => {
        let diff = b[1] - a[1];
        return diff == 0 ? a[2] - b[2] : diff;
      });

      _paths = [];
      for (let i in pathFlows)
        _paths.push(pathFlows[i][0]);

      return _paths;
    }

    return _paths;
  }

  load_paths() {
    this.paths = this.getEdges(this.source, this.dest);
    this.paths = this.orderPaths(this.paths)

    let paths_html = "";

    for (let i = 0; i < this.paths.length; i++) {
      if (this.getMaxFlow(this.paths[i].split(",")) > 0)
        paths_html += `- <button class="btn btn-xs btn-primary" OnClick="ng.applyPath('${this.paths[i]}')" id="sabt"><i class="fas fa-arrow-circle-down"></i></button> ${this.paths[i]} (${ this.getMaxFlow( this.paths[i].split(",") ) }) <br>`;
      else
        paths_html += `- <button class="btn btn-xs btn-success" id="sabt"><i class="fas fa-check"></i></button> ${this.paths[i]}<br>`;
    }

    if (paths_html == "")
      paths_html ="No paths";

    $("#list-paths").html(paths_html);
  }

  draw(_nodes, _edges) {

    let container = document.getElementById('network');
    let data = {
      nodes: _nodes,
      edges: _edges
    };
    network = new vis.Network(container, data, options);

    this.nodes = data.nodes;
    this.edges = data.edges;

    this.updateSourceDest();
  }

  checkCycle(idx, _current_path, input) {
    for (let j in _current_path)
      if (this.edges_ref[input].to[idx] == _current_path[j])
        return true;

    return false;
  }

  // dfs recursive
  get_path(input, dst, current_path) {
    let res = "";

    if (this.edges_ref[input] != null && this.edges_ref[input].to != null) {

      if (this.edges_ref[input].to.length > 1) {

        let multi = [];

        for (let i in this.edges_ref[input].to) {

          if (this.edges_ref[input].to[i] != dst) {

            if (this.checkCycle(i, current_path.split(","), input))
              continue;

            res = this.get_path(this.edges_ref[input].to[i], dst, current_path + "," + input);

            if (Array.isArray(res))
              for (let j in res)
                multi.push(this.edges_ref[input].to[i] + "," + res[j]);
            else if (res != "cycle")
              multi.push(this.edges_ref[input].to[i] + "," + res);
          }
          else
            multi.push(this.edges_ref[input].to[i]);
        }

        return multi;
      }
      else {
        if (this.edges_ref[input].to[0] != dst) {

          if (this.checkCycle(0, current_path.split(","), input))
            return "cycle";

          res = this.get_path(this.edges_ref[input].to[0], dst, current_path + "," + input);

          if (res == "")
            return this.edges_ref[input].to[0];
          else if (res == "cycle")
            return "";
          else if (Array.isArray(res)) {
            for (let j in res)
              res[j] = this.edges_ref[input].to[0] + "," + res[j];

            return res;
          }

          return this.edges_ref[input].to[0] + "," + res;
        }
        else
          return this.edges_ref[input].to[0];
      }
    }
    else
      return "";
  }

  getEdges(s, t) {

    this.edges_ref = {};
    let _edges = this.edges._data;

    // fill this.edges_ref
    for (let i in _edges) {
      if (this.edges_ref[_edges[i].from] == null) this.edges_ref[_edges[i].from] = {};
      if (this.edges_ref[_edges[i].from].to == null) this.edges_ref[_edges[i].from].to = [];
      this.edges_ref[_edges[i].from].to.push(_edges[i].to);

      if (this.edges_ref[_edges[i].to] == null) this.edges_ref[_edges[i].to] = {};
      if (this.edges_ref[_edges[i].to].from == null) this.edges_ref[_edges[i].to].from = [];
      this.edges_ref[_edges[i].to].from.push(_edges[i].from);
    }
    // console.log(this.edges_ref);

    let tmp_paths = this.get_path(s, t, s);

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
  getMaxFlow(path) {

    let maxFlow = Number.MAX_VALUE;
    let _edges = this.edges._data;

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

  updateEdges(graph, f) {

    for (let i in graph) {

      let c = "#2b7ce9";

      if (graph[i].residual)
        c = "#4caf50";

      if (graph[i].from == this.focus_path[this.idx_steps-1] && graph[i].to == this.focus_path[this.idx_steps] && f != true)
        c = "#dd2c00";

      try {
        this.edges.update({
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

  applyPath(input) {
    pathsButtons("disable");

    // parsing input
    input = input.replace("(", "");
    input = input.replace(")", "");
    input = input.replace(/ /g, "");

    this.focus_path = input.split(",");

    // checking if the path exists
    let available = false;
    for (let i in this.paths) {
      if (this.paths[i] == input) {
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

    let maxFlow = this.getMaxFlow(this.focus_path);

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
      this.step = true;

      $("#apply_path").prop("disabled", true);
      $("#ap").prop("disabled", true);

      $("#stepbystep").prop("disabled", true);
      $("#stepbystep_").prop("disabled", true);
    }

    let _edges = deepCopy(this.edges._data);

    if (this.step)
      this.steps.push(deepCopy(_edges));

    for (let j in _edges) {
      try {
        this.edges.update({
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

    for (let i = 0; i < this.focus_path.length-1; i++) {
      let check_r_exist = false, counter = 0;
      for (let j in _edges) {

        if (_edges[j].from == this.focus_path[i] && _edges[j].to == this.focus_path[i+1]) {
          _edges[j].fill_capacity += maxFlow;
          _edges[j].label = _edges[j].fill_capacity + "/" + _edges[j].capacity;

          if (_edges[j].fill_capacity > 0) {

            if (!check_r_exist) {
              for (let k in _edges)
                if (_edges[k].from == this.focus_path[i+1] && _edges[k].to == this.focus_path[i]) {
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

          if (!this.step) {
            try {
              this.edges.update({
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
            this.steps.push(deepCopy(_edges));

          break;
        }

      }
    }

    this.max_flow += maxFlow;
    $("#maxflow").html(this.max_flow);

    if (!this.step) {
      this.viewResidualNetwork();
      this.load_paths();
    }
  }


  resetGraph() {
    this.max_flow = 0;
    $("#maxflow").html(this.max_flow);

    let graph = {
      nodes: deepCopy(this.r_graph[0]),
      edges: deepCopy(this.r_graph[1])
    };

    this.loadGraph(graph);
  }

  saveGraph() {

    let tmp_edges = this.edges._data;

    for (let i in tmp_edges) {
      if (tmp_edges[i].residual)
        tmp_edges[i].color.color = "#4caf50";
      else
        tmp_edges[i].color.color = "#2b7ce9";
    }

    let save = { nodes: this.nodes._data, edges: tmp_edges };
    let name = $("#graph-name").val() + ".json";
    download(JSON.stringify(save), name, "json");
  }

  loadGraph(graph) {
    this.r_graph = [
      deepCopy(graph.nodes),
      deepCopy(graph.edges)
    ];

    this.nodes = new vis.DataSet();
    this.nodes._data = graph.nodes;

    this.edges = new vis.DataSet();
    this.edges._data = graph.edges;

    this.max_flow = 0;
    $("#maxflow").html(this.max_flow);

    this.draw(this.nodes, this.edges);
  }

  changeGraph(idx) {
    this.max_flow = 0;
    $("#maxflow").html(this.max_flow);

    let graph = {
      nodes: deepCopy(graphs[idx].nodes),
      edges: deepCopy(graphs[idx].edges)
    };

    this.loadGraph(graph);
  }

  newGraph() {
    $("#graphs").val("--");
    $("#list-paths").html("")

    this.r_graph = [];

    this.nodes = new vis.DataSet();
    this.edges = new vis.DataSet();

    this.max_flow = 0;
    $("#maxflow").html(this.max_flow);

    this.draw(this.nodes, this.edges);
  }

  viewResidualNetwork() {
    this.edges_network = deepCopy(this.edges._data);
    this.residual_edges = [];

    let check_r_exist, counter = 0;

    for (let i in this.edges_network) {
      if (this.edges_network[i].fill_capacity > 0) {

        check_r_exist = false;
        for (let j in this.edges_network)
          if (this.edges_network[j].from == this.edges_network[i].to && this.edges_network[j].to == this.edges_network[i].from) {
            check_r_exist = true;
            break;
          }

        if (!check_r_exist) {
          this.residual_edges.push({
            id: parseInt(Object.keys(this.edges_network).length) + counter,
            from: this.edges_network[i].to,
            to: this.edges_network[i].from,
            arrows: "to",
            capacity: this.edges_network[i].fill_capacity,
            fill_capacity: 0,
            label: "0/" + this.edges_network[i].fill_capacity,
            residual: true
          });
          counter++;
        }
      }
    }

    this.edges.add(this.residual_edges);
    this.updateEdges(this.edges._data);
  }

  togglePhysics() {
    this.physics = !this.physics;
    network.setOptions( { physics: { enabled: this.physics } } );

    if (this.physics) {
      $("#p_off").hide();
      $("#p_on").show();
    }
    else {
      $("#p_off").show();
      $("#p_on").hide();
    }
  }
}
