-- Enable realtime for crops table
ALTER TABLE public.crops REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.crops;

-- Enable realtime for marketplace_listings table
ALTER TABLE public.marketplace_listings REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.marketplace_listings;