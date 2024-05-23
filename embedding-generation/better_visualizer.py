import pandas as pd
from sklearn.manifold import TSNE
import numpy as np
import plotly.express as px

# Load the new combined embeddings
combined_embeddings_df = pd.read_csv('anime_embeddings.csv')

# Convert the embeddings DataFrame to a numpy array
combined_embeddings_array = np.array(combined_embeddings_df)

# Perform dimensionality reduction with t-SNE
tsne = TSNE(n_components=2, random_state=42, verbose=1)
embeddings_2d = tsne.fit_transform(combined_embeddings_array)

# Load anime details
anime_details = pd.read_csv('anime_details.csv')

# Create a DataFrame with the reduced dimension embeddings
embeddings_2d_df = pd.DataFrame(embeddings_2d, columns=['Dimension 1', 'Dimension 2'])

# Concatenate the anime details with the reduced dimension embeddings
combined_df = pd.concat([anime_details, embeddings_2d_df], axis=1)

# Add title, genre, type, and episode_count to the embeddings DataFrame
embeddings_2d_df['title'] = anime_details['title']
embeddings_2d_df['demographic'] = anime_details['demographic']

# Define your prioritized genres
prioritized_genres = ['romance','sports', 'action', 'drama', 'mystery', 'adventure']

# Function to select the first prioritized genre
def select_genre(genres):
    for genre in genres:
        if genre.lower() in prioritized_genres:
            return genre
    return genres[0]

# Extract the first prioritized genre
anime_details['first_genre'] = anime_details['genres'].str.split(',').apply(select_genre)

# Add 'first_genre' to the DataFrame
embeddings_2d_df['genre'] = anime_details['first_genre']
embeddings_2d_df['type'] = anime_details['type']

# Handle 'episode_count' to ensure it is numeric
anime_details['episode_count'] = anime_details['episode_count'].replace('Unknown', 500)
anime_details['episode_count'] = pd.to_numeric(anime_details['episode_count'], errors='coerce')

embeddings_2d_df['episode_count'] = anime_details['episode_count']
embeddings_2d_df['score'] = anime_details['score']
embeddings_2d_df['year_first_aired'] = anime_details['year_first_aired']

# Create the plot using Plotly
fig = px.scatter(embeddings_2d_df, 
                 x='Dimension 1', 
                 y='Dimension 2', 
                 color='genre', 
                 symbol='genre', 
                 size='episode_count', 
                 hover_data=['title'])

# Update the marker opacity
fig.update_traces(marker=dict(opacity=0.5,sizemin=3))
# , sizeref=10, sizemin=3

# Update the layout of the plot
fig.update_layout(title='t-SNE Visualization of Anime Embeddings')

# Show the plot
fig.show()
