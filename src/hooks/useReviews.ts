
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type Review = {
  id: string;
  seller_id: string;
  buyer_id: string;
  product_id: string;
  rating: number;
  comment?: string;
  created_at: string;
  profile_photo_url?: string | null;
  username?: string;
};

export const useSellerReviews = (sellerId?: string) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!sellerId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        // Fetch reviews for the seller
        const { data: reviewsData, error } = await supabase
          .from('reviews')
          .select(`
            *,
            profiles:buyer_id(
              username,
              profile_photo_url
            )
          `)
          .eq('seller_id', sellerId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Transform the data to include profile information
        const transformedReviews = reviewsData.map(review => ({
          ...review,
          username: review.profiles?.username,
          profile_photo_url: review.profiles?.profile_photo_url,
        }));

        setReviews(transformedReviews);
        
        // Calculate average rating and total reviews
        if (transformedReviews.length > 0) {
          const totalRating = transformedReviews.reduce((sum, review) => sum + review.rating, 0);
          setAverageRating(totalRating / transformedReviews.length);
          setTotalReviews(transformedReviews.length);
        } else {
          setAverageRating(0);
          setTotalReviews(0);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviews();
  }, [sellerId]);

  return { reviews, isLoading, averageRating, totalReviews };
};
