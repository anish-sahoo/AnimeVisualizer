import time
import logging as log

from etl.extract import fetch
from etl.transform import transform_rank_data, clean
from etl.load import write
from etl.config import generate_ranking_urls, generate_anime_details_url

log.basicConfig(level=log.INFO, format='%(asctime)s [%(levelname)s] %(message)s')

def scrape_all():
    for url in generate_ranking_urls():
        data = fetch(url)
        if not data or "data" not in data:
            continue

        for entry in data["data"]:
            rank_info = transform_rank_data(entry)
            if None in rank_info.values():
                continue

            anime_details = fetch(generate_anime_details_url(rank_info["id"]))
            if not anime_details:
                continue

            cleaned_data = clean(anime_details)
            write(cleaned_data)
            time.sleep(3)

if __name__ == "__main__":
    log.info("Starting ETL pipeline")
    scrape_all()
