import { MeiliSearch } from 'meilisearch';

const host = process.env.MEILISEARCH_HOST || 'http://localhost:7700';
const apiKey = process.env.MEILISEARCH_API_KEY || 'masterKey';

export const meilisearch = new MeiliSearch({ host, apiKey });

export const PACKAGES_INDEX = 'checkup_packages';
export const HOSPITALS_INDEX = 'hospitals';

export async function ensureIndexes() {
  // Create or update indexes with searchable attributes
  const packagesIndex = meilisearch.index(PACKAGES_INDEX);
  const hospitalsIndex = meilisearch.index(HOSPITALS_INDEX);

  await packagesIndex.updateSettings({
    searchableAttributes: ['name', 'hospitalName', 'description', 'items', 'tags'],
    filterableAttributes: ['price', 'hospitalId', 'tags', 'includesTranslator', 'isActive'],
    sortableAttributes: ['price', 'avgRating'],
    rankingRules: ['sort', 'words', 'typo', 'proximity', 'attribute', 'exactness'],
  });

  await hospitalsIndex.updateSettings({
    searchableAttributes: ['name', 'description', 'address'],
    filterableAttributes: ['isActive'],
  });
}