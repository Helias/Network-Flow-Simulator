const graphs = [
  { // Graph 1
    nodes: {
      "s": { id: 's', label: 'S'},
      "a": { id: 'a', label: 'A'},
      "b": { id: 'b', label: 'B'},
      "c": { id: 'c', label: 'C'},
      "d": { id: 'd', label: 'D'},
      "t": { id: 't', label: 'T'}
    },
    edges: {
      "0": { id: "0", from:"s", to:"a", arrows: "to", capacity:20, fill_capacity:0, label:"0/20", color: { color: "#2b7ce9" }, residual: false },
      "1": { id: "1", from:"s", to:"c", arrows: "to", capacity:30, fill_capacity:0, label:"0/30", color: { color: "#2b7ce9" }, residual: false },
      "2": { id: "2", from:"a", to:"b", arrows: "to", capacity:10, fill_capacity:0, label:"0/10", color: { color: "#2b7ce9" }, residual: false },
      "3": { id: "3", from:"a", to:"d", arrows: "to", capacity:20, fill_capacity:0, label:"0/20", color: { color: "#2b7ce9" }, residual: false },
      "4": { id: "4", from:"b", to:"t", arrows: "to", capacity:15, fill_capacity:0, label:"0/15", color: { color: "#2b7ce9" }, residual: false },
      "5": { id: "5", from:"c", to:"b", arrows: "to", capacity:20, fill_capacity:0, label:"0/20", color: { color: "#2b7ce9" }, residual: false },
      "6": { id: "6", from:"d", to:"t", arrows: "to", capacity:30, fill_capacity:0, label:"0/30", color: { color: "#2b7ce9" }, residual: false }
    }
  },
  { // Graph 2
    nodes: {
      "s": { id: 's', label: 'S'},
      "a": { id: 'a', label: 'A'},
      "b": { id: 'b', label: 'B'},
      "c": { id: 'c', label: 'C'},
      "d": { id: 'd', label: 'D'},
      "t": { id: 't', label: 'T'}
    },
    edges: {
      "0": { id: "0", from:"s", to:"a", arrows: "to", capacity:20, fill_capacity:0, label:"0/20", color: { color: "#2b7ce9" }, residual: false },
      "1": { id: "1", from:"s", to:"c", arrows: "to", capacity:30, fill_capacity:0, label:"0/30", color: { color: "#2b7ce9" }, residual: false },
      "2": { id: "2", from:"a", to:"b", arrows: "to", capacity:10, fill_capacity:0, label:"0/10", color: { color: "#2b7ce9" }, residual: false },
      "3": { id: "3", from:"a", to:"d", arrows: "to", capacity:20, fill_capacity:0, label:"0/20", color: { color: "#2b7ce9" }, residual: false },
      "4": { id: "4", from:"b", to:"t", arrows: "to", capacity:15, fill_capacity:0, label:"0/15", color: { color: "#2b7ce9" }, residual: false },
      "5": { id: "5", from:"s", to:"b", arrows: "to", capacity:20, fill_capacity:0, label:"0/20", color: { color: "#2b7ce9" }, residual: false },
      "6": { id: "6", from:"d", to:"t", arrows: "to", capacity:30, fill_capacity:0, label:"0/30", color: { color: "#2b7ce9" }, residual: false }
    }
  },
];
