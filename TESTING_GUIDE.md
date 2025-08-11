# Tabill Application - Testing Guide

This document provides a comprehensive guide for testing the Tabill application. It is designed to be used by the testing team to verify all features and functionalities.

## Table of Contents
1. [Authentication & Onboarding](#1-authentication--onboarding)
2. [Homepage & Legal Pages](#2-homepage--legal-pages)
3. [Core Application & Permissions](#3-core-application--permissions)
4. [Staff Management (`/users`)](#4-staff-management-users)
5. [Menu & Categories (`/menu`)](#5-menu--categories-menu)
6. [Tables & Ordering (`/tables` & `/order/...`)](#6-tables--ordering-tables--order)
7. [Billing (`/billing`)](#7-billing-billing)
8. [Inventory (`/inventory`) - PRO Feature](#8-inventory-inventory---pro-feature)
9. [Procurement (`/procurement`) - PRO Feature](#9-procurement-procurement---pro-feature)
10. [Kitchen (`/kitchen` & `/my-productions`) - PRO Feature](#10-kitchen-kitchen--my-productions---pro-feature)
11. [Reports (`/reports` & `/staff-performance`)](#11-reports-reports--staff-performance)
12. [Subscription (`/subscription`)](#12-subscription-subscription)

---

## 1. Authentication & Onboarding

| Test Case ID | Feature | Steps to Test | Expected Result | Status (Pass/Fail) |
| :--- | :--- | :--- | :--- | :--- |
| **AUTH-01** | User Sign Up (Email) | 1. Navigate to the signup page. <br> 2. Enter a valid email and a password (min 6 chars). <br> 3. Click "Create Account". | A verification message appears. An email is sent to the address provided. User cannot log in yet. | |
| **AUTH-02** | User Sign Up (Google) | 1. Navigate to the signup page. <br> 2. Click "Sign up with Google". <br> 3. Complete the Google auth flow. | User is redirected to the `/profile` page to complete their details. | |
| **AUTH-03** | User Login (Email) | 1. Navigate to the login page. <br> 2. Enter credentials of a verified user. <br> 3. Click "Sign In". | User is logged in and redirected to the `/reports` dashboard. | |
| **AUTH-04** | Login with Unverified Email | 1. Sign up with a new email but do not verify. <br> 2. Attempt to log in with the new credentials. | An error message is displayed stating the email needs verification. Login fails. | |
| **AUTH-05** | Profile Completion | 1. After first login (Google) or after verifying email, user is at `/profile`. <br> 2. Fill in all required fields and submit. | Profile is saved. User is redirected to `/reports`. A 14-day PRO trial is activated. | |
| **AUTH-06** | Guided Tour | 1. As a new user who just completed their profile, land on `/reports`. <br> 2. An onboarding dialog should appear. <br> 3. Click "Yes, show me how". | The guided tour should start, highlighting the date picker and stats cards. Clicking "Next" should navigate through the steps. | |

## 2. Homepage & Legal Pages

| Test Case ID | Feature | Steps to Test | Expected Result | Status (Pass/Fail) |
| :--- | :--- | :--- | :--- | :--- |
| **HP-01** | Pricing Display | 1. Navigate to the root homepage (`/`). <br> 2. Check the pricing section. | Two plans, "Tabill Lite" and "Tabill PRO", are displayed with the correct features and pricing (`700` and `1400` respectively, with strikethrough prices). | |
| **HP-02** | Call-to-Action Buttons | 1. On the homepage, click the "Try for Free" buttons under both plans. | Both buttons should redirect to the `/signup` page. | |
| **HP-03** | Footer Links | 1. Scroll to the footer of the homepage. <br> 2. Click on each link (Contact Us, Terms, Privacy, etc.). | Each link navigates to the correct corresponding legal/contact page. | |

## 3. Core Application & Permissions

| Test Case ID | Feature | Steps to Test | Expected Result | Status (Pass/Fail) |
| :--- | :--- | :--- | :--- | :--- |
| **PERM-01** | PRO Features Visibility | 1. Log in as a user with a **PRO** subscription. <br> 2. Check the sidebar. | All menu items are visible, including Inventory, Procurement, Kitchen, and My Productions. | |
| **PERM-02** | LITE Features Visibility | 1. Log in as a user with a **LITE** subscription (or expired trial). <br> 2. Check the sidebar. | Inventory, Procurement, Kitchen, and My Productions links are **not** visible. | |
| **PERM-03** | Staff Permissions | 1. Create a staff member with limited module access (e.g., only 'Tables' and 'Billing'). <br> 2. Log in as that staff member. | The sidebar should only show links for 'Tables' and 'Billing'. Direct navigation to other URLs (e.g., `/reports`) should be blocked or show an 'Access Denied' message. | |
| **PERM-04** | Chef Assignment (PRO vs Lite) | 1. As a PRO user, go to `/menu` and add/edit an item. <br> 2. As a LITE user, go to `/menu` and add/edit an item. | The "Assigned Chef" dropdown is visible for the PRO user but **not** for the LITE user. | |

## 4. Staff Management (`/users`)

| Test Case ID | Feature | Steps to Test | Expected Result | Status (Pass/Fail) |
| :--- | :--- | :--- | :--- | :--- |
| **USER-01** | Add Staff | 1. Go to `/users`. <br> 2. Click "Add Staff". <br> 3. Fill in the form with a name, email, role, and permissions. <br> 4. Save. | The new staff member appears in the list. | |
| **USER-02** | Edit Staff | 1. Click the edit icon for a staff member. <br> 2. Change their role and add/remove a module permission. <br> 3. Save. | The changes are reflected in the staff list. The staff member's access should be updated on their next login. | |
| **USER-03** | Delete Staff | 1. Click the delete icon for a staff member. <br> 2. Confirm the deletion in the dialog. | The staff member is removed from the list. | |

## 5. Menu & Categories (`/menu`)

| Test Case ID | Feature | Steps to Test | Expected Result | Status (Pass/Fail) |
| :--- | :--- | :--- | :--- | :--- |
| **MENU-01** | Create Category | 1. Go to `/menu`. <br> 2. Click "Add Category", enter a name, and save. | The new category accordion appears. | |
| **MENU-02** | Create Menu Item | 1. Click "Add New Item". <br> 2. Fill in details, select a category, and add one or more variants with prices. <br> 3. Save. | The new item appears under its category. | |
| **MENU-03** | Edit Menu Item | 1. Click the edit icon on an item. <br> 2. Change its name and the price of one variant. <br> 3. Save. | The changes are reflected on the menu card. | |
| **MENU-04** | Search & Filter | 1. Use the search bar to find an item by name. <br> 2. Filter the list by selecting a specific category. | The list updates correctly based on search and filter criteria. | |

## 6. Tables & Ordering (`/tables` & `/order/...`)

| Test Case ID | Feature | Steps to Test | Expected Result | Status (Pass/Fail) |
| :--- | :--- | :--- | :--- | :--- |
| **ORDER-01** | Add Table | 1. Go to `/tables`. <br> 2. Click "Add Table", provide a name and location. <br> 3. Save. | The new table appears in the correct location group with 'Open' status. | |
| **ORDER-02** | Start an Order | 1. Click on an 'Open' table. | You are redirected to the order page for that table. | |
| **ORDER-03** | Add Items to Order | 1. On the order page, click on a menu item. If it has variants, select one from the dialog. <br> 2. Repeat for several items. | Items are added to the "Added Items" list on the left. Quantities can be adjusted with +/- buttons. | |
| **ORDER-04** | Print KOT | 1. After adding items, click "Print KOT". | The browser's print dialog opens with a correctly formatted Kitchen Order Ticket. | |
| **ORDER-05** | Proceed to Bill | 1. Click "Proceed to Bill". | You are redirected to the billing page for that table. | |
| **ORDER-06** | Table Status | 1. After adding an item to an order for a table, navigate back to `/tables`. | The table's status should now be 'Taken' (or occupied). | |

## 7. Billing (`/billing`)

| Test Case ID | Feature | Steps to Test | Expected Result | Status (Pass/Fail) |
| :--- | :--- | :--- | :--- | :--- |
| **BILL-01** | View Pending Bills | 1. Go to `/billing`. <br> 2. The "Live Tables" tab should be active. | Tables with pending orders are highlighted (blue) and show order summary (item count, total). | |
| **BILL-02** | Finalize Bill | 1. From the order page, proceed to the bill, or click a pending table from `/billing`. <br> 2. Verify subtotal, GST, and total. <br> 3. Adjust GST rates. | The total amount updates correctly when GST rates are changed. | |
| **BILL-03** | Settle Bill (Cash) | 1. Click "Paid by Cash". | A print dialog appears with the final bill. The user is redirected to `/billing`. The table status becomes 'available' again. | |
| **BILL-04** | Settle Bill (Card/UPI) | 1. Click "Paid by Card / UPI". | A print dialog appears with the final bill. The user is redirected to `/billing`. The table status becomes 'available' again. | |
| **BILL-05** | Billing History | 1. On the `/billing` page, click the "Billing History" tab. | A list of recently settled bills is displayed with bill number, date, table, and amount. | |

## 8. Inventory (`/inventory`) - PRO Feature

| Test Case ID | Feature | Steps to Test | Expected Result | Status (Pass/Fail) |
| :--- | :--- | :--- | :--- | :--- |
| **INV-01** | Add Inventory Item | 1. Go to `/inventory`. <br> 2. Click "Add New Item". <br> 3. Fill in name, category, unit, and reorder level. Save. | The new item appears in the "Current Stock" list with 0 quantity. | |
| **INV-02** | Update Stock | 1. Go to the "Add/Edit Stock" tab. <br> 2. Enter a positive number for a new item (e.g., 10). <br> 3. Enter a negative number for another item (e.g., -1 for wastage). <br> 4. Click "Apply All Changes". | The quantities in the "Current Stock" tab are updated correctly. | |
| **INV-03** | Low Stock Alert | 1. Update stock so an item's quantity is at or below its reorder level. | The item is highlighted in the "Current Stock" list with a "Low Stock" badge. | |
| **INV-04** | Fulfill Kitchen Request | 1. Go to the "Kitchen Requests" tab. A pending request should be visible. <br> 2. Click "Fulfill Request". | The request status changes to 'Fulfilled'. The stock levels for the requested items are automatically deducted in the "Current Stock" list. | |
| **INV-05** | Fulfill Request (Insufficient Stock) | 1. Create a kitchen request for more items than are available in stock. <br> 2. Attempt to fulfill it. | An error message is displayed, and the transaction is blocked. Stock levels remain unchanged. | |

## 9. Procurement (`/procurement`) - PRO Feature

| Test Case ID | Feature | Steps to Test | Expected Result | Status (Pass/Fail) |
| :--- | :--- | :--- | :--- | :--- |
| **PROC-01** | Manage Suppliers & Items | 1. Go to `/procurement` -> "Manage" tab. <br> 2. Add a new Supplier. <br> 3. Add a new procurement Item. | The new supplier and item appear in their respective lists. | |
| **PROC-02** | Create Purchase Order (PO) | 1. Go to "Create Purchase Order" tab. <br> 2. Select a supplier. <br> 3. Add several items with quantities and prices. | The total amount updates automatically. | |
| **PROC-03** | Save Purchase Order | 1. After creating the PO, click "Create Purchase Order". | The PO is saved. It appears in the "Purchase History" tab with 'Pending' status. The form is cleared. | |

## 10. Kitchen (`/kitchen` & `/my-productions`) - PRO Feature

| Test Case ID | Feature | Steps to Test | Expected Result | Status (Pass/Fail) |
| :--- | :--- | :--- | :--- | :--- |
| **KITCH-01** | Request Materials | 1. Log in as Kitchen Staff and go to `/kitchen`. <br> 2. Click "Request Materials". <br> 3. Add items from inventory and specify quantities. <br> 4. Submit the request. | The request is submitted and appears in the "Recent Material Requests" list with 'Pending' status. The same request is visible to the inventory manager on the `/inventory` page. | |
| **KITCH-02** | Log Production | 1. Assign a menu item to a chef in `/menu`. <br> 2. Log in as that chef and go to `/my-productions`. <br> 3. Enter a quantity for a prepared item and click "Log". | The logged item appears in the "Today's Production History" list. The input field clears. | |

## 11. Reports (`/reports` & `/staff-performance`)

| Test Case ID | Feature | Steps to Test | Expected Result | Status (Pass/Fail) |
| :--- | :--- | :--- | :--- | :--- |
| **REP-01** | Date Filter | 1. Go to `/reports`. <br> 2. Select a different date range. | All cards and charts on the page update to reflect data from only the selected range. | |
| **REP-02** | Overview Stats | 1. Settle a few bills. <br> 2. Go to `/reports`. | The Total Revenue, Profit, GST, and Avg. Order Value cards show correct calculations. Payment breakdown is accurate. | |
| **REP-03** | Item & Category Analysis | 1. View the "Item & Category Analysis" tab. | Charts and lists for top-selling items, most profitable items, and sales by category are displayed correctly. | |
| **REP-04** | Staff Performance | 1. Go to `/staff-performance`. <br> 2. Settle bills using different staff accounts. | The report correctly attributes sales and order counts to the respective staff members. | |

## 12. Subscription (`/subscription`)

| Test Case ID | Feature | Steps to Test | Expected Result | Status (Pass/Fail) |
| :--- | :--- | :--- | :--- | :--- |
| **SUB-01** | Trial Status | 1. As a new user, navigate to `/subscription`. | The page correctly displays that the user is on a trial and shows the number of days remaining. | |
| **SUB-02** | Payment Flow | 1. Click the "Pay Now & Subscribe" button. | The Razorpay payment modal opens with the correct amount and details. (Do not complete payment unless in a test environment). | |
| **SUB-03** | Expired Status | 1. For a user whose trial/subscription has expired, navigate to any page other than `/subscription` or `/profile`. | The user is automatically redirected to the `/subscription` page. An "Expired" message is shown. | |
