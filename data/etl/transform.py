def transform_rank_data(raw_data):
    return {
        "id": raw_data.get("node", {}).get("id"),
        "title": raw_data.get("node", {}).get("title"),
        "main_picture": raw_data.get("node", {}).get("main_picture", {}).get("large"),
        "rank": raw_data.get("ranking", {}).get("rank", -1)
    }

def clean(anime_details):
    return anime_details
