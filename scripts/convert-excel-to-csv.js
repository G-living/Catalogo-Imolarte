// scripts/convert-excel-to-csv.js
// IMOLARTE - Convertir Excel matricial → CSV vertical unificado
// Estructura Excel:
//   Fila 1: Título general
//   Fila 2: Nombres de colecciones (GIALLO FIORE, BIANCO FIORE, etc.)
//   Fila 3: Sub-headers "code" y "price" repetidos
//   Fila 4+: Datos de productos

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const INPUT_FILE = path.join(__dirname, '../listino/IMOLARTE NET PRICE WHOLESALE EXTRA CEE.xlsx');
const OUTPUT_FILE = path.join(__dirname, '../listino/catalogo-imolarte.csv');

// Mapeo de prefijos a nombres completos de colección y comodines
const COLLECTION_MAP = {
  'GF': { name: 'GIALLO FIORE', comodin: 'Giallo_Fiore.png' },
  'BF': { name: 'BIANCO FIORE', comodin: 'Bianco_Fiore.png' },
  'MZ': { name: 'MAZZETTO', comodin: 'Mazzetto.png' },
  'GB': { name: 'GAROFANO BLU', comodin: 'Garofano_Blu.png' },
  'GI': { name: 'GAROFANO IMOLA', comodin: 'Garofano_Imola.png' },
  'GT': { name: 'GAROFANO TIFFANY', comodin: 'Garofano_Tiffany.png' },
  'GP': { name: 'GAROFANO ROSA', comodin: 'Garofano_Rosa.png' },
  'GR': { name: 'GAROFANO ROSA', comodin: 'Garofano_Rosa.png' },
  'GL': { name: 'GAROFANO LAVI', comodin: 'Garofano_Lavi.png' },
  'GRG': { name: 'ROSSO E ORO', comodin: 'Rosso_E_Oro.png' },
  'GIG': { name: 'AVORIO E ORO', comodin: 'Avorio_E_Oro.png' }
};

// Multiplicador EUR → COP
const EUR_TO_COP = 12600;

// ============================================================================
// FUNCIONES PRINCIPALES
// ============================================================================

