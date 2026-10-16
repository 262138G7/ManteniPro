--
-- PostgreSQL database dump
--

\restrict CaS3YaRX2edroy8bdi5rI1I0WSCZH1ftYUMNqhdewSwKcSAXomJPJ1oADic1yG2

-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

-- Started on 2026-10-16 10:07:53

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
-- TOC entry 4 (class 2615 OID 2200)
-- Name: public; Type: SCHEMA; Schema: -; Owner: pg_database_owner
--

CREATE SCHEMA public;


ALTER SCHEMA public OWNER TO pg_database_owner;

--
-- TOC entry 5046 (class 0 OID 0)
-- Dependencies: 4
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

COMMENT ON SCHEMA public IS 'standard public schema';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 220 (class 1259 OID 16482)
-- Name: equipment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.equipment (
    id integer NOT NULL,
    name character varying(150) NOT NULL,
    asset_code character varying(50) NOT NULL,
    location character varying(150) NOT NULL,
    next_maintenance_date date NOT NULL,
    active boolean DEFAULT true NOT NULL
);


ALTER TABLE public.equipment OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 16481)
-- Name: equipment_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.equipment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.equipment_id_seq OWNER TO postgres;

--
-- TOC entry 5047 (class 0 OID 0)
-- Dependencies: 219
-- Name: equipment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.equipment_id_seq OWNED BY public.equipment.id;


--
-- TOC entry 224 (class 1259 OID 16522)
-- Name: maintenance_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.maintenance_log (
    id integer NOT NULL,
    order_id integer NOT NULL,
    description text NOT NULL,
    performed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    notes text
);


ALTER TABLE public.maintenance_log OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 16521)
-- Name: maintenance_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.maintenance_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.maintenance_log_id_seq OWNER TO postgres;

--
-- TOC entry 5048 (class 0 OID 0)
-- Dependencies: 223
-- Name: maintenance_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.maintenance_log_id_seq OWNED BY public.maintenance_log.id;


--
-- TOC entry 222 (class 1259 OID 16498)
-- Name: maintenance_order; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.maintenance_order (
    id integer NOT NULL,
    equipment_id integer NOT NULL,
    title character varying(150) NOT NULL,
    description text,
    status character varying(30) NOT NULL,
    priority character varying(20) NOT NULL,
    due_date date NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    completed_at timestamp without time zone,
    CONSTRAINT maintenance_order_priority_check CHECK (((priority)::text = ANY ((ARRAY['LOW'::character varying, 'MEDIUM'::character varying, 'HIGH'::character varying, 'URGENT'::character varying])::text[]))),
    CONSTRAINT maintenance_order_status_check CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'IN_PROGRESS'::character varying, 'COMPLETED'::character varying])::text[])))
);


ALTER TABLE public.maintenance_order OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 16497)
-- Name: maintenance_order_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.maintenance_order_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.maintenance_order_id_seq OWNER TO postgres;

--
-- TOC entry 5049 (class 0 OID 0)
-- Dependencies: 221
-- Name: maintenance_order_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.maintenance_order_id_seq OWNED BY public.maintenance_order.id;


--
-- TOC entry 4866 (class 2604 OID 16485)
-- Name: equipment id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.equipment ALTER COLUMN id SET DEFAULT nextval('public.equipment_id_seq'::regclass);


--
-- TOC entry 4870 (class 2604 OID 16525)
-- Name: maintenance_log id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance_log ALTER COLUMN id SET DEFAULT nextval('public.maintenance_log_id_seq'::regclass);


--
-- TOC entry 4868 (class 2604 OID 16501)
-- Name: maintenance_order id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenance_order ALTER COLUMN id SET DEFAULT nextval('public.maintenance_order_id_seq'::regclass);


--
-- TOC entry 5036 (class 0 OID 16482)
-- Dependencies: 220
-- Data for Name: equipment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.equipment (id, name, asset_code, location, next_maintenance_date, active) FROM stdin;
1	Compresor de Aire Industrial	EQ-COMP-001	Taller Principal - Zona A	2026-11-15	t
2	Torno CNC de Precisión	EQ-TORNO-002	Área de Mecanizado	2026-10-30	t
3	Elevador Hidráulico 4 Columnas	EQ-ELEV-003	Bahía de Revisión 2	2026-12-01	t
4	Cinta Transportadora Principal	EQ-CINTA-004	Línea de Ensamblaje 1	2026-10-25	t
5	Generador Eléctrico de Emergencia	EQ-GEN-005	Exterior - Caseta de Máquinas	2027-01-10	f
\.


--
-- TOC entry 5040 (class 0 OID 16522)
-- Dependencies: 224
-- Data for Name: maintenance_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.maintenance_log (id, order_id, description, performed_at, notes) FROM stdin;
1	4	Desmontaje parcial de rodillos y limpieza de residuos acumulados.	2026-10-10 11:08:09.403566	Se encontró desgaste leve en un rodillo secundario pero aún es funcional.
2	4	Lubricación de rodamientos y prueba de carga exitosa.	2026-10-11 11:08:09.403566	La cinta opera con normalidad sin ruidos extraños.
\.


--
-- TOC entry 5038 (class 0 OID 16498)
-- Dependencies: 222
-- Data for Name: maintenance_order; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.maintenance_order (id, equipment_id, title, description, status, priority, due_date, created_at, completed_at) FROM stdin;
1	1	Cambio de filtros y aceite	Realizar cambio completo de aceite de compresor y sustitución de filtros de aire.	PENDING	HIGH	2026-11-15	2026-10-12 11:08:09.403566	\N
2	2	Calibración de ejes X e Y	Revisión periódica de precisión y ajuste de holguras en guías del torno.	IN_PROGRESS	URGENT	2026-10-30	2026-10-09 11:08:09.403566	\N
3	3	Inspección de cables de acero	Verificar estado de desgaste de cables y pruebas del sistema de bloqueo de seguridad.	PENDING	MEDIUM	2026-12-01	2026-10-13 11:08:09.403566	\N
4	4	Revisión de rodillos y motor	Limpieza general de la banda transportadora y engrase de rodamientos principales.	COMPLETED	LOW	2026-10-10	2026-10-04 11:08:09.403566	2026-10-11 11:08:09.403566
5	5	Prueba de arranque mensual	Comprobar el encendido automático ante cortes de suministro eléctrico.	PENDING	LOW	2027-01-10	2026-10-14 11:08:09.403566	\N
\.


--
-- TOC entry 5050 (class 0 OID 0)
-- Dependencies: 219
-- Name: equipment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.equipment_id_seq', 5, true);


--
-- TOC entry 5051 (class 0 OID 0)
-- Dependencies: 223
-- Name: maintenance_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.maintenance_log_id_seq', 2, true);


--
-- TOC entry 5052 (class 0 OID 0)
-- Dependencies: 221
-- Name: maintenance_order_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.maintenance_order_id_seq', 5, true);


-- Completed on 2026-10-16 10:07:53

--
-- PostgreSQL database dump complete
--

\unrestrict CaS3YaRX2edroy8bdi5rI1I0WSCZH1ftYUMNqhdewSwKcSAXomJPJ1oADic1yG2

