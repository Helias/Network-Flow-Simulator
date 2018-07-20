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
