# Graph Report - GrowEasy  (2026-07-05)

## Corpus Check
- 109 files · ~1,221,448 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 461 nodes · 1484 edges · 27 communities detected
- Extraction: 29% EXTRACTED · 71% INFERRED · 0% AMBIGUOUS · INFERRED: 1050 edges (avg confidence: 0.53)
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
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 62|Community 62]]

## God Nodes (most connected - your core abstractions)
1. `FarmerProfile` - 45 edges
2. `CustomerProfile` - 43 edges
3. `FarmerPermission` - 41 edges
4. `Order` - 39 edges
5. `Address` - 39 edges
6. `CustomUser` - 37 edges
7. `Product` - 36 edges
8. `FarmerBankDetail` - 35 edges
9. `DeliveryPartnerProfile` - 34 edges
10. `FarmerRating` - 34 edges

## Surprising Connections (you probably didn't know these)
- `Register()` --calls--> `register_if_needed()`  [INFERRED]
  frontend/src/pages/auth/Register.jsx → backend/accounts/admin.py
- `Unit` --uses--> `FarmerProfile`  [INFERRED]
  backend/products/models.py → backend/accounts/models.py
- `Landing()` --calls--> `useAuth()`  [INFERRED]
  frontend/src/pages/Landing.jsx → frontend/src/context/AuthContext.jsx
- `DeliveryProfile()` --calls--> `useAuth()`  [INFERRED]
  frontend/src/pages/delivery/DeliveryProfile.jsx → frontend/src/context/AuthContext.jsx
- `Dashboard()` --calls--> `useAuth()`  [INFERRED]
  frontend/src/pages/delivery/Dashboard.jsx → frontend/src/context/AuthContext.jsx

## Communities

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (31): clear_expired_cart_items(), Cart, CartItem, Order, OrderItem, PaymentStatus, Status, CustomerPermission (+23 more)

### Community 1 - "Community 1"
Cohesion: 0.19
Nodes (43): AbstractUser, CustomerProfileAdmin, FarmerProfileAdmin, APIView, Address, AddressType, CustomerProfile, CustomUser (+35 more)

### Community 2 - "Community 2"
Cohesion: 0.11
Nodes (23): BasePermission, Meta, Product, ProductCategory, ProductImage, Unit, FarmerPermission, Meta (+15 more)

### Community 3 - "Community 3"
Cohesion: 0.2
Nodes (25): DeliveryAdmin, DeliveryPartnerBankDetailAdmin, DeliveryPartnerProfileAdmin, PartnerEarningAdmin, Delivery, DeliveryPartnerBankDetail, DeliveryPartnerProfile, PartnerEarning (+17 more)

### Community 4 - "Community 4"
Cohesion: 0.06
Nodes (16): register_if_needed(), useAuth(), Checkout(), CompleteProfile(), CustomerProfile(), Dashboard(), DeliveryProfile(), FarmerProfile() (+8 more)

### Community 5 - "Community 5"
Cohesion: 0.08
Nodes (6): BaseUserManager, get_distance_km(), Returns distance in km between two lat/lng points.     Returns None if any coord, CustomUserManager, create_user_profile(), When a new User is created, automatically create the matching profile     based

### Community 6 - "Community 6"
Cohesion: 0.08
Nodes (4): get_readable_location(), CookieJWTAuthentication, JWTAuthentication, VerifyEmail()

### Community 7 - "Community 7"
Cohesion: 0.15
Nodes (6): AppConfig, AccountsConfig, DeliveryConfig, OrdersConfig, PaymentsConfig, ProductsConfig

### Community 8 - "Community 8"
Cohesion: 0.4
Nodes (1): Migration

### Community 12 - "Community 12"
Cohesion: 1.0
Nodes (2): getStatusConfig(), OrderDetail()

### Community 13 - "Community 13"
Cohesion: 0.67
Nodes (2): main(), Run administrative tasks.

### Community 29 - "Community 29"
Cohesion: 1.0
Nodes (1): Migration

### Community 30 - "Community 30"
Cohesion: 1.0
Nodes (1): Migration

### Community 31 - "Community 31"
Cohesion: 1.0
Nodes (1): Migration

### Community 32 - "Community 32"
Cohesion: 1.0
Nodes (1): Migration

### Community 33 - "Community 33"
Cohesion: 1.0
Nodes (1): Migration

### Community 34 - "Community 34"
Cohesion: 1.0
Nodes (1): Migration

### Community 35 - "Community 35"
Cohesion: 1.0
Nodes (1): Migration

### Community 36 - "Community 36"
Cohesion: 1.0
Nodes (1): Migration

