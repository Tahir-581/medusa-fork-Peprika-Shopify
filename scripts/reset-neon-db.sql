-- Reset Neon (or any Postgres) database so Medusa migrations can run from scratch.
-- Run this in Neon Console → SQL Editor, then run: yarn medusa db:migrate
-- WARNING: Destroys all data in the public schema.

DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO neondb_owner;
GRANT ALL ON SCHEMA public TO public;
