# 🚗 Car Rental Platform (Full-Stack)

A comprehensive, full-stack Car Rental application designed to connect car owners (Hosts) with renters (Customers) seamlessly[cite: 3]. The platform provides a robust system for vehicle management, booking workflows, and secure online payments[cite: 3].

## ✨ Features

The application is divided into three main role-based modules[cite: 3]:

### 👤 Customer (Renter)
* Browse and search for available cars using various filters[cite: 3].
* View detailed car information, including availability calendars and reviews[cite: 3].
* Book cars and manage booking history[cite: 3].
* Process secure online payments using integrating gateways (VNPay)[cite: 3].
* Authenticate using traditional email/password or Google Login[cite: 3].

### 🏠 Host (Car Owner)
* Dedicated Host Dashboard to track revenue and statistics[cite: 3].
* Add, edit, and manage car listings (Car Form, My Cars)[cite: 3].
* Manage car availability using a dynamic calendar system[cite: 3].
* Handle incoming booking requests from customers[cite: 3].

### 👑 Admin
* Global administrative dashboard for system overview[cite: 3].
* Manage all users, cars, and bookings across the platform[cite: 3].

## 🛠️ Technology Stack

### Front-end
* **Framework:** ReactJS powered by Vite[cite: 3].
* **Styling:** Tailwind CSS[cite: 3].
* **State Management:** Custom stores (e.g., `authStore.js`)[cite: 3].
* **Architecture:** Component-based design with specific layouts (`AdminLayout`, `HostLayout`, `MainLayout`) and protected routing (`Protectedroute.jsx`)[cite: 3].

### Back-end
* **Framework:** Java Spring Boot with Maven (`pom.xml`, `mvnw`)[cite: 3].
* **Security:** Spring Security with JSON Web Tokens (JWT) for stateless authentication (`JwtAuthFilter`, `JwtUtil`)[cite: 3].
* **Database & ORM:** Spring Data JPA (Repositories for User, Car, Booking, Payment, Review, etc.)[cite: 3].

### Third-party Integrations
* **Payments:** VNPay (`VNPayService`)[cite: 3].
* **Cloud Storage:** Cloudinary for seamless car image uploads and management (`CloudinaryConfig`)[cite: 3].
* **Authentication:** Google OAuth2 integration (`GoogleLoginRequest`)[cite: 3].

## 📁 Project Structure

The repository is organized into a monorepo structure, separating the client-side and server-side applications into two distinct folders[cite: 4, 5]:

### 1. `car-rental-backend` (Spring Boot API)
This directory houses the Java Spring Boot application[cite: 4, 5], structured into business modules for maintainability:
* `src/main/java/com/carrental/`
    * `module/`: The core business logic, divided by feature[cite: 4, 5]:
        * `admin/`: Admin controllers and services (Dashboard, User/Car management)[cite: 4, 5].
        * `auth/`: Authentication logic, JWT processing, and Refresh Token handling[cite: 4, 5].
        * `booking/`: Car reservation logic and booking status management[cite: 4, 5].
        * `car/`: Car entity management, image handling, and availability calendars[cite: 4, 5].
        * `payment/`: Payment gateway integrations (`VNPayService`)[cite: 4, 5].
        * `review/`: System for users to rate and review cars[cite: 4, 5].
        * `user/`: User profiles and Host request management[cite: 4, 5].
    * `config/`: Application configurations (Cloudinary, Security settings)[cite: 4, 5].
    * `security/`: JWT filters (`JwtAuthFilter`) and custom user details services[cite: 4, 5].
    * `common/`: Shared resources like Enums (`Role`, `PaymentStatus`), standard API responses, and global exception handlers[cite: 4, 5].
* `src/main/resources/`: Configuration files like `application.properties`[cite: 4, 5].

### 2. `car-rental-frontend` (React + Vite)
This directory contains the ReactJS application[cite: 4, 5], designed with a scalable component-based architecture:
* `src/`
    * `api/`: Axios instances and service files for backend communication (`authApi`, `bookingApi`, `paymentApi`, etc.)[cite: 4, 5].
    * `components/`: Reusable UI elements:
        * `car/`: Car cards and filter panels[cite: 4, 5].
        * `common/`: Shared elements like loading spinners and Google Login buttons[cite: 4, 5].
        * `layout/`: Role-specific structural wrappers (`AdminLayout`, `HostLayout`, `MainLayout`, `Navbar`, `Footer`)[cite: 4, 5].
    * `hooks/`: Custom React hooks for state management (e.g., `useAuth`, `useGoogleAuth`)[cite: 4, 5].
    * `pages/`: Page-level components organized by user roles:
        * `admin/`: Admin dashboards and management tables[cite: 4, 5].
        * `auth/`: Login, Register, and Password Reset screens[cite: 4, 5].
        * `customer/`: Booking workflows and payment result pages[cite: 4, 5].
        * `host/`: Car listing forms and incoming booking management[cite: 4, 5].
        * `public/`: Unauthenticated views like the Homepage and Car Search/Detail pages[cite: 4, 5].
    * `store/`: Global state management (`authStore.js`)[cite: 4, 5].

## 🚀 Getting Started

### Prerequisites
* Java 17+
* Node.js & npm
* Maven

### Backend Setup
1. Navigate to the backend directory: `cd car-rental-backend`[cite: 3].
2. Configure your environment variables in `src/main/resources/application.properties` (Database credentials, JWT secret, Cloudinary keys, VNPay credentials)[cite: 3].
3. Run the application: `./mvnw spring-boot:run`[cite: 3].

### Frontend Setup
1. Navigate to the frontend directory: `cd car-rental-frontend`[cite: 3].
2. Install dependencies: `npm install`[cite: 3].
3. Start the development server: `npm run dev`[cite: 3].