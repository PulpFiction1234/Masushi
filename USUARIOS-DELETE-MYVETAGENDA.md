# Eliminar usuario myvetagenda@gmail.com

Este archivo contiene instrucciones para eliminar el usuario con email `myvetagenda@gmail.com` de Supabase.

Recomendación (segura):
- Usa Supabase Dashboard → Authentication → Users → busca `myvetagenda@gmail.com` y elimina el usuario desde la interfaz.

Si prefieres usar SQL (más directo):
1. Abre `scripts/delete-user-myvetagenda.sql` y ejecuta el primer SELECT para obtener el `id` del usuario.
2. Reemplaza `<USER_ID>` por ese valor en el bloque DELETE y ejecútalo en el SQL editor.

Precauciones:
- El borrado es irreversible: exporta los SELECT antes de ejecutar los DELETE.
- Asegúrate de eliminar primero las filas de tus tablas de aplicación que referencien al perfil (orders, favorites, etc.).
- No compartas la Service Role Key en el repositorio.

Si quieres que yo añada un script Node que ejecute esta operación con la Service Role Key, dime y lo creo (no ejecutaré nada por mi cuenta).
