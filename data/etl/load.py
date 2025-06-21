import logging as log
from rich.logging import RichHandler
from etl.postgres_etl import PostgresETL

log.basicConfig(
    level=log.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[RichHandler()]
)

db = PostgresETL()

def write(data):
    anime_details, genres, studios = data
    anime_id = anime_details['id']
    
    # log.info(f"Writing data: {anime_id} - {anime_details['title']}")
    try:
        db.insert_anime(anime_details)
    except Exception as e:
        log.exception(f'Failed to insert anime {anime_id} - {anime_details['title']} -> {e}')
        return
    
    for genre in genres:
        genre_id = db.get_genre_id_or_create_new(genre)
        if genre_id is None:
            log.warning(f'Error retrieving genre_id for genre {genre.get('name')}, skipping write')
            return
        db.link_anime_to_genre(anime_id, genre_id)
    
    for studio in studios:
        studio_id = db.get_studio_id_or_create_new(studio)
        if studio_id is None:
            log.warning(f'Error creating genre_id for genre {studio.get('name')}, skipping write')
            return
        db.link_anime_to_studio(anime_id, studio_id)

def close_db_connection():
    db.close()