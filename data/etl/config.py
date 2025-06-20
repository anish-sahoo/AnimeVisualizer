import os
from dotenv import load_dotenv
import math

load_dotenv()

BASE_URL = os.getenv("MAL_API_URL")
CLIENT_ID = os.getenv("MAL_CLIENT_ID")

HEADERS = {
    "User-Agent": "Mozilla/5.0",
    "X-MAL-CLIENT-ID": CLIENT_ID
}

FIELDS = [
    "id","title","main_picture","start_date","end_date","synopsis",
    "mean","rank","popularity","num_list_users","num_scoring_users",
    "genres","updated_at","last_scraped_at","media_type","status",
    "num_episodes","source","studios", "nsfw", "rating"
]

TOTAL_AMOUNT_TO_SCRAPE = 10
PAGE_SIZE = 500

def generate_anime_details_url(anime_id):
    return f"{BASE_URL}/anime/{anime_id}?fields={','.join(FIELDS)}"

def generate_ranking_urls():
    return [
        f"{BASE_URL}/anime/ranking?ranking_type=all&limit={PAGE_SIZE}&offset={i*PAGE_SIZE}"
        for i in range(math.ceil(TOTAL_AMOUNT_TO_SCRAPE / PAGE_SIZE))
    ]
