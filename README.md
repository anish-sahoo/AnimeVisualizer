# AnimeVisualizer

Goals:
- Scrape the website for all info about top 1000 anime or manga (or both)
  - use beautifulsoup as api rate limit is too small
  - find an effective way to get comments
  - must needed fields: name, author/studio, genres, audience, score, etc.
- generate embeddings of different kinds from these
  - text based, plot based, score based, things similar people have seen.
- visualize those in a website

## System Architecture
```mermaid
graph TD
  A["PixiJS UI"]:::ui
  B["Static Points File (JSON)"]:::infra
  C["GraphQL API"]:::backend
  D["REST Endpoint (for static file)"]:::backend
  E["Redis (Cache)"]:::infra
  F["PostgreSQL (Data Store)"]:::infra
  G["Elasticsearch (Vector Search)"]:::infra

  subgraph Client
    A
  end

  subgraph "Backend (Tomcat)"
    C
    D
  end

  subgraph Infrastructure
    E
    F
    G
  end

  subgraph "Background Services"
    H["Data Scraper"]:::services
    I["Cron Job: Sync PG → ES"]:::services
  end

%% Client side
  A --> B
  A -->|GraphQL Queries| C
  A -->|/static File| D

%% Backend routes
  D --> B
  C --> E
  C --> F
  C --> G
  E -->|Cache Miss| F

%% Background services
  H --> F
  I --> F
  I --> G
```