function convertExcelToCSV() {
  console.log('🔄 Convirtiendo Excel matricial a CSV vertical...');
  
  // Verificar archivo
  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`❌ Archivo no encontrado: ${INPUT_FILE}`);
    console.log('💡 Asegúrate de que el Excel está en: /listino/');
    process.exit(1);
  }
  
  // Leer Excel
  const workbook = XLSX.readFile(INPUT_FILE);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Convertir a array de arrays (preservando estructura exacta)
  const rawData = XLSX.utils.sheet_to_json(worksheet, { 
    header: 1,
    defval: ''
  });
  
  console.log(`📊 ${rawData.length} filas leídas del Excel`);
  
  // Identificar columnas de colecciones (FILA 2 - índice 1)
  const collectionColumns = identifyCollectionColumns(rawData);
  
  if (Object.keys(collectionColumns).length === 0) {
    console.error('❌ No se detectaron colecciones en el Excel');
    console.log('💡 Verificar que la FILA 2 tenga los nombres: GIALLO FIORE, BIANCO FIORE, etc.');
    console.log('\n📋 Primeras 3 filas del Excel:');
    for (let i = 0; i < Math.min(3, rawData.length); i++) {
      console.log(`Fila ${i + 1}:`, rawData[i].slice(0, 10).join(' | '));
    }
    process.exit(1);
  }
  
  console.log(`📦 ${Object.keys(collectionColumns).length} colecciones detectadas:`);
  Object.keys(collectionColumns).forEach(prefix => {
    const col = collectionColumns[prefix];
    console.log(`   ${prefix} (${COLLECTION_MAP[prefix]?.name || 'Unknown'}) - Columna ${col}`);
  });
  
  // Procesar datos → formato vertical
  const csvRows = [];
  
  // Header CSV
  csvRows.push('Descripcion;Colección;Prefijo_Coleccion;Codigo_Producto;SKU;Foto_Comodin_Coleccion;Foto_Real_Codigo_Producto;Precio_EUR;Precio_COP;Multiplicador');
  
  // Procesar cada fila de datos (empezar desde fila 4 - índice 3)
  let productsCount = 0;
  let lastDescription = '';
  
  for (let rowIdx = 3; rowIdx < rawData.length; rowIdx++) {
    const row = rawData[rowIdx];
    
    // Primera columna: descripción del producto
    const description = String(row[0] || '').trim();
    
    // Saltar filas vacías o que no son productos
    if (!description || 
        description.includes('IMOLARTE') || 
        description.includes('DESCRIPTION') ||
        description.includes('code') ||
        description.includes('€')) {
      continue;
    }
    
    // Para cada colección, extraer código y precio
    for (const [prefix, colIndex] of Object.entries(collectionColumns)) {
      const code = String(row[colIndex] || '').trim();
      const priceEUR = parseFloat(row[colIndex + 1]);
      
      // Solo procesar si hay código válido y precio
      if (!code || isNaN(priceEUR) || priceEUR === 0) continue;
      
      // Extraer número de producto (quitar prefijo)
      const productNumber = code.replace(prefix, '');
      
      // Obtener información de colección
      const collection = COLLECTION_MAP[prefix];
      if (!collection) {
        console.warn(`⚠️ Colección no mapeada para prefijo: ${prefix}`);
        continue;
      }
      
      // Calcular precio COP
      const priceCOP = Math.round(priceEUR * EUR_TO_COP);
      
      // Descripción solo en primera fila del producto
      const displayDescription = (description !== lastDescription) ? description : '';
      lastDescription = description;
      
      // Multiplicador solo en primera fila del producto
      const displayMultiplier = (description !== lastDescription || productsCount === 0) ? EUR_TO_COP : '';
      
      // Formato de precios
      const priceEURFormatted = `EUR ${priceEUR.toFixed(2).replace('.', ',')}`;
      const priceCOPFormatted = `COP ${priceCOP.toLocaleString('es-CO')}`;
      
      // Foto real: solo el número del producto (110.jpg, 001.jpg, etc.)
      const fotoReal = `${productNumber}.jpg`;
      
      // Construir fila CSV
      const csvRow = [
        displayDescription,
        collection.name,
        prefix,
        productNumber,
        code,
        collection.comodin,
        fotoReal,
        priceEURFormatted,
        priceCOPFormatted,
        displayMultiplier
      ];
      
      csvRows.push(csvRow.join(';'));
      productsCount++;
    }
  }
  
  // Escribir CSV
  fs.writeFileSync(OUTPUT_FILE, csvRows.join('\n'), 'utf-8');
  
  console.log(`\n✅ CSV generado: ${OUTPUT_FILE}`);
  console.log(`📦 ${productsCount} productos exportados`);
  console.log(`\n💡 Ejemplo de primeras líneas:`);
  csvRows.slice(0, 4).forEach(line => console.log(`   ${line}`));
  console.log('\n💡 Ahora ejecuta: node test-catalog.js para verificar');
  console.log('💡 Luego: npm run dev para testear el frontend');
}

/**
 * Identifica las columnas de código/precio para cada colección
 * Busca en la FILA 2 (índice 1) los nombres de colecciones
 * Retorna: { 'GF': 1, 'BF': 3, 'MZ': 5, 'GB': 7, ... }
 */
function identifyCollectionColumns(data) {
  const collectionColumns = {};
  
  // Buscar en FILA 2 (índice 1) los headers de colecciones
  const headerRow = data[1] || [];
  
  console.log('\n🔍 Buscando colecciones en fila 2 (índice 1)...');
  console.log('Contenido de fila 2:', headerRow.slice(0, 15).join(' | '));
  
  for (let colIdx = 0; colIdx < headerRow.length; colIdx++) {
    const cell = String(headerRow[colIdx] || '').trim();
    
    // Verificar si es un nombre de colección conocido
    for (const [prefix, collection] of Object.entries(COLLECTION_MAP)) {
      if (cell === collection.name || cell.includes(collection.name)) {
        // La columna del código está en colIdx
        // La columna del precio está en colIdx + 1
        collectionColumns[prefix] = colIdx;
        console.log(`✅ Encontrado: ${collection.name} (${prefix}) en columna ${colIdx}`);
        break;
      }
    }
  }
  
  return collectionColumns;
}

// ============================================================================
// EJECUCIÓN
// ============================================================================

convertExcelToCSV();