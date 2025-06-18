import pandas as pd
import matplotlib.pyplot as plt
import tensorflow as tf
import tensorflow_hub as hub
from sklearn.preprocessing import OneHotEncoder
import json
import numpy as np

# Load JSON data
with open('anime_database.anime_details.json', 'r') as file:
    data = json.load(file)

# Convert JSON data to pandas DataFrame
df = pd.DataFrame(data)

# Handle missing data
df['synopsis'] = df['synopsis'].fillna('')
df['genres'] = df['genres'].fillna('')

# Load the Universal Sentence Encoder
embed = hub.load("https://tfhub.dev/google/universal-sentence-encoder/4")

# Generate embeddings for the synopsis
synopsis_embeddings = embed(df['synopsis'].tolist())

# Convert TensorFlow tensor to numpy array
synopsis_embeddings = synopsis_embeddings.numpy()

# Convert genres to numerical vectors using one-hot encoding
one_hot_encoder = OneHotEncoder()

# Split genres by ', ' and explode the DataFrame for multi-label encoding
df['genres_split'] = df['genres'].apply(lambda x: x.split(', '))
df_exploded = df.explode('genres_split')

# One-hot encode the exploded genres
genres_encoded = one_hot_encoder.fit_transform(df_exploded[['genres_split']])

# Convert sparse matrix to dense and sum the encoded genres for each original anime entry
genres_encoded_dense = pd.DataFrame(genres_encoded.toarray(), columns=one_hot_encoder.categories_[0], index=df_exploded.index)
genres_encoded_summed = genres_encoded_dense.groupby(df_exploded.index).sum()

# Combine the USE embeddings with the one-hot encoded genres
combined_embeddings = pd.DataFrame(synopsis_embeddings)
combined_embeddings = pd.concat([combined_embeddings, genres_encoded_summed.reset_index(drop=True)], axis=1)

# Select the columns to store
columns_to_store = ['title', 'english_title', 'japanese_title', 'score', 'genres', 'themes', 'demographic', 'synopsis', 'url', 'studio', 'type', 'episode_count', 'year_first_aired']

# Create a new DataFrame with these columns
df_to_store = df[columns_to_store]

# Save the DataFrame as a CSV file
df_to_store.to_csv('anime_details.csv', index=False)

# Save the embeddings as a CSV file
combined_embeddings.to_csv('anime_embeddings.csv', index=False)
