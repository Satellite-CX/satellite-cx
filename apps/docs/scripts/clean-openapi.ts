import fs from 'fs';
import path from 'path';

// Read the raw OpenAPI spec
const rawSpec = JSON.parse(fs.readFileSync('petstore-raw.json', 'utf8'));

// Function to clean descriptions that contain problematic MDX characters
function cleanDescription(description: string): string {
  if (!description) return description;

  // Replace < and > with HTML entities to avoid MDX parsing issues
  return description
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/<=\s*/g, '&lt;= ')
    .replace(/>=\s*/g, '&gt;= ');
}

// Recursively clean all descriptions in the spec
function cleanObject(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(cleanObject);
  } else if (obj && typeof obj === 'object') {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (key === 'description' && typeof value === 'string') {
        cleaned[key] = cleanDescription(value);
      } else {
        cleaned[key] = cleanObject(value);
      }
    }
    return cleaned;
  }
  return obj;
}

// Clean the spec
const cleanedSpec = cleanObject(rawSpec);

// Write the cleaned spec
fs.writeFileSync('petstore-openapi.json', JSON.stringify(cleanedSpec, null, 2));

console.log('Cleaned OpenAPI spec written to petstore-openapi.json');