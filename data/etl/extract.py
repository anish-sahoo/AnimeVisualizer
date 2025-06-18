import requests
import time
import logging as log
from etl.config import HEADERS

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
