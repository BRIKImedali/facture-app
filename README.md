# 🧾 FacturaPro — Système de Gestion de Facturation

> Application web professionnelle de facturation pour PME — Projet de Fin d'Études (PFE)

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2-brightgreen)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)
[![Java](https://img.shields.io/badge/Java-17-orange)](https://www.java.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 📋 Table des matières

- [Fonctionnalités](#-fonctionnalités)
- [Architecture](#-architecture)
- [Diagrammes UML](#-diagrammes-uml)
- [Prérequis](#-prérequis)
- [Installation et Démarrage](#-installation-et-démarrage)
- [Comptes de test](#-comptes-de-test)
- [Configuration IA (Gemini)](#-configuration-ia-gemini)
- [Endpoints API](#-endpoints-api)
- [Structure du projet](#-structure-du-projet)

---

## ✨ Fonctionnalités

### Gestion des factures
- ✅ Création de factures avec lignes de détail (HT, TVA, TTC)
- ✅ Numérotation automatique `FAC-YYYY-XXXX`
- ✅ Gestion du cycle de vie : `BROUILLON → ENVOYÉE → PAYÉE / ANNULÉE`
- ✅ Téléchargement PDF (Thymeleaf + Flying Saucer)
- ✅ Export XML structuré pour l'ERP

### Gestion des clients, produits et stocks
- ✅ CRUD complet clients avec informations fiscales (ICE, catégories)
- ✅ Catalogue de produits/services avec TVA et unités configurables
- ✅ Gestion de stock multi-sites (Site, Emplacement, Stock) avec alertes de seuil minimum

### Intelligence Artificielle (Google Gemini)
- ✅ **ChatBot intégré** — Posez des questions de comptabilité et de facturation
- ✅ **Validation IA** — Détection automatique d'erreurs (TVA, calculs, incohérences)

### Administration & Sécurité
- ✅ Authentification JWT robuste
- ✅ **Gestion des rôles (AppRole)** et permissions granulaires (`FACTURE:CREATE`, `CLIENT:READ`, etc.)
- ✅ Audit complet des actions (`AuditLog`)
- ✅ Tableau de bord avec statistiques financières, évolution du CA et top clients
- ✅ Paramétrage ERP et gestion de la base de données intégrée

---

## 🏗️ Architecture

```mermaid
graph LR
    subgraph Frontend["Frontend — React 18"]
        Pages["Pages\n(FactureForm, LoginPage...)"]
        Services["Services API\n(axios + JWT)"]
        Context["AuthContext\n(useState + localStorage)"]
    end

    subgraph Backend["Backend — Spring Boot 3.2"]
        Controllers["Controllers\n(@RestController)"]
        Security["Security Filter\n(JwtAuthFilter)"]
        AppServices["Services\n(@Service @Transactional)"]
        Repos["Repositories\n(JpaRepository)"]
    end

    subgraph DB["Persistance"]
        MySQL[(MySQL / PostgreSQL\nJPA / Hibernate)]
    end

    Pages --> Services
    Services -->|HTTP + Bearer JWT| Controllers
    Controllers --> Security
    Security --> AppServices
    AppServices --> Repos
    Repos --> MySQL
```

**Stack technique :**
| Couche | Technologie |
|--------|-------------|
| Backend | Spring Boot 3.2, Spring Security, Spring Data JPA |
| Base de données | H2 (dev) / PostgreSQL (prod) |
| Frontend | React 18, Vite, Recharts, React Router v6 |
| Auth | JWT (jjwt) |
| IA | Google Gemini API (via REST) |
| PDF | Thymeleaf + Flying Saucer (OpenPDF) |

---

## 📐 Diagrammes UML

### 1. Diagramme de Classes (Entités du Domaine)

```mermaid
classDiagram
    direction TB

    class User {
        <<Entity>>
        - Long id
        - String username
        - String password
        - Boolean isActive
        + boolean hasPermission(String permissionString)
    }

    class AppRole {
        <<Entity>>
        - String name
        - Boolean isSystemRole
    }

    class Permission {
        <<Entity>>
        - String entity
        - String action
    }

    class Facture {
        <<Entity>>
        - String numero
        - StatutFacture statut
        - BigDecimal totalTTC
    }

    class Client {
        <<Entity>>
        - String nom
        - String email
        - String ice
    }

    class LigneFacture {
        <<Entity>>
        - Integer quantite
        - BigDecimal montantTTC
    }

    class Produit {
        <<Entity>>
        - String reference
        - String nom
        - BigDecimal prixHT
    }

    class Site {
        <<Entity>>
        - String nom
        - String ville
    }

    class Emplacement {
        <<Entity>>
        - String zone
        - String rayon
    }

    class Stock {
        <<Entity>>
        - Integer quantite
        - Integer seuilMinimum
        + boolean isEnAlerte()
    }

    %% Relations
    User "0..*" o-- "0..*" AppRole : appRoles
    AppRole "0..*" o-- "0..*" Permission : permissions
    Facture "0..*" --> "1" Client : client
    Facture "0..*" --> "0..1" User : createdBy
    Facture "1" *-- "0..*" LigneFacture : lignes
    LigneFacture "0..*" --> "0..1" Produit : produit
    Site "1" *-- "0..*" Emplacement : emplacements
    Site "1" *-- "0..*" Stock : stocks
    Stock "0..*" --> "1" Produit : produit
    Stock "0..*" --> "1" Site : site
    Stock "0..*" --> "0..1" Emplacement : emplacement
```

### 2. Diagramme de Cas d'Utilisation

```mermaid
graph TB
    subgraph Acteurs
        ADMIN([👤 Admin])
        USER([👤 User])
    end

    subgraph UC["🧾 FacturaPro — Fonctionnalités"]
        UC_Auth(Authentification JWT)
        UC_Fact(Gérer les Factures)
        UC_Cli(Gérer les Clients)
        UC_Prod(Gérer les Produits & Stocks)
        UC_Admin(Administration : Users, Rôles, Audits)
        UC_IA(Interagir avec l'IA)
    end

    ADMIN --> UC_Auth
    ADMIN --> UC_Fact
    ADMIN --> UC_Cli
    ADMIN --> UC_Prod
    ADMIN --> UC_Admin
    ADMIN --> UC_IA

    USER --> UC_Auth
    USER -.->|selon permissions| UC_Fact
    USER -.->|selon permissions| UC_Cli
    USER -.->|selon permissions| UC_Prod
```

### 3. Diagramme de Séquence : Création d'une Facture

```mermaid
sequenceDiagram
    autonumber
    actor Utilisateur as 👤 Utilisateur
    participant React as React (Frontend)
    participant Ctrl as FactureController
    participant Svc as FactureService
    participant DB as 🗄️ Base de données

    Utilisateur->>React: Soumet le formulaire de facture
    React->>Ctrl: POST /api/factures (avec JWT)
    Ctrl->>Svc: create(Request)
    Svc->>DB: Vérifie l'existence du client
    Svc->>Svc: Génère numéro unique (FAC-YYYY-XXXX)
    Svc->>Svc: Calcule les totaux HT, TVA, TTC
    Svc->>DB: Sauvegarde Facture + Lignes (cascade)
    DB-->>Svc: Entité persistée
    Svc-->>Ctrl: DTO FactureResponse
    Ctrl-->>React: HTTP 201 Created
    React-->>Utilisateur: Confirmation de création
```

---

## 📦 Prérequis

- Java 17+
- Maven 3.8+
- Node.js 18+ et npm

---

## 🚀 Installation et Démarrage

### 1. Cloner le projet

```bash
git clone <url-du-repo>
cd facturation-app
```

### 2. Démarrer le Backend

```bash
cd backend
mvn spring-boot:run
```

> Le serveur démarre sur `http://localhost:8080`
> La console H2 est disponible sur `http://localhost:8080/h2-console`

### 3. Démarrer le Frontend

```bash
cd frontend
npm install
npm run dev
```

> L'application est disponible sur `http://localhost:5173`

---

## 👤 Comptes de test

Les comptes suivants sont créés automatiquement au premier démarrage :

| Rôle | Username / Identifiant | Mot de passe |
|------|-------|--------------|
| **ADMIN** | `admin` | `admin123` |
| **USER** | `user` | `user123` |

---

## 🤖 Configuration IA (Gemini)

Pour activer l'assistant IA et la validation de factures, une clé API Google Gemini est nécessaire :

1. Créer une clé gratuite sur [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Modifier `backend/src/main/resources/application.properties` :

```properties
gemini.api.key=VOTRE_CLE_API_ICI
```

---

## 📡 Endpoints API

La documentation Swagger interactive est disponible sur : `http://localhost:8080/swagger-ui.html`

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/auth/login` | Connexion (retourne JWT) |
| GET | `/api/factures` | Liste des factures |
| POST | `/api/factures` | Créer une facture |
| PATCH | `/api/factures/{id}/statut` | Changer le statut |
| GET | `/api/factures/{id}/pdf` | Télécharger le PDF |
| GET | `/api/factures/{id}/export-xml` | Exporter en XML |
| POST | `/api/ai/chat` | Poser une question à l'IA |
| GET | `/api/dashboard/stats` | Statistiques Dashboard |

---

## 📂 Structure du projet

```
facturation-app/
├── backend/          # Spring Boot 3.2 (Java 17)
│   ├── src/main/java/com/pfe/facturation/
│   │   ├── controller/   # REST Controllers
│   │   ├── service/      # Logique métier
│   │   ├── repository/   # Spring Data JPA
│   │   ├── entity/       # Entités JPA Métier
│   │   ├── model/        # Entités Administration & Rôles
│   │   └── security/     # JWT, Configuration Sécurité
│   └── src/main/resources/
│       └── templates/    # Templates Thymeleaf (PDF)
│
└── frontend/         # React 18 + Vite
    └── src/
        ├── components/   # Composants réutilisables
        ├── context/      # Contextes React (AuthContext)
        ├── pages/        # Vues principales (Dashboard, Factures...)
        └── services/     # Appels API (Axios)
```
