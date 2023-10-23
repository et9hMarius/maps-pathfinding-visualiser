"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";

interface GraphData {
  visited_graph: any;
  path: number[];
}

function GraphComponent() {
  const [graphList, setGraphList] = useState<string[]>([]);
  const [selectedGraph, setSelectedGraph] = useState<string>("");
  const [node1, setNode1] = useState<number>(0);
  const [node2, setNode2] = useState<number>(0);
  const [visitedGraph, setVisitedGraph] = useState<any | null>(null);
  const [shortestPath, setShortestPath] = useState<number[]>([]);

  useEffect(() => {
    // Fetch the list of graph files when the component mounts
    axios
      .get<string[]>("/api/python/graphs")
      .then((response) => {
        setGraphList(response.data);
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

  const handleGraphSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedGraph(event.target.value);
  };

  useEffect(() => {
    axios
      .get<{
        node1: number;
        node2: number;
      }>("/api/python/two_random_points/" + selectedGraph)
      .then((response) => {
        setNode1(response.data.node1);
        setNode2(response.data.node2);
      })
      .catch((error) => {
        console.error(error);
      });
  }, [selectedGraph]);

  const handleNode1Change = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNode1(parseInt(event.target.value));
  };

  const handleNode2Change = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNode2(parseInt(event.target.value));
  };

  const findShortestPath = () => {
    if (selectedGraph && node1 && node2) {
      axios
        .get<GraphData>(`/api/python/path/${selectedGraph}/${node1}/${node2}`)
        .then((response) => {
          const { visited_graph, path } = response.data;
          setVisitedGraph(visited_graph);
          setShortestPath(path);
        })
        .catch((error) => {
          console.error(error);
        });
    }
  };

  return (
    <div>
      <h2>Graph Component</h2>

      <div>
        <label>Select a graph file:</label>
        <select onChange={handleGraphSelect}>
          <option value="">-- Select a graph --</option>
          {graphList.map((graph) => (
            <option key={graph} value={graph}>
              {graph}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label>Node 1:</label>
        <input type="number" value={node1} onChange={handleNode1Change} />
      </div>

      <div>
        <label>Node 2:</label>
        <input type="number" value={node2} onChange={handleNode2Change} />
      </div>

      <button onClick={findShortestPath}>Find Shortest Path</button>

      <div>
        {visitedGraph && (
          <div>
            <h3>Visited Graph</h3>
            {/* Render the visited graph using your preferred graph visualization library */}
          </div>
        )}
      </div>

      <div>
        {shortestPath.length > 0 && (
          <div>
            <h3>Shortest Path</h3>
            <p>{shortestPath.join(" -> ")}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default GraphComponent;