### Community 37 - "Community 37"
Cohesion: 1.0
Nodes (1): Migration

### Community 38 - "Community 38"
Cohesion: 1.0
Nodes (1): Migration

### Community 39 - "Community 39"
Cohesion: 1.0
Nodes (1): Migration

### Community 40 - "Community 40"
Cohesion: 1.0
Nodes (1): Migration

### Community 41 - "Community 41"
Cohesion: 1.0
Nodes (1): Migration

### Community 42 - "Community 42"
Cohesion: 1.0
Nodes (1): WSGI config for GrowEasy project.  It exposes the WSGI callable as a module-leve

### Community 43 - "Community 43"
Cohesion: 1.0
Nodes (1): ASGI config for GrowEasy project.  It exposes the ASGI callable as a module-leve

### Community 62 - "Community 62"
Cohesion: 1.0
Nodes (1): Priority order:         1. Query params ?lat=...&lng=... (manual override / GPS)

## Knowledge Gaps
- **20 isolated node(s):** `Run administrative tasks.`, `Priority order:         1. Query params ?lat=...&lng=... (manual override / GPS)`, `Migration`, `Returns distance in km between two lat/lng points.     Returns None if any coord`, `Migration` (+15 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 8`** (5 nodes): `Migration`, `0001_initial.py`, `0001_initial.py`, `0001_initial.py`, `0001_initial.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 12`** (3 nodes): `OrderDetail.jsx`, `getStatusConfig()`, `OrderDetail()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 13`** (3 nodes): `manage.py`, `main()`, `Run administrative tasks.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 29`** (2 nodes): `Migration`, `0002_alter_product_price_alter_product_stock.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 30`** (2 nodes): `Migration`, `0003_cartitem_reserved_until.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 31`** (2 nodes): `Migration`, `0004_alter_order_status.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 32`** (2 nodes): `Migration`, `0002_order_payment_status_order_razorpay_order_id_and_more.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 33`** (2 nodes): `Migration`, `0008_farmercertification_fields_and_farmer_gender.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 34`** (2 nodes): `Migration`, `0002_alter_customuser_is_active_alter_customuser_is_staff_and_more.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 35`** (2 nodes): `Migration`, `0010_farmerbankdetail.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 36`** (2 nodes): `Migration`, `0007_farmercertification.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 37`** (2 nodes): `Migration`, `0003_address.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 38`** (2 nodes): `Migration`, `0012_merge_0011_heads.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 39`** (2 nodes): `Migration`, `0011_alter_customuser_role.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 40`** (2 nodes): `Migration`, `0004_farmerrating.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 41`** (2 nodes): `Migration`, `0009_customerprofile_latitude_customerprofile_longitude_and_more.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 42`** (2 nodes): `wsgi.py`, `WSGI config for GrowEasy project.  It exposes the WSGI callable as a module-leve`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 43`** (2 nodes): `ASGI config for GrowEasy project.  It exposes the ASGI callable as a module-leve`, `asgi.py`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 62`** (1 nodes): `Priority order:         1. Query params ?lat=...&lng=... (manual override / GPS)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `register_if_needed()` connect `Community 4` to `Community 1`?**
  _High betweenness centrality (0.101) - this node is a cross-community bridge._
- **Are the 43 inferred relationships involving `FarmerProfile` (e.g. with `ProductCategory` and `Meta`) actually correct?**
  _`FarmerProfile` has 43 INFERRED edges - model-reasoned connections that need verification._
- **Are the 41 inferred relationships involving `CustomerProfile` (e.g. with `Cart` and `CartItem`) actually correct?**
  _`CustomerProfile` has 41 INFERRED edges - model-reasoned connections that need verification._
- **Are the 38 inferred relationships involving `FarmerPermission` (e.g. with `ProductListCreateView` and `ProductDetailView`) actually correct?**
  _`FarmerPermission` has 38 INFERRED edges - model-reasoned connections that need verification._
- **Are the 36 inferred relationships involving `Order` (e.g. with `DeliveryPartnerProfileView` and `DeliveryPartnerAvailabilityView`) actually correct?**
  _`Order` has 36 INFERRED edges - model-reasoned connections that need verification._
- **Are the 36 inferred relationships involving `Address` (e.g. with `CreateRazorpayOrderView` and `VerifyPaymentView`) actually correct?**
  _`Address` has 36 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Run administrative tasks.`, `Priority order:         1. Query params ?lat=...&lng=... (manual override / GPS)`, `Migration` to the rest of the system?**
  _20 weakly-connected nodes found - possible documentation gaps or missing edges._