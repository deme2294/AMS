# Script to remove CEO and Manager permissions for complaints
import mysql.connector

conn = mysql.connector.connect(
    host='127.0.0.1',
    user='root',
    password='',
    database='db_barber'
)

cursor = conn.cursor()

# Get menu IDs for complaints
cursor.execute("SELECT id FROM cms_menus WHERE path LIKE '/interaction/complaints%' OR path = '#complaints'")
menu_ids = [row[0] for row in cursor.fetchall()]
print(f"Complaint menu IDs: {menu_ids}")

# Remove CEO (3), Manager (2), MANAGER (4) permissions
for role_id in [2, 3, 4]:
    for menu_id in menu_ids:
        cursor.execute(
            "DELETE FROM role_menu_permissions WHERE role_id = %s AND menu_id = %s",
            (role_id, menu_id)
        )
    print(f"✅ Removed permissions for role {role_id}")

conn.commit()
print("✅ Done - Removed CEO and Manager permissions for complaints")