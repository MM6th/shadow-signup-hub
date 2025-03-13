
import { z } from 'zod';

export const nftFormSchema = z.object({
  title: z.string().min(3, { message: 'Title must be at least 3 characters' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters' }),
  price: z.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: 'Price must be a positive number',
  }),
  collection: z.string().min(1, { message: 'Collection is required' }),
  blockchain: z.string().min(1, { message: 'Blockchain is required' }),
  currency: z.string().min(1, { message: 'Currency is required' }),
  content_type: z.string().min(1, { message: 'Content type is required' }),
});

export type NFTFormData = z.infer<typeof nftFormSchema>;
