--
-- PostgreSQL database dump
--

\restrict isrXZScavV47jj4PSabJV2bkMrnpImVLuEEazn5h7okSNsMYTb88FHQcT7T4EZn

-- Dumped from database version 18.6 (Ubuntu 18.6-0ubuntu0.26.04.1)
-- Dumped by pg_dump version 18.6 (Ubuntu 18.6-0ubuntu0.26.04.1)

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
-- Name: AuditAction; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AuditAction" AS ENUM (
    'CREATE',
    'UPDATE',
    'PUBLISH',
    'UNPUBLISH',
    'DELETE',
    'SCRAPE_IMPORT',
    'SYNC'
);


ALTER TYPE public."AuditAction" OWNER TO postgres;

--
-- Name: ContentStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ContentStatus" AS ENUM (
    'DRAFT',
    'PUBLISHED',
    'ARCHIVED',
    'SCHEDULED'
);


ALTER TYPE public."ContentStatus" OWNER TO postgres;

--
-- Name: PageBlockType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PageBlockType" AS ENUM (
    'HERO',
    'CTA',
    'FEATURES',
    'SERVICES',
    'TESTIMONIALS',
    'GALLERY',
    'FAQ',
    'STATS',
    'PRICING',
    'TEAM',
    'RICHTEXT',
    'VIDEO',
    'CUSTOM_SECTION',
    'CTA_BUTTON',
    'CONTACT',
    'FORM',
    'SERVICES_HERO',
    'SERVICES_FEATURES',
    'SERVICES_PROCESS',
    'SERVICES_AUDIENCES',
    'SERVICES_BENEFITS',
    'SERVICES_STATS',
    'SERVICES_FAQ',
    'SERVICES_CTA',
    'HOME_PHILOSOPHY',
    'HOME_REASONS',
    'HOME_SERVICES',
    'HOME_OFFERS',
    'HOME_PROCESS',
    'HOME_CTA',
    'ABOUT_CAPABILITIES',
    'ABOUT_VALUES',
    'ABOUT_COMMITMENTS',
    'ABOUT_TIMELINE'
);


ALTER TYPE public."PageBlockType" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: AuditLog; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."AuditLog" (
    id text NOT NULL,
    "entityType" text NOT NULL,
    "entityId" text NOT NULL,
    action public."AuditAction" NOT NULL,
    actor text,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "pageId" text,
    "postId" text,
    "authorId" text,
    "categoryId" text,
    "tagId" text,
    "faqId" text,
    "featureId" text,
    "testimonialId" text,
    "galleryItemId" text,
    "navigationId" text,
    "footerId" text,
    "settingId" text,
    "seoId" text,
    "mediaId" text,
    "formId" text,
    "leadId" text
);


ALTER TABLE public."AuditLog" OWNER TO postgres;

--
-- Name: Author; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Author" (
    id text NOT NULL,
    slug text NOT NULL,
    name text NOT NULL,
    bio text,
    status public."ContentStatus" DEFAULT 'DRAFT'::public."ContentStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "publishedAt" timestamp(3) without time zone,
    "deletedAt" timestamp(3) without time zone,
    version integer DEFAULT 0 NOT NULL
);


ALTER TABLE public."Author" OWNER TO postgres;

--
-- Name: Category; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Category" (
    id text NOT NULL,
    slug text NOT NULL,
    name text NOT NULL,
    status public."ContentStatus" DEFAULT 'DRAFT'::public."ContentStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "publishedAt" timestamp(3) without time zone,
    "deletedAt" timestamp(3) without time zone,
    version integer DEFAULT 0 NOT NULL
);


ALTER TABLE public."Category" OWNER TO postgres;

--
-- Name: CrawlUrl; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."CrawlUrl" (
    id text NOT NULL,
    url text NOT NULL,
    canonical text,
    status text NOT NULL,
    "fetchedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."CrawlUrl" OWNER TO postgres;

--
-- Name: Faq; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Faq" (
    id text NOT NULL,
    slug text NOT NULL,
    question text NOT NULL,
    answer text NOT NULL,
    status public."ContentStatus" DEFAULT 'DRAFT'::public."ContentStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "publishedAt" timestamp(3) without time zone,
    "deletedAt" timestamp(3) without time zone,
    version integer DEFAULT 0 NOT NULL
);


ALTER TABLE public."Faq" OWNER TO postgres;

--
-- Name: Feature; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Feature" (
    id text NOT NULL,
    slug text NOT NULL,
    title text NOT NULL,
    description text,
    status public."ContentStatus" DEFAULT 'DRAFT'::public."ContentStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "publishedAt" timestamp(3) without time zone,
    "deletedAt" timestamp(3) without time zone,
    version integer DEFAULT 0 NOT NULL
);


ALTER TABLE public."Feature" OWNER TO postgres;

--
-- Name: Footer; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Footer" (
    id text NOT NULL,
    slug text NOT NULL,
    title text NOT NULL,
    status public."ContentStatus" DEFAULT 'DRAFT'::public."ContentStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "publishedAt" timestamp(3) without time zone,
    "deletedAt" timestamp(3) without time zone,
    version integer DEFAULT 0 NOT NULL,
    copyright text,
    description text,
    "rowVersion" integer DEFAULT 0 NOT NULL
);


ALTER TABLE public."Footer" OWNER TO postgres;

--
-- Name: FooterLink; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."FooterLink" (
    id text NOT NULL,
    "footerId" text NOT NULL,
    label text NOT NULL,
    href text NOT NULL,
    "position" integer DEFAULT 0 NOT NULL,
    type text DEFAULT 'LINK'::text NOT NULL,
    status public."ContentStatus" DEFAULT 'DRAFT'::public."ContentStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    version integer DEFAULT 0 NOT NULL,
    "rowVersion" integer DEFAULT 0 NOT NULL
);


ALTER TABLE public."FooterLink" OWNER TO postgres;

--
-- Name: Form; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Form" (
    id text NOT NULL,
    slug text NOT NULL,
    name text NOT NULL,
    fields jsonb NOT NULL,
    status public."ContentStatus" DEFAULT 'DRAFT'::public."ContentStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "publishedAt" timestamp(3) without time zone,
    "deletedAt" timestamp(3) without time zone,
    version integer DEFAULT 0 NOT NULL
);


ALTER TABLE public."Form" OWNER TO postgres;

--
-- Name: GalleryItem; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."GalleryItem" (
    id text NOT NULL,
    slug text NOT NULL,
    title text,
    "altText" text,
    "imageUrl" text NOT NULL,
    caption text,
    status public."ContentStatus" DEFAULT 'DRAFT'::public."ContentStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "publishedAt" timestamp(3) without time zone,
    "deletedAt" timestamp(3) without time zone,
    version integer DEFAULT 0 NOT NULL
);


ALTER TABLE public."GalleryItem" OWNER TO postgres;

--
-- Name: Lead; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Lead" (
    id text NOT NULL,
    slug text NOT NULL,
    name text,
    email text,
    company text,
    message text,
    source text,
    status public."ContentStatus" DEFAULT 'DRAFT'::public."ContentStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "publishedAt" timestamp(3) without time zone,
    "deletedAt" timestamp(3) without time zone,
    version integer DEFAULT 0 NOT NULL
);


