# Seeded User Credentials

Run `npm run seed` inside `backend` to wipe and reseed the database.

## Default passwords

- Chief: `Chief@12345` (or `SEED_CHIEF_PASSWORD` from `backend/.env`)
- Admin: `Admin@12345` (or `SEED_ADMIN_PASSWORD` from `backend/.env`)
- Helpdesk: `Helpdesk@12345` (or `SEED_HELPDESK_PASSWORD`)
- HOD: `Hod@12345` (or `SEED_HOD_PASSWORD`)
- Requesters: `User@12345` (or `SEED_REQUESTER_PASSWORD`)

## Departments

| Department | Code |
| --- | --- |
| Engineering | ENGG |
| House Keeping | HK |
| Biomedical Engineering | BME |
| Laundry | LAUNDRY |
| Transport / Ambulance | TRANSPORT |

## Sub-Departments

| Sub-Department | Code | Parent Dept |
| --- | --- | --- |
| HVAC | ENGG-HVAC | ENGG |
| Electrical | ENGG-ELEC | ENGG |
| CGSS | ENGG-CGSS | ENGG |
| Furniture | ENGG-FURN | ENGG |
| Plumbing | ENGG-PLMB | ENGG |
| Fire & Safety | ENGG-FIRE | ENGG |
| HR | HK-HR | HK |
| BME | BME-BME | BME |
| AGM | LAUNDRY-AGM | LAUNDRY |

## Users

| Role | Name | Emp ID | Email | Department |
| --- | --- | --- | --- | --- |
| CHIEF | Chief Executive | `10017` | chief@tmshospital.com | ENGG |
| ADMIN | System Administrator | `10001` | admin@tmshospital.com | ENGG |
| HELPDESK | Engineering Helpdesk Agent | `10002` | helpdesk.engg@tmshospital.com | ENGG |
| HELPDESK | Engineering Helpdesk Agent Two | `10011` | helpdesk2.engg@tmshospital.com | ENGG |
| HELPDESK | BME Helpdesk Agent | `10003` | helpdesk.bme@tmshospital.com | BME |
| HELPDESK | BME Helpdesk Agent Two | `10012` | helpdesk2.bme@tmshospital.com | BME |
| HELPDESK | HK Helpdesk Agent | `10004` | helpdesk.hk@tmshospital.com | HK |
| HELPDESK | HK Helpdesk Agent Two | `10013` | helpdesk2.hk@tmshospital.com | HK |
| HOD | Engineering HOD | `10005` | hod.engg@tmshospital.com | ENGG |
| HOD | House Keeping HOD | `10006` | hod.hk@tmshospital.com | HK |
| HOD | BME HOD | `10007` | hod.bme@tmshospital.com | BME |
| REQUESTER | Requester One | `10014` | requester.one@tmshospital.com | ENGG |
| REQUESTER | Requester Two | `10015` | requester.two@tmshospital.com | HK |
| REQUESTER | Requester Three | `10016` | requester.three@tmshospital.com | BME |

## Notes

- Employee IDs are 5-digit numeric values.
- Department and sub-department are both optional on users and tickets.
- This seed is department-routed for helpdesk testing:
  - Engineering helpdesk sees ENGG-routed tickets
  - BME helpdesk sees BME-routed tickets
  - HK helpdesk sees HK-routed tickets
