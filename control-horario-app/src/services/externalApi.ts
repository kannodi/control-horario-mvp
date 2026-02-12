import { LocationInfo } from '../types';

/**
 * Obtiene información de ubicación basada en la IP del cliente usando ipapi.co
 * @returns Promise<LocationInfo>
 */
export const fetchLocationInfo = async (): Promise<LocationInfo> => {
    try {
        const response = await fetch('https://ipapi.co/json/');

        if (!response.ok) {
            throw new Error(`Error en la respuesta de la API: ${response.statusText}`);
        }

        const data = await response.json();

        // Validar que los campos requeridos existan
        if (!data.city || !data.region || !data.country_name || !data.ip || !data.timezone) {
            throw new Error('La respuesta de la API no contiene todos los campos necesarios');
        }

        return {
            city: data.city,
            region: data.region,
            country_name: data.country_name,
            ip: data.ip,
            timezone: data.timezone
        };
    } catch (error) {
        console.error('Error fetching location info:', error);
        throw error instanceof Error ? error : new Error('Error desconocido al obtener la ubicación');
    }
};
