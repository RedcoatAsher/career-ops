# Personalization Guide

This system is designed to be customized by you (Claude) directly. When the user asks to change archetypes, translate modes, adjust scoring, add companies, or modify negotiation scripts — do it. You read the same files you use, so you know exactly what to edit.

## Common Customization Requests

| Request | Edit this |
|---------|-----------|
| "Change the archetypes to [backend/frontend/data/devops] roles" | `modes/_shared.md` |
| "Translate the modes to English" | All files in `modes/` |
| "Add these companies to my portals" | `portals.yml` |
| "Update my profile" | `config/profile.yml` |
| "Change the CV template design" | `templates/cv-template.html` |
| "Adjust the scoring weights" | `modes/_shared.md` and `batch/batch-prompt.md` |

## About This System

Built by [santifer](https://santifer.io) to evaluate 740+ job offers and land a Head of Applied AI role. Archetypes, scoring logic, negotiation scripts, and proof point structure reflect his career search in AI/automation roles. **Designed to be made yours** — the user says "change the archetypes to data engineering roles" and you do it directly.

The portfolio that goes with this system is also open source: [cv-santiago](https://github.com/santifer/cv-santiago).
