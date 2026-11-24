// Builds data/species.json: every species recorded on iNaturalist inside the property
// boundary (data/property_boundary.json). Run with `npm run species`; also runs in `npm run build`.
//
// Counted: verifiable observations (so not captive/cultivated ones) identified to species or
// finer, whose public coordinates fall inside the boundary. Observations with obscured
// coordinates can't be placed and are left out.
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";

const BOUNDARY = new URL("../data/property_boundary.json", import.meta.url);
const OUTPUT = new URL("../data/species.json", import.meta.url);
const API = "https://api.inaturalist.org/v1/observations";
const PLACE_ID = 7085; // British Columbia — decides which species count as native or introduced
const PER_PAGE = 200;
const MAX_PAGES = 50;

// iNaturalist's "iconic taxon" → the heading used on the page, in display order.
const GROUPS = [
  ["Plantae", "Plants"],
  ["Fungi", "Fungi & lichens"],
  ["Aves", "Birds"],
  ["Mammalia", "Mammals"],
  ["Amphibia", "Amphibians"],
  ["Reptilia", "Reptiles"],
  ["Actinopterygii", "Fish"],
  ["Insecta", "Insects"],
  ["Arachnida", "Spiders & kin"],
  ["Mollusca", "Slugs & snails"],
];
const OTHER = "Other life";

function insideRing(lng, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[j];
    if (y1 > lat !== y2 > lat && lng < ((x2 - x1) * (lat - y1)) / (y2 - y1) + x1) inside = !inside;
  }
  return inside;
}

async function fetchObservations(bbox) {
  const all = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const params = new URLSearchParams({
      ...bbox,
      verifiable: "true",
      hrank: "species",
      preferred_place_id: PLACE_ID,
      locale: "en",
      order_by: "observed_on",
      order: "desc",
      per_page: PER_PAGE,
      page,
    });
    const res = await fetch(`${API}?${params}`);
    if (!res.ok) throw new Error(`iNaturalist answered ${res.status} ${res.statusText}`);
    const body = await res.json();
    all.push(...body.results);
    if (all.length >= body.total_results || body.results.length === 0) break;
    await new Promise((r) => setTimeout(r, 1000)); // stay well under iNaturalist's rate limit
  }
  return all;
}

function licensedPhoto(obs) {
  const photo = (obs.photos || []).find((p) => p.license_code && !p.hidden);
  if (!photo) return null;
  // "(c) Name, some rights reserved (CC BY-NC)" → "Name, CC BY-NC"
  const parts = /^\(c\) (.+?), some rights reserved \((.+?)\)/.exec(photo.attribution || "");
  return {
    url: photo.url.replace("/square.", "/medium."),
    credit: parts ? `${parts[1]}, ${parts[2]}` : photo.attribution,
    observation: obs.uri,
  };
}

function summarise(observations, ring) {
  const species = new Map();
  const observers = new Map();
  let counted = 0;

  for (const obs of observations) {
    const coords = obs.geojson?.coordinates;
    const taxon = obs.taxon;
    if (!coords || !taxon || obs.obscured) continue;
    if (!insideRing(Number(coords[0]), Number(coords[1]), ring)) continue;
    counted++;
    if (obs.user?.login) {
      const { login, name } = obs.user;
      const observer = observers.get(login) || { login, name: name || login, observations: 0 };
      observer.observations++;
      observers.set(login, observer);
    }

    // Subspecies and varieties are folded into their species.
    const id = taxon.min_species_taxon_id || taxon.id;
    const isSpeciesRank = taxon.rank === "species";
    let entry = species.get(id);
    if (!entry) {
      const group = GROUPS.find(([iconic]) => iconic === taxon.iconic_taxon_name);
      entry = {
        id,
        name: taxon.name.split(" ").slice(0, 2).join(" "),
        common_name: null,
        group: group ? group[1] : OTHER,
        introduced: false,
        observations: 0,
        confirmed: false,
        first_observed: obs.observed_on,
        last_observed: obs.observed_on,
        photo: null,
        photo_confirmed: false,
      };
      species.set(id, entry);
    }
    if (taxon.preferred_common_name && (isSpeciesRank || !entry.common_name)) {
      const name = taxon.preferred_common_name;
      entry.common_name = name[0].toUpperCase() + name.slice(1);
    }
    entry.introduced ||= Boolean(taxon.introduced);
    entry.observations++;
    const research = obs.quality_grade === "research";
    entry.confirmed ||= research;
    if (obs.observed_on) {
      if (!entry.first_observed || obs.observed_on < entry.first_observed) entry.first_observed = obs.observed_on;
      if (!entry.last_observed || obs.observed_on > entry.last_observed) entry.last_observed = obs.observed_on;
    }
    // Prefer a photo from a community-confirmed observation; otherwise the most recent one.
    if (!entry.photo || (research && !entry.photo_confirmed)) {
      const photo = licensedPhoto(obs);
      if (photo) {
        entry.photo = photo;
        entry.photo_confirmed = research;
      }
    }
  }

  const order = [...GROUPS.map(([, label]) => label), OTHER];
  const list = [...species.values()]
    .map(({ photo_confirmed, ...rest }) => rest)
    .sort(
      (a, b) =>
        order.indexOf(a.group) - order.indexOf(b.group) ||
        (a.common_name || a.name).localeCompare(b.common_name || b.name, "en", { sensitivity: "base" }),
    );
  const observerList = [...observers.values()].sort(
    (a, b) => b.observations - a.observations || a.name.localeCompare(b.name, "en", { sensitivity: "base" }),
  );
  return { list, counted, observers: observerList, groups: order.filter((g) => list.some((s) => s.group === g)) };
}

async function main() {
  const boundary = JSON.parse(await readFile(BOUNDARY, "utf8"));
  const ring = boundary.geometry.coordinates[0];
  const lngs = ring.map(([x]) => x);
  const lats = ring.map(([, y]) => y);
  const bbox = {
    swlat: Math.min(...lats),
    swlng: Math.min(...lngs),
    nelat: Math.max(...lats),
    nelng: Math.max(...lngs),
  };

  const observations = await fetchObservations(bbox);
  const { list, counted, observers, groups } = summarise(observations, ring);

  const data = {
    updated: new Date().toISOString().slice(0, 10),
    observations: counted,
    // Everyone with a counted observation, most observations first.
    observers,
    // Human-facing link to the same area on iNaturalist (bounding box of the boundary).
    inaturalist_url: `https://www.inaturalist.org/observations?${new URLSearchParams({ ...bbox, verifiable: "true", hrank: "species" })}`,
    groups,
    species: list,
  };
  await writeFile(OUTPUT, JSON.stringify(data, null, 2) + "\n");
  console.log(`species: ${list.length} species from ${counted} observations by ${observers.length} observers → data/species.json`);
}

main().catch((err) => {
  if (existsSync(OUTPUT)) {
    console.warn(`species: could not refresh from iNaturalist (${err.message}); keeping the existing data/species.json`);
  } else {
    console.error(`species: could not fetch from iNaturalist (${err.message}) and there is no existing data/species.json`);
    process.exit(1);
  }
});
