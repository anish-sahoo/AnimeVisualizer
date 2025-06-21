import psycopg
from dotenv import load_dotenv
import os
import logging as log
from rich.logging import RichHandler

log.basicConfig(
    level=log.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[RichHandler()]
)

class PostgresETL:
    def __init__(self):
        load_dotenv()
        self.conn_params = {
            "host": os.getenv("POSTGRES_HOST"),
            "port": os.getenv("POSTGRES_PORT"),
            "dbname": os.getenv("POSTGRES_DB"),
            "user": os.getenv("POSTGRES_USER"),
            "password": os.getenv("POSTGRES_PASSWORD")
        }
        self.conn = None
        self.connect()

    def connect(self):
        if self.conn is None or self.conn.closed:
            self.conn = psycopg.connect(**self.conn_params)
            log.info("Postgres connection opened.")

    def close(self):
        if self.conn and not self.conn.closed:
            self.conn.close()
            log.info("Postgres connection closed.")

    def insert_anime(self, columns, row):
        placeholders = ", ".join(["%s"] * len(columns))
        columns_str = ", ".join(columns)
        query = f"INSERT INTO anime ({columns_str}) VALUES ({placeholders})"
        try:
            self.connect()
            with self.conn.cursor() as cur:
                cur.execute(query, row)
            self.conn.commit()
            return True
        except Exception as e:
            log.info(f"Error inserting row: {e}")
            if self.conn:
                self.conn.rollback()
            return False
                
    def get_genre_id_or_create_new(self, genre):
        try:
            self.connect()
            with self.conn.cursor() as cur:
                cur.execute("SELECT id FROM genres WHERE id = %s", (genre["id"],))
                result = cur.fetchone()
                if result:
                    return result[0]
                cur.execute(
                    "INSERT INTO genres (id, name) VALUES (%s, %s) RETURNING id",
                    (genre["id"], genre["name"])
                )
                genre_id = cur.fetchone()[0]
                self.conn.commit()
                return genre_id
        except Exception as e:
            log.info(f"Error getting or creating genre: {e}")
            if self.conn:
                self.conn.rollback()
            return None

    def link_anime_to_genre(self, anime_id, genre_id):
        try:
            self.connect()
            with self.conn.cursor() as cur:
                cur.execute(
                    "INSERT INTO anime_genres (anime_id, genre_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
                    (anime_id, genre_id)
                )
            self.conn.commit()
        except Exception as e:
            log.info(f"Error linking anime to genre: {e}")
            if self.conn:
                self.conn.rollback()

    def get_studio_id_or_create_new(self, studio):
        try:
            self.connect()
            with self.conn.cursor() as cur:
                cur.execute("SELECT id FROM studios WHERE id = %s", (studio["id"],))
                result = cur.fetchone()
                if result:
                    return result[0]
                cur.execute(
                    "INSERT INTO studios (id, name) VALUES (%s, %s) RETURNING id",
                    (studio["id"], studio["name"])
                )
                studio_id = cur.fetchone()[0]
                self.conn.commit()
                return studio_id
        except Exception as e:
            log.info(f"Error getting or creating studio: {e}")
            if self.conn:
                self.conn.rollback()
            return -1

    def link_anime_to_studio(self, anime_id, studio_id):
        try:
            self.connect()
            with self.conn.cursor() as cur:
                cur.execute(
                    "INSERT INTO anime_studios (anime_id, studio_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
                    (anime_id, studio_id)
                )
            self.conn.commit()
        except Exception as e:
            log.info(f"Error linking anime to studio: {e}")
            if self.conn:
                self.conn.rollback()
