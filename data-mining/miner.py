# scrape the names of the top 200 most popular anime on MAL.

import requests
from bs4 import BeautifulSoup
import time
import json
import re
import pymongo

def get_top_anime_urls(limit=1000):
    top_anime_urls = []
    base_url = 'https://myanimelist.net/topanime.php?limit='
    offset = 0

    while len(top_anime_urls) < limit:
        url = base_url + str(offset)
        response = requests.get(url)
        soup = BeautifulSoup(response.content, 'html.parser')
        
        anime_list = soup.find_all('tr', class_='ranking-list')
        for anime in anime_list:
            link = anime.find('a', class_='hoverinfo_trigger')['href']
            top_anime_urls.append(link)
        print(f'Collected {len(top_anime_urls)} anime URLs')
        offset += 50
        time.sleep(1)  # To avoid hitting rate limits
    return top_anime_urls[:limit]

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}


def get_anime_details(anime_url):
    response = requests.get(anime_url, headers=headers)
    if response.status_code != 200:
        print(f"Failed to fetch {anime_url}: Status code {response.status_code}")
        return None
    
    soup = BeautifulSoup(response.content, 'html.parser')
    
    # Safely extract the English title
    english_title_tag = soup.find('p', class_='title-english')
    english_title = english_title_tag.text.strip() if english_title_tag else None
    
    # Safely extract the Japanese title
    japanese_title_tag = soup.find('h1', class_='title-name h1_bold_none')
    japanese_title = japanese_title_tag.find('strong').text.strip() if japanese_title_tag and japanese_title_tag.find('strong') else None
    
    # Use English title as primary title if available, otherwise use Japanese title
    title = english_title if english_title else japanese_title if japanese_title else 'Unknown Title'
    
    # Safely extract the score
    score_tag = soup.find('div', class_='score-label')
    score = score_tag.text.strip() if score_tag else 'N/A'

    # Safely extract synopsis
    synopsis_tag = soup.find('p', itemprop='description')
    synopsis = synopsis_tag.text.strip() if synopsis_tag else 'No synopsis available'
    synopsis = re.sub(r'[\n\r\t]', ' ', synopsis)
    synopsis = synopsis.split('[Written by MAL Rewrite]')[0].strip()
    
    studio_tag = soup.find('span', class_='information studio author')
    if studio_tag:
        studios = studio_tag.text.strip()
        studios = [studio.strip() for studio in studios.split(',')]
        studio = ', '.join(studios)
    else:
        studio = 'Unknown Studio'

    # Safely extract the type (movie, TV series, etc.)
    type_tag = soup.find('span', class_='information type')
    type = type_tag.text.strip() if type_tag else 'Unknown Type'

    theme_element = soup.find('span', string='Themes:')
    genre_element = soup.find('span', string='Genres:') or soup.find('span', itemprop='genre')

    # Extract the genres
    genre = ', '.join([a.text.strip() for a in genre_element.find_next_siblings('a')]) if genre_element else 'Unknown'
    
    demographic_element = soup.find('span', string='Demographic:')

    theme = ', '.join([a.text.strip() for a in theme_element.find_next_siblings('a')]) if theme_element else 'Unknown'
    # genre = ', '.join([a.text.strip() for a in genre_element.find_next_siblings('a')]) if genre_element else 'Unknown'
    demographic = demographic_element.find_next('a').text.strip() if demographic_element else 'Unknown'

    episodes_tag = soup.find('span', string='Episodes:')
    episode_count = episodes_tag.find_next_sibling(string=True).strip() if episodes_tag else 'Unknown'
    
    aired_tag = soup.find('span', string='Aired:')
    aired_year = re.search(r'\d{4}', aired_tag.find_next_sibling(string=True).strip()).group() if aired_tag else 'Unknown'
    
    
    print(f'Fetched details for {title} {episode_count} {aired_year} {genre.split(',')[0]} successfully')

    return {
        'title': title,
        'english_title': english_title,
        'japanese_title': japanese_title,
        'score': score,
        'genres': genre,
        'themes': theme,
        'demographic': demographic,
        'synopsis': synopsis,
        'url': anime_url,
        'studio': studio,
        'type': type,
        'episode_count': episode_count,
        'year_first_aired': aired_year,
    }

top_anime_urls = get_top_anime_urls()
anime_details_list = []

for url in top_anime_urls:
    details = get_anime_details(url)
    anime_details_list.append(details)
    time.sleep(1)  # To avoid hitting rate limits

# Print or save the anime details
for anime in anime_details_list:
    print(json.dumps(anime, indent=2))

# Establish MongoDB connection
client = pymongo.MongoClient("mongodb://localhost:27017/")  # Assuming MongoDB is running locally
db = client["anime_database"]  # Name of your MongoDB database
collection = db["anime_details"]  # Name of your collection

# Storing anime details in MongoDB
for anime in anime_details_list:
    collection.insert_one(anime)
    print(f"Inserted {anime['title']} into MongoDB")

client.close()  # Close the MongoDB connection when done