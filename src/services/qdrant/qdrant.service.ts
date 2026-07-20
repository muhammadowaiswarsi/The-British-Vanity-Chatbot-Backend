import {
  qdrant,
  QDRANT_COLLECTION,
  POLICIES_COLLECTION,
  FAQS_COLLECTION,
  EMBEDDING_VECTOR_SIZE,
} from '../../config/qdrant';

export { qdrant, QDRANT_COLLECTION, POLICIES_COLLECTION, FAQS_COLLECTION };

const REQUIRED_COLLECTIONS = [QDRANT_COLLECTION, POLICIES_COLLECTION, FAQS_COLLECTION] as const;

const collectionExists = async (name: string): Promise<boolean> => {
  const collections = await qdrant.getCollections();
  return collections.collections.some((collection) => collection.name === name);
};

export async function createVectorCollection(name: string, recreate = false): Promise<void> {
  const exists = await collectionExists(name);

  if (exists && recreate) {
    await qdrant.deleteCollection(name);
  } else if (exists) {
    console.log(`✓ ${name} collection exists`);
    return;
  }

  await qdrant.createCollection(name, {
    vectors: {
      size: EMBEDDING_VECTOR_SIZE,
      distance: 'Cosine',
    },
  });

  console.log(`✓ ${name} collection created`);
}

export async function ensureAllCollections(): Promise<string[]> {
  for (const name of REQUIRED_COLLECTIONS) {
    const exists = await collectionExists(name);

    if (exists) {
      console.log(`✓ ${name} collection exists`);
      continue;
    }

    await qdrant.createCollection(name, {
      vectors: {
        size: EMBEDDING_VECTOR_SIZE,
        distance: 'Cosine',
      },
    });

    console.log(`✓ ${name} collection created`);
  }

  return [...REQUIRED_COLLECTIONS];
}

export async function clearCollectionPoints(collectionName: string): Promise<void> {
  let offset: string | number | Record<string, unknown> | null | undefined = undefined;

  while (true) {
    const result = await qdrant.scroll(collectionName, {
      limit: 100,
      offset,
      with_payload: false,
      with_vector: false,
    });

    if (!result.points?.length) {
      break;
    }

    await qdrant.delete(collectionName, {
      wait: true,
      points: result.points.map((point) => point.id),
    });

    offset = result.next_page_offset;
    if (!offset) {
      break;
    }
  }
}

export async function createProductsCollection(): Promise<void> {
  await createVectorCollection(QDRANT_COLLECTION);
}

export async function createPoliciesCollection(recreate = false): Promise<void> {
  await createVectorCollection(POLICIES_COLLECTION, recreate);
}

export async function createFaqsCollection(recreate = false): Promise<void> {
  await createVectorCollection(FAQS_COLLECTION, recreate);
}

export async function testQdrantConnection() {
  return qdrant.getCollections();
}
