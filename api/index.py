from fastapi import FastAPI
import osmnx as ox
import networkx as nx
import fastapi

app = FastAPI()

@app.get("/api/python")
def hello_world():
    return {"message": "Hello World"}
    
    
    
@app.get("/nodes")
def read_nodes():
    point = (40.740, -73.990)
    distance = 1000
    G = ox.graph_from_point(point, dist=distance, network_type='drive')

    return {"nodes": len(list(G.nodes()))}

    
    
    