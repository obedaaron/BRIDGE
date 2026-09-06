-- Seller prices are protected: BRIDGE's service fee and payment processing fee
-- are quoted to, and paid by, the buyer in addition to the seller's amount.
alter table marketplace_orders add column if not exists processing_fee_kobo bigint not null default 0 check (processing_fee_kobo >= 0);
alter table marketplace_orders add column if not exists buyer_total_kobo bigint not null default 0 check (buyer_total_kobo >= 0);

-- Preserve historical orders as charged; new orders are priced by the API.
update marketplace_orders set buyer_total_kobo = amount_kobo where buyer_total_kobo = 0;
