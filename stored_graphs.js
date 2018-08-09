const graphs = [];
graphs[0] = {
  nodes: [
    { id: 's', label: 'S'},
    { id: 'a', label: 'A'},
    { id: 'b', label: 'B'},
    { id: 'c', label: 'C'},
    { id: 'd', label: 'D'},
    { id: 't', label: 'T'}
  ],
  edges: [
    { id: "0", from:"s", to:"a", arrows: "to", capacity:20, fill_capacity:0, label:"0/20", color: { color: "#2b7ce9" }, residual: false },
    { id: "1", from:"s", to:"c", arrows: "to", capacity:30, fill_capacity:0, label:"0/30", color: { color: "#2b7ce9" }, residual: false },
    { id: "2", from:"a", to:"b", arrows: "to", capacity:10, fill_capacity:0, label:"0/10", color: { color: "#2b7ce9" }, residual: false },
    { id: "3", from:"a", to:"d", arrows: "to", capacity:20, fill_capacity:0, label:"0/20", color: { color: "#2b7ce9" }, residual: false },
    { id: "4", from:"b", to:"t", arrows: "to", capacity:15, fill_capacity:0, label:"0/15", color: { color: "#2b7ce9" }, residual: false },
    { id: "5", from:"c", to:"b", arrows: "to", capacity:20, fill_capacity:0, label:"0/20", color: { color: "#2b7ce9" }, residual: false },
    { id: "6", from:"d", to:"t", arrows: "to", capacity:30, fill_capacity:0, label:"0/30", color: { color: "#2b7ce9" }, residual: false }
  ]
};
