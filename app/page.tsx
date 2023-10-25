"use client";
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import * as d3 from "d3";
import {
  Button,
  ConfigProvider,
  Form,
  Input,
  Select,
  Slider,
  Spin,
  Tooltip,
} from "antd";

interface GraphData {
  explored_nodes: any;
  explored_links: any;
  path: number[];
}

function GraphComponent() {
  const [graphList, setGraphList] = useState<string[]>([]);
  const [selectedGraph, setSelectedGraph] = useState<string>("");
  const [node1, setNode1] = useState<number>(0);
  const [node2, setNode2] = useState<number>(0);
  const [nodeStep, setNodeStep] = useState<number>(-1);
  const [currentGraph, setCurrentGraph] = useState<any | null>(null);
  const [visitedNodes, setVisitedNodes] = useState<any | null>(null);
  const [visitedLinks, setVisitedLinks] = useState<any | null>(null);
  const [shortestPath, setShortestPath] = useState<number[]>([]);

  const [graphWidth, setGraphWidth] = useState<number>(900);
  const [graphHeight, setGraphHeight] = useState<number>(575);
  const [newGraphWidth, setNewGraphWidth] = useState<number>(graphWidth);
  const [newGraphHeight, setNewGraphHeight] = useState<number>(graphHeight);

  const [loading, setLoading] = useState<boolean>(false);
  const [running, setRunning] = useState<boolean>(false);

  const currentGraphRef = useRef<SVGSVGElement | null>(null);
  const strikeRef = useRef<HTMLDivElement | null>(null);

  // Create D3 container for current graph
  useEffect(() => {
    if (currentGraph && currentGraphRef.current) {
      setLoading(true);
      currentGraphRef.current.innerHTML = "";

      const svg = d3.select(currentGraphRef.current);

      //set bg color
      svg.style("background-color", "#1F090F");

      // Render links as lines
      svg
        .selectAll("line")
        .data(currentGraph.links)
        .enter()
        .append("line")
        .attr("x1", (link: any) => link.x1 * graphWidth)
        .attr("y1", (link: any) => link.y1 * graphHeight)
        .attr("x2", (link: any) => link.x2 * graphWidth)
        .attr("y2", (link: any) => link.y2 * graphHeight)
        .style("stroke", "#4C2118")
        .style("stroke-width", 2);

      // Render nodes as circles
      svg
        .selectAll("circle")
        .data(currentGraph.nodes)
        .enter()
        .append("circle")
        .attr("cx", (node: any) => node.x * graphWidth)
        .attr("cy", (node: any) => node.y * graphHeight)
        .attr("id", (d: any) => d.id)
        .attr("r", 2.5)
        .attr("fill", "#723723")
        //opacity
        .attr("opacity", 0.5)
        .attr("stroke", "#000000")
        //if nodeStep is 0, on click of a node, set node1 to that node, if nodeStep is 1, set node2 to that node
        //if nodeStep is -1, do nothing
        .on("click", (event: any, d: any) => {
          if (nodeStep === 0) {
            setNode1(d.id);
            setNodeStep(1);
          } else if (nodeStep === 1) {
            setNode2(d.id);
            setNodeStep(-1);
          }
        });
      //if nodestep is >-1 add a classname to the nodes
      if (nodeStep > -1) {
        svg.selectAll("circle").attr("class", "selectable");
      }

      //color in the selected nodes if they exist
      if (node1 && node2) {
        svg
          .selectAll("circle")
          .filter((d: any) => d.id === node1 || d.id === node2)
          .attr("class", "selected")
          .raise();
      }
      setLoading(false);
    }
  }, [currentGraph, node1, node2, nodeStep, graphWidth, graphHeight]);

  const handleGraphSelect = (value: string) => {
    setSelectedGraph(value);
  };

  useEffect(() => {
    axios
      .get<string[]>("/api/python/graphs")
      .then((response) => {
        setGraphList(response.data);
        setSelectedGraph(response.data[0]);
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

  useEffect(() => {
    if (!selectedGraph) {
      return;
    }

    setLoading(true);
    axios
      .get<any>(`/api/python/graph/${selectedGraph}`)
      .then((response) => {
        setCurrentGraph(response.data);
        setNode1(0);
        setNode2(0);
        setNodeStep(-1);

        setLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setLoading(false);
      });
  }, [selectedGraph]);

  // when visitedGraph updates color all the nodes and links by id in currentGraph
  useEffect(() => {
    if (visitedNodes && visitedLinks && currentGraphRef.current) {
      setRunning(true);
      const svg = d3.select(currentGraphRef.current);
      console.log(visitedNodes);

      const updateGraphWithDelay = (i: number) => {
        svg
          .selectAll("circle")
          .filter((d: any) => d.id === visitedNodes[i])
          .attr("class", "visited")
          .raise();

        //create a line between the current node and the next node using append
        if (i > 0) {
          //visitedLinks[i] is the parent node, visitedNodes[i] is the child node
          svg
            .append("line")
            .attr(
              "x1",
              (link: any) =>
                //find x of node by id in currentGraph
                currentGraph.nodes.find(
                  (node: any) => node.id === visitedLinks[i]
                ).x * graphWidth
            )
            .attr(
              "y1",
              (link: any) =>
                currentGraph.nodes.find(
                  (node: any) => node.id === visitedLinks[i]
                ).y * graphHeight
            )
            .attr(
              "x2",
              (link: any) =>
                currentGraph.nodes.find(
                  (node: any) => node.id === visitedNodes[i]
                ).x * graphWidth
            )
            .attr(
              "y2",
              (link: any) =>
                currentGraph.nodes.find(
                  (node: any) => node.id === visitedNodes[i]
                ).y * graphHeight
            )

            .attr("class", "visited_line")
            .raise();
        }

        if (i < visitedNodes.length - 1) {
          setTimeout(() => {
            updateGraphWithDelay(i + 1); // Call the next update after a delay
          }, 50);
        }

        if (i === visitedNodes.length - 1) {
          if (shortestPath) {
            if (strikeRef.current) {
              strikeRef.current.className = "light_strike";
            }
            //
            setTimeout(() => {
              //default color all the nodes and links
              svg.selectAll("circle").attr("class", "default");

              svg.selectAll("line").attr("class", "default");

              svg
                .selectAll("circle")
                .filter((d: any) => shortestPath.includes(d.id))
                .attr("class", "shortest_path")
                .raise();

              //change class off links too
              for (let i = 0; i < shortestPath.length - 1; i++) {
                svg;
                svg
                  .append("line")
                  .attr(
                    "x1",
                    (link: any) =>
                      currentGraph.nodes.find(
                        (node: any) => node.id === shortestPath[i]
                      ).x * graphWidth
                  )
                  .attr(
                    "y1",
                    (link: any) =>
                      currentGraph.nodes.find(
                        (node: any) => node.id === shortestPath[i]
                      ).y * graphHeight
                  )
                  .attr(
                    "x2",
                    (link: any) =>
                      currentGraph.nodes.find(
                        (node: any) => node.id === shortestPath[i + 1]
                      ).x * graphWidth
                  )
                  .attr(
                    "y2",
                    (link: any) =>
                      currentGraph.nodes.find(
                        (node: any) => node.id === shortestPath[i + 1]
                      ).y * graphHeight
                  )
                  .attr("class", "shortest_path_line")
                  .raise();
              }
              setRunning(false);
              //strikeref className="light_strike"
              if (strikeRef.current) {
                strikeRef.current.className = "";
              }
            }, 750);
          }
        }
      };

      updateGraphWithDelay(0); // Start the update with the first element
    }
  }, [visitedNodes, visitedLinks]);

  const handleNode1Change = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNode1(parseInt(event.target.value, 10));
  };

  const handleNode2Change = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNode2(parseInt(event.target.value, 10));
  };

  const findShortestPath = () => {
    setLoading(true);
    if (selectedGraph && node1 && node2) {
      axios
        .get<GraphData>(`/api/python/path/${selectedGraph}/${node1}/${node2}`)
        .then((response) => {
          const { explored_nodes, explored_links, path } = response.data;
          setVisitedNodes(explored_nodes);
          setVisitedLinks(explored_links);
          setShortestPath(path);
          setLoading(false);
        })
        .catch((error) => {
          console.error(error);
          setLoading(false);
        });
    }
  };

  const getRandomNodes = () => {
    if (!selectedGraph) {
      return;
    }
    axios
      .get<{ node1: number; node2: number }>(
        `/api/python/two_random_points/${selectedGraph}`
      )
      .then((response) => {
        setNode1(response.data.node1);
        setNode2(response.data.node2);
      })
      .catch((error) => {
        console.error(error);
      });

    setNodeStep(-1);
  };

  useEffect(() => {
    console.log(loading);
  }, [loading]);

  return (
    <>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: "#ffde19",
            colorPrimaryHover: "#ffde19",
          },
        }}
      >
        <div ref={strikeRef}></div>
        <h2 className="title">
          {"A* (A STAR) PATHFINDING VISUALIZER USING REAL WORLD STREET DATA"
            .split("")
            .map((char, index) => (
              <span key={index} style={{ animationDelay: `${index * 0.1}s` }}>
                {char}
              </span>
            ))}
        </h2>
        {loading && <div className="loading">{<Spin />}</div>}
        <div className="wrapper">
          <div className="left">
            <br />
            <br />
            {/* change width and height */}
            <Form labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
              <Form.Item label="width">
                <Slider
                  min={100}
                  max={2000}
                  defaultValue={graphWidth}
                  onChange={(value) => setNewGraphWidth(value)}
                />
              </Form.Item>
              <Form.Item label="height">
                <Slider
                  min={100}
                  max={2000}
                  defaultValue={graphHeight}
                  onChange={(value) => setNewGraphHeight(value)}
                />
              </Form.Item>
              <div className="button_wrapper">
                <Tooltip title="Original aspect ratio is 1.00">
                  <Button
                    type="link"
                    disabled={running}
                    onClick={() => {
                      setGraphWidth(newGraphWidth);
                      setGraphHeight(newGraphHeight);
                    }}
                  >
                    resize graph
                  </Button>
                </Tooltip>
              </div>
            </Form>

            <br />
            <br />
            <br />
            <div className="button_wrapper">
              <Button onClick={getRandomNodes} disabled={running}>
                randomly select two points.
              </Button>
            </div>
            <div className="button_wrapper">
              {nodeStep == -1 && (
                <Button disabled={running} onClick={() => setNodeStep(0)}>
                  manually select two points.
                </Button>
              )}
              {nodeStep > -1 && (
                <Button disabled={running} onClick={() => setNodeStep(-1)}>
                  cancel selection.
                </Button>
              )}
            </div>
            <br />
            <br />

            {node1 != 0 && node2 != 0 && (
              <div className="button_wrapper">
                <Button disabled={running} onClick={findShortestPath}>
                  START 💫
                </Button>
              </div>
            )}
          </div>
          <div className="middle">
            <div className="graphs_wrapper">
              <div>
                {currentGraph ? (
                  <div className="current_graph">
                    <svg
                      ref={currentGraphRef}
                      width={graphWidth}
                      height={graphHeight}
                    />
                  </div>
                ) : (
                  //place holder with width and height to keep the page from jumping around
                  <div className="current_graph">
                    <svg width={graphWidth} height={graphHeight} />
                  </div>
                )}
              </div>
              <div>
                {shortestPath.length > 0 && (
                  <div
                    style={{
                      fontSize: "0.5rem",
                      opacity: 0.5,
                      maxWidth: graphWidth,
                    }}
                  >
                    <p>{shortestPath.join(" -> ")}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="right">
            <div>
              <Select
                onChange={handleGraphSelect}
                value={selectedGraph}
                open
                disabled={running}
              >
                {graphList.map((graph) => (
                  <Select.Option
                    key={graph}
                    value={graph}
                    title={"Select a location"}
                  >
                    {/* replace _ with space, remove .json and add a , to the last space */}
                    {graph
                      .replaceAll("__", ", ")
                      .replaceAll("_", " ")
                      .replace(".json", "")}
                  </Select.Option>
                ))}
              </Select>

              {node1 != 0 ? (
                <div className="node_wrapper">
                  <div className="label">Starting point:</div>
                  <div className="value">{node1}</div>
                </div>
              ) : (
                <div></div>
              )}

              {node2 != 0 ? (
                <div className="node_wrapper">
                  <div className="label">Destination:</div>
                  <div className="value">{node2}</div>
                </div>
              ) : (
                <div></div>
              )}
            </div>
          </div>
        </div>
      </ConfigProvider>
    </>
  );
}

export default GraphComponent;
