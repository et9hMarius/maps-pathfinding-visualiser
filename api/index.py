import random
from fastapi import FastAPI
import networkx as nx
from networkx.readwrite import json_graph
import os
import json

app = FastAPI()

DATA_FOLDER = "./data/"


def astar(graph, start, goal):
    open_set = [start]
    closed_set = set()
    g_score = {node: float('inf') for node in graph.nodes()}
    g_score[start] = 0
    f_score = {node: float('inf') for node in graph.nodes()}
    f_score[start] = heuristic(start, goal, graph)
    came_from = {}
    explored_nodes = []
    explored_links = []

    while open_set:
        current = min(open_set, key=lambda node: f_score[node])
        open_set.remove(current)
        explored_nodes.append(current)
        explored_links.append(came_from.get(current, None))

        if current == goal:
            path = reconstruct_path(came_from, current)
            return explored_nodes, explored_links, path

        closed_set.add(current)

        for neighbor in graph.neighbors(current):
            if neighbor in closed_set:
                continue

            tentative_g_score = g_score[current] + \
                graph[current][neighbor]['length']

            if neighbor not in open_set:
                open_set.append(neighbor)
            elif tentative_g_score >= g_score[neighbor]:
                continue

            came_from[neighbor] = current
            g_score[neighbor] = tentative_g_score
            f_score[neighbor] = g_score[neighbor] + \
                heuristic(neighbor, goal, graph)

    return explored_nodes, explored_links, None


def heuristic(node, goal, graph):
    # Calculate the Euclidean distance as the heuristic
    x1, y1 = graph.nodes[node]['x'], graph.nodes[node]['y']
    x2, y2 = graph.nodes[goal]['x'], graph.nodes[goal]['y']
    return ((x1 - x2) ** 2 + (y1 - y2) ** 2) ** 0.5


def reconstruct_path(came_from, current):
    path = [current]
    while current in came_from:
        current = came_from[current]
        path.append(current)
    return path[::-1]


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
    random_nr1 = random.randint(0, len(nodes) - 1)
    random_nr2 = random.randint(0, len(nodes) - 1)

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

    # get smallest x and y for reference
    smallestX = min([G.nodes[node]["x"] for node in G.nodes()])
    smallestY = min([G.nodes[node]["y"] for node in G.nodes()])

    biggestX = max([G.nodes[node]["x"] for node in G.nodes()])
    biggestY = max([G.nodes[node]["y"] for node in G.nodes()])

    # get a suitable distortion factor so that we have values from 0 to 1
    distortionX = 1 / (biggestX - smallestX)
    distortionY = 1 / (biggestY - smallestY)

    # change the nodes
    for node in G.nodes():
        G.nodes[node]["x"] = (G.nodes[node]["x"] - smallestX) * distortionX
        G.nodes[node]["y"] = (G.nodes[node]["y"] - smallestY) * distortionY

    # add the node coordinates to the edges
    for edge in G.edges():
        G.edges[edge]["x1"] = G.nodes[edge[0]]["x"]
        G.edges[edge]["y1"] = G.nodes[edge[0]]["y"]
        G.edges[edge]["x2"] = G.nodes[edge[1]]["x"]
        G.edges[edge]["y2"] = G.nodes[edge[1]]["y"]

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
        # use a* to get the path step by  step using the function above
        explored_nodes, explored_links, path = astar(G, node1, node2)

        # Return the path
        return {
            "path": path,
            "explored_nodes": explored_nodes,
            "explored_links": explored_links,
        }

    except nx.NetworkXNoPath:
        return {"error": "No path exists between the specified nodes"}
