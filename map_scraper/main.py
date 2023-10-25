import json
import osmnx as ox
import networkx as nx
from networkx.readwrite import json_graph
import geopandas as gpd
import pickle

DATA_FETCHED = False

if DATA_FETCHED == False:
    # places with interesting street networks
    places = [
        'Toronto, Canada',
        'New York City, USA',
        'Washington D.C., USA',
        'Savannah, Georgia, USA',
        'San Francisco, USA',
        'Soho, London, UK',
        'Pigalle, Paris, France',
        'Pigneto, Rome, Italy',
        'Barcelona, Spain',
        'Bucharest, Romania',
        'Cluj-Napoca, Romania',
        'Timisoara, Romania',
        'Iasi, Romania',
        'Pitesti, Romania',
    ]

    points = []
    for place in places:
        points.append(ox.geocode(place))

    # get the street networks
    graphs = []
    for point in points:
        graphs.append(ox.graph_from_point(
            point, dist=750, network_type='drive'))

    # save graphs, points and places
    with open('graphs.pkl', 'wb') as f:
        pickle.dump(graphs, f)
    with open('points.pkl', 'wb') as f:
        pickle.dump(points, f)
    with open('places.pkl', 'wb') as f:
        pickle.dump(places, f)
else:
    import pickle
    with open('graphs.pkl', 'rb') as f:
        graphs = pickle.load(f)
    with open('points.pkl', 'rb') as f:
        points = pickle.load(f)
    with open('places.pkl', 'rb') as f:
        places = pickle.load(f)


# export the street networks
for graph, point, place in zip(graphs, points, places):
    name = place.replace(', ', '__').replace(' ', '_')

    # copy only nodes and edges to new graph
    G = nx.Graph()
    G.add_nodes_from(graph.nodes(data=True))
    G.add_edges_from(graph.edges(data=True))

    # remove gemoetry from edges
    for u, v, data in G.edges(data=True):
        data.pop('geometry', None)

    # export to json
    data = json_graph.node_link_data(G)
    with open('{}.json'.format(name), 'w') as f:
        json.dump(data, f)

    # get two random nodes and find the shortest path between them
    nodes = list(G.nodes())
    node1 = nodes[0]
    node2 = nodes[1]
    path = nx.shortest_path(G, node1, node2)
    print(path)
