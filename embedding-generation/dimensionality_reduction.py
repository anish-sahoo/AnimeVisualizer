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
prioritized_genres = ['romance','sports', 'action', 'drama', 'mystery', 'adventure', 'thriller', 'horror']

# Function to select the first prioritized genre
def select_genre(genres):
    for genre in genres:
        if genre.lower() in prioritized_genres:
            return genre
    return genres[0]

# Add 'first_genre' to the DataFrame
embeddings_2d_df['genres'] = anime_details['genres']
embeddings_2d_df['type'] = anime_details['type']

# Handle 'episode_count' to ensure it is numeric
anime_details['episode_count'] = anime_details['episode_count'].replace('Unknown', 500)
anime_details['episode_count'] = pd.to_numeric(anime_details['episode_count'], errors='coerce')

embeddings_2d_df['episode_count'] = anime_details['episode_count']
embeddings_2d_df['score'] = anime_details['score']
embeddings_2d_df['year_first_aired'] = anime_details['year_first_aired']

# Add 'rank' to the DataFrame
embeddings_2d_df['ranked'] = anime_details['ranked']
embeddings_2d_df['members_count'] = anime_details['members_count']
embeddings_2d_df['favorited_count'] = anime_details['favorited_count']

embeddings_2d_df['studio'] = anime_details['studio']
embeddings_2d_df['synopsis'] = anime_details['synopsis']

# Save the combined DataFrame with the reduced dimension embeddings and anime details to a CSV file
embeddings_2d_df.to_csv('anime_embeddings_2d.csv', index=False)

print(embeddings_2d_df.head())
# Save the combined DataFrame with the reduced dimension embeddings and anime details to a CSV file
embeddings_2d_df.to_csv('anime_embeddings_2d.csv', index=False)

