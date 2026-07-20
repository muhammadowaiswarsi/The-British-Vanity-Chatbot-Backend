import openai, { OPENAI_CHAT_MODEL } from '../../config/openai';
import Product from '../../models/Product.model';
import { generateEmbedding } from '../embeddings/embedding.service';
import { qdrant, QDRANT_COLLECTION } from '../qdrant/qdrant.service';

type PopulatedRef = { name?: string } | null;

export const indexProducts = async (): Promise<void> => {
  const products = await Product.find()
    .populate('brand', 'name')
    .populate('category', 'name');

  let index = 1;

  for (const product of products) {
    const brandName = (product.brand as PopulatedRef)?.name ?? '';
    const categoryName = (product.category as PopulatedRef)?.name ?? '';
    const images = product.images ?? [];
    const totalStock = product.variants?.length
      ? product.variants.reduce((sum, variant) => sum + (variant.stock || 0), 0)
      : product.stock ?? 0;

    const text = `
Title: ${product.title}
Description: ${product.description}
Price: ${product.price}
Brand: ${brandName}
Category: ${categoryName}
`;

    const embedding = await generateEmbedding(text);

    try {
      await qdrant.upsert(QDRANT_COLLECTION, {
        wait: true,
        points: [
          {
            id: index++,
            vector: embedding,
            payload: {
              mongoId: product._id.toString(),
              title: product.title,
              slug: product.slug,
              description: product.description,
              price: product.price,
              brand: brandName,
              category: categoryName,
              image: images[0] ?? '',
              inStock: totalStock > 0,
            },
          },
        ],
      });

      console.log(`Indexed: ${product.title}`);
    } catch (err) {
      console.error(`Failed to index: ${product.title}`);
      console.error(err);
    }
  }

  console.log('All products indexed.');
};

export const searchProducts = async (query: string) => {
  const embedding = await generateEmbedding(query);

  return qdrant.query(QDRANT_COLLECTION, {
    query: embedding,
    limit: 5,
    with_payload: true,
  });
};

export const askProductAssistant = async (question: string) => {
  const searchResults = await searchProducts(question);

  const productsContext = (searchResults.points ?? [])
    .map((item, index) => {
      const product = item.payload as Record<string, unknown>;

      return `
Product ${index + 1}
Title: ${product.title}
Price: $${product.price}
Brand: ${product.brand}
Category: ${product.category}
Description: ${product.description}
`;
    })
    .join('\n');

  const response = await openai.chat.completions.create({
    model: OPENAI_CHAT_MODEL,
    messages: [
      {
        role: 'system',
        content: `
You are an AI shopping assistant.

Answer ONLY using the products provided below.

If no matching product exists, clearly tell the user.

Products:
${productsContext}
        `,
      },
      {
        role: 'user',
        content: question,
      },
    ],
  });

  return response.choices[0]?.message?.content ?? null;
};
