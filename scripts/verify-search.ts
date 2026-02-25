import { SearchService } from '../src/lib/services/SearchService';

async function verifySearch() {
  console.log('--- Oracle Search Verification ---');

  // Test 1: Global Search
  console.log('\nTesting Global Search ("Christopher Nolan")...');
  const results = await SearchService.globalSearch('Christopher Nolan');
  console.log(`Movies found: ${results.movies.length}`);
  console.log(`TV Shows found: ${results.tv.length}`);
  console.log(`People found: ${results.people.length}`);

  // Test 2: Deep Entity Details
  if (results.movies.length > 0) {
    const movie = results.movies[0];
    console.log(`\nTesting Deep Entity Details for "${movie.title}" (ID: ${movie.id})...`);
    const details = await SearchService.getDeepEntityDetails(movie.id, 'movie');
    console.log(`Soundtrack albums found: ${details.soundtrack?.length || 0}`);
    console.log(`Composers identified: ${details.composers?.map((c: any) => c.name).join(', ') || 'None'}`);
  }

  // Test 3: Catalog for Person
  if (results.people.length > 0) {
    const person = results.people[0];
    console.log(`\nTesting Catalog for "${person.name}" (ID: ${person.id})...`);
    const catalog = await SearchService.getCatalogForPerson(person.id);
    console.log(`Person Name: ${catalog.name}`);
    console.log(`Credits Count: ${catalog.movie_credits?.cast?.length + catalog.movie_credits?.crew?.length || 0}`);
  }

  // Test 4: Hidden Gems Filter
  console.log('\nTesting Hidden Gems Filter ("Space")...');
  const gems = await SearchService.globalSearch('Space', { hiddenGems: true });
  console.log(`Hidden Gems found: ${gems.movies.length}`);

  console.log('\n--- Verification Complete ---');
}

verifySearch().catch(console.error);
