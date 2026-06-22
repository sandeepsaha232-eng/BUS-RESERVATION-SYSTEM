---
pdf_options:
  format: A4
  margin: 20mm
---

<div style="text-align: center; margin-top: 100px; margin-bottom: 50px;">
  <p><em>A DBMS Project on</em></p>
  <h1>Bus Reservation System</h1>
  
  <br><br><br><br>
  <p><em>Submitted by</em></p>
  <table style="margin: 0 auto; width: 300px; border: none; text-align: left;">
    <tr><td><strong>Sandeep Saha</strong></td></tr>
  </table>
  
  <br><br><br><br>
  <p><em>in partial fulfillment for the award of the degree of</em></p>
  <h3>BACHELOR OF TECHNOLOGY</h3>
  <p><em>in</em></p>
  <h3>COMPUTER SCIENCE AND ENGINEERING</h3>
  
  <br><br><br><br>
  <p><strong>Department of Computer Science and Engineering</strong></p>
  <br>
  <p><strong>2026</strong></p>
</div>

<div style="page-break-after: always;"></div>

# Abstract

The Bus Reservation System is a computerized system used to store and retrieve information and conduct transactions related to travel by buses. It is aimed at exposing the importance of an online reservation system to travel by road and to enhance customer's convenience to book bus tickets as and when they require with the use of this software to make reservations.

The application made with regard to this project has two parts: the user interface (front-end) and the database server (back-end). It allows customers to access the database and allows new customers to sign up for online access, thereby granting membership. The system allows passengers to search for buses available between two travel cities, namely the "Departure City" and "Arrival City," for a particular departure date. The system displays all available bus details such as bus number, bus type, price, and duration of the journey, along with the availability of seats in a particular bus.

To book a ticket, the system asks the customer to confirm their passenger details. All necessary details needed to book a bus ticket are securely stored. Money is processed virtually for the transaction. This dramatically reduces user inconvenience by eliminating manual ticketing errors and avoiding long queues at bus stations.

<div style="page-break-after: always;"></div>

# CONTENTS

1. **INTRODUCTION**
   1.1 Access Specification
2. **REQUIREMENT ANALYSIS**
   2.1 Functional Requirements
   2.2 Non-Functional Requirements
      2.2.1 Performance/Time
      2.2.2 Usability
      2.2.3 Security
      2.2.4 Reliability and Availability
3. **CONCEPTUAL MODELS**
   3.1 Entity-Relationship Overview
   3.2 Relational Schema
4. **SYSTEM DESIGN**
   4.1 Design Goals
   4.2 Design Development
   4.3 Detailed Design Understanding
      4.3.1 Data Gathering
      4.3.2 Merging Front-end and Back-end
5. **CONCLUSION**
6. **REFERENCES**

<div style="page-break-after: always;"></div>

# 1. INTRODUCTION

Globalization and technological advancements have taken over the world by storm. People are no longer confined to manual, time-consuming processes. With various forms of commute to choose from, travelling has gotten a whole lot easier. Travel by bus is one of the most accessible and affordable means of transportation. Hence, providing a digital interface for bus reservations is highly important.

This document aims at designing a Bus Reservation System that serves as a portal for booking tickets and maintaining user profiles to enhance the online ticket booking experience. A robust database design is critical to ensure high availability and data integrity. 

The Bus Reservation System provides a portal for passengers to book bus tickets. In order to use this service, a passenger ought to register with the system by providing details: Name, Email ID, Phone, and Password, which will be used for authentication purposes for further login sessions. After registering and verifying their account, the passenger can choose a destination and origin at a particular date and see the available buses. When booked, the transaction is recorded. If an interested customer wants to simply view buses, they can access the search portal as a guest.

## 1.1 Access Specification

There are two primary types of Users for the Bus Reservation System:

The **registered passenger** can view their profile details, search for buses, choose between available seats, and book tickets for the inputted destination and date.

The **guest passenger** has limited access. They cannot book tickets as they do not have membership accounts. They can only search and view buses that are available for the entered constraints. This is the extent of the guest user's access.

# 2. REQUIREMENT ANALYSIS

## 2.1 Functional Requirements

This web application can be viewed either in guest mode or registered user mode.

For guest user:
* The guests can search for buses available after entering origin, destination, and date of journey in the home page. The relevant buses would then be displayed. In order to book a particular bus and select a seat, the guest must register or login.

For registered users:
* The users can enter the details such as origin, destination, and date of journey. They are redirected to a page which displays the relevant buses with details such as bus number, bus type, fare, departure time, arrival time, and available seats.
* If a user is comfortable with a particular bus, they can proceed to select specific seats on an interactive seat map.
* After selecting a seat, passenger details are entered. The total fare is calculated. Once confirmed, a reservation is created and a ticket is generated.
* Users can log out, which redirects them safely back to the home page.

