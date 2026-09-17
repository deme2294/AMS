@echo off
setlocal enabledelayedexpansion

cd /d C:\Users\ITPC\Desktop\AMS\AMS\backend\models

REM Use current.sql as base (it has the 18 core tables already ordered and with data)
copy db_barber_current.sql db_barber_merged_clean.sql >nul

REM Now insert the missing tables from barber.sql at appropriate positions
REM Order: roles, departments, organization_types, categories, service_categories,
REM        employees, organization_structure, users, employee_positions, cms_menus,
REM        role_menu_permissions, user_menu_permissions, blocked_ips, revoked_tokens,
REM        active_sessions, approvalhierarchy, audit_logs, subscribers, system_settings,
REM        contact_messages, services, availability_slots, service_bookings, service_ratings,
REM        booking_reviews, queues, complaints, complaint_assignees, complaint_comments,
REM        complaint_history, complaint_feedback, complaint_attachments

REM Since current.sql already has roles, departments, etc. we only need to add the NEW tables
REM that are in barber.sql but not in current.sql:
REM   services, availability_slots, service_bookings, service_ratings, booking_reviews, queues
REM   complaint_assignees, cms_menus, organization_types, revoked_tokens, subscribers,
REM   system_settings, user_menu_permissions

REM For simplicity, let's use the barber.sql tables that don't already exist in current.sql
