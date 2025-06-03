import requests
from bs4 import BeautifulSoup
import time
import json

def get_top_manga_urls(limit=200):
    top_manga_urls = []
    base_url = 'https://myanimelist.net/topmanga.php?limit='
    offset = 0

    while len(top_manga_urls) < limit:
        url = base_url + str(offset)
        response = requests.get(url)
        soup = BeautifulSoup(response.content, 'html.parser')
        
        manga_list = soup.find_all('tr', class_='ranking-list')
        for manga in manga_list:
            link = manga.find('a', class_='hoverinfo_trigger')['href']
            top_manga_urls.append(link)
        print(f'Collected {len(top_manga_urls)} manga URLs')
        offset += 50
        time.sleep(1)  # To avoid hitting rate limits
    return top_manga_urls[:limit]

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}

def get_manga_details(manga_url):
    response = requests.get(manga_url)
    if response.status_code != 200:
        print(f"Failed to fetch {manga_url}: Status code {response.status_code}")
        return None
    
    soup = BeautifulSoup(response.content, 'html.parser')
    
    # Safely extract the title
    title_tag = soup.find('span', itemprop='name')
    title = title_tag.text.strip() if title_tag else 'Unknown Title'

    # Check if there's an English title
    english_title_tag = soup.find('span', class_='title-english')
    if english_title_tag:
        title = english_title_tag.text.strip()
    
    # Safely extract the score
    score_tag = soup.find('div', class_='score-label')
    score = score_tag.text.strip() if score_tag else 'N/A'
    
    # Safely extract genres
    genres_tags = soup.find_all('span', itemprop='genre')
    genres = [genre.text for genre in genres_tags] if genres_tags else []
    
    # Safely extract synopsis
    synopsis_tag = soup.find('span', itemprop='description')
    synopsis = synopsis_tag.text.strip() if synopsis_tag else 'No synopsis available'
    
    # Safely extract the author
    author_tag = soup.find('span', class_='information studio author')
    author = author_tag.text.strip() if author_tag else 'Unknown Author'

    # Safely extract the type (manga, one-shot, etc.)
    type_tag = soup.find('span', class_='information type')
    type = type_tag.text.strip() if type_tag else 'Unknown Type'

    print(f'Fetched details for {title}')
    
    return {
        'title': title,
        'score': score,
        'genres': genres,
        'synopsis': synopsis,
        'url': manga_url,
        'author': author,
        'type': type
    }


top_manga_urls = get_top_manga_urls()
manga_details_list = []

for url in top_manga_urls:
    details = get_manga_details(url)
    manga_details_list.append(details)
    time.sleep(1)  # To avoid hitting rate limits

# Print or save the manga details
for manga in manga_details_list:
    print(json.dumps(manga, indent=2))
