import pandas as pd
from sklearn.manifold import TSNE
import numpy as np
import plotly.express as px

# Read embeddings from file
df = pd.read_csv('anime_embeddings.csv')

combined_embeddings_array = np.array(df)

# Perform dimensionality reduction with t-SNE
tsne = TSNE(n_components=2, random_state=42)
embeddings_2d = tsne.fit_transform(combined_embeddings_array)

# Load anime details
anime_details = pd.read_csv('anime_details.csv')

# Create a DataFrame with the reduced dimension embeddings
embeddings_2d_df = pd.DataFrame(embeddings_2d, columns=['Dimension 1', 'Dimension 2'])

# Concatenate the anime details with the reduced dimension embeddings
combined_df = pd.concat([anime_details, embeddings_2d_df], axis=1)

# Now, 'combined_df' contains the anime details along with the reduced dimension embeddings

# Create a DataFrame with the reduced dimension embeddings and anime titles
embeddings_2d_df['title'] = anime_details['title']

# Define your prioritized genres
prioritized_genres = ['romance', 'action', 'drama', 'mystery', 'adventure']

# Function to select the first prioritized genre
def select_genre(genres):
    for genre in genres:
        if genre in prioritized_genres:
            return genre
    return genres[0]

# Extract the first prioritized genre
anime_details['first_genre'] = anime_details['genres'].str.split(',').apply(select_genre)

# Add 'first_genre' to the DataFrame
embeddings_2d_df['genre'] = anime_details['first_genre']
embeddings_2d_df['type'] = anime_details['type']

anime_details['episode_count'] = anime_details['episode_count'].replace('Unknown', 500)
anime_details['episode_count'] = pd.to_numeric(anime_details['episode_count'], errors='coerce')
embeddings_2d_df['episode_count'] = anime_details['episode_count']

fig = px.scatter(embeddings_2d_df, x='Dimension 1', y='Dimension 2', color='genre', symbol='type', size='episode_count', hover_data=['title'])

fig.update_traces(marker=dict(opacity=0.5))

fig.update_layout(title='t-SNE Visualization of Anime Embeddings')

fig.show()