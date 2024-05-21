# scrape the names of the top 200 most popular anime on MAL.

import requests
from bs4 import BeautifulSoup
import time
import json

def get_top_anime_urls(limit=200):
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
    
    # Safely extract the title
    title_tag = soup.find('h1', class_='title-name h1_bold_none')
    title = title_tag.find('strong').text.strip() if title_tag and title_tag.find('strong') else 'Unknown Title'
    
    # Safely extract the score
    score_tag = soup.find('div', class_='score-label')
    score = score_tag.text.strip() if score_tag else 'N/A'
    
    # Safely extract genres
    genres_tags = soup.find_all('span', itemprop='genre')
    genres = [genre.text for genre in genres_tags] if genres_tags else []
    
    # Safely extract synopsis
    synopsis_tag = soup.find('p', itemprop='description')
    synopsis = synopsis_tag.text.strip() if synopsis_tag else 'No synopsis available'
    
    # Safely extract the studio
    studio_tag = soup.find('span', class_='information studio')
    studio = studio_tag.text.strip() if studio_tag else 'Unknown Studio'

    # Safely extract the author
    author_tag = soup.find('span', class_='information studio author')
    author = author_tag.text.strip() if author_tag else 'Unknown Author'

    # Safely extract the type (movie, TV series, etc.)
    type_tag = soup.find('span', class_='information type')
    type = type_tag.text.strip() if type_tag else 'Unknown Type'

    print(f'Fetched details for {title}')
    return {
        'title': title,
        'score': score,
        'genres': genres,
        'synopsis': synopsis,
        'url': anime_url,
        'studio': studio,
        'author': author,
        'type': type
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

