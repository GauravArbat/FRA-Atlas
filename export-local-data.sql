-- Export your local database data
-- Run this in your local PostgreSQL to get all data

-- Export users
\copy (SELECT * FROM users) TO 'users_export.csv' WITH CSV HEADER;

-- Export patta_holders  
\copy (SELECT * FROM patta_holders) TO 'patta_export.csv' WITH CSV HEADER;

-- Export fra_claims
\copy (SELECT * FROM fra_claims) TO 'fra_claims_export.csv' WITH CSV HEADER;

-- Export any other tables you have
\dt