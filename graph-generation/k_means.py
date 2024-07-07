# %%
import pandas as pd
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.cluster import KMeans
import plotly.express as px
from sklearn.manifold import TSNE
import plotly.graph_objects as go

df = pd.read_csv('anime_embeddings_2d.csv')[['title', 'Dimension 1', 'Dimension 2']]

embeddings = df.iloc[:, 1:].values
cosine_sim = cosine_similarity(embeddings, embeddings)

kmeans = KMeans(n_clusters=500, random_state=0, verbose=1).fit(embeddings)
df['cluster'] = kmeans.labels_

cluster_centers = kmeans.cluster_centers_
df_centers = pd.DataFrame(cluster_centers, columns=['Cluster 1', 'Cluster 2'])

df_details = pd.read_csv('anime_embeddings_2d.csv')
df_details['cluster'] = df['cluster']

df_simplified = df_details[['Dimension 1', 'Dimension 2', 'title', 'cluster']]
print(df_simplified.head())

fig = px.scatter(df_simplified, x='Dimension 1', y='Dimension 2', color='cluster', hover_data=['title'])
fig.add_trace(go.Scatter(x=df_centers['Cluster 1'], y=df_centers['Cluster 2'], mode='markers', marker=dict(color='Black', size=10, symbol='x'), name='Cluster Centers'))
fig.show()

# %%
fig = px.scatter(df_simplified, x='Dimension 1', y='Dimension 2', color='cluster', hover_data=['title'], title='Anime Embeddings with Clusters using k-means; 500 clusters')

for i, center in enumerate(cluster_centers):
    cluster_points = df_simplified[df_simplified['cluster'] == i][['Dimension 1', 'Dimension 2']].values
    
    if len(cluster_points) > 0:
        max_radius = np.max(np.linalg.norm(cluster_points - center, axis=1))
        
        fig.add_shape(
            type="circle",
            xref="x",
            yref="y",
            x0=center[0] - max_radius, y0=center[1] - max_radius,
            x1=center[0] + max_radius, y1=center[1] + max_radius,
            line=dict(color="black"),
            opacity=0.3,
        )
fig.update_layout(yaxis=dict(autorange="reversed"))
fig.show()


