// test-catalog.js - Test rápido de lógica de catálogo
// Ejecutar con: node test-catalog.js

const fs = require('fs');
const path = require('path');

const CSV_FILE = path.join(__dirname, 'listino/catalogo-imolarte.csv');

console.log('🔍 Verificando CSV generado...\n');

if (!fs.existsSync(CSV_FILE)) {
  console.error('❌ CSV no encontrado:', CSV_FILE);
  console.log('💡 Ejecuta primero: npm run convert');
  process.exit(1);
}

const csvText = fs.readFileSync(CSV_FILE, 'utf-8');
const lines = csvText.trim().split('\n');

console.log('✅ CSV leído correctamente');
console.log(`📊 Total líneas: ${lines.length}`);

if (lines.length <= 1) {
  console.error('❌ CSV ESTÁ VACÍO - Solo tiene headers');
  console.log('💡 Ejecuta: npm run convert para generar datos');
  process.exit(1);
}

const headers = lines[0].split(';').map(h => h.trim());
console.log(`📋 Headers (${headers.length} columnas):`);
headers.forEach((h, i) => console.log(`   ${i + 1}. ${h}`));

console.log(`\n📦 Total productos: ${lines.length - 1}`);

// Parsear primeras 5 filas para validar
console.log('\n🔍 Primeros 5 productos:');
for (let i = 1; i <= Math.min(5, lines.length - 1); i++) {
  const values = lines[i].split(';').map(v => v.trim().replace(/^"|"$/g, ''));
  const product = {};
  headers.forEach((h, idx) => product[h] = values[idx] || '');
  
  console.log(`\n${i}. ${product.Descripcion || '(sin descripción)'}`);
  console.log(`   Colección: ${product.Colección}`);
  console.log(`   SKU: ${product.SKU}`);
  console.log(`   Precio: ${product.Precio_COP}`);
  console.log(`   Foto real: ${product.Foto_Real_Codigo_Producto}`);
  console.log(`   Comodín: ${product.Foto_Comodin_Coleccion}`);
}

console.log('\n✅ Test completado - La lógica de parsing funciona');