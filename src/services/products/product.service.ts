import Product from '../../models/Product.model';
import Category from '../../models/Category.model';
import Brand from '../../models/Brand.model';
import { searchProducts } from '../rag/rag.service';
import type { ChatProduct } from '../../types/chat.types';

const PRODUCT_RESULT_LIMIT = 5;

interface QdrantProductPayload {
  mongoId?: string;
  title?: string;
  slug?: string;
  description?: string;
  price?: number;
  brand?: string;
  category?: string;
  image?: string;
  inStock?: boolean;
}

const STOP_WORDS = new Set([
  'show', 'me', 'the', 'a', 'an', 'any', 'some', 'please', 'can', 'you',
  'do', 'have', 'i', 'need', 'want', 'looking', 'for', 'recommend', 'find',
  'get', 'give', 'what', 'are', 'your', 'best', 'products', 'product', 'under',
  'below', 'less', 'than', 'about', 'with', 'and', 'or', 'in', 'my', 'our',
]);

export interface ProductSearchOptions {
  maxPrice?: number;
  sort?: string;
  featuredOnly?: boolean;
}

const getTotalStock = (product: {
  variants?: Array<{ stock: number }>;
  stock?: number;
}): number => {
  if (product.variants?.length) {
    return product.variants.reduce((sum, variant) => sum + (variant.stock || 0), 0);
  }
  return product.stock ?? 0;
};

