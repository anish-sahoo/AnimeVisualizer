select "WARNING: Running this script will overwrite all data!";
select pg_sleep(5);

-- drop database if exists anime;
-- database name
-- create database anime;


-- destroys all tables without deleting database
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- enum for show status - to be used later
-- ova = "original video animation" (bonus series or side stories)
-- ona = "original net animation" (web series)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'media_type') THEN
        CREATE TYPE media_type AS ENUM ('unknown', 'tv', 'ova', 'special', 'ona', 'music', 'movie', 'tv_special');
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'source') THEN
        CREATE TYPE source AS ENUM (
            'other', 'original', 'manga', '4_koma_manga', 'web_manga',
            'digital_manga', 'novel', 'light_novel', 'visual_novel', 'game',
            'card_game', 'book', 'picture_book', 'radio', 'music'
        );
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status') THEN
        CREATE TYPE status AS ENUM (
            'finished_airing', 'currently_airing', 'not_yet_aired'
        );
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'age_rating') THEN
        CREATE TYPE age_rating AS ENUM (
            'g', 'pg', 'pg_13', 'r', 'r+', 'rx'
        );
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'context') THEN
        CREATE TYPE context AS ENUM ('search_results', 'recommendation');
    END IF;
END$$;

-- table #1

create table if not exists users  (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL
);

-- table #2
-- I did some research, and as it turns out, anime title do not exceed
-- 255 characters!
-- Notes:
-- thumbnail is for the "picture" provided by MAL, and can be of virtually unlimited length, since I don't know how long their CDN urls are; notice that it lacks NOT NULL since not every anime has a thumbnail/photo
-- end_date can be null; show may still be running
-- score is the name in our database, MAL describes score as "mean"
-- rank is in quotes, since it's a reserved keyword
-- as a reminder, media_type is whether it's a series/movie/...
create table if not exists anime  (
    id INT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    thumbnail TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    synopsis TEXT,
    score FLOAT NOT NULL,
    "rank" INT NOT NULL,
    popularity INT NOT NULL,
    num_list_users INT NOT NULL,
    num_scoring_users INT NOT NULL,
    updated_at DATE,
    last_scraped_at TIMESTAMP,
    media_type media_type NOT NULL,
    status status NOT NULL,
    num_episodes INT,
    source source NOT NULL,
    age_rating age_rating NOT NULL,
    active BOOLEAN DEFAULT true
);

-- table #3
-- FK breakdown:
--
-- user_ratings.username ----(FK)---> users.username
-- user_ratings.anime_id ----(FK)---> anime.id
create table if not exists user_ratings  (
    username VARCHAR(255) NOT NULL,
    anime_id INT NOT NULL,
    rating INT NOT NULL,
    FOREIGN KEY (username) REFERENCES users(username),
    FOREIGN KEY (anime_id) REFERENCES anime(id)
);

-- table #4
-- id is provided by MAL, don't use a serial
create table if not exists genres  (
    internal_id SERIAL PRIMARY KEY,
    id INT UNIQUE NOT NULL,
    name VARCHAR(255) UNIQUE NOT NULL
);

-- table #5
-- anime-genre relation table, for many to many implementation
-- plus "on delete" added so the relationship is nuked when either the genre or anime is removed from the database (although I doubt this will ever happen)
create table if not exists anime_genres  (
    anime_id INT REFERENCES anime(id) ON DELETE CASCADE,
    genre_id INT REFERENCES genres(id) ON DELETE CASCADE,
    PRIMARY KEY (anime_id, genre_id)
);

-- table #6
create table if not exists studios  (
    internal_id SERIAL PRIMARY KEY,
    id INT UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL
);

-- table #7
-- anime-studio relationship table, same many to many concept
create table if not exists anime_studios  (
    anime_id INT REFERENCES anime(id) ON DELETE CASCADE,
    studio_id INT REFERENCES studios(id) ON DELETE CASCADE,
    PRIMARY KEY (anime_id, studio_id)
);

-- table #8
-- we want to save these for archival purposes, so notice the omission of NOT NULL
-- future: we can create a trigger that creates a new record here each time an anime is added to the database
create table if not exists results  (
    anime_id INT REFERENCES anime(id),
    times_appeared INT,
    context context NOT NULL
);