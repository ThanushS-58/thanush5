import { readFileSync } from 'fs';
import { join } from 'path';

export interface PlantRecord {
  name: string;
  scientific_name: string;
  description: string;
  uses: string;
  preparation: string;
  location: string;
  image_url: string;
  family: string;
  parts_used: string;
  properties: string;
  precautions: string;
  hindi_name: string;
  sanskrit_name: string;
  english_name: string;
  regional_names: string;
  chemical_compounds: string;
  therapeutic_actions: string;
  dosage: string;
  season: string;
  habitat: string;
}

let plantDatabase: PlantRecord[] = [];
let isLoaded = false;

export function loadPlantDatabase(): PlantRecord[] {
  if (isLoaded && plantDatabase.length > 0) {
    return plantDatabase;
  }

  try {
    const csvPath = join(process.cwd(), 'server/data/expanded-medicinal-plants.csv');
    const csvContent = readFileSync(csvPath, 'utf-8');
    
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',');
    
    plantDatabase = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Parse CSV line with proper handling of commas in quoted fields
      const values = parseCSVLine(line);
      if (values.length < headers.length) continue;
      
      const plant: PlantRecord = {
        name: values[0] || '',
        scientific_name: values[1] || '',
        description: values[2] || '',
        uses: values[3] || '',
        preparation: values[4] || '',
        location: values[5] || '',
        image_url: values[6] || '',
        family: values[7] || '',
        parts_used: values[8] || '',
        properties: values[9] || '',
        precautions: values[10] || '',
        hindi_name: values[11] || '',
        sanskrit_name: values[12] || '',
        english_name: values[13] || '',
        regional_names: values[14] || '',
        chemical_compounds: values[15] || '',
        therapeutic_actions: values[16] || '',
        dosage: values[17] || '',
        season: values[18] || '',
        habitat: values[19] || ''
      };
      
      plantDatabase.push(plant);
    }
    
    isLoaded = true;
    console.log(`Loaded ${plantDatabase.length} plants from database`);
    return plantDatabase;
    
  } catch (error) {
    console.error('Error loading plant database:', error);
    return [];
  }
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

export function searchPlantsByName(query: string): PlantRecord[] {
  const database = loadPlantDatabase();
  const searchTerm = query.toLowerCase();
  
  return database.filter(plant => 
    plant.name.toLowerCase().includes(searchTerm) ||
    plant.scientific_name.toLowerCase().includes(searchTerm) ||
    plant.english_name.toLowerCase().includes(searchTerm) ||
    plant.hindi_name.toLowerCase().includes(searchTerm) ||
    plant.sanskrit_name.toLowerCase().includes(searchTerm)
  ).slice(0, 20); // Limit results
}

export function searchPlantsByUse(query: string): PlantRecord[] {
  const database = loadPlantDatabase();
  const searchTerm = query.toLowerCase();
  
  return database.filter(plant => 
    plant.uses.toLowerCase().includes(searchTerm) ||
    plant.therapeutic_actions.toLowerCase().includes(searchTerm) ||
    plant.description.toLowerCase().includes(searchTerm)
  ).slice(0, 20); // Limit results
}

export function getRandomPlants(count: number = 10): PlantRecord[] {
  const database = loadPlantDatabase();
  const shuffled = [...database].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export function getPlantByName(name: string): PlantRecord | undefined {
  const database = loadPlantDatabase();
  return database.find(plant => 
    plant.name.toLowerCase() === name.toLowerCase() ||
    plant.scientific_name.toLowerCase() === name.toLowerCase()
  );
}