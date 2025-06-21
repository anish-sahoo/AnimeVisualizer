FROM python:3.12.11-alpine3.22

# Uses an Alpine image for now, we can replace later with a debian based image
RUN apk add --no-cache dcron

WORKDIR /app

COPY requirements.txt /app/
RUN pip3 install --no-cache-dir -r requirements.txt

COPY scrape.py /app/

COPY crontab /etc/cron.d/etl-cron
RUN chmod 0644 /etc/cron.d/etl-cron

RUN crontab /etc/cron.d/etl-cron

RUN touch /var/log/cron.log

CMD ["sh", "-c", "crond && tail -f /var/log/cron.log"]
