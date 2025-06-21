import time
import logging as log
from rich.logging import RichHandler

from etl.extract import fetch
from etl.transform import transform_rank_data, clean
from etl.load import write, close_db_connection
from etl.config import generate_ranking_urls, generate_anime_details_url

log.basicConfig(
    level=log.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[RichHandler()]
)

def scrape_all():
    for url in generate_ranking_urls():
        data = fetch(url)
        if not data or "data" not in data:
            continue

        for entry in data["data"]:
            rank_info = transform_rank_data(entry)
            if None in rank_info.values():
                continue

            anime_details = fetch(generate_anime_details_url(rank_info.get('id')))
            if not anime_details:
                log.warning(f'Skipping {rank_info.get('id', 'Unknown Id')} - API returned nothing')
                continue

            cleaned_data = clean(anime_details)
            if cleaned_data[0] is None:
                log.warning(f'Skipping {entry.get('id', 'Unknown Id')} - {entry.get('title', 'Unknown Name')} - Error in cleaning')
                continue
            write(cleaned_data)
            time.sleep(3)

if __name__ == "__main__":
    log.info("Starting ETL pipeline")
    try:
        scrape_all()
    except Exception as e:
        log.exception(f'Error scraping: {e}')
    finally:
        close_db_connection()
