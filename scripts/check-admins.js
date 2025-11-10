// scripts/check-admins.js
// Ejecuta: node scripts/check-admins.js
// Requiere: npm install @supabase/supabase-js dotenv

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAdmins() {
  try {
    console.log('🔍 Buscando usuarios administradores...\n');

    // Obtener todos los perfiles con rol admin
    const { data: admins, error } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        role,
        created_at,
        updated_at
      `)
      .eq('role', 'admin')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Error:', error.message);
      return;
    }

    if (!admins || admins.length === 0) {
      console.log('⚠️  No se encontraron usuarios con rol admin');
      return;
    }

    console.log(`✅ Se encontraron ${admins.length} administrador(es):\n`);

    // Para cada admin, obtener el email desde auth.users
    for (const admin of admins) {
      const { data: userData } = await supabase.auth.admin.getUserById(admin.id);
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`👤 ${admin.full_name || 'Sin nombre'}`);
      console.log(`📧 ${userData?.user?.email || 'Email no disponible'}`);
      console.log(`🆔 ${admin.id}`);
      console.log(`🔑 Rol: ${admin.role}`);
      console.log(`📅 Creado: ${new Date(admin.created_at).toLocaleString('es-CL')}`);
      if (admin.updated_at) {
        console.log(`🔄 Actualizado: ${new Date(admin.updated_at).toLocaleString('es-CL')}`);
      }
      console.log('');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 Total: ${admins.length} administrador(es)`);

  } catch (err) {
    console.error('❌ Error inesperado:', err);
  }
}

checkAdmins();
