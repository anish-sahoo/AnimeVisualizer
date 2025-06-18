import pandas as pd
import tensorflow as tf
import tensorflow_hub as hub
from sklearn.preprocessing import OneHotEncoder, StandardScaler
import numpy as np
from pymongo import MongoClient

# Connect to MongoDB
client = MongoClient('mongodb://localhost:27017/')
db = client.anime_database
collection = db.anime_details

# Fetch data from MongoDB
data = list(collection.find())
client.close()

# Convert JSON data to pandas DataFrame
df = pd.DataFrame(data)

# Handle missing data
df['synopsis'] = df['synopsis'].fillna('')
df['genres'] = df['genres'].fillna('')
df['themes'] = df['themes'].fillna('')
df['demographic'] = df['demographic'].fillna('')

# Handle 'Unknown' and other non-numeric values in 'episode_count'
df['episode_count'] = pd.to_numeric(df['episode_count'], errors='coerce').fillna(0).astype(int)
df['year_first_aired'] = pd.to_numeric(df['year_first_aired'], errors='coerce').fillna(0).astype(int)

# Load the Universal Sentence Encoder
embed = hub.load("https://tfhub.dev/google/universal-sentence-encoder/4")

# Generate embeddings for the synopsis and title
synopsis_embeddings = embed(df['synopsis'].tolist()).numpy()
title_embeddings = embed(df['title'].tolist()).numpy()

# Convert genres, themes, and demographic to numerical vectors using one-hot encoding
genres_encoder = OneHotEncoder()
themes_encoder = OneHotEncoder()
demographic_encoder = OneHotEncoder()

# Split genres and themes by ', ' and explode the DataFrame for multi-label encoding
df['genres_split'] = df['genres'].apply(lambda x: x.split(', '))
df['themes_split'] = df['themes'].apply(lambda x: x.split(', '))
df_exploded_genres = df.explode('genres_split')
df_exploded_themes = df.explode('themes_split')

# One-hot encode the exploded genres and themes
genres_encoded = genres_encoder.fit_transform(df_exploded_genres[['genres_split']])
themes_encoded = themes_encoder.fit_transform(df_exploded_themes[['themes_split']])

# Convert sparse matrices to dense and sum the encoded genres and themes for each original anime entry
genres_encoded_dense = pd.DataFrame(genres_encoded.toarray(), columns=genres_encoder.categories_[0], index=df_exploded_genres.index)
themes_encoded_dense = pd.DataFrame(themes_encoded.toarray(), columns=themes_encoder.categories_[0], index=df_exploded_themes.index)
genres_encoded_summed = genres_encoded_dense.groupby(df_exploded_genres.index).sum()
themes_encoded_summed = themes_encoded_dense.groupby(df_exploded_themes.index).sum()

# One-hot encode the demographic
demographic_encoded = demographic_encoder.fit_transform(df[['demographic']]).toarray()
demographic_encoded_df = pd.DataFrame(demographic_encoded, columns=demographic_encoder.categories_[0])

# Standardize episode count and year first aired
scaler = StandardScaler()
episode_year_scaled = scaler.fit_transform(df[['episode_count', 'year_first_aired']])
episode_year_scaled_df = pd.DataFrame(episode_year_scaled, columns=['episode_count_scaled', 'year_first_aired_scaled'])

# Convert 'score' to numeric and handle missing values
df['score'] = pd.to_numeric(df['score'], errors='coerce').fillna(0)

# Standardize 'score'
score_scaler = StandardScaler()
score_scaled = score_scaler.fit_transform(df[['score']])
score_scaled_df = pd.DataFrame(score_scaled, columns=['score_scaled'])

# Combine all embeddings including the standardized 'score'
combined_embeddings = pd.DataFrame(synopsis_embeddings)
combined_embeddings = pd.concat([
    combined_embeddings, 
    pd.DataFrame(title_embeddings), 
    genres_encoded_summed.reset_index(drop=True), 
    themes_encoded_summed.reset_index(drop=True), 
    demographic_encoded_df.reset_index(drop=True),
    # episode_year_scaled_df.reset_index(drop=True),
    # score_scaled_df  # Include standardized 'score'
], axis=1)

# Select the columns to store
columns_to_store = ['title', 'english_title', 'japanese_title', 'score', 'genres', 'themes', 'demographic', 'synopsis', 'url', 'studio', 'type', 'episode_count', 'year_first_aired']

# Create a new DataFrame with these columns
df_to_store = df[columns_to_store]

# Save the DataFrame as a CSV file
df_to_store.to_csv('anime_details.csv', index=False)

# Save the embeddings as a CSV file
combined_embeddings.to_csv('anime_embeddings.csv', index=False)