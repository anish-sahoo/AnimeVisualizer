import pandas as pd
import cudf
import cuml
import cupy as cp
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

# Save the embeddings
# combined_embeddings.to_csv('anime_embeddings.csv', index=False)
# Or, save using another format if preferred:
combined_embeddings.to_json('anime_embeddings.json', orient='split')
# np.save('anime_embeddings.npy', combined_embeddings.to_numpy())
# combined_embeddings.to_pickle('anime_embeddings.pkl')

# Convert pandas DataFrame to cuDF DataFrame
# combined_embeddings_cudf = cudf.DataFrame.from_pandas(combined_embeddings)

# # Perform dimensionality reduction with t-SNE using cuML
# tsne = cuml.TSNE(n_components=2, random_state=42)
# embeddings_2d_cudf = tsne.fit_transform(combined_embeddings_cudf)

# # Convert embeddings to pandas DataFrame for plotting
# embeddings_2d = embeddings_2d_cudf.to_pandas()

# # Plot the embeddings with genre coloring
# plt.figure(figsize=(10, 8))
# plt.scatter(embeddings_2d.iloc[:, 0], embeddings_2d.iloc[:, 1], alpha=0.5, s=2)

# # Optionally, add labels for a few points
# for i, title in enumerate(df['title'].head(10)):  # Change to a suitable number
#     plt.annotate(title, (embeddings_2d.iloc[i, 0], embeddings_2d.iloc[i, 1]))

# plt.title('t-SNE Visualization of Anime Embeddings (cuML)')
# plt.xlabel('Dimension 1')
# plt.ylabel('Dimension 2')
# plt.show()
