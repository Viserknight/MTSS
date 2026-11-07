# Admin-configured lesson plan maker

## Goal
Let an administrator define lesson-plan formats, then let teachers generate a plan from a prompt or photo, quickly review and edit the result, and save it.

## Work
- Add a protected format library for admin-authored templates, with create, edit, activate/deactivate, and remove actions.
- Add a database table with explicit grants and RLS so only admins can manage templates and signed-in teachers can read active templates.
- Update the teacher lesson-plan maker to select an active format, capture/upload a photo, extract its content into that format, edit the draft directly or with a short AI instruction, and save it.
- Pass the selected format to the existing lesson-plan AI function for generation, image extraction, and editing; validate requests and preserve current access/security behavior.
- Add admin/teacher navigation and routes, regenerate database types, and verify the preview and relevant checks.

## Technical details
Use the existing React + Supabase client, role guards, dashboard navigation, lesson-plan page, and AI function. Store each template as a title plus format text; use the existing CAPS format as the fallback when no active template is selected. Apply schema changes through the Lovable Database migration tool and grant only authenticated access, scoped by RLS to admin management and active-template teacher reads.
