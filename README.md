# 🛠️ ManteniPro (Mai CMMS)

> **Computerized Maintenance Management System for Small Businesses**
>
> *Desarrollado por Mai Tech*

## 💡 Acerca del Proyecto

**ManteniPro** es una aplicación de gestión de mantenimiento asistido por ordenador (CMMS) diseñada específicamente para ayudar a pequeños negocios (talleres, gimnasios, academias o empresas de servicios) a controlar sus equipos y prevenir el olvido de revisiones periódicas.

Reemplaza el uso de hojas de cálculo (Excel), notas en papel o calendarios fragmentados mediante una solución centralizada, sencilla y eficiente.

### Preguntas clave que responde ManteniPro:

* ¿Qué equipos están registrados en la empresa?

* ¿Cuándo le corresponde la próxima revisión a cada equipo?

* ¿Qué mantenimientos están pendientes o próximos a vencer?

* ¿Qué trabajos se han realizado y cuáles siguen abiertos?

* ¿Cuánto tiempo lleva una tarea sin resolverse?

## 🎯 Propuesta de Valor

* **Centralización:** Toda la información técnica y operativa de los equipos en un solo lugar.

* **Sin Hoja de Cálculo:** Reduce errores humanos y pérdida de historial.

* **Nicho Inicial:** Dirigido a pequeñas empresas de mantenimiento o negocios con equipamiento sujeto a revisiones obligatorias o periódicas.

* **Modelo de Negocio Futuro:** Suscripción mensual (SaaS) por empresa con límites según el número de equipos registrados.

## 🚀 Alcance del MVP

### 🟢 Incluido en el MVP

* \[x\] **Gestión de Equipos:** Registrar, editar y consultar equipos (nombre, código, ubicación, próxima revisión).

* \[x\] **Órdenes de Mantenimiento:** Creación de órdenes asociadas a cada equipo.

* \[x\] **Gestión de Estados:** Estados `PENDIENTES`, `EN CURSO` y `COMPLETADA`.

* \[x\] **Seguimiento Detallado:** Registro de fechas, descripciones y observaciones de cada trabajo.

* \[x\] **Alertas y Filtros:** Consulta de mantenimientos pendientes/próximos a vencer; filtrado por equipo, estado y rango de fechas.

* \[x\] **Historial:** Histórico completo de mantenimientos por equipo.

* \[x\] **Validaciones:** Control de errores en formularios con mensajes comprensibles.

* \[x\] **API REST:** Endpoints dedicados para las operaciones principales.

### 🔴 Fuera del Alcance del MVP (Fases Posteriores)

* Apps móviles nativas.

* Lectura de códigos QR.

* Notificaciones por SMS o WhatsApp.

* Módulo de facturación y pagos.

* Gestión de inventario, almacén y repuestos.

* Inteligencia Artificial o integración con sensores IoT.

* Autenticación, roles y soporte multi-empresa complejo (se incorporarán antes de salir a producción comercial).

## 🏗 Arquitectura y Tecnologías

La aplicación está construida sobre una arquitectura **MVC (Model-View-Controller)** accesible tanto desde una interfaz web dinámica como a través de endpoints REST.

```
                  ┌─────────────────────────────────────────┐
                  │              Cliente (Browser / Client) │
                  └────────────────────┬────────────────────┘
                                       │
                    ┌──────────────────┴──────────────────┐
                    ▼                                     ▼
      ┌───────────────────────────┐         ┌───────────────────────────┐
      │     Vistas Thymeleaf      │         │         API REST          │
      │ (HTML5, Bootstrap, CSS3) │         │    (JSON / Controllers)   │
      └─────────────┬─────────────┘         └─────────────┬─────────────┘
                    │                                     │
                    └──────────────────┬──────────────────┘
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │          Spring Boot Service            │
                  │   (Lógica de negocio y Validaciones)    │
                  └────────────────────┬────────────────────┘
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │            Spring Data JPA              │
                  └────────────────────┬────────────────────┘
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │            PostgreSQL / Supabase        │
                  └────────────────────┬────────────────────┘
```

* **Backend:** Java 17+, Spring Boot, Spring Data JPA, Hibernate.

* **Frontend:** Thymeleaf, HTML5, CSS3, Bootstrap.

* **Base de Datos:** PostgreSQL (Local o cloud vía Supabase).

* **DevOps & CI/CD:** Maven, Docker, Jenkins, Kubernetes (Manifiestos básicos).

* **Pruebas:** JUnit 5, Spring Boot Test.

* **Herramientas API:** Postman / IntelliJ HTTP Client.

## 📊 Modelo de Datos

El diseño relacional consta de las siguientes entidades principales:

### Entidades

```
 ┌──────────────────────────┐          ┌──────────────────────────┐          ┌──────────────────────────┐
 │        EQUIPMENT         │          │    MAINTENANCE_ORDER     │          │     MAINTENANCE_LOG      │
 ├──────────────────────────┤          ├──────────────────────────┤          ├──────────────────────────┤
 │ id (PK)                  │ 1      N │ id (PK)                  │ 1      N │ id (PK)                  │
 │ name                     ├──────────┤ equipment_id (FK)        ├──────────┤ order_id (FK)            │
 │ asset_code               │          │ title                    │          │ description              │
 │ location                 │          │ description              │          │ performed_at             │
 │ next_maintenance_date    │          │ status                   │          │ notes                    │
 │ active                   │          │ priority                 │          └──────────────────────────┘
 └──────────────────────────┘          │ due_date                 │                  (Opcional)
                                       │ created_at               │
                                       │ completed_at             │
                                       └──────────────────────────┘
```