const truncateDescription = (description: string, maxLength = 140): string => {
  const normalized = description.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 3)}...`;
};

const extractMaxPrice = (message: string): number | undefined => {
  const match = message.match(/(?:under|below|less than)\s*\$?\s*(\d+(?:\.\d+)?)/i);
  return match ? Number(match[1]) : undefined;
};

const buildSearchTerms = (message: string): string => {
  const normalized = message
    .toLowerCase()
    .replace(/[^a-z0-9\s$]/g, ' ')
    .replace(/\$\s*\d+(?:\.\d+)?/g, ' ')
    .replace(/\b(under|below|less than)\s*\d+(?:\.\d+)?\b/g, ' ');

  const tokens = normalized
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));

  return [...new Set(tokens)].join(' ').trim();
};

export const isProductRelatedQuery = (message: string): boolean => {
  const normalized = message.toLowerCase();

  const intentKeywords = [
    'show me',
    'do you have',
    'looking for',
    'recommend',
    'i need',
    'i want',
    'find me',
    'any products',
    'products under',
    'best seller',
    'new arrival',
  ];

  const productKeywords = [
    'sneaker',
    'shoe',
    'shirt',
    't-shirt',
    'dress',
    'bag',
    'skincare',
    'perfume',
    'cologne',
    'lipstick',
    'makeup',
    'fragrance',
    'haircare',
    'serum',
    'moisturizer',
    'cleanser',
    'leather',
    'beauty',
    'product',
  ];

  return (
    intentKeywords.some((keyword) => normalized.includes(keyword)) ||
    productKeywords.some((keyword) => normalized.includes(keyword))
  );
};

const mapQdrantPayloadToChatProduct = (payload: QdrantProductPayload): ChatProduct | null => {
  if (!payload.mongoId || !payload.title) {
    return null;
  }

  const description = String(payload.description ?? '');

  return {
    id: payload.mongoId,
    name: payload.title,
    slug: String(payload.slug ?? ''),
    brand: String(payload.brand ?? 'Unknown brand'),
    category: String(payload.category ?? 'Uncategorized'),
    price: Number(payload.price ?? 0),
    image: String(payload.image ?? ''),
    shortDescription: truncateDescription(description),
    inStock: payload.inStock ?? true,
  };
};

const mapToChatProduct = (product: Record<string, unknown>): ChatProduct => {
  const brand = product.brand as { name?: string } | null | undefined;
  const category = product.category as { name?: string } | null | undefined;
  const variants = product.variants as Array<{ stock: number }> | undefined;
  const images = (product.images as string[] | undefined) ?? [];
  const description = String(product.description ?? '');
  const totalStock = getTotalStock({
    variants,
    stock: product.stock as number | undefined,
  });

  return {
    id: String(product._id),
    name: String(product.title),
    slug: String(product.slug),
    brand: brand?.name || 'Unknown brand',
    category: category?.name || 'Uncategorized',
    price: Number(product.price),
    image: images[0] || '',
    shortDescription: truncateDescription(description),
    inStock: totalStock > 0,
  };
};

const resolveCategoryIdsFromMessage = async (message: string): Promise<string[]> => {
  const normalized = message.toLowerCase();
  const categories = await Category.find({ isActive: true }).select('name slug').lean();

  return categories
    .filter(
      (category) =>
        normalized.includes(category.name.toLowerCase()) ||
        normalized.includes(category.slug.toLowerCase())
    )
    .map((category) => String(category._id));
};

const resolveBrandIdsFromMessage = async (message: string): Promise<string[]> => {
  const normalized = message.toLowerCase();
  const brands = await Brand.find({ isActive: true }).select('name slug').lean();

  return brands
    .filter(
      (brand) =>
        normalized.includes(brand.name.toLowerCase()) ||
        normalized.includes(brand.slug.toLowerCase())
    )
    .map((brand) => String(brand._id));
};

const resolveSort = (message: string): string => {
  const normalized = message.toLowerCase();

  if (normalized.includes('best seller') || normalized.includes('bestseller')) {
    return '-soldCount';
  }

  if (normalized.includes('new arrival') || normalized.includes('latest')) {
    return '-createdAt';
  }

  if (normalized.includes('top rated') || normalized.includes('highest rated')) {
    return '-averageRating';
  }

  return '-createdAt';
};

const searchProductsFromMongoDB = async (message: string): Promise<ChatProduct[]> => {
  const normalized = message.toLowerCase();
  const searchTerms = buildSearchTerms(message);
  const maxPrice = extractMaxPrice(message);
  const categoryIds = await resolveCategoryIdsFromMessage(message);
  const brandIds = await resolveBrandIdsFromMessage(message);

  const baseFilter: Record<string, unknown> = { isActive: true };

  if (categoryIds.length) {
    baseFilter.category = { $in: categoryIds };
  }

  if (brandIds.length) {
    baseFilter.brand = { $in: brandIds };
  }

  if (maxPrice !== undefined) {
    baseFilter.price = { $lte: maxPrice };
  }

  if (normalized.includes('featured')) {
    baseFilter.isFeatured = true;
  }

  const buildQuery = (filter: Record<string, unknown>, useTextSearch: boolean) => {
    let query = Product.find(filter)
      .populate('category', 'name slug')
      .populate('brand', 'name slug')
      .limit(PRODUCT_RESULT_LIMIT);

    if (useTextSearch && searchTerms.length >= 2) {
      return query.sort({ score: { $meta: 'textScore' } });
    }

    return query.sort(resolveSort(message));
  };

  if (searchTerms.length >= 2) {
    const textResults = await buildQuery(
      { ...baseFilter, $text: { $search: searchTerms } },
      true
    ).lean();

    if (textResults.length) {
      return textResults.map((product) => mapToChatProduct(product as Record<string, unknown>));
    }
  }

  const filteredResults = await buildQuery(baseFilter, false).lean();
  return filteredResults.map((product) => mapToChatProduct(product as Record<string, unknown>));
};

export const searchProductsForChat = async (message: string): Promise<ChatProduct[]> => {
  try {
    const qdrantResults = await searchProducts(message);
    const points = qdrantResults.points ?? [];

    if (points.length > 0) {
      const products = points
        .map((point) =>
          mapQdrantPayloadToChatProduct((point.payload ?? {}) as QdrantProductPayload)
        )
        .filter((product): product is ChatProduct => product !== null);

      if (products.length > 0) {
        return products.slice(0, PRODUCT_RESULT_LIMIT);
      }
    }
  } catch (error) {
    console.error(
      'Qdrant product search failed, falling back to MongoDB:',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }

  return searchProductsFromMongoDB(message);
};

export const formatProductsForPrompt = (products: ChatProduct[]): string => {
  if (!products.length) return 'No products found.';

  return products
    .map((product, index) => {
      const stockLabel = product.inStock ? 'In stock' : 'Out of stock';
      return `${index + 1}. ${product.name}
Brand: ${product.brand}
Category: ${product.category}
Price: $${product.price}
Availability: ${stockLabel}
Description: ${product.shortDescription}`;
    })
    .join('\n\n');
};
