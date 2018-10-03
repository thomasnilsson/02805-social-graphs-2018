import re
import networkx as nx
import pandas as pd
import io
import numpy as np
import matplotlib.pyplot as plt
from aux import *
from fa2 import ForceAtlas2

# Converts degree dictionary to numpy array
def degree_array(G, direction="none"):
    if direction == "in":
        return list(dict(G.in_degree()).values())
    elif direction == "out":
        return list(dict(G.out_degree()).values())
    else:
        return list(dict(G.degree()).values())

def flatten_edgelist(G):
    return list(sum(G.edges(), ()))

# Creates a Barabasil-Abert graph given a number of nodes (N)
def BA_graph(N):
    # Create initial two nodes, with one link between them
    G = nx.Graph()
    G.add_edges_from([(0,1)])
    
    # Create the remaining N-2 nodes. Link based on degree
    for node in range(2, N):
        edges = flatten_edgelist(G)
        pick = random.choice(edges)
        G.add_edges_from([(node, pick)])
    
    return G
    
# Returns the average degree of all neighbors, given a graph and a node.
def neighbors_avg_degree(G, node):
    nb = ba_graph_5k.neighbors(node)
    degrees = np.array(list(dict(G.degree(nb)).values()))
    return np.mean(degrees)

# Reads a WikiPage txt file, scans it for links to other Wikipages,
# and returns a list of the found links
def get_article_links(name, year, path_folder):
    # The regex pattern for recognizing links on the form [x | y]
    # and only capturing 'x'.
    article_pattern = r'\[\[([^\]]*?)(?:\|.*?)*\]\]'
    article = io.open(path_folder + name + year + ".txt", 'r', encoding='utf-8').read()
    article_links = re.findall(article_pattern, article)
    article_links = [a.replace(' ', '_') for a in article_links]
    return article_links

# A politcian class for storing data in a neat way.
class Politician:
    def __init__(self, dfRow):
        self.WikiPageName = str(dfRow[0])
        self.Party = str(dfRow[1])
        self.State = str(dfRow[2])
    
    def to_string(self):
        return "Wiki: %s, Party: %s, State: %s" % (self.WikiPageName, self.Party, self.State)
    
    def __hash__(self):
        return hash(self.WikiPageName)
    def __eq__(self, other):
        return (
                self.__class__ == other.__class__ and 
                self.WikiPageName == other.WikiPageName
               )

# Plots a histogram, given the degrees of a graph.
def distribution_histogram(degrees, text=""):
    v = np.arange(min(degrees), max(degrees)+1)
    plt.figure(figsize=(10,5))
    plt.hist(degrees, bins=v, edgecolor="black")
    plt.title("Degree distribution %s" % text)
    plt.xlabel("Degree (k)")
    plt.ylabel("Frequency (nodes)")
    plt.show()

def fa_positions(graph):
    forceatlas2 = ForceAtlas2(
        # Behavior alternatives
        outboundAttractionDistribution=False,  # Dissuade hubs
        linLogMode=False,  # NOT IMPLEMENTED
        adjustSizes=False,  # Prevent overlap (NOT IMPLEMENTED)
        edgeWeightInfluence=1.0,

        # Performance
        jitterTolerance=1.0,  # Tolerance
        barnesHutOptimize=True,
        barnesHutTheta=1.2,
        multiThreaded=False,  # NOT IMPLEMENTED

        # Tuning
        scalingRatio=2.0,
        strongGravityMode=False,
        gravity=1.0,

        # Log
        verbose=False
    )

    return forceatlas2.forceatlas2_networkx_layout(graph, pos=None, iterations=2000)