# %%
import numpy as np
from sklearn.cluster import DBSCAN
import pandas as pd
import plotly.express as px

# %%
df = pd.read_csv('anime_embeddings_2d.csv')[['title', 'Dimension 1', 'Dimension 2']]
points = df.iloc[:, 1:].values

# %%
eps = 2  # adjust based on your data
min_samples = 2  # adjust based on your data

dbscan = DBSCAN(eps=eps, min_samples=min_samples)
dbscan.fit(points)


# %%
core_samples_mask = np.zeros_like(dbscan.labels_, dtype=bool)
core_samples_mask[dbscan.core_sample_indices_] = True
labels = dbscan.labels_

# %%
# Add labels to original dataframe
df['Cluster'] = labels

# Plotting using Plotly
fig = px.scatter(df, x='Dimension 1', y='Dimension 2', color='Cluster',
                 title=f'DBSCAN Clustering (eps={eps}, min_samples={min_samples})')
fig.show()

# %%
# Calculate cluster centers and radii
cluster_centers = []
cluster_radii = []
for cluster in set(labels):
    if cluster == -1:
        continue  # skip noise points
    cluster_points = points[labels == cluster]
    center = np.mean(cluster_points, axis=0)
    radius = np.max(np.linalg.norm(cluster_points - center, axis=1))
    cluster_centers.append(center)
    cluster_radii.append(radius)

cluster_centers = np.array(cluster_centers)
cluster_radii = np.array(cluster_radii)



# %%
def dbscan_and_display(eps, min_samples):
    dbscan = DBSCAN(eps=eps, min_samples=min_samples)
    dbscan.fit(points)

    core_samples_mask = np.zeros_like(dbscan.labels_, dtype=bool)
    core_samples_mask[dbscan.core_sample_indices_] = True
    labels = dbscan.labels_

    df['Cluster'] = labels

    fig = px.scatter(df, x='Dimension 1', y='Dimension 2', color='Cluster',
                    title=f'DBSCAN Clustering (eps={eps}, min_samples={min_samples})')

    cluster_centers = []
    cluster_radii = []
    for cluster in set(labels):
        if cluster == -1:
            continue  # skip noise points
        cluster_points = points[labels == cluster]
        center = np.mean(cluster_points, axis=0)
        radius = np.max(np.linalg.norm(cluster_points - center, axis=1))
        cluster_centers.append(center)
        cluster_radii.append(radius)

    cluster_centers = np.array(cluster_centers)
    cluster_radii = np.array(cluster_radii)

    fig = px.scatter(df, x='Dimension 1', y='Dimension 2', color='Cluster', hover_data=['title'],
                    title=f'DBSCAN Clustering with Cluster Areas (eps={eps}, min_samples={min_samples}. Total clusters: {len(cluster_centers)}')

    for i, center in enumerate(cluster_centers):
        fig.add_shape(
            type="circle",
            x0=center[0] - cluster_radii[i], y0=center[1] - cluster_radii[i],
            x1=center[0] + cluster_radii[i], y1=center[1] + cluster_radii[i],
            line_color="black",
        )

    fig.update_layout(yaxis=dict(autorange="reversed"))
    fig.show()
    

eps = 2  # adjust based on your data
min_samples = 1  # adjust based on your data

dbscan_and_display(eps, min_samples)


