<div align="center">
  <img src="frontend/public/logo.png" alt="BUNON Gents logo" width="180" />

  # BUNON Gents

  **A full-stack fashion e-commerce platform for Bangladesh**

  A modern storefront and administration system powered by **Next.js, React, Node.js, Express, and MongoDB**.

  **Developed & Managed by Md. Masum Billah**  
  **Lead Engineer — SpideyTech**
</div>

---

## Contents

- [About the project](#about-the-project)
- [Features](#features)
- [Technology stack](#technology-stack)
- [System architecture](#system-architecture)
- [MongoDB data model and ER diagrams](#mongodb-data-model-and-er-diagrams)
- [Data flow architecture](#data-flow-architecture)
  - [Level 0: system context](#level-0-system-context)
  - [Level 1: application processes and data stores](#level-1-application-processes-and-data-stores)
  - [Catalog browsing and cart](#catalog-browsing-and-cart)
  - [Authentication and authorization](#authentication-and-authorization)
  - [Checkout, payments and inventory](#checkout-payments-and-inventory)
  - [Order tracking and account history](#order-tracking-and-account-history)
  - [Admin management, analytics and images](#admin-management-analytics-and-images)
  - [Server startup and database seeding](#server-startup-and-database-seeding)
- [API reference](#api-reference)
- [Project structure](#project-structure)
- [Local development](#local-development)
- [Implementation notes and production checklist](#implementation-notes-and-production-checklist)
- [Development and management](#development-and-management)
- [License](#license)

## About the project

**BUNON Gents** is a men's fashion e-commerce application featuring a responsive customer storefront, account and order management, and a browser-based admin dashboard. Prices are shown in **Bangladeshi Taka (BDT)**, and delivery fees can be configured for addresses inside and outside Dhaka.

> **Documentation scope:** The diagrams below document the implementation in this repository, rather than a proposed microservices architecture. The backend is a single Express application, and MongoDB documents are managed using Mongoose. This is a development/portfolio project, not a completed production-security audit.

## Features

**Customer-facing**

- Responsive editorial storefront, hero content, featured products, and collection cards.
- Product catalog, category filters, quick-view modal, sizes, colors, and stock display.
- Account registration and login, profile management, and order history.
- Browser-persisted shopping cart with product/size/color variants.
- Authenticated checkout and configurable delivery fees.
- Cash on Delivery (COD) or **manual** bKash/Nagad payment instructions and transaction-ID submission.
- Order tracking using an order number or customer phone number (see security limitations).

**Administration**

- Dashboard summary of orders, customers, products, collections, and calculated order totals.
- Create, update, and delete products and collection cards.
- View orders and update order and payment status.
- Manage users and administrator credentials.
- Edit storefront banners, contact details, payment instructions, category labels, and shipping prices.
- Upload product and banner images to ImgBB through the protected backend upload endpoint.

## Technology stack

| Layer | Implementation |
| --- | --- |
| Frontend | Next.js 15 App Router, React 19, TypeScript |
| Styling and components | Tailwind CSS 4, Lucide React, Google Fonts |
| Frontend state | React Context (`AuthContext`, `CartContext`) and browser `localStorage` |
| Backend | Node.js, Express 4, JavaScript REST endpoints |
| Database | MongoDB, Mongoose 8 |
| Authentication | JWT bearer tokens (30-day expiry), bcryptjs password hashing |
| File uploads | Multer in-memory upload, server-side ImgBB API call |
| Payment methods | COD; manual, off-platform bKash and Nagad transfers |

## System architecture

The Next.js frontend calls the Express REST API directly. Mongoose reads and writes MongoDB documents; uploaded images are stored externally on ImgBB, with their URLs saved in application records.

```mermaid
flowchart LR
    Shopper["Customer / shopper"]
    Admin["Store administrator"]

    subgraph Browser["Browser + Next.js 15 / React 19"]
        Pages["Storefront, account, checkout,<br/>order tracking, admin pages"]
        AuthContext["AuthContext<br/>JWT and profile"]
        CartContext["CartContext<br/>cart state"]
        LocalStorage[("Browser localStorage<br/>sessions and cart")]
        Pages --- AuthContext
        Pages --- CartContext
        AuthContext <--> LocalStorage
        CartContext <--> LocalStorage
    end

    subgraph Server["Node.js + Express REST API"]
        API["/api/auth, /products, /collections,<br/>/orders, /settings, /upload"]
        Guards["JWT middleware<br/>protectUser / protectAdmin"]
        ODM["Mongoose models"]
        API --> Guards
        API --> ODM
    end

    DB[("MongoDB<br/>users, products, collections,<br/>orders, settings")]
    ImgBB["ImgBB image hosting"]
    Wallet["bKash / Nagad wallet app<br/>manual transfer only"]

    Shopper --> Pages
    Admin --> Pages
    Pages <-->|"JSON REST requests / responses"| API
    ODM <--> DB
    API -->|"Admin image upload"| ImgBB
    ImgBB -->|"Hosted image URL"| API
    Shopper -.->|"Transfer outside this application"| Wallet
```

**Trust boundaries:** The client sends data and JWTs to the API. The backend verifies protected requests and accesses the database. The admin image-upload API uses the ImgBB key on the server. **There is no bKash or Nagad gateway integration or automatic transaction verification.**

## MongoDB data model and ER diagrams

The application defines **five persisted Mongoose models**: `User`, `Product`, `Collection`, `Order`, and `Settings`.

### ER diagram 1: users, products and orders

This is a **logical ER diagram over MongoDB documents**, not a relational SQL schema. `ORDER_ITEM`, `SHIPPING_ADDRESS`, and `PAYMENT_DETAILS` are **embedded structures inside an Order document**, not separate MongoDB collections.

```mermaid
erDiagram
    USER o|--o{ ORDER : "associated with by optional user ref"
    ORDER ||--|{ ORDER_ITEM : "embeds one or more items"
    PRODUCT o|--o{ ORDER_ITEM : "optional product ref"
    ORDER ||--|| SHIPPING_ADDRESS : "embeds"
    ORDER ||--o| PAYMENT_DETAILS : "embeds"

    USER {
        ObjectId _id PK
        string name
        string email UK
        string phone
        string address
        string city
        string deliveryZone
        string password "bcrypt hash"
        string role "customer or admin"
        boolean isActive
        datetime lastLogin
        datetime createdAt
        datetime updatedAt
    }

    PRODUCT {
        ObjectId _id PK
        string title
        string slug UK
        string category
        string badge
        number price
        number originalPrice
        string description
        string fabricAndCare
        string image
        string_array gallery
        string_array sizes
        string_array colors
        number stock
        boolean featured
        boolean inStock
        datetime createdAt
        datetime updatedAt
    }

    ORDER {
        ObjectId _id PK
        ObjectId user FK "optional schema ref"
        string orderNumber UK
        string customerName
        string customerPhone
        string customerEmail
        number subtotal
        number shippingCost
        number totalAmount
        string paymentMethod "COD, bKash, Nagad"
        string paymentStatus "Pending, Verified, Failed"
        string orderStatus "Pending through Cancelled"
        datetime createdAt
        datetime updatedAt
    }

    ORDER_ITEM {
        ObjectId _id PK "embedded subdocument"
        ObjectId product FK "optional Product ref"
        string title
        number price
        number quantity
        string size
        string color
        string image
    }

    SHIPPING_ADDRESS {
        string address
        string city
        string area
        string deliveryZone
        string notes
    }

    PAYMENT_DETAILS {
        string senderNumber
        string transactionId
    }
```

### ER diagram 2: collections and global settings

`Collection` holds storefront collection **cards**. A product's `category` is a plain string, and **there is no `Product.collection` foreign key**. `Settings` is treated as a single site-wide configuration document by the routes and seed logic, but uniqueness is not enforced by the schema.

```mermaid
erDiagram
    COLLECTION {
        ObjectId _id PK
        string numberLabel
        string title
        string slug UK
        string subtitle
        string status "AVAILABLE NOW or COMING SOON"
        string image
        number order
        datetime createdAt
        datetime updatedAt
    }

    SETTINGS {
        ObjectId _id PK
        string siteName
        string topAnnouncement
        string heroSubtitle
        string heroTitleLine1
        string heroTitleLine2
        string heroDescription
        string heroImage
        string winterBannerSubtitle
        string winterBannerTitle1
        string winterBannerTitle2
        string winterBannerDesc
        string winterBannerImage
        string bkashNumber
        boolean bkashActive
        string nagadNumber
        boolean nagadActive
        boolean codActive
        string paymentInstructions
        number insideDhakaShipping
        number outsideDhakaShipping
        string contactEmail
        string contactPhone
        string_array categories
        datetime createdAt
        datetime updatedAt
    }
```

### Relationship and persistence rules

| Data | MongoDB storage | Relationship / behavior |
| --- | --- | --- |
| Customer and administrator accounts | `users` | A `User` has `role: customer` or `role: admin`; password is stored as a bcrypt hash. |
| Product catalog | `products` | One standalone product document per item; `category` is a string, not a Collection reference. |
| Collection cards | `collections` | Independent documents displayed on the storefront. |
| Orders | `orders` | `user` optionally references `users._id` in the schema; the implemented checkout route requires login. |
| Order lines | Embedded in `orders.items[]` | Each line stores a price/title/variant snapshot and can optionally reference `products._id`. |
| Address and payment details | Embedded in each order | `shippingAddress` and `paymentDetails` are nested fields, not separate collections. |
| Site configuration | `settings` | The backend reads/updates the first settings document. |
| Cart | **Browser `localStorage` only** | `bunon_cart_v1`; there is no cart collection or cart API. |
| Session | **Browser `localStorage` only** | Customer and admin token/profile keys are stored on the client. |
| Images | ImgBB | MongoDB stores image URLs, not binary files. |

### Important model values

- **Order status:** `Pending`, `Confirmed`, `Processing`, `Shipped`, `Delivered`, `Cancelled`.
- **Payment status:** `Pending`, `Verified`, `Failed`.
- **Payment method:** `COD`, `bKash`, `Nagad`.
- **Delivery zone:** `Inside Dhaka`, `Outside Dhaka`.
- **Account role:** `customer`, `admin`.
- **Collection status:** `AVAILABLE NOW`, `COMING SOON`.

## Data flow architecture

All the diagrams in this section describe the **currently implemented** data paths. Dashed arrows indicate a manual/out-of-band step or a client-only dependency, not a live payment-gateway integration.

### Level 0: system context

```mermaid
flowchart LR
    Customer["Customer"]
    Administrator["Administrator"]
    App["BUNON Gents application<br/>Next.js frontend + Express API"]
    Database[("MongoDB data")]
    ImageHost["ImgBB"]
    Payment["External manual payment channel"]

    Customer -->|"Browse, sign in, manage cart, place orders, track"| App
    App -->|"Products, confirmation, status, account data"| Customer
    Administrator -->|"Manage products, users, orders, settings, images"| App
    App -->|"Management screens and dashboard data"| Administrator
    App <-->|"Read / write application documents"| Database
    App <-->|"Protected uploads / hosted image URLs"| ImageHost
    Customer -.->|"Optional manual bKash or Nagad transfer"| Payment
```

### Level 1: application processes and data stores

```mermaid
flowchart TB
    Customer["Customer browser"]
    Admin["Admin browser"]

    Browse["P1 Catalog + storefront"]
    Auth["P2 Register / login / profile"]
    Cart["P3 Cart management"]
    Checkout["P4 Checkout / create order"]
    Tracking["P5 Order tracking / history"]
    Management["P6 Admin CRUD + status updates"]
    Insights["P7 Admin dashboard stats"]
    Upload["P8 Admin image upload"]

    Users[("Users")]
    Products[("Products")]
    Collections[("Collections")]
    Orders[("Orders")]
    Settings[("Settings")]
    ClientStorage[("Browser localStorage")]
    ImgBB["ImgBB"]

    Customer --> Browse
    Customer --> Auth
    Customer --> Cart
    Customer --> Checkout
    Customer --> Tracking
    Admin --> Management
    Admin --> Insights
    Admin --> Upload

    Browse <-->|"Public GET"| Products
    Browse <-->|"Public GET"| Collections
    Browse <-->|"Public GET"| Settings
    Auth <-->|"Read / write profile + hashed password"| Users
    Auth <-->|"JWT / cached profile"| ClientStorage
    Cart <-->|"Cart items"| ClientStorage
    Checkout -->|"Create order"| Orders
    Checkout -->|"Decrement stock"| Products
    Checkout -->|"Fill missing profile fields"| Users
    Checkout -->|"Delivery fee + payment instructions"| Settings
    Tracking -->|"Read order records"| Orders
    Management <-->|"CRUD"| Users
    Management <-->|"CRUD"| Products
    Management <-->|"CRUD"| Collections
    Management <-->|"CRUD / statuses"| Orders
    Management <-->|"Update configuration"| Settings
    Insights -->|"Aggregate counts + totals"| Users
    Insights -->|"Count"| Products
    Insights -->|"Count"| Collections
    Insights -->|"Order totals + status breakdown"| Orders
    Upload <-->|"Upload / image URL"| ImgBB
    Upload -->|"URL subsequently saved by admin"| Management
```

### Catalog browsing and cart

```mermaid
sequenceDiagram
    actor Customer
    participant UI as Next.js storefront
    participant API as Express API
    participant DB as MongoDB
    participant Cart as CartContext
    participant Storage as Browser localStorage

    Customer->>UI: Open storefront
    UI->>API: GET /api/settings, /api/collections, /api/products
    API->>DB: Read Settings, Collection, Product
    DB-->>API: Documents
    API-->>UI: JSON data
    Note over UI: If a request fails, UI may display bundled fallback content
    Customer->>UI: Filter category / open product quick view
    UI-->>Customer: Product details and variants
    Customer->>UI: Add selected size, color and quantity
    alt Customer not signed in
        UI-->>Customer: Open registration/login modal
        Note over UI: Add-to-cart resumes after successful authentication
    end
    UI->>Cart: addToCart(product, size, color, quantity)
    Cart->>Storage: Save bunon_cart_v1
    Storage-->>Cart: Restore cart on later page load
    Note over Cart,Storage: Cart is not persisted in MongoDB
```

### Authentication and authorization

```mermaid
sequenceDiagram
    actor Person as Customer or administrator
    participant UI as Sign-in / registration UI
    participant API as Auth REST routes
    participant Users as MongoDB users
    participant Store as Browser localStorage
    participant Guard as JWT authorization middleware

    Person->>UI: Submit registration or credentials
    UI->>API: POST /api/auth/register or /api/auth/login
    API->>Users: Create user with bcrypt hash OR find user and compare password
    Users-->>API: User account
    API-->>UI: Profile + signed JWT (30 days)
    UI->>Store: Cache token and profile
    Note over UI,Store: Customer keys: bunon_user_token / bunon_user_profile
    Note over UI,Store: Admin keys: bunon_admin_token / bunon_admin_user
    Person->>UI: Access protected page / perform protected action
    UI->>Guard: Request with Authorization: Bearer JWT
    Guard->>Users: Verify JWT and load user
    alt Authorized customer or admin for endpoint
        Guard-->>UI: Allow request through to route handler
    else Missing / invalid token or insufficient role
        Guard-->>UI: 401 or 403 response
    end
```

> The backend uses `protectUser` for authenticated customer operations and `protectAdmin` for administrator endpoints. The admin guard currently checks `role: admin`; unlike `protectUser`, it does not separately reject accounts with `isActive: false`. This should be tightened before production use.

### Checkout, payments and inventory

```mermaid
sequenceDiagram
    actor Customer
    participant Checkout as Next.js checkout
    participant Config as GET /api/settings
    participant Wallet as External bKash / Nagad wallet
    participant Orders as POST /api/orders (JWT required)
    participant DB as MongoDB
    participant Cart as CartContext

    Checkout->>Config: Read payment options and inside/outside Dhaka fees
    Config-->>Checkout: Settings
    Customer->>Checkout: Enter delivery details and choose payment method
    alt Cash on Delivery
        Checkout-->>Customer: COD selected, no transfer reference required
    else bKash or Nagad
        Checkout-->>Customer: Show manual transfer instructions
        Customer->>Wallet: Make transfer outside the application
        Customer->>Checkout: Enter sender number and transaction ID
    end
    Checkout->>Orders: Submit items, prices, totals, address, payment information
    Orders->>DB: Create Order with paymentStatus = Pending and orderStatus = Pending
    Orders->>DB: Decrement referenced Product.stock for each item
    Orders->>DB: Fill empty User shipping fields when applicable
    DB-->>Orders: Stored order document
    Orders-->>Checkout: HTTP 201 + orderNumber and order details
    Checkout->>Cart: Clear local cart
    Checkout-->>Customer: Confirmation and order number
    Note over Orders,DB: Current server trusts client-provided prices and totals
    Note over Wallet,Orders: No payment gateway API or automatic payment verification
```

**Payment lifecycle:** The customer's transaction ID is stored in `orders.paymentDetails`. An administrator can later set the payment status to `Verified` or `Failed` using `PUT /api/orders/:id`. There is **no automated bKash/Nagad reconciliation**, and order creation does not imply payment has been received.

### Order tracking and account history

```mermaid
flowchart LR
    Guest["Visitor with order number or phone"]
    Customer["Authenticated customer"]
    Admin["Authenticated administrator"]

    PublicTrack["GET /api/orders/track/:query<br/>public endpoint"]
    History["GET /api/orders/my-orders<br/>protectUser"]
    ListAll["GET /api/orders<br/>protectAdmin"]
    Update["PUT /api/orders/:id<br/>protectAdmin"]
    Orders[("MongoDB orders")]

    Guest --> PublicTrack
    Customer --> History
    Admin --> ListAll
    Admin --> Update
    PublicTrack -->|"Query order number or phone"| Orders
    History -->|"Query user ID, email or phone"| Orders
    ListAll -->|"Filter / search"| Orders
    Update -->|"Save orderStatus / paymentStatus"| Orders
```

**Privacy warning:** The current public tracking endpoint returns full order documents, not a redacted status-only response. It can search by phone number and must be redesigned or access-controlled before a public production launch.

### Admin management, analytics and images

```mermaid
flowchart TB
    Admin["Administrator"]
    UI["Next.js /admin dashboard"]
    Login["POST /api/auth/login"]
    Guard["protectAdmin JWT check"]

    Products["Product CRUD<br/>/api/products"]
    Collections["Collection CRUD<br/>/api/collections"]
    Orders["Order list + status changes<br/>/api/orders"]
    Users["User management + admin credentials<br/>/api/auth"]
    Settings["Site and delivery settings<br/>/api/settings"]
    Stats["GET /api/settings/stats"]
    Upload["POST /api/upload<br/>Multer memory buffer"]

    DB[("MongoDB")]
    ImgBB["ImgBB REST API"]

    Admin --> UI
    UI --> Login
    UI --> Guard
    Guard --> Products
    Guard --> Collections
    Guard --> Orders
    Guard --> Users
    Guard --> Settings
    Guard --> Stats
    Guard --> Upload

    Products <--> DB
    Collections <--> DB
    Orders <--> DB
    Users <--> DB
    Settings <--> DB
    Stats -->|"Read products, collections, orders, users"| DB
    Upload -->|"Server sends base64 image with IMGBB_API_KEY"| ImgBB
    ImgBB -->|"Image URLs"| Upload
    Upload -->|"Returned URL used in subsequent create/update"| UI
```

The dashboard's `totalRevenue` is **the sum of non-cancelled order totals**, not verified payment receipts or accounting-grade recognized revenue. Payment-method breakdowns, customer counts, and recent orders are also derived from database queries in `/api/settings/stats`.

### Server startup and database seeding

```mermaid
flowchart TD
    Start["npm start / npm run dev"]
    Env["Load backend .env"]
    Connect["Mongoose connect to MongoDB"]
    Seed["ensureSeedData()"]
    AdminCheck{"Admin exists?"}
    Credentials{"ADMIN_EMAIL and ADMIN_PASSWORD configured?"}
    SeedAdmin["Create first admin user"]
    SkipAdmin["Skip admin creation"]
    SeedRest["Create default Settings, Collections,<br/>Products only when respective model is empty"]
    Listen["Express listens on PORT, default 5001"]

    Start --> Env --> Connect --> Seed --> AdminCheck
    AdminCheck -->|"Yes"| SeedRest
    AdminCheck -->|"No"| Credentials
    Credentials -->|"Yes"| SeedAdmin --> SeedRest
    Credentials -->|"No"| SkipAdmin --> SeedRest
    SeedRest --> Listen
```

Initial sample data is useful for local demos. An existing admin password is **not** overwritten on every restart in the prepared repository.

## API reference

All paths are relative to the base API URL (`http://localhost:5001/api` by default).

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/health` | Public | Service health check. |
| `POST` | `/auth/register` | Public | Register customer; return profile and JWT. |
| `POST` | `/auth/login` | Public | Sign in customer or admin; return JWT. |
| `GET` | `/auth/me` | JWT user | Read current account (password excluded). |
| `PUT` | `/auth/profile` | JWT user | Edit own customer profile/password. |
| `PUT` | `/auth/credentials` | Admin JWT | Edit administrator credentials. |
| `GET` | `/auth/users` | Admin JWT | Read users plus order history summaries. |
| `PUT` | `/auth/users/:id` | Admin JWT | Update a user's basic fields, role, or active flag. |
| `DELETE` | `/auth/users/:id` | Admin JWT | Delete customer account. |
| `GET` | `/products` | Public | List/search/filter products. |
| `GET` | `/products/:idOrSlug` | Public | Get one product by ID or slug. |
| `POST` | `/products` | Admin JWT | Create product. |
| `PUT` | `/products/:id` | Admin JWT | Update product. |
| `DELETE` | `/products/:id` | Admin JWT | Delete product. |
| `GET` | `/collections` | Public | List storefront collection cards. |
| `POST` | `/collections` | Admin JWT | Create collection card. |
| `PUT` | `/collections/:id` | Admin JWT | Update collection card. |
| `DELETE` | `/collections/:id` | Admin JWT | Delete collection card. |
| `POST` | `/orders` | JWT user | Place an order and decrement referenced stock. |
| `GET` | `/orders/my-orders` | JWT user | Get orders associated with current user, email, or phone. |
| `GET` | `/orders/track/:query` | Public | Find orders by order number or phone. |
| `GET` | `/orders` | Admin JWT | List/filter all orders. |
| `PUT` | `/orders/:id` | Admin JWT | Change order/payment status. |
| `DELETE` | `/orders/:id` | Admin JWT | Delete order. |
| `GET` | `/settings` | Public | Get global storefront/payment/delivery settings. |
| `PUT` | `/settings` | Admin JWT | Update allowed site settings. |
| `GET` | `/settings/stats` | Admin JWT | Return admin summary and breakdown data. |
| `POST` | `/upload` | Admin JWT | Upload `image` using ImgBB; return hosted URLs. |

**Authorization:** For protected endpoints, send `Authorization: Bearer <JWT>`. Administrators use the same `/auth/login` endpoint as customers; the role check happens on protected admin routes.

## Project structure

```text
bunon-gents-ecommerce/
├── backend/
│   ├── src/
│   │   ├── middleware/
│   │   │   └── auth.js             # protectUser / protectAdmin
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Product.js
│   │   │   ├── Collection.js
│   │   │   ├── Order.js
│   │   │   └── Settings.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── productRoutes.js
│   │   │   ├── collectionRoutes.js
│   │   │   ├── orderRoutes.js
│   │   │   ├── settingsRoutes.js
│   │   │   └── uploadRoutes.js
│   │   ├── seed.js                 # Seed data on startup
│   │   └── server.js               # Express entrypoint
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── public/                     # Logo and brand assets
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx            # Storefront
│   │   │   ├── account/page.tsx
│   │   │   ├── checkout/page.tsx
│   │   │   ├── track-order/page.tsx
│   │   │   └── admin/page.tsx
│   │   ├── components/             # Modal, drawer, brand logo
│   │   ├── context/                # AuthContext and CartContext
│   │   └── lib/api.ts              # Shared API URL and types
│   ├── .env.example
│   └── package.json
├── .gitignore
└── README.md
```

## Local development

### Requirements

- Node.js **20+** and npm (recommended).
- MongoDB database and connection string (local or hosted).
- ImgBB API key **only if** admin image uploading is needed.

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/bunon-gents-ecommerce.git
cd bunon-gents-ecommerce
```

### 2. Backend environment and server

```bash
cd backend
cp .env.example .env
npm ci
npm run dev
```

Update `backend/.env` with private values:

```dotenv
PORT=5001
MONGODB_URI=mongodb+srv://YOUR_USER:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/bunon
JWT_SECRET=REPLACE_WITH_A_LONG_RANDOM_SECRET
IMGBB_API_KEY=YOUR_IMGBB_API_KEY
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=REPLACE_WITH_A_STRONG_UNIQUE_PASSWORD
```

The backend starts at `http://localhost:5001` and exposes `GET http://localhost:5001/api/health`.

### 3. Frontend environment and server

In a **separate terminal**, from the repository root:

```bash
cd frontend
cp .env.example .env.local
npm ci
npm run dev
```

Set `frontend/.env.local`:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:5001/api
```

Open **http://localhost:3000** for the storefront or **http://localhost:3000/admin** for the admin dashboard. For production, set `NEXT_PUBLIC_API_URL` to the deployed backend API origin plus `/api`.

> On Windows PowerShell, replace `cp .env.example .env` with `Copy-Item .env.example .env`, and `cp .env.example .env.local` with `Copy-Item .env.example .env.local`.

### Local browser storage

| Key | Purpose |
| --- | --- |
| `bunon_user_token` | Customer JWT. |
| `bunon_user_profile` | Cached customer profile. |
| `bunon_admin_token` | Admin dashboard JWT. |
| `bunon_admin_user` | Cached admin name/email. |
| `bunon_cart_v1` | Customer cart line items. |

## Implementation notes and production checklist

1. **Recompute checkout totals on the server.** The current `/orders` handler accepts item prices, shipping, subtotals, and final totals supplied by the client; these must be validated against Product and Settings records.
2. **Fix public order tracking privacy.** The tracking endpoint can return complete order documents from an order-number/phone search. Return minimal public statuses or require ownership verification.
3. **Make inventory changes transactional.** Stock is decremented after creating an order without an atomic stock-availability guard; cancelled orders do not automatically restore stock.
4. **Harden auth and API input.** Add rate limits, input validation, login abuse controls, a production CORS allowlist, and a consistent inactive-account check on all privileged routes.
5. **Treat manual wallet payments as unverified until reviewed.** bKash and Nagad are not connected through payment APIs. A submitted sender number or transaction ID is not payment confirmation.
6. **Protect sensitive configuration.** Keep `.env` and `.env.local` out of Git; rotate previously exposed credentials, use a strong JWT secret, and manage ImgBB/DB credentials server-side.
7. **Clarify reporting.** Dashboard `totalRevenue` represents non-cancelled order totals, not guaranteed collected funds.
8. **Audit product imagery and brand assets.** Confirm that any publicly distributed logos and photos can legally be redistributed.

## Development and management

**Developed & Managed by Md. Masum Billah**  
**Lead Engineer — SpideyTech**

The engineering credit above identifies project development and management. It does not, by itself, establish copyright ownership of the source, trademark, logo, or photographs.

## License

This prepared repository does **not** automatically grant an open-source license. If you own the code or have the necessary rights to license it, you may add a `LICENSE` file containing the [MIT License](https://opensource.org/license/mit) and the appropriate legal copyright-holder name.

> **Important:** Publishing code under MIT does not automatically license the **BUNON Gents** name, logos, images, or third-party assets. If this is client-owned software, confirm permission before making the repository public.
