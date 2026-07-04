# Graph Report - GrowEasy  (2026-07-05)

## Corpus Check
- 74 files · ~1,153,490 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 292 nodes · 873 edges · 19 communities detected
- Extraction: 30% EXTRACTED · 70% INFERRED · 0% AMBIGUOUS · INFERRED: 611 edges (avg confidence: 0.52)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]

## God Nodes (most connected - your core abstractions)
1. `FarmerProfile` - 39 edges
2. `CustomerProfile` - 35 edges
3. `FarmerPermission` - 32 edges
4. `CustomUser` - 30 edges
5. `CustomerPermission` - 30 edges
6. `Address` - 29 edges
7. `FarmerRating` - 28 edges
8. `FarmerCertification` - 28 edges
9. `Product` - 27 edges
10. `UserRegistrationSerializer` - 26 edges

## Surprising Connections (you probably didn't know these)
- `Unit` --uses--> `FarmerProfile`  [INFERRED]
  backend/products/models.py → backend/accounts/models.py
- `Landing()` --calls--> `useAuth()`  [INFERRED]
  frontend/src/pages/Landing.jsx → frontend/src/context/AuthContext.jsx
- `CustomerProfile()` --calls--> `useAuth()`  [INFERRED]
  frontend/src/pages/customer/CustomerProfile.jsx → frontend/src/context/AuthContext.jsx
- `ProductDetail()` --calls--> `useAuth()`  [INFERRED]
  frontend/src/pages/products/ProductDetail.jsx → frontend/src/context/AuthContext.jsx
- `Register()` --calls--> `useAuth()`  [INFERRED]
  frontend/src/pages/auth/Register.jsx → frontend/src/context/AuthContext.jsx

## Communities

### Community 0 - "Community 0"
Cohesion: 0.19
Nodes (34): AbstractUser, APIView, Address, CustomerProfile, CustomUser, FarmerCertification, FarmerProfile, FarmerRating (+26 more)

### Community 1 - "Community 1"
Cohesion: 0.11
Nodes (19): Cart, CartItem, Order, OrderItem, Status, CartItemSerializer, CartItemWriteSerializer, CartSerializer (+11 more)

### Community 2 - "Community 2"
Cohesion: 0.11
Nodes (20): BasePermission, haversine(), Meta, Product, ProductCategory, ProductImage, Unit, CustomerPermission (+12 more)

### Community 3 - "Community 3"
Cohesion: 0.1
Nodes (5): BaseUserManager, AddressType, CustomUserManager, create_user_profile(), When a new User is created, automatically create the matching profile     based

### Community 4 - "Community 4"
Cohesion: 0.09
Nodes (10): useAuth(), CustomerProfile(), FarmerProfile(), Landing(), Login(), Navbar(), ProductDetail(), ProtectedRoute() (+2 more)

### Community 5 - "Community 5"
Cohesion: 0.25
Nodes (4): AppConfig, AccountsConfig, OrdersConfig, ProductsConfig

### Community 6 - "Community 6"
Cohesion: 0.4
Nodes (2): CookieJWTAuthentication, JWTAuthentication

### Community 7 - "Community 7"
Cohesion: 0.5
Nodes (1): Migration

### Community 9 - "Community 9"
Cohesion: 1.0
Nodes (2): getStatusConfig(), OrderDetail()

### Community 11 - "Community 11"
Cohesion: 0.67
Nodes (2): main(), Run administrative tasks.

### Community 23 - "Community 23"
Cohesion: 1.0
Nodes (1): Migration

### Community 24 - "Community 24"
Cohesion: 1.0
Nodes (1): Migration

### Community 25 - "Community 25"
Cohesion: 1.0
Nodes (1): Migration

### Community 26 - "Community 26"
Cohesion: 1.0
Nodes (1): Migration

### Community 27 - "Community 27"
Cohesion: 1.0
Nodes (1): Migration

### Community 28 - "Community 28"
Cohesion: 1.0
Nodes (1): Migration

### Community 29 - "Community 29"
Cohesion: 1.0
Nodes (1): Migration

### Community 30 - "Community 30"
Cohesion: 1.0
Nodes (1): WSGI config for GrowEasy project.  It exposes the WSGI callable as a module-leve

### Community 31 - "Community 31"
Cohesion: 1.0
Nodes (1): ASGI config for GrowEasy project.  It exposes the ASGI callable as a module-leve

## Knowledge Gaps
- **11 isolated node(s):** `Run administrative tasks.`, `Migration`, `AddressType`, `Migration`, `Migration` (+6 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 6`** (5 nodes): `CookieJWTAuthentication`, `.authenticate()`, `authentication.py`, `JWTAuthentication`, `.validate()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 7`** (4 nodes): `Migration`, `0001_initial.py`, `0001_initial.py`, `0001_initial.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 9`** (3 nodes): `OrderDetail.jsx`, `getStatusConfig()`, `OrderDetail()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 11`** (3 nodes): `manage.py`, `main()`, `Run administrative tasks.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 23`** (2 nodes): `Migration`, `0002_alter_product_price_alter_product_stock.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 24`** (2 nodes): `Migration`, `0008_farmercertification_fields_and_farmer_gender.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 25`** (2 nodes): `Migration`, `0002_alter_customuser_is_active_alter_customuser_is_staff_and_more.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 26`** (2 nodes): `Migration`, `0007_farmercertification.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 27`** (2 nodes): `Migration`, `0003_address.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 28`** (2 nodes): `Migration`, `0004_farmerrating.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 29`** (2 nodes): `Migration`, `0009_customerprofile_latitude_customerprofile_longitude_and_more.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 30`** (2 nodes): `wsgi.py`, `WSGI config for GrowEasy project.  It exposes the WSGI callable as a module-leve`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 31`** (2 nodes): `ASGI config for GrowEasy project.  It exposes the ASGI callable as a module-leve`, `asgi.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `FarmerProfile` connect `Community 0` to `Community 2`, `Community 3`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **Why does `FarmerPermission` connect `Community 2` to `Community 0`, `Community 1`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Why does `CustomerProfile` connect `Community 0` to `Community 1`, `Community 2`, `Community 3`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Are the 37 inferred relationships involving `FarmerProfile` (e.g. with `ProductCategory` and `Meta`) actually correct?**
  _`FarmerProfile` has 37 INFERRED edges - model-reasoned connections that need verification._
- **Are the 33 inferred relationships involving `CustomerProfile` (e.g. with `Cart` and `CartItem`) actually correct?**
  _`CustomerProfile` has 33 INFERRED edges - model-reasoned connections that need verification._
- **Are the 29 inferred relationships involving `FarmerPermission` (e.g. with `ProductListCreateView` and `ProductDetailView`) actually correct?**
  _`FarmerPermission` has 29 INFERRED edges - model-reasoned connections that need verification._
- **Are the 27 inferred relationships involving `CustomUser` (e.g. with `RegisterView` and `LoginView`) actually correct?**
  _`CustomUser` has 27 INFERRED edges - model-reasoned connections that need verification._