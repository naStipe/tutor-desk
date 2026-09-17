-- btree_gist was created in "public" (extension_in_public advisor lint). Objects it creates
-- (operator classes/families) are then reachable to anyone who can reach public, and it pollutes
-- the public namespace. Move it to a dedicated schema instead. The lesson_no_overlap exclusion
-- constraint already resolved its operator classes to fixed OIDs at creation time, so moving the
-- extension does not affect it.
create schema if not exists extensions;

alter extension btree_gist set schema extensions;
