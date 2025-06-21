import requests
import time
import logging as log
from rich.logging import RichHandler
from etl.config import HEADERS

log.basicConfig(
    level=log.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[RichHandler()]
)

# https://api.myanimelist.net/v2/anime/30230?fields=id,title,main_picture,alternative_titles,start_date,end_date,synopsis,mean,rank,popularity,num_list_users,num_scoring_users,nsfw,created_at,updated_at,media_type,status,genres,my_list_status,num_episodes,start_season,broadcast,source,rating,pictures,studios,statistics

def fetch(url):
    try:
        response = requests.get(url, headers=HEADERS)
        if response.status_code == 429:
            log.warning(f"Rate limited: {url}")
        elif response.status_code >= 400:
            log.warning(f"HTTP error {response.status_code} at {url}")
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        log.warning(f"Request failed for {url}: {e}")
        return None
