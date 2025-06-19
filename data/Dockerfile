FROM python:3.12.11-alpine3.22

RUN apt-get update && apt-get install -y cron

WORKDIR /app

COPY requirements.txt /app/
RUN pip3 install --no-cache-dir -r requirements.txt

COPY scrape.py /app/

COPY crontab /etc/cron.d/etl-cron
RUN chmod 0644 /etc/cron.d/etl-cron

RUN crontab /etc/cron.d/etl-cron

RUN touch /var/log/cron.log

CMD ["sh", "-c", "cron && tail -f /var/log/cron.log"]
