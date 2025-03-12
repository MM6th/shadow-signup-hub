
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
        
        // First, fetch reviews for the seller
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('reviews')
          .select('*')
          .eq('seller_id', sellerId)
          .order('created_at', { ascending: false });

        if (reviewsError) throw reviewsError;
        
        // Create a map of reviews with their IDs as keys
        const reviewsMap = new Map();
        reviewsData.forEach(review => {
          reviewsMap.set(review.id, { ...review });
        });
        
        // Fetch profile information for all buyer_ids
        const buyerIds = reviewsData.map(review => review.buyer_id);
        
        if (buyerIds.length > 0) {
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, username, profile_photo_url')
            .in('id', buyerIds);
            
          if (profilesError) throw profilesError;
          
          // Create a map of profiles with their IDs as keys
          const profilesMap = new Map();
          profilesData?.forEach(profile => {
            profilesMap.set(profile.id, profile);
          });
          
          // Update each review with the corresponding profile information
          reviewsData.forEach(review => {
            const profile = profilesMap.get(review.buyer_id);
            if (profile) {
              const reviewObj = reviewsMap.get(review.id);
              reviewObj.username = profile.username;
              reviewObj.profile_photo_url = profile.profile_photo_url;
              reviewsMap.set(review.id, reviewObj);
            }
          });
        }
        
        // Convert the map values back to an array
        const transformedReviews = Array.from(reviewsMap.values());
        
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
