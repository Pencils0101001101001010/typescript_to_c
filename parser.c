#include <stdio.h>
#include <stdlib.h>  
#include <stdint.h> 
#include <string.h>
#include <libpq-fe.h>


struct book {
    int32_t id;
    char title[51];
    char author[51];
    char publisher[51];
    char genre[51];
};
// # 1. Compile the program using PostgreSQL directory maps
// gcc -I$(pg_config --includedir) -L$(pg_config --libdir) parser.c -lpq -o parser

// # 2. Inject your environment variables and execute the binary
// export $(grep -v '^#' .env | xargs) && ./parser


int main() {
    FILE *fptr;
    struct book current_book;
    const char *conninfo = "";

    PGconn *conn = PQconnectdb(conninfo);

    if (PQstatus(conn) == CONNECTION_BAD) {
        fprintf(stderr, "Database connection failed: %s\n", PQerrorMessage(conn));
        PQfinish(conn);  
        return 1;        
    };

    printf("Database connected successfully!\n");

    PGresult *copy_res = PQexec(conn, 
    "COPY books (id, title, author, publisher, genre) FROM STDIN WITH (FORMAT CSV)");

    if (PQresultStatus(copy_res) != PGRES_COPY_IN) {
         fprintf(stderr, "Failed to initiate COPY: %s\n", PQerrorMessage(conn));
         PQclear(copy_res);
         PQfinish(conn);
         return 1;
        }
    PQclear(copy_res);

    fptr = fopen("./books.csv", "r");

    // Store the content of the file
    char myString[1024];

    // If the file exist
    if(fptr != NULL) {
  
    // Read the content and print it
    while(fgets(myString, sizeof(myString), fptr)) {
        char *id_str = strtok(myString, ",");
        char *title_str = strtok(NULL, ",");
        char *author_str = strtok(NULL, ",");
        char *publisher_str = strtok(NULL, ",");
        char *genre_str = strtok(NULL, ",\n");


        if(id_str == NULL || title_str == NULL || author_str == NULL || publisher_str == NULL || genre_str == NULL ){
             fprintf(stderr ,"Book info was incomplete\n");
            continue;
        }
        

        current_book.id = atoi(id_str);
        // strncpy(current_book.id, id_str, 50);
        // current_book.title[50] = '\0';
        //char *strncpy(char *dest, const char *src, size_t n);
        //dest: A pointer to the destination array where the content is to be copied.
        // src: A pointer to the source string to be copied.
        // n: The number of characters to be copied from the source string.
        strncpy(current_book.title, title_str, 50);
        current_book.title[50] = '\0';

        strncpy(current_book.author, author_str, 50);
        current_book.author[50] = '\0';

        strncpy(current_book.publisher, publisher_str, 50);
        current_book.publisher[50] = '\0';

        strncpy(current_book.genre, genre_str, 50);
        current_book.genre[50] = '\0';
        //test:
        // printf("ID: %d, Title: %s, Author: %s\n", current_book.id, current_book.title, current_book.author);

        char csv_buffer[256];

        snprintf(csv_buffer, sizeof(csv_buffer), "%d,%s,%s,%s,%s\n", current_book.id, current_book.title, current_book.author, current_book.publisher, current_book.genre);

        PQputCopyData(conn, csv_buffer, strlen(csv_buffer));
    }

     // Send the termination signal down the pipeline
     PQputCopyEnd(conn, NULL);
    
      // Fetch the transaction processing result back from the server
    PGresult *final_res = PQgetResult(conn);

    // Confirm that everything saved successfully
    if (PQresultStatus(final_res) != PGRES_COMMAND_OK) {
        fprintf(stderr, "Postgres COPY processing failed: %s\n", PQerrorMessage(conn));
    } else {
        printf("Successfully loaded rows into the database!\n");
    }
    PQclear(final_res);
    // If the file does not exist 
    } else {
        printf("Not able to open the file.");
    }

   
    // free(myString);
    PQfinish(conn);
    return 0;


}