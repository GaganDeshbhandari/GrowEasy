# GrowEasy

GrowEasy is a full-stack farm-to-customer e-commerce platform that enables farmers to sell products directly to consumers without intermediaries. The platform provides separate workflows for farmers, customers, and delivery partners, ensuring a seamless buying and delivery experience.

## Features

### Customer

* User registration and authentication
* Browse available products
* Add products to cart
* Place orders
* Online payments using Razorpay
* Track order status

### Farmer

* Add, update, and delete products
* Manage product inventory
* View incoming orders
* Monitor product listings

### Delivery Partner

* View assigned deliveries
* Update delivery status
* Track delivery progress

## Tech Stack

### Frontend

* React
* Vite
* Tailwind CSS
* Axios
* React Router

### Backend

* Django
* Django REST Framework
* JWT Authentication
* PostgreSQL

### Third-Party Services

* Cloudinary (Image Storage)
* Razorpay (Payment Gateway)

## System Architecture

```text
Users
  |
React Frontend
  |
REST APIs
  |
Django REST Framework
  |
PostgreSQL
  |
-------------------------
|                       |
Cloudinary         Razorpay
```

## Authentication

* JWT-based authentication
* Access and Refresh tokens
* Secure cookie-based token storage
* Role-based authorization

## Project Structure

```text
backend/
├── accounts/
├── products/
├── orders/
├── payments/
├── delivery/

frontend/
├── src/
├── components/
├── pages/
├── services/
```

## Installation

### Backend

```bash
git clone <repository-url>
cd backend

python -m venv venv
source venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file:

```env
SECRET_KEY=your_secret_key

DB_NAME=your_database
DB_USER=your_user
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
```

Run migrations:

```bash
python manage.py migrate
python manage.py runserver
```

### Frontend

```bash
cd frontend

npm install
npm run dev
```

## Workflow

1. Farmer lists products.
2. Product images are stored in Cloudinary.
3. Customers browse available products.
4. Customers add products to cart and place orders.
5. Payments are processed through Razorpay.
6. Orders are created and tracked in PostgreSQL.
7. Delivery partners fulfill assigned deliveries.
8. Customers receive their orders.

## Future Improvements

* Real-time order tracking
* Product recommendation system
* Inventory analytics dashboard
* Multi-vendor support
* Review and rating system

## Author

Gagan Deshbhandari
