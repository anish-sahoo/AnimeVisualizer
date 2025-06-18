import logging as log

def write(data):
    # In future: insert into DB
    log.info(f"Writing data: {data['id']} - {data['title']}")