## 2.2 Non-Functional Requirements

### 2.2.1 Performance/Time
The query processing and the retrieval of the results takes minimal time (typically under a few seconds). Real-time seat availability is ensured through optimized SQL queries.

### 2.2.2 Usability
Usability is a crucial feature of our system. The web interface is user-friendly, highly responsive, and utilizes modern glassmorphism design principles so that anyone using it for the first time will be able to easily navigate and book tickets.

### 2.2.3 Security
A secure login feature is implemented to ensure that no user can access other users' personal details. Passwords are encrypted before being stored in the database, ensuring security and integrity.

### 2.2.4 Reliability and Availability
This system ensures that the details of the buses given for a particular set of inputs are highly accurate. The architecture supports fallback from a remote MySQL database to a local SQLite database if the network connection fails, ensuring high availability.

<div style="page-break-after: always;"></div>

# 3. CONCEPTUAL MODELS

## 3.1 Entity-Relationship Overview

The database is built on relational principles involving Users, Buses, Routes, Schedules, Seats, and Reservations.
* **Users** have a one-to-many relationship with **Reservations**.
* **Routes** have a one-to-many relationship with **Schedules**.
* **Buses** are linked to **Schedules** (one bus can have multiple schedules on different dates).
* **Schedules** have a one-to-many relationship with **Reservations**.

## 3.2 Relational Schema

The relational schema represents the logical definition of tables in the database.

**Users:**
| UserID | FullName | Email | PasswordHash | Phone | Role | WalletBalance |

**Buses:**
| BusID | BusNumber | BusType | TotalSeats | Status |

**Routes:**
| RouteID | StartCity | EndCity | DistanceKm | EstimatedDuration |

**Schedules:**
| ScheduleID | BusID | RouteID | DepartureTime | ArrivalTime | AvailableSeats | Fare | TravelDate |

**Reservations:**
| ReservationID | UserID | ScheduleID | SeatID | PassengerName | PassengerEmail | PassengerPhone | TotalFare |

<div style="page-break-after: always;"></div>

# 4. SYSTEM DESIGN

The design of the system can be divided into the following two parts:
a) Database & API Design (Back-end)
b) User Interface Design (Front-end)

## 4.1 Design Goals

The following design goals were kept in mind while the Bus Reservation System was being developed:
* The website must be responsive across all devices (desktops, tablets, and smartphones).
* The backend must be rendered using Node.js and a MySQL/SQLite database.
* The frontend must utilize clean HTML5, CSS3 with a modern UI (glassmorphism, gradients, CSS grids), and Vanilla JavaScript for asynchronous data fetching.
* The code ought to be readable, modular, and well-designed, meeting all functional and non-functional requirements.

## 4.2 Design Development

The back-end server is developed using Node.js with the Express framework to build RESTful APIs. It manages the connection to a MySQL remote database with a local SQLite fallback strategy to ensure reliability.
The front-end of the website is developed using raw HTML, CSS, and Vanilla JavaScript. Dynamic DOM manipulation allows for interactive features like the visual seat-selection map.

## 4.3 Detailed Design Understanding

### 4.3.1 Data Architecture
The data layer utilizes normalized relational tables. Complex SQL queries involving `JOIN` operations efficiently combine data from `Routes`, `Buses`, and `Schedules` to deliver lightning-fast search results to the end-user. 

### 4.3.2 Merging Front-end and Back-end
The architecture follows a clear client-server model. The frontend communicates with the backend via `fetch` API calls exchanging JSON data.
* **Search Flow:** The home page allows searching. Inputs are sent to the `/api/routes/schedules` endpoint, which returns matching buses.
* **Booking Flow:** The user selects a seat and submits passenger details to `/api/reservations`. The server updates seat availability, records the transaction using SQL Transactions to prevent race conditions, and confirms the booking.

<div style="page-break-after: always;"></div>

# 5. CONCLUSION

This project has aimed and achieved to make an Online Bus Reservation System. The user can easily book tickets from the comfort of their home. Robust database security measures are taken to ensure the safety of the user's account and personal information. The website provides all the functionalities of a real-time ticket booking web portal and ensures user satisfaction with an aesthetically pleasing, responsive interface. The Bus Reservation System has achieved all expected design goals and makes use of the data in the database using optimized SQL queries in a highly efficient manner.

# 6. REFERENCES

[1] Node.js and Express API Documentation - https://nodejs.org/en/docs/
[2] HTML, CSS, and Vanilla JavaScript Basics - https://developer.mozilla.org/
[3] Relational Database Design Concepts - "Database System Concepts" by Abraham Silberschatz, Henry F. Korth, and S. Sudarshan.
