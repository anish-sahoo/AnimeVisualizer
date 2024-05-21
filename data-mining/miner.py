# scrape the names of the top 200 most popular anime on MAL.

import requests
from bs4 import BeautifulSoup
import time
import json
import re

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
    
    # Safely extract genres
    # genres_tags = soup.find_all('span', itemprop='genre')
    # genres = [genre.text for genre in genres_tags] if genres_tags else []
    
    # Safely extract synopsis
    synopsis_tag = soup.find('p', itemprop='description')
    synopsis = synopsis_tag.text.strip() if synopsis_tag else 'No synopsis available'
    synopsis = re.sub(r'[\n\r\t]', ' ', synopsis)
    synopsis = synopsis.split('[Written by MAL Rewrite]')[0].strip()
    
    # Safely extract the studio
    # studio_tag = soup.find('span', class_='information studio author')
    # studio = studio_tag.text.strip() if studio_tag else 'Unknown Studio'
    
    studio_tag = soup.find('span', class_='information studio author')
    if studio_tag:
        studios = studio_tag.text.strip()
        studios = [studio.strip() for studio in studios.split(',')]
        studio = ', '.join(studios)
    else:
        studio = 'Unknown Studio'

    # Safely extract the author
    # author_tag = soup.find('span', class_='information studio author')
    # author = author_tag.text.strip() if author_tag else 'Unknown Author'

    # Safely extract the type (movie, TV series, etc.)
    type_tag = soup.find('span', class_='information type')
    type = type_tag.text.strip() if type_tag else 'Unknown Type'

    theme_element = soup.find('span', text='Themes:')
    genre_element = soup.find('span', text='Genres:')
    
    # genres_tag = soup.find('span', text='Genres:')
    # if genres_tag:
    #     genres = [a.text.strip() for a in genres_tag.find_next_siblings('a')]
    #     genres = ', '.join(genres)
    # else:
    #     genres = 'Unknown Genres'

    # print(f'Genres: {genres}')

    
    demographic_element = soup.find('span', text='Demographic:')

    # Extract the theme, genre, and demographic values
    theme = ', '.join([a.text.strip() for a in theme_element.find_next_siblings('a')]) if theme_element else 'Unknown'
    genre = ', '.join([a.text.strip() for a in genre_element.find_next_siblings('a')]) if genre_element else 'Unknown'
    demographic = demographic_element.find_next('a').text.strip() if demographic_element else 'Unknown'

    print(f'Fetched details for {title}')
    # print(json.dumps({
    #     'title': title,
    #     'english_title': english_title,
    #     'japanese_title': japanese_title,
    #     'score': score,
    #     'genres': genre,
    #     'themes': theme,
    #     'demographic': demographic,
    #     'synopsis': synopsis,
    #     'url': anime_url,
    #     'studio': studio,
    #     'type': type
    # }, indent=2))

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
        'type': type
    }


# def get_anime_details(anime_url):
#     response = requests.get(anime_url, headers=headers)
#     if response.status_code != 200:
#         print(f"Failed to fetch {anime_url}: Status code {response.status_code}")
#         return None
    
#     soup = BeautifulSoup(response.content, 'html.parser')
    
#     # Safely extract the title
#     title_tag = soup.find('h1', class_='title-name h1_bold_none')
#     title = title_tag.find('strong').text.strip() if title_tag and title_tag.find('strong') else 'Unknown Title'
    
#     # Safely extract the score
#     score_tag = soup.find('div', class_='score-label')
#     score = score_tag.text.strip() if score_tag else 'N/A'
    
#     # Safely extract genres
#     genres_tags = soup.find_all('span', itemprop='genre')
#     genres = [genre.text for genre in genres_tags] if genres_tags else []
    
#     # Safely extract synopsis
#     synopsis_tag = soup.find('p', itemprop='description')
#     synopsis = synopsis_tag.text.strip() if synopsis_tag else 'No synopsis available'
    
#     # Safely extract the studio
#     studio_tag = soup.find('span', class_='information studio')
#     studio = studio_tag.text.strip() if studio_tag else 'Unknown Studio'

#     # Safely extract the author
#     author_tag = soup.find('span', class_='information studio author')
#     author = author_tag.text.strip() if author_tag else 'Unknown Author'

#     # Safely extract the type (movie, TV series, etc.)
#     type_tag = soup.find('span', class_='information type')
#     type = type_tag.text.strip() if type_tag else 'Unknown Type'

#     print(f'Fetched details for {title}')
#     return {
#         'title': title,
#         'score': score,
#         'genres': genres,
#         'synopsis': synopsis,
#         'url': anime_url,
#         'studio': studio,
#         'author': author,
#         'type': type
#     }

top_anime_urls = get_top_anime_urls()
anime_details_list = []

for url in top_anime_urls:
    details = get_anime_details(url)
    anime_details_list.append(details)
    time.sleep(1)  # To avoid hitting rate limits

# Print or save the anime details
for anime in anime_details_list:
    print(json.dumps(anime, indent=2))

