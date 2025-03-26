import mysql.connector

conn = mysql.connector.connect(
    host="127.0.0.1",
    port=3306,
    user="root",
    password="root",
    database="your_database"
)

print("Connected to MySQL!")
conn.close()