ALTER TABLE public."Lead" OWNER TO postgres;

--
-- Name: Media; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Media" (
    id text NOT NULL,
    slug text NOT NULL,
    filename text NOT NULL,
    "mimeType" text NOT NULL,
    url text NOT NULL,
    "altText" text,
    status public."ContentStatus" DEFAULT 'DRAFT'::public."ContentStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "publishedAt" timestamp(3) without time zone,
    "deletedAt" timestamp(3) without time zone,
    version integer DEFAULT 0 NOT NULL,
    caption text,
    checksum text,
    height integer,
    "rowVersion" integer DEFAULT 0 NOT NULL,
    size integer,
    tags text[] DEFAULT ARRAY[]::text[],
    title text NOT NULL,
    width integer
);


ALTER TABLE public."Media" OWNER TO postgres;

--
-- Name: Navigation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Navigation" (
    id text NOT NULL,
    slug text NOT NULL,
    label text NOT NULL,
    href text,
    "parentId" text,
    status public."ContentStatus" DEFAULT 'DRAFT'::public."ContentStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "publishedAt" timestamp(3) without time zone,
    "deletedAt" timestamp(3) without time zone,
    version integer DEFAULT 0 NOT NULL,
    key text NOT NULL,
    "position" integer DEFAULT 0 NOT NULL,
    "rowVersion" integer DEFAULT 0 NOT NULL
);


ALTER TABLE public."Navigation" OWNER TO postgres;

--
-- Name: NavigationItem; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."NavigationItem" (
    id text NOT NULL,
    "navigationId" text NOT NULL,
    label text NOT NULL,
    href text NOT NULL,
    "parentId" text,
    "position" integer DEFAULT 0 NOT NULL,
    status public."ContentStatus" DEFAULT 'DRAFT'::public."ContentStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    version integer DEFAULT 0 NOT NULL,
    "rowVersion" integer DEFAULT 0 NOT NULL
);


ALTER TABLE public."NavigationItem" OWNER TO postgres;

--
-- Name: Page; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Page" (
    id text NOT NULL,
    slug text NOT NULL,
    title text NOT NULL,
    status public."ContentStatus" DEFAULT 'DRAFT'::public."ContentStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "publishedAt" timestamp(3) without time zone,
    "deletedAt" timestamp(3) without time zone,
    version integer DEFAULT 0 NOT NULL,
    "seoId" text
);


ALTER TABLE public."Page" OWNER TO postgres;

--
-- Name: PageBlock; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PageBlock" (
    id text NOT NULL,
    "pageId" text NOT NULL,
    type public."PageBlockType" NOT NULL,
    "order" integer NOT NULL,
    props jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    version integer DEFAULT 0 NOT NULL,
    "mediaId" text
);


ALTER TABLE public."PageBlock" OWNER TO postgres;

--
-- Name: Post; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Post" (
    id text NOT NULL,
    slug text NOT NULL,
    title text NOT NULL,
    excerpt text,
    body text,
    status public."ContentStatus" DEFAULT 'DRAFT'::public."ContentStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "publishedAt" timestamp(3) without time zone,
    "deletedAt" timestamp(3) without time zone,
    version integer DEFAULT 0 NOT NULL,
    "authorId" text,
    "seoId" text,
    "featuredImageId" text,
    "imageAlt" text,
    "ogImageId" text,
    "thumbnailImageId" text
);


ALTER TABLE public."Post" OWNER TO postgres;

--
-- Name: ScrapeJob; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ScrapeJob" (
    id text NOT NULL,
    "sourceUrl" text NOT NULL,
    status text NOT NULL,
    "startedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "finishedAt" timestamp(3) without time zone,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ScrapeJob" OWNER TO postgres;

--
-- Name: Seo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Seo" (
    id text NOT NULL,
    slug text NOT NULL,
    title text,
    description text,
    keywords text,
    canonical text,
    robots text,
    schema jsonb,
    "ogTitle" text,
    "ogDescription" text,
    "ogImage" text,
    "twitterCard" text,
    status public."ContentStatus" DEFAULT 'DRAFT'::public."ContentStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "publishedAt" timestamp(3) without time zone,
    "deletedAt" timestamp(3) without time zone,
    version integer DEFAULT 0 NOT NULL
);


ALTER TABLE public."Seo" OWNER TO postgres;

--
-- Name: Setting; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Setting" (
    id text NOT NULL,
    slug text NOT NULL,
    key text NOT NULL,
    value text NOT NULL,
    status public."ContentStatus" DEFAULT 'DRAFT'::public."ContentStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "publishedAt" timestamp(3) without time zone,
    "deletedAt" timestamp(3) without time zone,
    version integer DEFAULT 0 NOT NULL
);


ALTER TABLE public."Setting" OWNER TO postgres;

--
-- Name: Tag; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Tag" (
    id text NOT NULL,
    slug text NOT NULL,
    name text NOT NULL,
    status public."ContentStatus" DEFAULT 'DRAFT'::public."ContentStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "publishedAt" timestamp(3) without time zone,
    "deletedAt" timestamp(3) without time zone,
    version integer DEFAULT 0 NOT NULL
);


ALTER TABLE public."Tag" OWNER TO postgres;

--
-- Name: Testimonial; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Testimonial" (
    id text NOT NULL,
    slug text NOT NULL,
    quote text NOT NULL,
    author text NOT NULL,
    role text,
    company text,
    status public."ContentStatus" DEFAULT 'DRAFT'::public."ContentStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "publishedAt" timestamp(3) without time zone,
    "deletedAt" timestamp(3) without time zone,
    version integer DEFAULT 0 NOT NULL
);


ALTER TABLE public."Testimonial" OWNER TO postgres;

--
-- Name: _CategoryToPost; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."_CategoryToPost" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


ALTER TABLE public."_CategoryToPost" OWNER TO postgres;

--
-- Name: _PostToTag; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."_PostToTag" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


ALTER TABLE public."_PostToTag" OWNER TO postgres;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Data for Name: AuditLog; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."AuditLog" (id, "entityType", "entityId", action, actor, metadata, "createdAt", "pageId", "postId", "authorId", "categoryId", "tagId", "faqId", "featureId", "testimonialId", "galleryItemId", "navigationId", "footerId", "settingId", "seoId", "mediaId", "formId", "leadId") FROM stdin;
\.


--
-- Data for Name: Author; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Author" (id, slug, name, bio, status, "createdAt", "updatedAt", "publishedAt", "deletedAt", version) FROM stdin;
\.


--
-- Data for Name: Category; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Category" (id, slug, name, status, "createdAt", "updatedAt", "publishedAt", "deletedAt", version) FROM stdin;
\.


