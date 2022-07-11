#!/bin/bash

# https://www.gnu.org/software/bash/manual/html_node/The-Set-Builtin.html
# -e Exit immediately if a pipeline returns a non-zero status.
set -e
# -u Treat unset variables and parameters other than the special parameters ‘@’ or ‘*’ as an error when performing parameter expansion. 
# An error message will be written to the standard error, and a non-interactive shell will exit.
set -u

# function to create database and grant POSTGRES_USER all privileges:
create_database() {
	local DB_NAME="$1"
	echo "Creating DB_NAME: ${DB_NAME}..."
	psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
	    CREATE DATABASE $DB_NAME;
	    GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $POSTGRES_USER;
EOSQL
}

# Usage (docker-compose.yml):
# environment:
#     POSTGRES_MULTIPLE_DBS: app_funds,app_funds_test
if [[ -n "$POSTGRES_MULTIPLE_DBS" ]]
then
	echo "Creating additional databases from list: $POSTGRES_MULTIPLE_DBS"
	for DB_NAME in $(echo "$POSTGRES_MULTIPLE_DBS" | cut -d ',' --output-delimiter=' ' -f 1-)
    do
		create_database "$DB_NAME"
	done
	echo "Additional databases ${POSTGRES_MULTIPLE_DBS} created. Done!"
    exit 0
fi