### Reglas de Negocio Integradas:

1. Una orden completada debe incluir obligatoriamente su `completed_at`.

2. No es posible asociar una orden a un equipo inexistente.

3. La finalización de órdenes pasadas debe validar adecuadamente la fecha de próxima revisión del equipo (`next_maintenance_date`).

## 🔌 API REST Endpoints

Todos los endpoints devuelven respuestas en formato `JSON` e implementan códigos de estado HTTP estándar (`200 OK`, `201 Created`, `400 Bad Request`, `404 Not Found`).

| Método | Endpoint | Descripción |
| ----- | ----- | ----- |
| `GET` | `/api/equipment` | Listar todos los equipos registrados |
| `GET` | `/api/equipment/{id}` | Consultar el detalle de un equipo específico |
| `POST` | `/api/equipment` | Registrar un nuevo equipo |
| `PUT` | `/api/equipment/{id}` | Actualizar datos de un equipo |
| `GET` | `/api/equipment/{id}/orders` | Consultar las órdenes asociadas a un equipo |
| `GET` | `/api/orders` | Listar órdenes de mantenimiento con posibilidad de filtros |
| `POST` | `/api/orders` | Crear una nueva orden de mantenimiento |
| `PATCH` | `/api/orders/{id}/status` | Cambiar el estado de una orden |
| `GET` | `/api/orders/upcoming` | Consultar revisiones y mantenimientos próximos a vencer |

## 🖥️ Estructura de Vistas (Thymeleaf)

* `/dashboard` — Resumen general con métricas de equipos activos, órdenes pendientes y alertas de próximos vencimientos.

* `/equipment` — Listado completo de equipos y formulario de alta/edición.

* `/equipment/{id}` — Ficha de detalle del equipo junto con su historial de intervenciones.

* `/orders` — Vista general de órdenes de mantenimiento con panel de filtros (por estado, fechas y equipo).

* `/orders/new` — Formulario para el registro de nueva orden de trabajo.

## 🗓️ Plan de Desarrollo (100 Horas)

| Fase | Duración | Descripción | Entregable |
| ----- | ----- | ----- | ----- |
| **Fase 1: Diseño y Maven** | 5 h | Definición de MVP, creación de repositorio, configuración de Maven y diseño ER. | Estructura ejecutable inicial. |
| **Fase 2: Spring Boot y Persistencia** | 20 h | Entidades JPA, repositorios, servicios, reglas de negocio y conexión a PostgreSQL. | CRUD y lógica principal con base de datos. |
| **Fase 3: Thymeleaf** | 20 h | Desarrollo de vistas web: formularios, listados, filtros y dashboard. | App web interactiva navegable. |
| **Fase 4: API REST** | 12 h | Endpoints, DTOs, validaciones de entrada y manejo de excepciones HTTP. | API REST documentada y probada. |
| **Fase 5: Pruebas** | 10 h | Pruebas unitarias e integración de reglas de negocio y casos límites. | Test suite con JUnit. |
| **Fase 6: Jenkins y Docker** | 10 h | Automatización de builds, dockerización de la app y scripts de ejecución. | Dockerfile y pipeline en Jenkins. |
| **Fase 7: Kubernetes** | 8 h | Creación de manifiestos de despliegue y servicio para clúster local. | Manifiestos K8s funcionales. |
| **Fase 8: Portfolio y Demo** | 5 h | Documentación en README, diagrama de arquitectura y preparación de la demo. | Repositorio listo para presentación. |
| **Reserva** | 10 h | Margen para resolución de imprevistos o ajustes finales. | \- |

## 🛡️ Riesgos y Mitigaciones

| Riesgo Detectado | Estrategia de Mitigación |
| ----- | ----- |
| Scope Creep (Añadir demasiadas funciones) | MVP strictly frozen pre-desarrollo. |
| Pérdida de tiempo en diseño de interfaz | Implementación de componentes estándar Bootstrap. |
| Complejidad en orquestación Kubernetes | Despliegue monolítico simple en un único contenedor. |
| Fuga de credenciales (Base de datos) | Uso estricto de variables de entorno (`.env`), ignoradas en `.gitignore`. |
| Inconsistencia de datos relacionales | Centralización de lógica e invariantes en la capa `@Service`. |

## ⚡ Despliegue y Ejecución Local

### Prerrequisitos

* Java 17 o superior

* Maven 3.8+

* Docker y Docker Compose (Opcional para DB local)

### Pasos

1. **Clonar el repositorio:**

   ```bash
   git clone https://github.com/tu-usuario/mantenipro.git
   cd mantenipro
   ```

2. **Configurar variables de entorno:**
   Crea un archivo `.env` o configura tus variables del sistema:

   ```env
   DB_URL=jdbc:postgresql://localhost:5432/mantenipro_db
   DB_USERNAME=tu_usuario
   DB_PASSWORD=tu_contraseña
   ```

3. **Compilar y ejecutar:**

   ```bash
   mvn clean package
   java -jar target/mantenipro-0.0.1-SNAPSHOT.jar
   ```

4. **Ejecutar con Docker:**

   ```bash
   docker build -t mantenipro:latest .
   docker run -p 8080:8080 --env-file .env mantenipro:latest
   ```

*Proyecto diseñado y desarrollado como solución MVP funcional para la gestión de mantenimiento en PYMES.*