--
-- Data for Name: CrawlUrl; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."CrawlUrl" (id, url, canonical, status, "fetchedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Faq; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Faq" (id, slug, question, answer, status, "createdAt", "updatedAt", "publishedAt", "deletedAt", version) FROM stdin;
cmw0khb04000hwvimkygv5s3z	verify-faq-1793703044570	FAQ verify 1793703044570	FAQ answer body	PUBLISHED	2026-11-03 10:50:44.596	2026-11-03 10:50:44.596	\N	\N	0
cmw0kic5q000jwvim70yqigtj	verify-faq-1793703092724	FAQ verify 1793703092724	FAQ answer body	PUBLISHED	2026-11-03 10:51:32.75	2026-11-03 10:51:32.75	\N	\N	0
cmw0kjn73000kwvim9u3b8xrv	verify-faq-1793703153566	FAQ verify 1793703153566	FAQ answer body	PUBLISHED	2026-11-03 10:52:33.711	2026-11-03 10:52:33.711	\N	\N	0
cmw0kukk3000dwvlt6kbppuai	verify-faq-1793703663305	FAQ verify 1793703663305	FAQ answer body	PUBLISHED	2026-11-03 11:01:03.507	2026-11-03 11:01:03.507	\N	\N	0
cmw0kvfiy000iwvltl50ydjny	verify-faq-1793703703617	FAQ verify 1793703703617	FAQ answer body	PUBLISHED	2026-11-03 11:01:43.643	2026-11-03 11:01:43.643	\N	\N	0
cmw0kxkvw000jwvltcsd4yp4z	verify-faq-1793703803798	FAQ verify 1793703803798	FAQ answer body	PUBLISHED	2026-11-03 11:03:23.9	2026-11-03 11:03:23.9	\N	\N	0
\.


--
-- Data for Name: Feature; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Feature" (id, slug, title, description, status, "createdAt", "updatedAt", "publishedAt", "deletedAt", version) FROM stdin;
cmw0khb13000iwvimu84hulbe	verify-service-1793703044570	Service verify 1793703044570	Service verify description	PUBLISHED	2026-11-03 10:50:44.631	2026-11-03 10:50:44.631	\N	\N	0
cmw0kjn7o000lwvimikfumxqq	verify-service-1793703153566	Service verify 1793703153566	Service verify description	PUBLISHED	2026-11-03 10:52:33.733	2026-11-03 10:52:33.733	\N	\N	0
cmw0kumst000ewvltxzkk63fi	verify-service-1793703663305	Service verify 1793703663305	Service verify description	PUBLISHED	2026-11-03 11:01:06.413	2026-11-03 11:01:06.413	\N	\N	0
\.


--
-- Data for Name: Footer; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Footer" (id, slug, title, status, "createdAt", "updatedAt", "publishedAt", "deletedAt", version, copyright, description, "rowVersion") FROM stdin;
cmvyysssm000kwvwjt87goye4	main-footer	Phause	PUBLISHED	2026-11-02 07:56:03.143	2026-11-03 09:29:54.65	\N	\N	59	© 2025 Phause. All rights reserved. Strengthen. Aware. Defend.	Phause delivers enterprise-grade cybersecurity solutions — threat detection, security audits, cloud protection and 24/7 monitoring to keep your business safe.	0
\.


--
-- Data for Name: FooterLink; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."FooterLink" (id, "footerId", label, href, "position", type, status, "createdAt", "updatedAt", "deletedAt", version, "rowVersion") FROM stdin;
cmw0hlcrq007gwvt9nfpjmhfw	cmvyysssm000kwvwjt87goye4	Home	/	0	LINK	PUBLISHED	2026-11-03 09:29:54.662	2026-11-03 09:29:54.662	\N	0	0
cmw0hlcrq007hwvt9iop4wv9r	cmvyysssm000kwvwjt87goye4	About Us	/about	1	LINK	PUBLISHED	2026-11-03 09:29:54.662	2026-11-03 09:29:54.662	\N	0	0
cmw0hlcrq007iwvt9unz9mg98	cmvyysssm000kwvwjt87goye4	Services	/services	2	LINK	PUBLISHED	2026-11-03 09:29:54.662	2026-11-03 09:29:54.662	\N	0	0
cmw0hlcrq007jwvt95ji8c968	cmvyysssm000kwvwjt87goye4	Blog	/blog	3	LINK	PUBLISHED	2026-11-03 09:29:54.662	2026-11-03 09:29:54.662	\N	0	0
cmw0hlcrq007kwvt9p4j8xybu	cmvyysssm000kwvwjt87goye4	Docs	/docs	4	LINK	PUBLISHED	2026-11-03 09:29:54.662	2026-11-03 09:29:54.662	\N	0	0
cmw0hlcrq007lwvt9w71e15xn	cmvyysssm000kwvwjt87goye4	FAQ	/faq	5	LINK	PUBLISHED	2026-11-03 09:29:54.662	2026-11-03 09:29:54.662	\N	0	0
cmw0hlcrq007mwvt9kow8tt3m	cmvyysssm000kwvwjt87goye4	Subscription	/subscription	6	LINK	PUBLISHED	2026-11-03 09:29:54.662	2026-11-03 09:29:54.662	\N	0	0
cmw0hlcrq007nwvt9mnptb5g0	cmvyysssm000kwvwjt87goye4	Contact Us	/contact	7	LINK	PUBLISHED	2026-11-03 09:29:54.662	2026-11-03 09:29:54.662	\N	0	0
cmw0hlcrq007owvt9efxb800c	cmvyysssm000kwvwjt87goye4	Threat Detection	/services#threat-detection	8	LINK	PUBLISHED	2026-11-03 09:29:54.662	2026-11-03 09:29:54.662	\N	0	0
cmw0hlcrq007pwvt9g37r5cyw	cmvyysssm000kwvwjt87goye4	Security Audits	/services#security-audits	9	LINK	PUBLISHED	2026-11-03 09:29:54.662	2026-11-03 09:29:54.662	\N	0	0
cmw0hlcrq007qwvt927330y97	cmvyysssm000kwvwjt87goye4	Cloud Protection	/services#cloud-protection	10	LINK	PUBLISHED	2026-11-03 09:29:54.662	2026-11-03 09:29:54.662	\N	0	0
cmw0hlcrq007rwvt9twp8pm3n	cmvyysssm000kwvwjt87goye4	Data Encryption	/services#data-encryption	11	LINK	PUBLISHED	2026-11-03 09:29:54.662	2026-11-03 09:29:54.662	\N	0	0
cmw0hlcrq007swvt9medmlyi1	cmvyysssm000kwvwjt87goye4	Privacy Policy	/privacy	12	LINK	PUBLISHED	2026-11-03 09:29:54.662	2026-11-03 09:29:54.662	\N	0	0
cmw0hlcrq007twvt95piw228p	cmvyysssm000kwvwjt87goye4	Terms of Service	/terms	13	LINK	PUBLISHED	2026-11-03 09:29:54.662	2026-11-03 09:29:54.662	\N	0	0
\.


--
-- Data for Name: Form; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Form" (id, slug, name, fields, status, "createdAt", "updatedAt", "publishedAt", "deletedAt", version) FROM stdin;
cmw0hkf56001xwvt99fflxlu8	contact-form	Contact form	[{"type": "text", "label": "Full name", "required": true, "placeholder": "Full name"}, {"type": "email", "label": "Work email", "required": true, "placeholder": "you@company.com"}, {"type": "text", "label": "Company", "placeholder": "Company name"}, {"type": "textarea", "label": "Message", "placeholder": "Tell us about your security needs"}]	PUBLISHED	2026-11-03 09:29:11.083	2026-11-03 09:29:54.731	\N	\N	4
cmw0hkf5d001ywvt98d4zv796	registration-form	Registration form	[{"type": "text", "label": "Full name", "required": true, "placeholder": "Full name"}, {"type": "text", "label": "Organisation name", "placeholder": "Organisation name"}, {"type": "email", "label": "Work email", "required": true, "placeholder": "Work email"}, {"type": "password", "label": "Password", "required": true, "placeholder": "Password"}]	PUBLISHED	2026-11-03 09:29:11.089	2026-11-03 09:29:54.738	\N	\N	4
\.


--
-- Data for Name: GalleryItem; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."GalleryItem" (id, slug, title, "altText", "imageUrl", caption, status, "createdAt", "updatedAt", "publishedAt", "deletedAt", version) FROM stdin;
\.


--
-- Data for Name: Lead; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Lead" (id, slug, name, email, company, message, source, status, "createdAt", "updatedAt", "publishedAt", "deletedAt", version) FROM stdin;
cmw0hkf5j001zwvt9bmwgu9a1	ava-johnson	Ava Johnson	ava.johnson@acme.io	Acme Security	Interested in a reseller package and rapid rollout onboarding.	Website	PUBLISHED	2026-11-03 09:29:11.095	2026-11-03 09:29:54.742	\N	\N	4
cmw0hkf5r0020wvt9cqebtqp4	raul-perez	Raul Perez	raul.perez@northstar.co	Northstar Systems	Need help with compliance monitoring and incident response coverage.	Outbound	SCHEDULED	2026-11-03 09:29:11.103	2026-11-03 09:29:54.749	\N	\N	4
cmw0hkf5w0021wvt9ncm8szqw	megan-chen	Megan Chen	megan.chen@cyberdock.ai	Cyberdock AI	Looking for pricing details and a product walkthrough for the enterprise plan.	Demo Request	DRAFT	2026-11-03 09:29:11.108	2026-11-03 09:29:54.754	\N	\N	4
\.


--
-- Data for Name: Media; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Media" (id, slug, filename, "mimeType", url, "altText", status, "createdAt", "updatedAt", "publishedAt", "deletedAt", version, caption, checksum, height, "rowVersion", size, tags, title, width) FROM stdin;
cmw0hkete0000wvt9bw8mkpmz	brand-logo	phause-logo.png	image/png	/logo/phause-logo.png	Phause brand logo	PUBLISHED	2026-11-03 09:29:10.659	2026-11-03 09:29:54.369	\N	\N	4	Phause brand logo	brand-logo-phause	400	0	21432	{brand,logo}	Brand logo	1200
cmvz1pnij0017wvyb5m1mqvr9	media-35bfa1aef87a	image?url=%2F_next%2Fstatic%2Fimmutable%2Fmedia%2Fphause-logo.30ghdg_rrvm_c.png&w=1200&q=75	image/png	https://phause.vercel.app/_next/image?url=%2F_next%2Fstatic%2Fimmutable%2Fmedia%2Fphause-logo.30ghdg_rrvm_c.png&w=1200&q=75	Phause | Strengthen. Aware. Defend.	PUBLISHED	2026-11-02 09:17:35.18	2026-11-02 11:04:18.099	\N	\N	1	\N	35bfa1aef87aac4db5b3f9e1c9d4abf047913ac51584edfa3141e178088012be	\N	0	\N	{}	Media home	\N
\.


--
-- Data for Name: Navigation; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Navigation" (id, slug, label, href, "parentId", status, "createdAt", "updatedAt", "publishedAt", "deletedAt", version, key, "position", "rowVersion") FROM stdin;
cmvyysssa000fwvwjm6io1j04	main-navigation	Main navigation	/	\N	PUBLISHED	2026-11-02 07:56:03.13	2026-11-03 09:29:54.626	\N	\N	57	main	0	0
\.


--
-- Data for Name: NavigationItem; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."NavigationItem" (id, "navigationId", label, href, "parentId", "position", status, "createdAt", "updatedAt", "deletedAt", version, "rowVersion") FROM stdin;
cmw0hlcr60077wvt9eorvrbf2	cmvyysssa000fwvwjm6io1j04	Home	/	\N	0	PUBLISHED	2026-11-03 09:29:54.642	2026-11-03 09:29:54.642	\N	0	0
cmw0hlcr60078wvt9r006utma	cmvyysssa000fwvwjm6io1j04	About Us	/about	\N	1	PUBLISHED	2026-11-03 09:29:54.642	2026-11-03 09:29:54.642	\N	0	0
cmw0hlcr60079wvt9l0qx6g2g	cmvyysssa000fwvwjm6io1j04	Services	/services	\N	2	PUBLISHED	2026-11-03 09:29:54.642	2026-11-03 09:29:54.642	\N	0	0
cmw0hlcr6007awvt9m9bqt64m	cmvyysssa000fwvwjm6io1j04	Blog	/blog	\N	3	PUBLISHED	2026-11-03 09:29:54.642	2026-11-03 09:29:54.642	\N	0	0
cmw0hlcr6007bwvt9ybf93tl9	cmvyysssa000fwvwjm6io1j04	Docs	/docs	\N	4	PUBLISHED	2026-11-03 09:29:54.642	2026-11-03 09:29:54.642	\N	0	0
cmw0hlcr6007cwvt98u1gwuij	cmvyysssa000fwvwjm6io1j04	Subscription	/subscription	\N	5	PUBLISHED	2026-11-03 09:29:54.642	2026-11-03 09:29:54.642	\N	0	0
cmw0hlcr6007dwvt9yb1a92fp	cmvyysssa000fwvwjm6io1j04	FAQ	/faq	\N	6	PUBLISHED	2026-11-03 09:29:54.642	2026-11-03 09:29:54.642	\N	0	0
cmw0hlcr6007ewvt9o07c9i9o	cmvyysssa000fwvwjm6io1j04	Contact Us	/contact	\N	7	PUBLISHED	2026-11-03 09:29:54.642	2026-11-03 09:29:54.642	\N	0	0
\.


--
-- Data for Name: Page; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Page" (id, slug, title, status, "createdAt", "updatedAt", "publishedAt", "deletedAt", version, "seoId") FROM stdin;
cmvyyssqo0000wvwjyp1aaav7	home	Home	PUBLISHED	2026-11-02 07:56:03.072	2026-11-03 09:29:54.387	\N	\N	127	cmvyyssqu0001wvwjhbct5kzi
cmw0hkexr000kwvt940v1kmov	docs	Untitled page	PUBLISHED	2026-11-03 09:29:10.815	2026-11-03 11:00:41.313	\N	\N	7	cmw0hkexx000lwvt96ct6e1li
cmw0hkevs000dwvt9fpt1jwaa	services	Services	PUBLISHED	2026-11-03 09:29:10.744	2026-11-03 09:29:54.434	\N	\N	4	cmw0hkew6000ewvt9ce4lf78o
cmw0hkex0000hwvt9tjms6m6n	blog	Blog	PUBLISHED	2026-11-03 09:29:10.789	2026-11-03 09:29:54.463	\N	\N	4	cmw0hkex8000iwvt9k3le0viw
cmvyyssr40005wvwj1x53xzn6	about	Untitled page	PUBLISHED	2026-11-02 07:56:03.089	2026-11-03 11:01:09.65	\N	\N	59	cmvyyssr70006wvwj75isp9dt
cmw0hkeyn000nwvt99js4xh96	faq	FAQ	PUBLISHED	2026-11-03 09:29:10.847	2026-11-03 09:29:54.502	\N	\N	4	cmw0hkeyu000owvt9qnzgr4hv
cmvyyssrf0009wvwj045r9b6e	contact	Contact	PUBLISHED	2026-11-02 07:56:03.099	2026-11-03 09:29:54.534	\N	\N	56	cmvyyssrh000awvwjca2o9634
cmvyyssrq000cwvwj9fxynogh	subscription	Subscription	PUBLISHED	2026-11-02 07:56:03.11	2026-11-03 09:29:54.575	\N	\N	56	cmvyyssrt000dwvwju8j0r0e5
cmvz1nylg0021wvga68lp3qru	registration	Registration	PUBLISHED	2026-11-02 09:16:16.228	2026-11-03 09:29:54.603	\N	\N	40	cmvz1nylj0022wvgaatsxbhnm
\.


--
-- Data for Name: PageBlock; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PageBlock" (id, "pageId", type, "order", props, "createdAt", "updatedAt", "deletedAt", version, "mediaId") FROM stdin;
cmw0hlckb0069wvt9j5kuvz3o	cmvyyssqo0000wvwjyp1aaav7	HERO	0	{"title": "Strengthen. Aware. Defend.", "eyebrow": "Strengthen. Aware. Defend.", "ctaPrimary": "Get Protected Now", "description": "Phause delivers enterprise-grade cybersecurity solutions — threat detection, security audits, cloud protection and 24/7 monitoring to keep your business safe.", "ctaSecondary": "Explore Platform", "ctaPrimaryHref": "/subscription", "ctaSecondaryHref": "/about"}	2026-11-03 09:29:54.395	2026-11-03 09:29:54.395	\N	0	\N
cmw0hlckb006awvt9k1fhifre	cmvyyssqo0000wvwjyp1aaav7	STATS	1	{"items": [{"label": "Threat Block Rate", "value": "99.9%"}, {"label": "Active Monitoring", "value": "24/7"}, {"label": "Response Time", "value": "<50ms"}, {"label": "Companies Protected", "value": "500+"}]}	2026-11-03 09:29:54.395	2026-11-03 09:29:54.395	\N	0	\N
cmw0hlckb006bwvt9nxz9ur1s	cmvyyssqo0000wvwjyp1aaav7	FEATURES	2	{"items": [{"title": "Proactive Defense", "description": "We don't wait for attacks. We hunt threats before they strike, turning vulnerability into strength."}, {"title": "Radical Transparency", "description": "Real-time visibility into every security event. No hidden logs, no surprises — complete clarity."}, {"title": "Privacy by Design", "description": "Your data is sacred. We build every system with encryption and privacy as the foundation, not an afterthought."}]}	2026-11-03 09:29:54.395	2026-11-03 09:29:54.395	\N	0	\N
cmw0hlckb006cwvt9el6cqzei	cmvyyssqo0000wvwjyp1aaav7	RICHTEXT	3	{"content": "<h3>Why the world's best teams choose Phause</h3><p>Founded by security researchers and ethical hackers, Phause exists for one reason: to make the digital world a safer place. We combine AI-driven threat intelligence with human expertise to protect what matters most — you.</p>"}	2026-11-03 09:29:54.395	2026-11-03 09:29:54.395	\N	0	\N
cmw0hlckb006dwvt90xaj074u	cmvyyssqo0000wvwjyp1aaav7	FAQ	4	{"items": [{"answer": "Endpoints, cloud workloads, infrastructure, identities, and application surfaces across the modern enterprise.", "question": "What does Phause protect?"}, {"answer": "Sub-50ms automated threat neutralization with human-led escalation and expert monitoring around the clock.", "question": "How fast is response time?"}, {"answer": "No. We deploy protection without touching a single line of your existing code and keep zero-downtime operations in mind.", "question": "Is implementation disruptive?"}]}	2026-11-03 09:29:54.395	2026-11-03 09:29:54.395	\N	0	\N
cmw0hlcls006lwvt99wfgcvw1	cmw0hkevs000dwvt9fpt1jwaa	HERO	0	{"title": "Protect every layer of your digital footprint", "eyebrow": "Services", "ctaPrimary": "Book a Consultation", "description": "From detection to recovery, our services are built to keep your business secure and resilient.", "ctaPrimaryHref": "/contact"}	2026-11-03 09:29:54.448	2026-11-03 09:29:54.448	\N	0	\N
cmw0hlcls006mwvt919lh0bqd	cmw0hkevs000dwvt9fpt1jwaa	SERVICES	1	{"items": [{"title": "Threat Detection", "description": "24/7 monitoring and continuous threat hunting."}, {"title": "Security Audits", "description": "Assessments that expose gaps before attackers do."}, {"title": "Cloud Protection", "description": "Secure workloads across AWS, Azure, and GCP."}, {"title": "Data Encryption", "description": "Protect critical data at rest and in transit."}]}	2026-11-03 09:29:54.448	2026-11-03 09:29:54.448	\N	0	\N
cmw0hlcmd006pwvt912dfpwh6	cmw0hkex0000hwvt9tjms6m6n	HERO	0	{"title": "Security knowledge worth sharing", "eyebrow": "Insights", "description": "Expert analysis and practical guidance for leaders defending modern digital operations."}	2026-11-03 09:29:54.47	2026-11-03 09:29:54.47	\N	0	\N
cmw0hlcnn006vwvt95y3tht9p	cmw0hkeyn000nwvt99js4xh96	FAQ	0	{"items": [{"answer": "Endpoints, cloud workloads, identities, infrastructure, and application surfaces.", "question": "What does Phause protect?"}, {"answer": "Most deployments are designed to begin within days, not months.", "question": "How quickly can we launch?"}, {"answer": "Yes. Phause supports common security workflows and enterprise systems.", "question": "Can we integrate with existing tools?"}]}	2026-11-03 09:29:54.515	2026-11-03 09:29:54.515	\N	0	\N
cmw0hlcok006ywvt9maydhi9c	cmvyyssrf0009wvwj045r9b6e	CONTACT	0	{"title": "Let's Secure Your Future", "details": [{"label": "Email Us", "value": "hello@phause.com"}, {"label": "Call Us", "value": "+1 (555) 010-PHAUSE"}, {"label": "Headquarters", "value": "580 California Street, Floor 12, San Francisco, CA 94104"}], "ctaPrimary": "Send Enquiry", "description": "Whether you're evaluating a platform, planning a migration, or facing an active incident — our team is one message away, around the clock.", "ctaSecondary": "Call Emergency Line", "ctaPrimaryHref": "/contact", "ctaSecondaryHref": "tel:+1-555-010-7428"}	2026-11-03 09:29:54.548	2026-11-03 09:29:54.548	\N	0	\N
cmw0hlcpo0071wvt98c4uuhaw	cmvyyssrq000cwvwj9fxynogh	HERO	0	{"title": "Security that scales with you", "eyebrow": "Pricing & Plans", "description": "Five tiers. One platform. Zero compromises. Start free, upgrade when you're ready — every plan runs the same battle-tested defense grid."}	2026-11-03 09:29:54.588	2026-11-03 09:29:54.588	\N	0	\N
cmw0hlcpo0072wvt9onjk4bum	cmvyyssrq000cwvwj9fxynogh	PRICING	1	{"plans": [{"name": "Starter", "price": "$0", "description": "For early teams getting started."}, {"name": "Growth", "price": "$49", "description": "For modern companies scaling securely."}, {"name": "Enterprise", "price": "Custom", "description": "For global operations with advanced requirements."}], "title": "Choose Your Shield"}	2026-11-03 09:29:54.588	2026-11-03 09:29:54.588	\N	0	\N
cmw0hlcqc0075wvt9ea4s641u	cmvz1nylg0021wvga68lp3qru	FORM	0	{"title": "Create your Phause account.", "fields": [{"type": "text", "label": "Full name", "placeholder": "Full name"}, {"type": "text", "label": "Organisation name", "placeholder": "Organisation name"}, {"type": "email", "label": "Work email", "placeholder": "Work email"}, {"type": "password", "label": "Password", "placeholder": "Password"}, {"type": "text", "label": "Region", "placeholder": "Select your region"}], "description": "Enter your details to get started."}	2026-11-03 09:29:54.612	2026-11-03 09:29:54.612	\N	0	\N
cmw0ku3fq0009wvltyzqln2sx	cmw0hkexr000kwvt940v1kmov	CUSTOM_SECTION	1	{"items": [{"id": "docs-verify-1793703631987", "slug": "docs-verify-1793703631987", "title": "Docs verify 1793703631987", "description": "Docs verify description"}]}	2026-11-03 11:00:41.318	2026-11-03 11:00:41.318	\N	0	\N
cmw0kupbu000hwvltlho8mqwe	cmvyyssr40005wvwj1x53xzn6	ABOUT_VALUES	1	{"items": [{"id": "about-verify-1793703663305", "title": "About verify 1793703663305", "description": "About verify description"}]}	2026-11-03 11:01:09.69	2026-11-03 11:01:09.69	\N	0	\N
\.


--
-- Data for Name: Post; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Post" (id, slug, title, excerpt, body, status, "createdAt", "updatedAt", "publishedAt", "deletedAt", version, "authorId", "seoId", "featuredImageId", "imageAlt", "ogImageId", "thumbnailImageId") FROM stdin;
\.


--
-- Data for Name: ScrapeJob; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ScrapeJob" (id, "sourceUrl", status, "startedAt", "finishedAt", metadata, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Seo; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Seo" (id, slug, title, description, keywords, canonical, robots, schema, "ogTitle", "ogDescription", "ogImage", "twitterCard", status, "createdAt", "updatedAt", "publishedAt", "deletedAt", version) FROM stdin;
cmvyyssrh000awvwjca2o9634	contact	Phause | Contact	Whether you're evaluating a platform, planning a migration, or facing an active incident — our team is one message away, around the clock.	contact phause,security support,incident response	https://phause.com/contact	\N	\N	\N	\N	\N	\N	DRAFT	2026-11-02 07:56:03.101	2026-11-03 09:29:54.524	\N	\N	0
cmvyyssrt000dwvwju8j0r0e5	subscription	Phause | Pricing & Plans	Five tiers. One platform. Zero compromises. Start free, upgrade when you're ready — every plan runs the same battle-tested defense grid.	phause pricing,cybersecurity pricing,security plans	https://phause.com/subscription	\N	\N	\N	\N	\N	\N	DRAFT	2026-11-02 07:56:03.113	2026-11-03 09:29:54.571	\N	\N	0
cmvz1nylj0022wvgaatsxbhnm	registration	Create your Phause account	Create your Phause account. A smarter way to work, powered by AI.	register phause,account creation,security platform	https://phause.com/registration	\N	\N	\N	\N	\N	\N	DRAFT	2026-11-02 09:16:16.231	2026-11-03 09:29:54.599	\N	\N	0
cmvyyssqu0001wvwjhbct5kzi	home	Phause | Strengthen. Aware. Defend.	Phause delivers enterprise-grade cybersecurity solutions — threat detection, security audits, cloud protection and 24/7 monitoring to keep your business safe.	cybersecurity,threat detection,cloud protection,phause	https://phause.com/	\N	\N	\N	\N	\N	\N	DRAFT	2026-11-02 07:56:03.078	2026-11-03 09:29:54.382	\N	\N	0
cmw0hkew6000ewvt9ce4lf78o	services	Phause | Cybersecurity Services	Security services built for modern teams: threat detection, audits, cloud protection, and strategic guidance.	cybersecurity services,threat detection,cloud protection	https://phause.com/services	\N	\N	\N	\N	\N	\N	DRAFT	2026-11-03 09:29:10.758	2026-11-03 09:29:54.426	\N	\N	0
cmw0hkex8000iwvt9k3le0viw	blog	Phause | Blog	Insights, research notes, and practical guidance from the Phause security team.	phause blog,cybersecurity insights	https://phause.com/blog	\N	\N	\N	\N	\N	\N	DRAFT	2026-11-03 09:29:10.796	2026-11-03 09:29:54.458	\N	\N	0
cmw0hkeyu000owvt9qnzgr4hv	faq	Phause | FAQ	Answers to common questions about Phause services, deployment, and security coverage.	phause faq,security questions	https://phause.com/faq	\N	\N	\N	\N	\N	\N	DRAFT	2026-11-03 09:29:10.854	2026-11-03 09:29:54.498	\N	\N	0
cmw0hkexx000lwvt96ct6e1li	docs	Untitled page	\N	\N	\N	\N	\N	\N	\N	\N	\N	DRAFT	2026-11-03 09:29:10.821	2026-11-03 11:00:41.31	\N	\N	0
cmvyyssr70006wvwj75isp9dt	about	Untitled page	\N	\N	\N	\N	\N	\N	\N	\N	\N	DRAFT	2026-11-02 07:56:03.091	2026-11-03 11:01:09.614	\N	\N	0
\.


--
-- Data for Name: Setting; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Setting" (id, slug, key, value, status, "createdAt", "updatedAt", "publishedAt", "deletedAt", version) FROM stdin;
cmvz7hoah0000wv6y58kvarbn	siteName	siteName	Phause	PUBLISHED	2026-11-02 11:59:20.633	2026-11-03 09:29:54.668	\N	\N	7
cmvz7hoan0001wv6yjw4g85rw	timezone	timezone	UTC	PUBLISHED	2026-11-02 11:59:20.639	2026-11-03 09:29:54.673	\N	\N	6
cmvz7hoar0002wv6y2gycabfe	publishingMode	publishingMode	Draft + publish	PUBLISHED	2026-11-02 11:59:20.644	2026-11-03 09:29:54.678	\N	\N	6
cmvz7hoav0003wv6yvnugdo8s	cmsApiEnabled	cmsApiEnabled	true	PUBLISHED	2026-11-02 11:59:20.647	2026-11-03 09:29:54.686	\N	\N	6
cmvz7hoaz0004wv6yzm5gu6g6	mediaPipelineEnabled	mediaPipelineEnabled	true	PUBLISHED	2026-11-02 11:59:20.651	2026-11-03 09:29:54.701	\N	\N	6
cmvz7hob40005wv6y1ivambe9	seoSyncEnabled	seoSyncEnabled	true	PUBLISHED	2026-11-02 11:59:20.656	2026-11-03 09:29:54.706	\N	\N	6
cmvz7hob80006wv6yag1vb9j4	supportEmail	supportEmail	hello@phause.com	PUBLISHED	2026-11-02 11:59:20.66	2026-11-03 09:29:54.717	\N	\N	6
cmvz7hobb0007wv6yx4qpivvy	supportPhone	supportPhone	+1 (555) 010-PHAUSE	PUBLISHED	2026-11-02 11:59:20.663	2026-11-03 09:29:54.721	\N	\N	6
cmvz7hobe0008wv6ynjps3uir	logoUrl	logoUrl	/logo/phause-logo.png	PUBLISHED	2026-11-02 11:59:20.666	2026-11-03 09:29:54.727	\N	\N	6
\.


--
-- Data for Name: Tag; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Tag" (id, slug, name, status, "createdAt", "updatedAt", "publishedAt", "deletedAt", version) FROM stdin;
\.


--
-- Data for Name: Testimonial; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Testimonial" (id, slug, quote, author, role, company, status, "createdAt", "updatedAt", "publishedAt", "deletedAt", version) FROM stdin;
\.


--
-- Data for Name: _CategoryToPost; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."_CategoryToPost" ("A", "B") FROM stdin;
\.


--
-- Data for Name: _PostToTag; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."_PostToTag" ("A", "B") FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
522702e3-56b8-471b-8d51-675ac19b6f27	f89431f2d63dfc94525d11313e0aadbe81c6bfd0d3f4a84756cde90cf3f438cf	2026-11-02 12:55:15.941522+05:30	20261102072515_init	\N	\N	2026-11-02 12:55:15.890782+05:30	1
\.


--
-- Name: AuditLog AuditLog_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_pkey" PRIMARY KEY (id);


--
-- Name: Author Author_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Author"
    ADD CONSTRAINT "Author_pkey" PRIMARY KEY (id);


--
-- Name: Category Category_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Category"
    ADD CONSTRAINT "Category_pkey" PRIMARY KEY (id);


--
-- Name: CrawlUrl CrawlUrl_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CrawlUrl"
    ADD CONSTRAINT "CrawlUrl_pkey" PRIMARY KEY (id);


--
-- Name: Faq Faq_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Faq"
    ADD CONSTRAINT "Faq_pkey" PRIMARY KEY (id);


--
-- Name: Feature Feature_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Feature"
    ADD CONSTRAINT "Feature_pkey" PRIMARY KEY (id);


--
-- Name: FooterLink FooterLink_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."FooterLink"
    ADD CONSTRAINT "FooterLink_pkey" PRIMARY KEY (id);


--
-- Name: Footer Footer_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Footer"
    ADD CONSTRAINT "Footer_pkey" PRIMARY KEY (id);


--
-- Name: Form Form_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Form"
    ADD CONSTRAINT "Form_pkey" PRIMARY KEY (id);


--
-- Name: GalleryItem GalleryItem_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."GalleryItem"
    ADD CONSTRAINT "GalleryItem_pkey" PRIMARY KEY (id);


--
-- Name: Lead Lead_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Lead"
    ADD CONSTRAINT "Lead_pkey" PRIMARY KEY (id);


--
-- Name: Media Media_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Media"
    ADD CONSTRAINT "Media_pkey" PRIMARY KEY (id);


--
-- Name: NavigationItem NavigationItem_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."NavigationItem"
    ADD CONSTRAINT "NavigationItem_pkey" PRIMARY KEY (id);


--
-- Name: Navigation Navigation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Navigation"
    ADD CONSTRAINT "Navigation_pkey" PRIMARY KEY (id);


--
-- Name: PageBlock PageBlock_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PageBlock"
    ADD CONSTRAINT "PageBlock_pkey" PRIMARY KEY (id);


--
-- Name: Page Page_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Page"
    ADD CONSTRAINT "Page_pkey" PRIMARY KEY (id);


--
-- Name: Post Post_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Post"
    ADD CONSTRAINT "Post_pkey" PRIMARY KEY (id);


--
-- Name: ScrapeJob ScrapeJob_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ScrapeJob"
    ADD CONSTRAINT "ScrapeJob_pkey" PRIMARY KEY (id);


--
-- Name: Seo Seo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Seo"
    ADD CONSTRAINT "Seo_pkey" PRIMARY KEY (id);


--
-- Name: Setting Setting_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Setting"
    ADD CONSTRAINT "Setting_pkey" PRIMARY KEY (id);


--
-- Name: Tag Tag_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Tag"
    ADD CONSTRAINT "Tag_pkey" PRIMARY KEY (id);


--
-- Name: Testimonial Testimonial_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Testimonial"
    ADD CONSTRAINT "Testimonial_pkey" PRIMARY KEY (id);


--
-- Name: _CategoryToPost _CategoryToPost_AB_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."_CategoryToPost"
    ADD CONSTRAINT "_CategoryToPost_AB_pkey" PRIMARY KEY ("A", "B");


--
-- Name: _PostToTag _PostToTag_AB_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."_PostToTag"
    ADD CONSTRAINT "_PostToTag_AB_pkey" PRIMARY KEY ("A", "B");


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: Author_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Author_slug_key" ON public."Author" USING btree (slug);


--
-- Name: Category_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Category_slug_key" ON public."Category" USING btree (slug);


--
-- Name: CrawlUrl_status_fetchedAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "CrawlUrl_status_fetchedAt_idx" ON public."CrawlUrl" USING btree (status, "fetchedAt");


--
-- Name: CrawlUrl_url_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "CrawlUrl_url_key" ON public."CrawlUrl" USING btree (url);


--
-- Name: Faq_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Faq_slug_key" ON public."Faq" USING btree (slug);


--
-- Name: Faq_status_publishedAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Faq_status_publishedAt_idx" ON public."Faq" USING btree (status, "publishedAt");


--
-- Name: Feature_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Feature_slug_key" ON public."Feature" USING btree (slug);


--
-- Name: FooterLink_footerId_position_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "FooterLink_footerId_position_idx" ON public."FooterLink" USING btree ("footerId", "position");


--
-- Name: Footer_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Footer_slug_key" ON public."Footer" USING btree (slug);


--
-- Name: Form_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Form_slug_key" ON public."Form" USING btree (slug);


--
-- Name: GalleryItem_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "GalleryItem_slug_key" ON public."GalleryItem" USING btree (slug);


--
-- Name: Lead_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Lead_slug_key" ON public."Lead" USING btree (slug);


--
-- Name: Media_checksum_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Media_checksum_idx" ON public."Media" USING btree (checksum);


--
-- Name: Media_checksum_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Media_checksum_key" ON public."Media" USING btree (checksum);


--
-- Name: Media_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Media_slug_key" ON public."Media" USING btree (slug);


--
-- Name: Media_status_mimeType_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Media_status_mimeType_idx" ON public."Media" USING btree (status, "mimeType");


--
-- Name: NavigationItem_navigationId_position_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "NavigationItem_navigationId_position_idx" ON public."NavigationItem" USING btree ("navigationId", "position");


--
-- Name: Navigation_key_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Navigation_key_key" ON public."Navigation" USING btree (key);


--
-- Name: Navigation_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Navigation_slug_key" ON public."Navigation" USING btree (slug);


--
-- Name: Navigation_status_position_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Navigation_status_position_idx" ON public."Navigation" USING btree (status, "position");


--
-- Name: PageBlock_pageId_order_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PageBlock_pageId_order_idx" ON public."PageBlock" USING btree ("pageId", "order");


--
-- Name: Page_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Page_createdAt_idx" ON public."Page" USING btree ("createdAt");


--
-- Name: Page_seoId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Page_seoId_key" ON public."Page" USING btree ("seoId");


--
-- Name: Page_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Page_slug_key" ON public."Page" USING btree (slug);


--
-- Name: Page_status_publishedAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Page_status_publishedAt_idx" ON public."Page" USING btree (status, "publishedAt");


--
-- Name: Post_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Post_createdAt_idx" ON public."Post" USING btree ("createdAt");


--
-- Name: Post_seoId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Post_seoId_key" ON public."Post" USING btree ("seoId");


--
-- Name: Post_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Post_slug_key" ON public."Post" USING btree (slug);


--
-- Name: Post_status_publishedAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Post_status_publishedAt_idx" ON public."Post" USING btree (status, "publishedAt");


--
-- Name: ScrapeJob_status_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "ScrapeJob_status_createdAt_idx" ON public."ScrapeJob" USING btree (status, "createdAt");


--
-- Name: Seo_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Seo_slug_key" ON public."Seo" USING btree (slug);


--
-- Name: Setting_key_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Setting_key_key" ON public."Setting" USING btree (key);


--
-- Name: Setting_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Setting_slug_key" ON public."Setting" USING btree (slug);


--
-- Name: Tag_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Tag_slug_key" ON public."Tag" USING btree (slug);


--
-- Name: Testimonial_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Testimonial_slug_key" ON public."Testimonial" USING btree (slug);


--
-- Name: _CategoryToPost_B_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "_CategoryToPost_B_index" ON public."_CategoryToPost" USING btree ("B");


--
-- Name: _PostToTag_B_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "_PostToTag_B_index" ON public."_PostToTag" USING btree ("B");


--
-- Name: AuditLog AuditLog_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public."Author"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: AuditLog AuditLog_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."Category"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: AuditLog AuditLog_faqId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_faqId_fkey" FOREIGN KEY ("faqId") REFERENCES public."Faq"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: AuditLog AuditLog_featureId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES public."Feature"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: AuditLog AuditLog_footerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_footerId_fkey" FOREIGN KEY ("footerId") REFERENCES public."Footer"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: AuditLog AuditLog_formId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_formId_fkey" FOREIGN KEY ("formId") REFERENCES public."Form"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: AuditLog AuditLog_galleryItemId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_galleryItemId_fkey" FOREIGN KEY ("galleryItemId") REFERENCES public."GalleryItem"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: AuditLog AuditLog_leadId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES public."Lead"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: AuditLog AuditLog_mediaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES public."Media"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: AuditLog AuditLog_navigationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_navigationId_fkey" FOREIGN KEY ("navigationId") REFERENCES public."Navigation"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: AuditLog AuditLog_pageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES public."Page"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: AuditLog AuditLog_postId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_postId_fkey" FOREIGN KEY ("postId") REFERENCES public."Post"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: AuditLog AuditLog_seoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_seoId_fkey" FOREIGN KEY ("seoId") REFERENCES public."Seo"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: AuditLog AuditLog_settingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_settingId_fkey" FOREIGN KEY ("settingId") REFERENCES public."Setting"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: AuditLog AuditLog_tagId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES public."Tag"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: AuditLog AuditLog_testimonialId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_testimonialId_fkey" FOREIGN KEY ("testimonialId") REFERENCES public."Testimonial"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: FooterLink FooterLink_footerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."FooterLink"
    ADD CONSTRAINT "FooterLink_footerId_fkey" FOREIGN KEY ("footerId") REFERENCES public."Footer"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: NavigationItem NavigationItem_navigationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."NavigationItem"
    ADD CONSTRAINT "NavigationItem_navigationId_fkey" FOREIGN KEY ("navigationId") REFERENCES public."Navigation"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PageBlock PageBlock_mediaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PageBlock"
    ADD CONSTRAINT "PageBlock_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES public."Media"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: PageBlock PageBlock_pageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PageBlock"
    ADD CONSTRAINT "PageBlock_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES public."Page"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Page Page_seoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Page"
    ADD CONSTRAINT "Page_seoId_fkey" FOREIGN KEY ("seoId") REFERENCES public."Seo"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Post Post_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Post"
    ADD CONSTRAINT "Post_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public."Author"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Post Post_featuredImageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Post"
    ADD CONSTRAINT "Post_featuredImageId_fkey" FOREIGN KEY ("featuredImageId") REFERENCES public."Media"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Post Post_ogImageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Post"
    ADD CONSTRAINT "Post_ogImageId_fkey" FOREIGN KEY ("ogImageId") REFERENCES public."Media"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Post Post_seoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Post"
    ADD CONSTRAINT "Post_seoId_fkey" FOREIGN KEY ("seoId") REFERENCES public."Seo"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Post Post_thumbnailImageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Post"
    ADD CONSTRAINT "Post_thumbnailImageId_fkey" FOREIGN KEY ("thumbnailImageId") REFERENCES public."Media"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: _CategoryToPost _CategoryToPost_A_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."_CategoryToPost"
    ADD CONSTRAINT "_CategoryToPost_A_fkey" FOREIGN KEY ("A") REFERENCES public."Category"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _CategoryToPost _CategoryToPost_B_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."_CategoryToPost"
    ADD CONSTRAINT "_CategoryToPost_B_fkey" FOREIGN KEY ("B") REFERENCES public."Post"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _PostToTag _PostToTag_A_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."_PostToTag"
    ADD CONSTRAINT "_PostToTag_A_fkey" FOREIGN KEY ("A") REFERENCES public."Post"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _PostToTag _PostToTag_B_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."_PostToTag"
    ADD CONSTRAINT "_PostToTag_B_fkey" FOREIGN KEY ("B") REFERENCES public."Tag"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict isrXZScavV47jj4PSabJV2bkMrnpImVLuEEazn5h7okSNsMYTb88FHQcT7T4EZn

