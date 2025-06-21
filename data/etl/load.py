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
    # In future: insert into DB
    log.info(f"Writing data: {data['id']} - {data['title']}")
