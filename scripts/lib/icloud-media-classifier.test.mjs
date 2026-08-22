import assert from 'node:assert/strict';
import test from 'node:test';
import { classifyMediaPaths, cleanTitle } from './icloud-media-classifier.mjs';

test('preserves dotted titles while removing release metadata', () => {
  assert.equal(cleanTitle('True.Detective'), 'True Detective');
  assert.equal(cleanTitle('Twin.Peaks'), 'Twin Peaks');
  assert.equal(cleanTitle('X-Men.97'), 'X-Men 97');
  assert.equal(cleanTitle('Arrival.2016.1080p.BluRay.x264'), 'Arrival 2016');
  assert.equal(cleanTitle('Perfect.Blue.1997.JAPANESE.REMASTERED.1080p'), 'Perfect Blue 1997');
  assert.equal(cleanTitle('Mortal.Kombat.II.2026.REPACK.1080p'), 'Mortal Kombat II 2026');
});

test('treats Animation and Anime as collections rather than movie titles', () => {
  const result = classifyMediaPaths([
    'Animation/Song of the Sea (2014) [1080p]/Song.of.the.Sea.2014.1080p.BluRay.x264.YIFY.mp4',
    'Anime/Paprika.2006.1080p.BluRay/Paprika.2006.1080p.BluRay.mkv',
  ]);

  assert.deepEqual(result.items.map(({ query, media_type, year }) => ({ query, media_type, year })), [
    { query: 'Song of the Sea', media_type: 'movie', year: 2014 },
    { query: 'Paprika', media_type: 'movie', year: 2006 },
  ]);
});

test('groups episodes into one item per season and ignores extras', () => {
  const result = classifyMediaPaths([
    'Anime/[Judas] Dr. Stone (Seasons 1-2)/[Judas] Dr. Stone S1/[Judas] Dr. Stone - S01E01.mkv',
    'Anime/[Judas] Dr. Stone (Seasons 1-2)/[Judas] Dr. Stone S1/[Judas] Dr. Stone - S01E02.mkv',
    'Anime/[Judas] Dr. Stone (Seasons 1-2)/[Judas] Dr. Stone S1/Extras/[Judas] Dr. Stone - S01 NCOP 01.mkv',
    'Anime/[Judas] Dr. Stone (Seasons 1-2)/[Judas] Dr. Stone S2/[Judas] Dr. Stone - S02E01.mkv',
  ]);

  assert.equal(result.items.length, 2);
  assert.deepEqual(result.items.map(({ query, media_type, season_number }) => ({ query, media_type, season_number })), [
    { query: 'Dr Stone', media_type: 'tv', season_number: 1 },
    { query: 'Dr Stone', media_type: 'tv', season_number: 2 },
  ]);
});

test('deduplicates loose episodes with punctuation variants', () => {
  const result = classifyMediaPaths([
    "Animation/X-Men '97 S02E02 A Force to Be Reckoned With.mkv",
    'Animation/X-Men.97.S02E01.720p.HEVC.x265.mkv',
    'Animation/X-Men.97.S02E03.1080p.HEVC.x265.mkv',
  ]);

  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].source_key, 'tv:x-men-97:unknown:season:2');
  assert.equal(result.items[0].season_number, 2);
});

test('skips large non-episodic course bundles instead of creating fake films', () => {
  const paths = Array.from(
    { length: 12 },
    (_, index) => `Feature Films/Udemy - Complete Course/Lesson ${index + 1}.mp4`,
  );
  const result = classifyMediaPaths(paths);

  assert.equal(result.items.length, 0);
  assert.deepEqual(result.skipped, [{
    bundle: 'Feature Films/Udemy - Complete Course',
    reason: 'ambiguous-non-episodic-bundle',
    media_files: 12,
  }]);
});

test('supports explicit nested collections and title overrides', () => {
  const result = classifyMediaPaths(
    ['Anime/Studio Ghibli/Spirited Away Release/video.mkv'],
    {
      collectionDirectories: ['Anime/Studio Ghibli'],
      titleOverrides: [['Anime/Studio Ghibli/Spirited Away Release', 'Spirited Away']],
    },
  );

  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].query, 'Spirited Away');
  assert.equal(result.items[0].source_key, 'movie:spirited-away:unknown');
});

test('expands a small multi-movie bundle into separate catalog items', () => {
  const result = classifyMediaPaths([
    'Feature Films/The Hobbit Trilogy/The Hobbit An Unexpected Journey 2012 EXTENDED REMASTERED.mkv',
    'Feature Films/The Hobbit Trilogy/The Hobbit The Desolation of Smaug 2013 EXTENDED REMASTERED.mkv',
    'Feature Films/The Hobbit Trilogy/The Hobbit The Battle of the Five Armies 2014 EXTENDED REMASTERED.mkv',
  ]);

  assert.deepEqual(result.items.map(({ query, year }) => ({ query, year })), [
    { query: 'The Hobbit An Unexpected Journey', year: 2012 },
    { query: 'The Hobbit The Battle of the Five Armies', year: 2014 },
    { query: 'The Hobbit The Desolation of Smaug', year: 2013 },
  ]);
});

test('uses a useful parenthetical alias for anime season packs', () => {
  const result = classifyMediaPaths([
    'Anime/[Judas] Enen no Shouboutai (Fire Force) (Season 2)/[Judas] Enen no Shouboutai - S02E01.mkv',
  ]);

  assert.equal(result.items[0].query, 'Fire Force');
  assert.equal(result.items[0].source_key, 'tv:fire-force:unknown:season:2');
});
