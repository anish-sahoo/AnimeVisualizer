from datetime import datetime

def transform_rank_data(raw_data):
    return {
        "id": raw_data.get("node", {}).get("id"),
        "title": raw_data.get("node", {}).get("title"),
        "main_picture": raw_data.get("node", {}).get("main_picture", {}).get("large"),
        "rank": raw_data.get("ranking", {}).get("rank", -1)
    }

def clean(anime_details):
    if anime_details['nsfw'] == "black" or anime_details['rating'] == 'rx':
        return None
    anime = {}
    anime['id'] = anime_details.get('id')
    anime['title'] = anime_details.get('title')
    anime['thumbnail'] = anime_details.get('main_picture').get('large', anime_details.get('main_picture').get('medium', None))
    anime['start_date'] = anime_details.get('start_date')
    anime['age_rating'] = anime_details.get('rating')
    anime['end_date'] = anime_details.get('end_date')
    anime['synopsis'] = anime_details.get('synopsis')
    anime['score'] = anime_details.get('mean')
    anime['rank'] = anime_details.get('rank')
    anime['popularity'] = anime_details.get('popularity')
    anime['num_list_users'] = anime_details.get('num_list_users')
    anime['num_scoring_users'] = anime_details.get('num_scoring_users')
    anime['updated_at'] = anime_details.get('updated_at')
    anime['last_scraped_at'] = datetime.now()
    anime['media_type'] = anime_details.get('media_type')
    anime['status'] = anime_details.get('status')
    anime['num_episodes'] = anime_details.get('num_episodes')
    anime['source'] = anime_details.get('source')
    
    genres = anime_details.get('genres', [])
    studios = anime_details.get('studios', [])
    
    return (anime, genres, studios)
