// scripts/convert-excel-to-csv.js
// IMOLARTE - Convertir Excel matricial → CSV vertical unificado
// Estructura: Múltiples colecciones en columnas → Una fila por producto

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const INPUT_FILE = path.join(__dirname, '../listino/IMOLARTE NET PRICE WHOLESALE EXTRA CEE.xlsx');
const OUTPUT_FILE = path.join(__dirname, '../listino/catalogo-imolarte.csv');

// Mapeo de colecciones a comodines
const COLECCION_COMODIN = {
  'GIALLO FIORE': 'GIALLO_FIORE.png',
  'BIANCO FIORE': 'BIANCO_FIORE.png',
  'MAZZETTO': 'MAZZETTO.png',
  'GAROFANO BLU': 'BLU_CLASSICO.png',
  'GAROFANO IMOLA': 'GAROFANO_IMOLA.png',
  'GAROFANO TIFFANY': 'TIFFANY.png',
  'GAROFANO GRGSA': 'GRGSA.png',
  'GAROFANO LAVI': 'LAVI.png',
  'ROSSO E ORO': 'ROSSO_ORO.png',
  'AVORIO E ORO': 'AVORIO_E_ORO.png'
};

// Multiplicador EUR → COP
const EUR_TO_COP = 12600;

// ============================================================================
// FUNCIONES PRINCIPALES
// ============================================================================

function convertExcelToCSV() {
  console.log('🔄 Convirtiendo Excel matricial a CSV...');
  
  // Verificar archivo
  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`❌ Archivo no encontrado: ${INPUT_FILE}`);
    process.exit(1);
  }
  
  // Leer Excel
  const workbook = XLSX.readFile(INPUT_FILE);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Convertir a array de arrays (preservando estructura)
  const rawData = XLSX.utils.sheet_to_json(worksheet, { 
    header: 1,
    defval: ''
  });
  
  console.log(`📊 ${rawData.length} filas leídas del Excel`);
  
  // Identificar headers de colecciones (fila 2-3 aprox)
  const collectionHeaders = identifyCollections(rawData);
  console.log(` ${collectionHeaders.length} colecciones detectadas: ${collectionHeaders.map(c => c.name).join(', ')}`);
  
  // Procesar datos matriciales → formato vertical
  const products = processMatrixData(rawData, collectionHeaders);
  
  console.log(`📦 ${products.length} productos extraídos`);
  
  // Generar CSV
  const csvRows = ['SKU,Nombre,Coleccion,Precio_EUR,Precio_COP,Imagen_Real,Comodin,Stock,Activo'];
  
  products.forEach(product => {
    const row = [
      product.sku,
      `"${product.name.replace(/"/g, '""')}"`,
      product.coleccion,
      product.precioEUR.toFixed(2),
      product.precioCOP,
      product.imagenReal,
      product.comodin,
      product.stock,
      product.activo ? 'TRUE' : 'FALSE'
    ];
    csvRows.push(row.join(','));
  });
  
  // Escribir CSV
  fs.writeFileSync(OUTPUT_FILE, csvRows.join('\n'), 'utf-8');
  
  console.log(`✅ CSV generado: ${OUTPUT_FILE}`);
  console.log(`💡 Ahora ejecuta: npm run dev para testear`);
}

/**
 * Identifica las colecciones y sus columnas en el Excel
 */
function identifyCollections(data) {
  const collections = [];
  
  // Buscar fila de headers (generalmente fila 2-3)
  for (let rowIdx = 0; rowIdx < Math.min(15, data.length); rowIdx++) {
    const row = data[rowIdx];
    
    // Detectar nombres de colecciones (celdas con texto como "GIALLO FIORE", "GAROFANO BLU", etc.)
    for (let colIdx = 1; colIdx < row.length; colIdx++) {
      const cell = String(row[colIdx] || '').trim().toUpperCase();
      
      // Verificar si es un nombre de colección conocido
      if (COLECCION_COMODIN[cell] || cell.includes('GAROFANO') || cell.includes('FIORE')) {
        // Verificar que tenga columnas de code/price después
        if (rowIdx + 1 < data.length) {
          const nextRow = data[rowIdx + 1];
          if (nextRow[colIdx] && nextRow[colIdx + 1]) {
            collections.push({
              name: cell,
              codeCol: colIdx,
              priceCol: colIdx + 1
            });
          }
        }
      }
    }
  }
  
  return collections;
}

/**
 * Procesa datos matriciales y los convierte a formato vertical
 */
function processMatrixData(data, collections) {
  const products = [];
  
  // Empezar desde la fila de datos (después de headers)
  const dataStartRow = 12; // Ajustar según estructura real
  
  for (let rowIdx = dataStartRow; rowIdx < data.length; rowIdx++) {
    const row = data[rowIdx];
    
    // Primera columna: descripción del producto
    const description = String(row[0] || '').trim();
    if (!description) continue;
    
    // Para cada colección, extraer code y price
    collections.forEach(collection => {
      const code = String(row[collection.codeCol] || '').trim();
      const priceEUR = parseFloat(row[collection.priceCol]) || 0;
      
      // Solo agregar si hay código válido
      if (code && priceEUR > 0) {
        products.push({
          sku: code,
          name: description,
          coleccion: collection.name,
          precioEUR: priceEUR,
          precioCOP: Math.round(priceEUR * EUR_TO_COP),
          imagenReal: `${code}.jpg`,
          comodin: COLECCION_COMODIN[collection.name] || 'DEFAULT.png',
          stock: 50, // Default, se puede ajustar
          activo: true
        });
      }
    });
  }
  
  return products;
}

// ============================================================================
// EJECUCIÓN
// ============================================================================

convertExcelToCSV();