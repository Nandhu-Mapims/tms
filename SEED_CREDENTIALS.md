# Seeded user credentials

Use **Employee ID** and **password** to sign in. Email addresses are for reference only.

Run `npm run seed` in `backend` to load this data (it wipes and reseeds the database).

---

## Admin, Helpdesk, and HOD (role-specific passwords)

| Role      | Full name              | Emp ID | Email                      | Password        |
| --------- | ---------------------- | ------ | -------------------------- | --------------- |
| ADMIN     | System Administrator   | `10001` | admin@tmshospital.com      | `Admin@12345`¹  |
| HELPDESK  | Helpdesk Agent One     | `10002` | helpdesk1@tmshospital.com  | `Helpdesk@12345` |
| HELPDESK  | Helpdesk Agent Two     | `10003` | helpdesk2@tmshospital.com  | `Helpdesk@12345` |
| HOD       | Dr. Cardiology HOD     | `10004` | hod.cardio@tmshospital.com | `Hod@12345`     |
| HOD       | Dr. Radiology HOD      | `10005` | hod.radio@tmshospital.com  | `Hod@12345`     |

¹ Admin password is `SEED_ADMIN_PASSWORD` from `backend/.env` if set before seeding; otherwise `Admin@12345`.

---

## Named requesters (password `User@12345`)

| Role       | Full name           | Emp ID | Email                    |
| ---------- | ------------------- | ------ | ------------------------ |
| REQUESTER  | Nurse Anita Patel   | `10006` | anita.patel@tmshospital.com |
| REQUESTER  | Dr. Arjun Mehta     | `10007` | arjun.mehta@tmshospital.com |
| REQUESTER  | Pharmacist Sunita Rao | `10008` | sunita.rao@tmshospital.com |

---

## Department coordinators (password `User@12345` for all)

| Emp ID  | Full name                               | Email                                  | Department code |
| ------- | --------------------------------------- | -------------------------------------- | --------------- |
| `10009` | Biomedical Engineering Coordinator      | coordinator.bioeng@tmshospital.com     | BIOENG          |
| `10010` | Emergency Coordinator                   | coordinator.er@tmshospital.com         | ER              |
| `10011` | Intensive Care Coordinator              | coordinator.icu@tmshospital.com        | ICU             |
| `10012` | Administration Coordinator              | coordinator.admin@tmshospital.com      | ADMIN           |
| `10013` | Laboratory Coordinator                  | coordinator.lab@tmshospital.com        | LAB             |
| `10014` | Pediatrics Coordinator                | coordinator.pedia@tmshospital.com    | PEDIA           |
| `10015` | Orthopedics Coordinator               | coordinator.ortho@tmshospital.com    | ORTHO           |
| `10016` | Neurology Coordinator                 | coordinator.neuro@tmshospital.com     | NEURO           |
| `10017` | Oncology Coordinator                  | coordinator.onco@tmshospital.com     | ONCO            |
| `10018` | General Surgery Coordinator           | coordinator.surg@tmshospital.com     | SURG            |
| `10019` | Anesthesia Coordinator                | coordinator.anes@tmshospital.com     | ANES            |
| `10020` | Obstetrics & Gynecology Coordinator   | coordinator.obgyn@tmshospital.com    | OBGYN           |
| `10021` | Psychiatry Coordinator                | coordinator.psych@tmshospital.com    | PSYCH           |
| `10022` | ENT Coordinator                       | coordinator.ent@tmshospital.com      | ENT             |
| `10023` | Ophthalmology Coordinator             | coordinator.ophth@tmshospital.com    | OPHTH           |
| `10024` | Dermatology Coordinator               | coordinator.derm@tmshospital.com     | DERM            |
| `10025` | Physiotherapy Coordinator             | coordinator.physt@tmshospital.com    | PHYST           |
| `10026` | Nutrition & Dietetics Coordinator     | coordinator.diet@tmshospital.com     | DIET            |
| `10027` | Medical Records Coordinator           | coordinator.medrec@tmshospital.com   | MEDREC          |
| `10028` | Human Resources Coordinator           | coordinator.hr@tmshospital.com       | HR              |
| `10029` | Finance & Billing Coordinator         | coordinator.fin@tmshospital.com      | FIN             |
| `10030` | Security Coordinator                | coordinator.sec@tmshospital.com      | SEC             |
| `10031` | Housekeeping Coordinator            | coordinator.hkeep@tmshospital.com    | HKEEP           |

---

## Password summary

| Account type                         | Password        |
| ------------------------------------ | --------------- |
| Admin                                | `Admin@12345` (or `SEED_ADMIN_PASSWORD`) |
| Helpdesk                             | `Helpdesk@12345` |
| HOD                                  | `Hod@12345`     |
| All requesters and coordinators      | `User@12345`    |

---

## Notes

- Employee IDs are exactly **five numeric digits**.
- Change all passwords after first login in any shared or production environment.
- See also `credition.txt` for a compact tab-separated list of the primary named accounts.
