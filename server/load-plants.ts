import { readFileSync } from 'fs';
import { join } from 'path';
import { db } from './db.js';
import { plants } from '@shared/schema';
import { getHindiTranslation } from './hindi-translations.js';

interface PlantCSVRecord {
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

export async function loadPlantsFromCSV() {
  try {
    const csvPath = join(process.cwd(), 'server/data/comprehensive-medicinal-plants.csv');
    const csvContent = readFileSync(csvPath, 'utf-8');
    
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',');
    
    console.log('Loading plants from CSV...');
    console.log('Headers:', headers);
    
    const plantsToInsert: PlantCSVRecord[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = parseCSVLine(line);
      if (values.length < 20) continue; // Skip incomplete rows
      
      const plant: PlantCSVRecord = {
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
      
      plantsToInsert.push(plant);
    }
    
    console.log(`Parsed ${plantsToInsert.length} plants from CSV`);
    
    // Clear existing plants and insert new ones
    await db.delete(plants);
    console.log('Cleared existing plants');
    
    // Insert plants in batches to avoid overwhelming the database
    const batchSize = 10;
    for (let i = 0; i < plantsToInsert.length; i += batchSize) {
      const batch = plantsToInsert.slice(i, i + batchSize);
      const insertData = batch.map(plant => ({
        name: plant.name,
        scientificName: plant.scientific_name,
        description: plant.description,
        uses: plant.uses,
        preparation: plant.preparation,
        location: plant.location,
        imageUrl: plant.image_url,
        family: plant.family,
        partsUsed: plant.parts_used,
        properties: plant.properties,
        precautions: plant.precautions,
        hindiName: plant.hindi_name,
        sanskritName: plant.sanskrit_name,
        englishName: plant.english_name,
        regionalNames: plant.regional_names,
        chemicalCompounds: plant.chemical_compounds,
        therapeuticActions: plant.therapeutic_actions,
        dosage: plant.dosage,
        season: plant.season,
        habitat: plant.habitat,
        verificationStatus: 'verified',
        // Add Hindi translations
        hindiDescription: getHindiTranslation('descriptions', plant.description),
        hindiUses: getHindiTranslation('uses', plant.uses),
        hindiPreparation: getHindiTranslation('preparations', plant.preparation),
        hindiPartsUsed: getHindiTranslation('partsUsed', plant.parts_used),
        hindiProperties: getHindiTranslation('properties', plant.properties),
        hindiPrecautions: getHindiTranslation('precautions', plant.precautions),
        hindiDosage: getHindiTranslation('dosages', plant.dosage),
        hindiTherapeuticActions: getHindiTranslation('uses', plant.therapeutic_actions)
      }));
      
      await db.insert(plants).values(insertData);
      console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(plantsToInsert.length / batchSize)}`);
    }
    
    console.log(`Successfully loaded ${plantsToInsert.length} plants into database!`);
    return plantsToInsert.length;
    
  } catch (error) {
    console.error('Error loading plants from CSV:', error);
    throw error;
  }
}

// Run the import if this script is called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  loadPlantsFromCSV()
    .then(count => {
      console.log(`✅ Successfully loaded ${count} plants with Hindi information!`);
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Failed to load plants:', error);
      process.exit(1);
    });
}