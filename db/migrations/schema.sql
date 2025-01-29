--
-- PostgreSQL database dump
--

-- Dumped from database version 17.2
-- Dumped by pg_dump version 17.1

-- Started on 2025-01-28 10:44:54

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 3390 (class 1262 OID 16389)
-- Name: neondb; Type: DATABASE; Schema: -; Owner: neondb_owner
--

CREATE DATABASE neondb WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = builtin LOCALE = 'C.UTF-8' BUILTIN_LOCALE = 'C.UTF-8';


ALTER DATABASE neondb OWNER TO neondb_owner;

\connect neondb

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 220 (class 1259 OID 24577)
-- Name: csp_violations; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.csp_violations (
    id integer NOT NULL,
    blocked_uri text NOT NULL,
    document_uri text NOT NULL,
    violated_directive text NOT NULL,
    original_policy text NOT NULL,
    "timestamp" timestamptz DEFAULT now() NOT NULL
);


ALTER TABLE public.csp_violations OWNER TO neondb_owner;

--
-- TOC entry 219 (class 1259 OID 24576)
-- Name: csp_violations_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.csp_violations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.csp_violations_id_seq OWNER TO neondb_owner;

--
-- TOC entry 3392 (class 0 OID 0)
-- Dependencies: 219
-- Name: csp_violations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.csp_violations_id_seq OWNED BY public.csp_violations.id;


--
-- TOC entry 226 (class 1259 OID 32769)
-- Name: music_library; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.music_library (
    id integer NOT NULL,
    title text NOT NULL,
    artist text NOT NULL,
    mood text NOT NULL,
    storage_url text NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);


ALTER TABLE public.music_library OWNER TO neondb_owner;

--
-- TOC entry 225 (class 1259 OID 32768)
-- Name: music_library_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.music_library_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.music_library_id_seq OWNER TO neondb_owner;

--
-- TOC entry 3393 (class 0 OID 0)
-- Dependencies: 225
-- Name: music_library_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.music_library_id_seq OWNED BY public.music_library.id;


--
-- TOC entry 218 (class 1259 OID 16480)
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    email VARCHAR(255) UNIQUE
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- TOC entry 217 (class 1259 OID 16479)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO neondb_owner;

--
-- TOC entry 3394 (class 0 OID 0)
-- Dependencies: 217
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 222 (class 1259 OID 24587)
-- Name: video_likes; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.video_likes (
    id integer NOT NULL,
    video_id integer NOT NULL,
    user_id integer NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);


ALTER TABLE public.video_likes OWNER TO neondb_owner;

--
-- TOC entry 221 (class 1259 OID 24586)
-- Name: video_likes_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.video_likes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.video_likes_id_seq OWNER TO neondb_owner;

--
-- TOC entry 3395 (class 0 OID 0)
-- Dependencies: 221
-- Name: video_likes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.video_likes_id_seq OWNED BY public.video_likes.id;


--
-- TOC entry 224 (class 1259 OID 24597)
-- Name: videos; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.videos (
    id integer NOT NULL,
    prompt text NOT NULL,
    music_file text NOT NULL,
    output_url text,
    caption text,
    status text DEFAULT 'pending'::text NOT NULL,
    style text DEFAULT 'dramatic'::text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    user_id integer,
    likes_count integer DEFAULT 0 NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);


ALTER TABLE public.videos OWNER TO neondb_owner;

--
-- TOC entry 223 (class 1259 OID 24596)
-- Name: videos_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.videos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.videos_id_seq OWNER TO neondb_owner;

--
-- TOC entry 3396 (class 0 OID 0)
-- Dependencies: 223
-- Name: videos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.videos_id_seq OWNED BY public.videos.id;


--
-- TOC entry 3210 (class 2604 OID 24580)
-- Name: csp_violations id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.csp_violations ALTER COLUMN id SET DEFAULT nextval('public.csp_violations_id_seq'::regclass);


--
-- TOC entry 3221 (class 2604 OID 32772)
-- Name: music_library id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.music_library ALTER COLUMN id SET DEFAULT nextval('public.music_library_id_seq'::regclass);


--
-- TOC entry 3207 (class 2604 OID 16483)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 3212 (class 2604 OID 24590)
-- Name: video_likes id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.video_likes ALTER COLUMN id SET DEFAULT nextval('public.video_likes_id_seq'::regclass);


--
-- TOC entry 3214 (class 2604 OID 24600)
-- Name: videos id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.videos ALTER COLUMN id SET DEFAULT nextval('public.videos_id_seq'::regclass);


--
-- TOC entry 3228 (class 2606 OID 24585)
-- Name: csp_violations csp_violations_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.csp_violations
    ADD CONSTRAINT csp_violations_pkey PRIMARY KEY (id);


--
-- TOC entry 3236 (class 2606 OID 32777)
-- Name: music_library music_library_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.music_library
    ADD CONSTRAINT music_library_pkey PRIMARY KEY (id);


--
-- TOC entry 3224 (class 2606 OID 16487)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 3226 (class 2606 OID 16489)
-- Name: users users_username_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_unique UNIQUE (username);


--
-- TOC entry 3230 (class 2606 OID 24593)
-- Name: video_likes video_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.video_likes
    ADD CONSTRAINT video_likes_pkey PRIMARY KEY (id);


--
-- TOC entry 3232 (class 2606 OID 24595)
-- Name: video_likes video_likes_video_id_user_id_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.video_likes
    ADD CONSTRAINT video_likes_video_id_user_id_unique UNIQUE (video_id, user_id);


--
-- TOC entry 3234 (class 2606 OID 24610)
-- Name: videos videos_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.videos
    ADD CONSTRAINT videos_pkey PRIMARY KEY (id);


--
-- TOC entry 3237 (class 2606 OID 24618)
-- Name: video_likes video_likes_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.video_likes
    ADD CONSTRAINT video_likes_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 3238 (class 2606 OID 24613)
-- Name: video_likes video_likes_video_id_videos_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.video_likes
    ADD CONSTRAINT video_likes_video_id_videos_id_fk FOREIGN KEY (video_id) REFERENCES public.videos(id);


--
-- TOC entry 3239 (class 2606 OID 24623)
-- Name: videos videos_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.videos
    ADD CONSTRAINT videos_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 3391 (class 0 OID 0)
-- Dependencies: 3390
-- Name: DATABASE neondb; Type: ACL; Schema: -; Owner: neondb_owner
--

GRANT ALL ON DATABASE neondb TO neon_superuser;


--
-- TOC entry 2065 (class 826 OID 16391)
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- TOC entry 2064 (class 826 OID 16390)
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


-- Completed on 2025-01-28 10:45:06

--
-- PostgreSQL database dump complete
--

CREATE TABLE password_resets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

