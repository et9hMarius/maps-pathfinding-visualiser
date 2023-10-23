from fastapi import FastAPI
import networkx as nx
app = FastAPI()

@app.get("/api/python")
def hello_world():
    return {"message": "Hello World"}
    
    

    
    
    