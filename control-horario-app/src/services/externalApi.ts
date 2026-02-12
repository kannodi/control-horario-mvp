import { LocationInfo } from '../types';

const CACHE_KEY = 'location_cache';
const CACHE_TIMESTAMP_KEY = 'location_cache_timestamp';
const CACHE_TTL = 30 * 60 * 1000; // 30 minutos en milisegundos

/**
 * Obtiene información de ubicación basada en la IP del cliente usando ipapi.co
 * Implementa caching en localStorage y manejo robusto de errores.
 * @returns Promise<LocationInfo>
 */
export const fetchLocationInfo = async (): Promise<LocationInfo> => {
    // 1. Intentar obtener desde el cache
    const cachedData = localStorage.getItem(CACHE_KEY);
    const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);

    if (cachedData && cachedTimestamp) {
        const age = Date.now() - parseInt(cachedTimestamp, 10);
        if (age < CACHE_TTL) {
            return JSON.parse(cachedData) as LocationInfo;
        }
    }

    try {
        const response = await fetch('https://ipapi.co/json/');

        // Manejo específico para Too Many Requests (429)
        if (response.status === 429) {
            console.warn('API ipapi.co: Límite de peticiones alcanzado. Usando cache si está disponible.');
            if (cachedData) return JSON.parse(cachedData);
            throw new Error('Límite de peticiones excedido (429) y no hay datos en cache.');
        }

        if (!response.ok) {
            throw new Error(`Error en la respuesta de la API: ${response.statusText}`);
        }

        const data = await response.json();

        // Validar que los campos requeridos existan
        if (!data.city || !data.region || !data.country_name || !data.ip || !data.timezone) {
            // Si la data viene mal pero tenemos cache, mejor usar el cache
            if (cachedData) return JSON.parse(cachedData);
            throw new Error('La respuesta de la API no contiene todos los campos necesarios');
        }

        const locationData: LocationInfo = {
            city: data.city,
            region: data.region,
            country_name: data.country_name,
            ip: data.ip,
            timezone: data.timezone
        };

        // Guardar en cache
        localStorage.setItem(CACHE_KEY, JSON.stringify(locationData));
        localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());

        return locationData;
    } catch (error) {
        console.error('Error fetching location info:', error);

        // Fallback al cache si falla el fetch por cualquier motivo (ej. sin conexión o CORS)
        if (cachedData) {
            console.info('Retornando datos de cache antiguos debido a fallo en la petición.');
            return JSON.parse(cachedData);
        }

        throw error instanceof Error ? error : new Error('Error desconocido al obtener la ubicación');
    }
};
