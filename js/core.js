var ng = new NetworkGraph();
var network;
var currentMousePos = { x: -1, y: -1 };

var options = {
  layout: { randomSeed: 2 }, // just to make sure the layout is the same
  locale: "en",
  edges: {
    smooth: true
  },
  physics: {
    enabled: ng.physics,
    solver: "repulsion"
  },
  manipulation: {
    addNode: function (data, callback) {
      $("#network-popUp").css('top', getMousePos()["y"]+100 + "px");
      $("#network-popUp").css('left', getMousePos()["x"]-150 + "px");

      $('#operation').html("Add Node");
      $('#node-label').val(data.label);
      document.getElementById('saveButton').onclick = saveData.bind(this, data, callback, false);
      document.getElementById('cancelButton').onclick = clearPopUp.bind();
      $('#network-popUp').show();
    },
    editNode: function (data, callback) {
      $("#network-popUp").css('top', getMousePos()["y"]+100 + "px");
      $("#network-popUp").css('left', getMousePos()["x"]-150 + "px");

      $('#operation').html("Edit Node");
      $('#node-label').val(data.label);
      document.getElementById('saveButton').onclick = saveData.bind(this, data, callback, true);
      document.getElementById('cancelButton').onclick = cancelEdit.bind(this, callback);
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
    },
    editEdge: function (data, callback) {
      callback(data);
      ng.load_paths();
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

  ng.loadGraph(deepCopy(graphs[0]));
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

function readTextFile(input) {
  let fReader = new FileReader();
  fReader.readAsDataURL(input.files[0]);
  fReader.onloadend = function(event) {
    let graph = event.target.result;
    graph = graph.replace("data:application/json;base64,", "");
    graph = JSON.parse(atob(graph));
    ng.loadGraph(graph);
    $("#saveModal").modal({ show: true });
    $('#graphs').val('--');
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

function saveData(data, callback, edit) {
  if (!edit) {
    data.id = ($("#node-label").val()).toLowerCase();
    data.label = ($("#node-label").val()).toUpperCase();
    callback(data);
  }
  else { // edit mode
    let new_label = ($("#node-label").val()).toLowerCase();

    ng.nodes.add([ { id: new_label, label: new_label.toUpperCase() } ]);

    try { ng.nodes.remove({ id: data.id }); }
    catch (err) { console.log(err); }

    for (let i in ng.edges._data) {
      if (ng.edges._data[i].from.toLowerCase() == data.id) {
        try {
          ng.edges.update({
            id: ng.edges._data[i].id,
            from: new_label,
            to: ng.edges._data[i].to,
            arrows: ng.edges._data[i].arrows,
            capacity: ng.edges._data[i].capacity,
            fill_capacity: ng.edges._data[i].fill_capacity,
            label: ng.edges._data[i].label,
            color: ng.edges._data[i].color,
            residual: ng.edges._data[i].residual
          });
        } catch (err) {
          console.log(err);
        }
      }

      if (ng.edges._data[i].to == data.id) {
        try {
          ng.edges.update({
            id: ng.edges._data[i].id,
            from: ng.edges._data[i].from,
            to: new_label,
            arrows: ng.edges._data[i].arrows,
            capacity: ng.edges._data[i].capacity,
            fill_capacity: ng.edges._data[i].fill_capacity,
            label: ng.edges._data[i].label,
            color: ng.edges._data[i].color,
            residual: ng.edges._data[i].residual
          });
        } catch (err) {
          console.log(err);
        }
      }
    }
  }

  clearPopUp();
  ng.load_paths();
}

function saveDataEdge(data, callback) {
  data.capacity = $("#edge-capacity").val();
  data.label = "0/" + data.capacity;

  clearPopUp();
  callback(data);

  ng.load_paths();
}

// Steps functions
function start() {
  $("#start").hide();
  $("#next").show();

  next();
}

function next() {
  ng.idx_steps++;

  ng.updateEdges(ng.steps[ng.idx_steps]);

  if (ng.idx_steps > 0)
    $("#back").show();

  if (ng.idx_steps == ng.steps.length-1) {
    $("#next").hide();
    $("#finish").show();
  }
}

function back() {
  ng.idx_steps--;

  let lastEdge = Object.keys(ng.edges._data).length-1;
  if (ng.edges._data[lastEdge].residual) {
    try {
      ng.edges.remove({
        id: lastEdge
      });
    } catch (err) {
      console.log(err);
    }
  }

  if (ng.idx_steps == 0) {
    $("#next").hide();
    $("#start").show();
    $("#back").hide();
  }

  if (ng.idx_steps < ng.steps.length) {
    if (ng.idx_steps != 0)
      $("#next").show();

    $("#finish").hide();
  }

  ng.updateEdges(ng.steps[ng.idx_steps]);
}

function finish() {
  ng.updateEdges(ng.steps[ng.idx_steps], true);

  ng.step = false;
  ng.idx_steps = 0;
  ng.steps = [];

  $("#apply_path").prop("disabled", false);
  $("#ap").prop("disabled", false);
  $("#stepbystep").prop("disabled", false);
  $("#stepbystep_").prop("disabled", false);

  $("#back").hide();
  $("#finish").hide();

  pathsButtons("enable");
  ng.load_paths();
}

function pathsButtons(enable_disable) {
  enable_disable = (enable_disable == "enable" ? true : false);
  let buttons = document.getElementById("list-paths").getElementsByTagName("button");
  for (let i = 0; i < buttons.length; i++)
    buttons[i].disabled = !enable_disable;
}
