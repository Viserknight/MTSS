# Project architecture rules
- Store administrator-authored lesson-plan templates in a dedicated table protected by database role policies; the admin UI and teacher selector must rely on those policies rather than client-side role checks for data security.
