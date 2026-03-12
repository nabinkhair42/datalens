# DataLens

**The web-native, collaborative database IDE.**

Query, visualize, and manage your databases with a modern interface that works anywhere.

![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=flat&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React_19-61DAFB?style=flat&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_4-06B6D4?style=flat&logo=tailwindcss&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)
![Drizzle](https://img.shields.io/badge/Drizzle_ORM-C5F74F?style=flat&logo=drizzle&logoColor=black)
![Better Auth](https://img.shields.io/badge/Better_Auth-000000?style=flat)
![Biome](https://img.shields.io/badge/Biome-60A5FA?style=flat&logo=biome&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=flat&logo=vitest&logoColor=white)

## Features

### SQL Editor
- CodeMirror 6 with PostgreSQL syntax highlighting and autocomplete
- Execute queries with `Ctrl+Enter`, save with `Ctrl+S`
- Query history tracking and saved query templates
- Export results as CSV or JSON

### Table Browser
- Interactive data grid with sorting, filtering, and pagination
- Inline cell editing with type-aware inputs (booleans, enums, dates, JSON)
- Add new records inline (NeonDB-style) or bulk delete with confirmation
- Column visibility toggle with search

### Schema Explorer
- Hierarchical schema/table/column browser
- Primary key, foreign key, and type annotations
- Expandable table details with column metadata

### Connection Management
- Support for PostgreSQL (MySQL, SQLite, MongoDB, MSSQL planned)
- Test connections before saving (latency + version info)
- SSH tunnel support with key-based auth
- AES-256-GCM encryption for stored credentials

### Keyboard Shortcuts
| Shortcut | Action |
|---|---|
| `Ctrl+Enter` | Execute query |
| `Ctrl+S` | Save query |
| `Ctrl+R` | Refresh table data |
| `Ctrl+I` | Insert new row |
| `Delete` / `Backspace` | Delete selected rows |
| `Escape` | Discard / deselect |


## Database Support

| Database | Status |
|---|---|
| PostgreSQL | Fully supported |
| MySQL | Planned |
| SQLite | Planned |
| MongoDB | Planned |
| SQL Server | Planned |
