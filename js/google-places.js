// Google Places API (New) - Implementación correcta con DEBUGGING COMPLETO
let placesService = null;
let sessionToken = null;

async function initGooglePlaces() {
    console.log('🔍 === INICIO GOOGLE PLACES DEBUGGING ===');
    
    try {
        // Verificar que Google Maps esté cargado
        if (typeof google === 'undefined') {
            console.error('❌ ERROR: Google Maps no está cargado');
            console.log('Verifica que el script de Google Maps esté en index.html');
            return;
        }
        console.log('✅ Google Maps está cargado');
        
        if (!google.maps) {
            console.error('❌ ERROR: google.maps no está disponible');
            return;
        }
        console.log('✅ google.maps está disponible');
        
        // Intentar cargar la librería de Places
        console.log('📦 Cargando librería de Places...');
        const { AutocompleteService } = await google.maps.importLibrary("places");
        const { Place } = await google.maps.importLibrary("places");
        console.log('✅ Librería de Places cargada correctamente');
        
        placesService = new AutocompleteService();
        sessionToken = new google.maps.places.AutocompleteSessionToken();
        console.log('✅ AutocompleteService inicializado');
        console.log('✅ Session token creado');
        
        const addressInput = document.getElementById('address');
        const suggestionsDiv = document.getElementById('suggestions');
        
        if (!addressInput) {
            console.error('❌ ERROR: Campo de dirección no encontrado');
            return;
        }
        console.log('✅ Campo de dirección encontrado');
        
        if (!suggestionsDiv) {
            console.error('❌ ERROR: Div de sugerencias no encontrado');
            return;
        }
        console.log('✅ Div de sugerencias encontrado');
        
        let debounceTimer;
        addressInput.addEventListener('input', function(e) {
            clearTimeout(debounceTimer);
            const value = e.target.value;
            
            console.log('📝 Usuario escribió:', value);
            
            if (value.length < 3) {
                console.log('⏸️ Texto muy corto (menos de 3 caracteres)');
                suggestionsDiv.innerHTML = '';
                suggestionsDiv.style.display = 'none';
                return;
            }
            
            debounceTimer = setTimeout(() => {
                console.log('🔎 Buscando sugerencias para:', value);
                
                const request = {
                    input: value,
                    componentRestrictions: { country: 'co' },
                    sessionToken: sessionToken
                };
                
                console.log('📤 Request enviado a Google Places:', request);
                
                placesService.getPlacePredictions(request, handlePredictions);
            }, 300);
        });
        
        function handlePredictions(predictions, status) {
            console.log('📥 Respuesta de Google Places recibida');
            console.log('Status:', status);
            console.log('Predictions:', predictions);
            
            if (status !== 'OK') {
                console.error('❌ ERROR en Google Places API:', status);
                if (status === 'REQUEST_DENIED') {
                    console.error('⛔ REQUEST_DENIED - Verifica:');
                    console.error('1. API key correcta');
                    console.error('2. Places API (New) habilitada');
                    console.error('3. Billing habilitado');
                }
                if (status === 'ZERO_RESULTS') {
                    console.warn('⚠️ ZERO_RESULTS - No se encontraron resultados');
                }
                if (status === 'INVALID_REQUEST') {
                    console.error('⛔ INVALID_REQUEST - Request inválido');
                }
                suggestionsDiv.style.display = 'none';
                return;
            }
            
            if (!predictions || predictions.length === 0) {
                console.log('⚠️ No se encontraron sugerencias');
                suggestionsDiv.style.display = 'none';
                return;
            }
            
            console.log('✅ Sugerencias encontradas:', predictions.length);
            
            suggestionsDiv.innerHTML = predictions.map(pred => {
                console.log('  -', pred.description);
                return '<div class="suggestion-item" data-place-id="' + pred.place_id + '">' +
                    pred.description + '</div>';
            }).join('');
            
            suggestionsDiv.style.display = 'block';
            console.log('✅ Sugerencias mostradas en pantalla');
            
            document.querySelectorAll('.suggestion-item').forEach(item => {
                item.addEventListener('click', async function() {
                    const placeId = this.dataset.placeId;
                    console.log('👆 Usuario seleccionó lugar con ID:', placeId);
                    await selectPlace(placeId, Place);
                    suggestionsDiv.style.display = 'none';
                });
            });
        }
        
        async function selectPlace(placeId, Place) {
            console.log('📍 Obteniendo detalles del lugar...');
            
            try {
                const place = new Place({ id: placeId });
                await place.fetchFields({ fields: ['addressComponents', 'formattedAddress'] });
                
                console.log('✅ Detalles obtenidos:', place);
                
                const components = {};
                if (place.addressComponents) {
                    place.addressComponents.forEach(comp => {
                        components[comp.types[0]] = comp.longText;
                    });
                    console.log('📋 Componentes de dirección:', components);
                }
                
                let addr = components.route || '';
                if (components.street_number) addr += ' #' + components.street_number;
                if (!addr) addr = place.formattedAddress;
                
                console.log('✅ Dirección final:', addr);
                console.log('✅ Barrio:', components.sublocality_level_1 || components.locality || '');
                console.log('✅ Ciudad:', components.locality || 'Bogotá');
                
                document.getElementById('address').value = addr;
                document.getElementById('neighborhood').value = components.sublocality_level_1 || components.locality || '';
                document.getElementById('city').value = components.locality || 'Bogotá';
                
                sessionToken = new google.maps.places.AutocompleteSessionToken();
                console.log('🔄 Nuevo session token creado');
                console.log('✅ Campos completados correctamente');
            } catch (error) {
                console.error('❌ ERROR al obtener detalles del lugar:', error);
            }
        }
        
        document.addEventListener('click', (e) => {
            if (!addressInput.contains(e.target) && !suggestionsDiv.contains(e.target)) {
                suggestionsDiv.style.display = 'none';
            }
        });
        
        console.log('✅ === GOOGLE PLACES INICIALIZADO CORRECTAMENTE ===');
    } catch (error) {
        console.error('❌ === ERROR FATAL EN GOOGLE PLACES ===');
        console.error('Error:', error);
        console.error('Stack:', error.stack);
        console.error('Verifica:');
        console.error('1. API key en index.html');
        console.error('2. Places API (New) habilitada en Google Cloud');
        console.error('3. Billing activo');
        console.error('4. Sin restricciones de dominio bloqueando g-living.github.io');
    }
}
