# Seeded User Credentials (New Seed)

Run `npm run seed` inside `backend` to wipe and reseed the database with the new dataset.

## Default passwords

- Admin: `Admin@12345` (or `SEED_ADMIN_PASSWORD` from `backend/.env`)
- Helpdesk: `Helpdesk@12345` (or `SEED_HELPDESK_PASSWORD`)
- HOD: `Hod@12345` (or `SEED_HOD_PASSWORD`)
- Requesters: `User@12345` (or `SEED_REQUESTER_PASSWORD`)

## Users

| Role | Name | Emp ID | Email | Department |
| --- | --- | --- | --- | --- |
| ADMIN | System Administrator | `10001` | admin@tmshospital.com | IT |
| HELPDESK | IT Helpdesk Agent | `10002` | helpdesk.it@tmshospital.com | IT |
| HELPDESK | IT Helpdesk Agent Two | `10011` | helpdesk2.it@tmshospital.com | IT |
| HELPDESK | Biomedical Helpdesk Agent | `10003` | helpdesk.bio@tmshospital.com | BIOENG |
| HELPDESK | Biomedical Helpdesk Agent Two | `10012` | helpdesk2.bio@tmshospital.com | BIOENG |
| HELPDESK | Facilities Helpdesk Agent | `10004` | helpdesk.fac@tmshospital.com | FAC |
| HELPDESK | Facilities Helpdesk Agent Two | `10013` | helpdesk2.fac@tmshospital.com | FAC |
| HOD | IT HOD | `10005` | hod.it@tmshospital.com | IT |
| HOD | Nursing HOD | `10006` | hod.nursing@tmshospital.com | NURS |
| HOD | Pharmacy HOD | `10007` | hod.pharmacy@tmshospital.com | PHARMA |
| REQUESTER | Requester One | `10014` | requester.one@tmshospital.com | NURS |
| REQUESTER | Requester Two | `10015` | requester.two@tmshospital.com | PHARMA |
| REQUESTER | Requester Three | `10016` | requester.three@tmshospital.com | IT |

## Notes

- Employee IDs are 5-digit numeric values.
- This seed is department-routed for helpdesk testing:
  - IT helpdesk sees IT-routed tickets
  - Biomedical helpdesk sees BIOENG-routed tickets
  - Facilities helpdesk sees FAC-routed tickets
