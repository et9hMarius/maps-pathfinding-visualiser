from fastapi import FastAPI
from matplotlib import pyplot as plt
import networkx as nx
from networkx.readwrite import json_graph
import os
import json

import numpy as np

app = FastAPI()

DATA_FOLDER = "./data/"


@app.get("/api/python/graphs")
def get_graphs():
    # Get the list of graph files
    files = os.listdir(DATA_FOLDER)

    # Return the list of graph files
    return files


@app.get("/api/python/two_random_points/{name}")
def get_random_points(name):
    # Construct the path to the JSON file for the specified graph
    graph_path = os.path.join(DATA_FOLDER, name)

    # Check if the file exists
    if not os.path.exists(graph_path):
        return {"error": "Graph file not found"}

    # Read and load the JSON data into a NetworkX graph
    with open(graph_path, "r") as f:
        data = json.load(f)
        G = json_graph.node_link_graph(data)

    # Get the list of nodes
    nodes = list(G.nodes())

    # Pick two random nodes
    random_nr1 = np.random.randint(0, len(nodes))
    random_nr2 = np.random.randint(0, len(nodes))

    # Get the nodes
    node1 = nodes[random_nr1]
    node2 = nodes[random_nr2]

    # Return the two random nodes
    return {
        "node1": node1,
        "node2": node2,
    }


@app.get("/api/python/graph/{name}")
def get_graph(name):
    # Construct the path to the JSON file for the specified graph
    graph_path = os.path.join(DATA_FOLDER, name)

    # Check if the file exists
    if not os.path.exists(graph_path):
        return {"error": "Graph file not found"}

    # Read and load the JSON data into a NetworkX graph
    with open(graph_path, "r") as f:
        data = json.load(f)
        G = json_graph.node_link_graph(data)

    # Return the graph
    return json_graph.node_link_data(G)


@app.get("/api/python/path/{name}/{node1}/{node2}")
def get_path(name, node1, node2):
    # Construct the path to the JSON file for the specified graph
    graph_path = os.path.join(DATA_FOLDER, name)

    # Check if the file exists
    if not os.path.exists(graph_path):
        return {"error": "Graph file not found"}

    # Read and load the JSON data into a NetworkX graph
    with open(graph_path, "r") as f:
        data = json.load(f)
        G = json_graph.node_link_graph(data)

    # Convert node1 and node2 to integers
    node1 = int(node1)
    node2 = int(node2)

    try:
        # Create dictionaries to track the following:
        # - Shortest distance from the source node to each node.
        # - Previous node in the shortest path.
        shortest_distances = {node: float('inf') for node in G.nodes()}
        previous_nodes = {node: None for node in G.nodes()}

        # Initialize the source node's distance to 0.
        shortest_distances[node1] = 0

        # Create a set of unvisited nodes.
        unvisited_nodes = set(G.nodes())

        visited_graph = nx.Graph()
        previous_node = None
        while unvisited_nodes:
            # Select the node with the smallest distance that is still unvisited.
            current_node = min(
                unvisited_nodes, key=lambda node: shortest_distances[node])

            # If the current node's distance is infinity, there is no path to node2.
            if shortest_distances[current_node] == float('inf'):
                break

            # Update the distances to neighboring nodes.
            for neighbor in G.neighbors(current_node):
                tentative_distance = shortest_distances[current_node] + \
                    G[current_node][neighbor].get("weight", 1)
                if tentative_distance < shortest_distances[neighbor]:
                    shortest_distances[neighbor] = tentative_distance
                    previous_nodes[neighbor] = current_node

            # Mark the current node as visited.
            unvisited_nodes.remove(current_node)

            # update visited graph
            visited_graph.add_node(current_node)
            if previous_node is not None:
                visited_graph.add_edge(current_node, previous_node)
            previous_node = current_node

            print(current_node)

        # Reconstruct the shortest path from node2 to node1.
        path = []
        current_node = node2
        while previous_nodes[current_node] is not None:
            path.insert(0, current_node)
            current_node = previous_nodes[current_node]
        path.insert(0, node1)

        return {
            "visited_graph": json_graph.node_link_data(visited_graph),
            "path": path,
        }

    except nx.NetworkXNoPath:
        return {"error": "No path exists between the specified nodes"}
