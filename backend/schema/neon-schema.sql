CREATE SCHEMA "public";
CREATE SCHEMA "neon_auth";
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"slug" text NOT NULL CONSTRAINT "categories_slug_key" UNIQUE,
	"parent_id" uuid,
	"icon" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE "contact_verification_challenges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"destination" text NOT NULL,
	"code_hash" text NOT NULL,
	"provider_reference" text,
	"attempts" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contact_verification_challenges_type_check" CHECK ((type = ANY (ARRAY['email'::text, 'phone'::text])))
);
CREATE TABLE "conversation_read_receipts" (
	"conversation_id" uuid,
	"user_id" uuid,
	"last_read_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "conversation_read_receipts_pkey" PRIMARY KEY("conversation_id","user_id")
);
CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"vendor_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "conversations_vendor_id_customer_id_key" UNIQUE("vendor_id","customer_id")
);
CREATE TABLE "listings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"vendor_id" uuid NOT NULL,
	"category_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"type" text NOT NULL,
	"price" numeric(12, 2),
	"currency" text DEFAULT 'NGN',
	"images" jsonb DEFAULT '[]',
	"attributes" jsonb DEFAULT '{}',
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"image_url" text,
	"stock_quantity" integer,
	"image_urls" text[] DEFAULT '{}' NOT NULL,
	CONSTRAINT "listings_stock_quantity_check" CHECK (((stock_quantity IS NULL) OR (stock_quantity >= 0))),
	CONSTRAINT "listings_type_check" CHECK ((type = ANY (ARRAY['product'::text, 'service'::text])))
);
CREATE TABLE "marketplace_fraud_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"order_id" uuid NOT NULL,
	"code" text NOT NULL,
	"severity" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"details" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone,
	"resolved_by" uuid,
	"resolution_note" text,
	CONSTRAINT "marketplace_fraud_alerts_severity_check" CHECK ((severity = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text]))),
	CONSTRAINT "marketplace_fraud_alerts_status_check" CHECK ((status = ANY (ARRAY['open'::text, 'resolved'::text, 'dismissed'::text])))
);
CREATE TABLE "marketplace_order_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"order_id" uuid NOT NULL,
	"actor_id" uuid,
	"event_type" text NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE "marketplace_order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"order_id" uuid NOT NULL,
	"listing_id" uuid,
	"title" text NOT NULL,
	"quantity" integer NOT NULL,
	"unit_amount_kobo" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "marketplace_order_items_quantity_check" CHECK ((quantity > 0)),
	CONSTRAINT "marketplace_order_items_unit_amount_kobo_check" CHECK ((unit_amount_kobo >= 0))
);
CREATE TABLE "marketplace_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"conversation_id" uuid NOT NULL,
	"vendor_id" uuid NOT NULL,
	"buyer_id" uuid NOT NULL,
	"seller_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"amount_kobo" bigint NOT NULL,
	"currency" char(3) DEFAULT 'NGN' NOT NULL,
	"delivery_terms" text,
	"status" text DEFAULT 'proposed' NOT NULL,
	"expires_at" timestamp with time zone,
	"accepted_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"payment_provider" text,
	"payment_reference" text CONSTRAINT "marketplace_orders_payment_reference_key" UNIQUE,
	"payment_authorization_url" text,
	"paid_at" timestamp with time zone,
	"platform_fee_kobo" bigint DEFAULT 0 NOT NULL,
	"seller_amount_kobo" bigint DEFAULT 0 NOT NULL,
	"delivery_proof_url" text,
	"delivered_at" timestamp with time zone,
	"disputed_at" timestamp with time zone,
	"refunded_at" timestamp with time zone,
	"refund_reference" text,
	"payout_status" text DEFAULT 'not_ready' NOT NULL,
	"payout_reference" text,
	"processing_fee_kobo" bigint DEFAULT 0 NOT NULL,
	"buyer_total_kobo" bigint DEFAULT 0 NOT NULL,
	"fulfilment_method" text DEFAULT 'pickup' NOT NULL,
	"delivery_fee_kobo" bigint DEFAULT 0 NOT NULL,
	"pickup_location" text,
	"delivery_address" text,
	"delivery_city" text,
	"delivery_state" text,
	"buyer_contact_name" text,
	"buyer_contact_phone" text,
	"buyer_contact_submitted_at" timestamp with time zone,
	"is_gift" boolean DEFAULT false NOT NULL,
	"gift_message" text,
	"gift_recipient_name" text,
	"gift_recipient_phone" text,
	CONSTRAINT "marketplace_orders_amount_kobo_check" CHECK ((amount_kobo > 0)),
	CONSTRAINT "marketplace_orders_buyer_total_kobo_check" CHECK ((buyer_total_kobo >= 0)),
	CONSTRAINT "marketplace_orders_delivery_fee_kobo_check" CHECK ((delivery_fee_kobo >= 0)),
	CONSTRAINT "marketplace_orders_fulfilment_method_check" CHECK ((fulfilment_method = ANY (ARRAY['pickup'::text, 'local_delivery'::text, 'outside_delivery'::text]))),
	CONSTRAINT "marketplace_orders_payout_status_check" CHECK ((payout_status = ANY (ARRAY['not_ready'::text, 'pending'::text, 'wallet_available'::text, 'processing'::text, 'paid'::text, 'failed'::text, 'on_hold'::text]))),
	CONSTRAINT "marketplace_orders_platform_fee_kobo_check" CHECK ((platform_fee_kobo >= 0)),
	CONSTRAINT "marketplace_orders_processing_fee_kobo_check" CHECK ((processing_fee_kobo >= 0)),
	CONSTRAINT "marketplace_orders_seller_amount_kobo_check" CHECK ((seller_amount_kobo >= 0)),
	CONSTRAINT "marketplace_orders_status_check" CHECK ((status = ANY (ARRAY['proposed'::text, 'accepted'::text, 'rejected'::text, 'cancelled'::text, 'payment_pending'::text, 'paid'::text, 'in_progress'::text, 'delivered'::text, 'completed'::text, 'refunded'::text, 'disputed'::text])))
);
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"conversation_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE "password_reset_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL CONSTRAINT "password_reset_tokens_token_hash_key" UNIQUE,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE "payment_webhook_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"provider" text NOT NULL,
	"event_key" text NOT NULL,
	"event_type" text NOT NULL,
	"provider_reference" text,
	"processing_status" text NOT NULL,
	"processing_error" text,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	CONSTRAINT "payment_webhook_events_processing_status_check" CHECK ((processing_status = 'processed'::text))
);
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"vendor_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"body" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reviews_vendor_id_customer_id_key" UNIQUE("vendor_id","customer_id"),
	CONSTRAINT "reviews_rating_check" CHECK (((rating >= 1) AND (rating <= 5)))
);
CREATE TABLE "spatial_ref_sys" (
	"srid" integer PRIMARY KEY,
	"auth_name" varchar(256),
	"auth_srid" integer,
	"srtext" varchar(2048),
	"proj4text" varchar(2048),
	CONSTRAINT "spatial_ref_sys_srid_check" CHECK (((srid > 0) AND (srid <= 998999)))
);
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"vendor_id" uuid NOT NULL,
	"tier" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"paystack_customer_code" text,
	"paystack_subscription_code" text,
	"current_period_end" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'past_due'::text, 'cancelled'::text]))),
	CONSTRAINT "subscriptions_tier_check" CHECK ((tier = ANY (ARRAY['standard'::text, 'premium'::text])))
);
CREATE TABLE "user_marketplace_interests" (
	"user_id" uuid,
	"interest_key" text,
	"weight" integer DEFAULT 1 NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_marketplace_interests_pkey" PRIMARY KEY("user_id","interest_key"),
	CONSTRAINT "user_marketplace_interests_interest_key_check" CHECK (((char_length(interest_key) >= 2) AND (char_length(interest_key) <= 120))),
	CONSTRAINT "user_marketplace_interests_weight_check" CHECK ((weight > 0))
);
CREATE TABLE "user_terms_acceptances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"terms_type" text NOT NULL,
	"version" text NOT NULL,
	"accepted_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_terms_acceptances_user_id_terms_type_version_key" UNIQUE("user_id","terms_type","version")
);
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"email" text NOT NULL CONSTRAINT "users_email_key" UNIQUE,
	"password_hash" text NOT NULL,
	"full_name" text,
	"phone" text,
	"role" text DEFAULT 'customer' NOT NULL,
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"email_verified_at" timestamp with time zone,
	"phone_verified_at" timestamp with time zone,
	CONSTRAINT "users_role_check" CHECK ((role = ANY (ARRAY['customer'::text, 'vendor'::text, 'admin'::text])))
);
CREATE TABLE "vendor_payout_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"vendor_id" uuid NOT NULL CONSTRAINT "vendor_payout_accounts_vendor_id_key" UNIQUE,
	"provider" text DEFAULT 'paystack' NOT NULL,
	"recipient_code" text NOT NULL CONSTRAINT "vendor_payout_accounts_recipient_code_key" UNIQUE,
	"bank_code" text NOT NULL,
	"bank_name" text,
	"account_name" text,
	"account_last4" char(4) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE "vendor_promotions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"vendor_id" uuid NOT NULL,
	"listing_id" uuid NOT NULL CONSTRAINT "vendor_promotions_listing_id_key" UNIQUE,
	"status" text DEFAULT 'active' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vendor_promotions_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'ended'::text])))
);
CREATE TABLE "vendor_storefront_daily_metrics" (
	"vendor_id" uuid,
	"metric_date" date,
	"store_views" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "vendor_storefront_daily_metrics_pkey" PRIMARY KEY("vendor_id","metric_date"),
	CONSTRAINT "vendor_storefront_daily_metrics_store_views_check" CHECK ((store_views >= 0))
);
CREATE TABLE "vendor_storefront_gallery_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"vendor_id" uuid NOT NULL,
	"image_url" text NOT NULL,
	"position" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vendor_storefront_gallery_images_vendor_id_position_key" UNIQUE("vendor_id","position"),
	CONSTRAINT "vendor_storefront_gallery_images_position_check" CHECK (("position" >= 0))
);
CREATE TABLE "vendor_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"vendor_id" uuid NOT NULL,
	"tier" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"amount_kobo" bigint NOT NULL,
	"currency" char(3) DEFAULT 'NGN' NOT NULL,
	"payment_reference" text CONSTRAINT "vendor_subscriptions_payment_reference_key" UNIQUE,
	"provider" text DEFAULT 'paystack' NOT NULL,
	"provider_plan_code" text NOT NULL,
	"provider_subscription_code" text,
	"started_at" timestamp with time zone,
	"current_period_ends_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vendor_subscriptions_amount_kobo_check" CHECK ((amount_kobo > 0)),
	CONSTRAINT "vendor_subscriptions_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'active'::text, 'past_due'::text, 'cancelled'::text]))),
	CONSTRAINT "vendor_subscriptions_tier_check" CHECK ((tier = ANY (ARRAY['standard'::text, 'premium'::text])))
);
CREATE TABLE "vendor_verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"vendor_id" uuid NOT NULL,
	"type" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"document_url" text,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"provider" text,
	"provider_reference" text,
	"provider_status" text,
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"review_note" text,
	"review_checklist" jsonb,
	CONSTRAINT "vendor_verifications_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text]))),
	CONSTRAINT "vendor_verifications_type_check" CHECK ((type = ANY (ARRAY['identity'::text, 'business'::text, 'location'::text, 'skill'::text, 'bridge'::text])))
);
CREATE TABLE "vendor_wallet_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"vendor_id" uuid NOT NULL,
	"order_id" uuid,
	"withdrawal_id" uuid,
	"entry_type" text NOT NULL,
	"amount_kobo" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vendor_wallet_transactions_order_id_entry_type_key" UNIQUE("order_id","entry_type"),
	CONSTRAINT "vendor_wallet_transactions_amount_kobo_check" CHECK ((amount_kobo <> 0)),
	CONSTRAINT "vendor_wallet_transactions_entry_type_check" CHECK ((entry_type = ANY (ARRAY['order_credit'::text, 'withdrawal_reserve'::text, 'withdrawal_reversal'::text])))
);
CREATE TABLE "vendor_wallet_withdrawals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"vendor_id" uuid NOT NULL,
	"payout_account_id" uuid NOT NULL,
	"amount_kobo" bigint NOT NULL,
	"status" text DEFAULT 'requested' NOT NULL,
	"provider" text DEFAULT 'paystack' NOT NULL,
	"provider_reference" text CONSTRAINT "vendor_wallet_withdrawals_provider_reference_key" UNIQUE,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	"processed_by" uuid,
	"failure_reason" text,
	CONSTRAINT "vendor_wallet_withdrawals_amount_kobo_check" CHECK ((amount_kobo > 0)),
	CONSTRAINT "vendor_wallet_withdrawals_status_check" CHECK ((status = ANY (ARRAY['requested'::text, 'processing'::text, 'paid'::text, 'failed'::text, 'on_hold'::text, 'cancelled'::text])))
);
CREATE TABLE "vendor_wallets" (
	"vendor_id" uuid PRIMARY KEY,
	"available_kobo" bigint DEFAULT 0 NOT NULL,
	"pending_withdrawal_kobo" bigint DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vendor_wallets_available_kobo_check" CHECK ((available_kobo >= 0)),
	CONSTRAINT "vendor_wallets_pending_withdrawal_kobo_check" CHECK ((pending_withdrawal_kobo >= 0))
);
CREATE TABLE "vendors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"business_name" text NOT NULL,
	"slug" text NOT NULL CONSTRAINT "vendors_slug_key" UNIQUE,
	"description" text,
	"logo_url" text,
	"cover_image_url" text,
	"phone" text,
	"whatsapp" text,
	"email" text,
	"address" text,
	"city" text,
	"state" text,
	"country" text DEFAULT 'Nigeria',
	"location" geography(Point,4326),
	"verification_status" text DEFAULT 'unverified' NOT NULL,
	"subscription_tier" text DEFAULT 'free' NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"category_id" uuid,
	"publish_grace_expires_at" timestamp with time zone,
	"publish_grace_used_at" timestamp with time zone,
	"out_of_city_delivery_fee_kobo" bigint DEFAULT 0 NOT NULL,
	"storefront_cover_url" text,
	"storefront_accent_color" text,
	"storefront_layout" text DEFAULT 'classic' NOT NULL,
	CONSTRAINT "vendors_out_of_city_delivery_fee_kobo_check" CHECK ((out_of_city_delivery_fee_kobo >= 0)),
	CONSTRAINT "vendors_storefront_layout_check" CHECK ((storefront_layout = ANY (ARRAY['classic'::text, 'modern'::text, 'minimal'::text]))),
	CONSTRAINT "vendors_subscription_tier_check" CHECK ((subscription_tier = ANY (ARRAY['free'::text, 'standard'::text, 'premium'::text]))),
	CONSTRAINT "vendors_verification_status_check" CHECK ((verification_status = ANY (ARRAY['unverified'::text, 'pending'::text, 'identity_verified'::text, 'business_verified'::text, 'location_verified'::text, 'skill_verified'::text, 'bridge_verified'::text])))
);
CREATE TABLE "neon_auth"."account" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"accountId" text NOT NULL,
	"providerId" text NOT NULL,
	"userId" uuid NOT NULL,
	"accessToken" text,
	"refreshToken" text,
	"idToken" text,
	"accessTokenExpiresAt" timestamp with time zone,
	"refreshTokenExpiresAt" timestamp with time zone,
	"scope" text,
	"password" text,
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp with time zone NOT NULL
);
CREATE TABLE "neon_auth"."invitation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organizationId" uuid NOT NULL,
	"email" text NOT NULL,
	"role" text,
	"status" text NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"inviterId" uuid NOT NULL
);
CREATE TABLE "neon_auth"."jwks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"publicKey" text NOT NULL,
	"privateKey" text NOT NULL,
	"createdAt" timestamp with time zone NOT NULL,
	"expiresAt" timestamp with time zone
);
CREATE TABLE "neon_auth"."member" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organizationId" uuid NOT NULL,
	"userId" uuid NOT NULL,
	"role" text NOT NULL,
	"createdAt" timestamp with time zone NOT NULL
);
CREATE TABLE "neon_auth"."organization" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"slug" text NOT NULL CONSTRAINT "organization_slug_key" UNIQUE,
	"logo" text,
	"createdAt" timestamp with time zone NOT NULL,
	"metadata" text
);
CREATE TABLE "neon_auth"."project_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"endpoint_id" text NOT NULL CONSTRAINT "project_config_endpoint_id_key" UNIQUE,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"trusted_origins" jsonb NOT NULL,
	"social_providers" jsonb NOT NULL,
	"email_provider" jsonb,
	"email_and_password" jsonb,
	"allow_localhost" boolean NOT NULL,
	"plugin_configs" jsonb,
	"webhook_config" jsonb
);
CREATE TABLE "neon_auth"."session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"expiresAt" timestamp with time zone NOT NULL,
	"token" text NOT NULL CONSTRAINT "session_token_key" UNIQUE,
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp with time zone NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"userId" uuid NOT NULL,
	"impersonatedBy" text,
	"activeOrganizationId" text
);
CREATE TABLE "neon_auth"."user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"email" text NOT NULL CONSTRAINT "user_email_key" UNIQUE,
	"emailVerified" boolean NOT NULL,
	"image" text,
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"role" text,
	"banned" boolean,
	"banReason" text,
	"banExpires" timestamp with time zone
);
CREATE TABLE "neon_auth"."verification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE UNIQUE INDEX "categories_pkey" ON "categories" ("id");
CREATE UNIQUE INDEX "categories_slug_key" ON "categories" ("slug");
CREATE INDEX "contact_verification_challenges_lookup_idx" ON "contact_verification_challenges" ("user_id","type","created_at");
CREATE UNIQUE INDEX "contact_verification_challenges_pkey" ON "contact_verification_challenges" ("id");
CREATE UNIQUE INDEX "conversation_read_receipts_pkey" ON "conversation_read_receipts" ("conversation_id","user_id");
CREATE UNIQUE INDEX "conversations_pkey" ON "conversations" ("id");
CREATE UNIQUE INDEX "conversations_vendor_id_customer_id_key" ON "conversations" ("vendor_id","customer_id");
CREATE INDEX "listings_category_idx" ON "listings" ("category_id");
CREATE UNIQUE INDEX "listings_pkey" ON "listings" ("id");
CREATE INDEX "listings_vendor_idx" ON "listings" ("vendor_id");
CREATE UNIQUE INDEX "marketplace_fraud_alerts_open_code_idx" ON "marketplace_fraud_alerts" ("order_id","code");
CREATE UNIQUE INDEX "marketplace_fraud_alerts_pkey" ON "marketplace_fraud_alerts" ("id");
CREATE INDEX "marketplace_fraud_alerts_review_idx" ON "marketplace_fraud_alerts" ("status","severity","created_at");
CREATE INDEX "marketplace_order_events_order_idx" ON "marketplace_order_events" ("order_id","created_at");
CREATE UNIQUE INDEX "marketplace_order_events_pkey" ON "marketplace_order_events" ("id");
CREATE UNIQUE INDEX "marketplace_order_items_pkey" ON "marketplace_order_items" ("id");
CREATE INDEX "marketplace_orders_buyer_idx" ON "marketplace_orders" ("buyer_id","created_at");
CREATE INDEX "marketplace_orders_conversation_idx" ON "marketplace_orders" ("conversation_id","created_at");
CREATE UNIQUE INDEX "marketplace_orders_payment_reference_key" ON "marketplace_orders" ("payment_reference");
CREATE UNIQUE INDEX "marketplace_orders_pkey" ON "marketplace_orders" ("id");
CREATE INDEX "marketplace_orders_status_idx" ON "marketplace_orders" ("status","created_at");
CREATE INDEX "marketplace_orders_vendor_idx" ON "marketplace_orders" ("vendor_id","created_at");
CREATE INDEX "messages_conversation_idx" ON "messages" ("conversation_id");
CREATE INDEX "messages_conversation_sender_created_idx" ON "messages" ("conversation_id","sender_id","created_at");
CREATE UNIQUE INDEX "messages_pkey" ON "messages" ("id");
CREATE INDEX "password_reset_tokens_active_idx" ON "password_reset_tokens" ("user_id","expires_at");
CREATE UNIQUE INDEX "password_reset_tokens_pkey" ON "password_reset_tokens" ("id");
CREATE UNIQUE INDEX "password_reset_tokens_token_hash_key" ON "password_reset_tokens" ("token_hash");
CREATE UNIQUE INDEX "payment_webhook_events_pkey" ON "payment_webhook_events" ("id");
CREATE UNIQUE INDEX "payment_webhook_events_provider_key_idx" ON "payment_webhook_events" ("provider","event_key");
CREATE INDEX "payment_webhook_events_reference_idx" ON "payment_webhook_events" ("provider_reference","received_at");
CREATE INDEX "idx_reviews_vendor_id" ON "reviews" ("vendor_id");
CREATE UNIQUE INDEX "reviews_pkey" ON "reviews" ("id");
CREATE UNIQUE INDEX "reviews_vendor_id_customer_id_key" ON "reviews" ("vendor_id","customer_id");
CREATE UNIQUE INDEX "spatial_ref_sys_pkey" ON "spatial_ref_sys" ("srid");
CREATE UNIQUE INDEX "subscriptions_pkey" ON "subscriptions" ("id");
CREATE UNIQUE INDEX "user_marketplace_interests_pkey" ON "user_marketplace_interests" ("user_id","interest_key");
CREATE INDEX "user_marketplace_interests_user_weight_idx" ON "user_marketplace_interests" ("user_id","weight","last_seen_at");
CREATE UNIQUE INDEX "user_terms_acceptances_pkey" ON "user_terms_acceptances" ("id");
CREATE UNIQUE INDEX "user_terms_acceptances_user_id_terms_type_version_key" ON "user_terms_acceptances" ("user_id","terms_type","version");
CREATE UNIQUE INDEX "users_email_key" ON "users" ("email");
CREATE UNIQUE INDEX "users_pkey" ON "users" ("id");
CREATE UNIQUE INDEX "vendor_payout_accounts_pkey" ON "vendor_payout_accounts" ("id");
CREATE UNIQUE INDEX "vendor_payout_accounts_recipient_code_key" ON "vendor_payout_accounts" ("recipient_code");
CREATE UNIQUE INDEX "vendor_payout_accounts_vendor_id_key" ON "vendor_payout_accounts" ("vendor_id");
CREATE INDEX "vendor_promotions_active_idx" ON "vendor_promotions" ("vendor_id","ends_at");
CREATE UNIQUE INDEX "vendor_promotions_listing_id_key" ON "vendor_promotions" ("listing_id");
CREATE UNIQUE INDEX "vendor_promotions_pkey" ON "vendor_promotions" ("id");
CREATE UNIQUE INDEX "vendor_storefront_daily_metrics_pkey" ON "vendor_storefront_daily_metrics" ("vendor_id","metric_date");
CREATE INDEX "vendor_storefront_daily_metrics_vendor_date_idx" ON "vendor_storefront_daily_metrics" ("vendor_id","metric_date");
CREATE UNIQUE INDEX "vendor_storefront_gallery_images_pkey" ON "vendor_storefront_gallery_images" ("id");
CREATE UNIQUE INDEX "vendor_storefront_gallery_images_vendor_id_position_key" ON "vendor_storefront_gallery_images" ("vendor_id","position");
CREATE INDEX "vendor_storefront_gallery_images_vendor_position_idx" ON "vendor_storefront_gallery_images" ("vendor_id","position");
CREATE UNIQUE INDEX "vendor_subscriptions_payment_reference_key" ON "vendor_subscriptions" ("payment_reference");
CREATE UNIQUE INDEX "vendor_subscriptions_pkey" ON "vendor_subscriptions" ("id");
CREATE INDEX "vendor_subscriptions_vendor_idx" ON "vendor_subscriptions" ("vendor_id","created_at");
CREATE UNIQUE INDEX "vendor_verifications_active_type_idx" ON "vendor_verifications" ("vendor_id","type");
CREATE UNIQUE INDEX "vendor_verifications_pkey" ON "vendor_verifications" ("id");
CREATE UNIQUE INDEX "vendor_wallet_transactions_order_id_entry_type_key" ON "vendor_wallet_transactions" ("order_id","entry_type");
CREATE UNIQUE INDEX "vendor_wallet_transactions_pkey" ON "vendor_wallet_transactions" ("id");
CREATE INDEX "vendor_wallet_transactions_vendor_idx" ON "vendor_wallet_transactions" ("vendor_id","created_at");
CREATE UNIQUE INDEX "vendor_wallet_withdrawals_pkey" ON "vendor_wallet_withdrawals" ("id");
CREATE UNIQUE INDEX "vendor_wallet_withdrawals_provider_reference_key" ON "vendor_wallet_withdrawals" ("provider_reference");
CREATE INDEX "vendor_wallet_withdrawals_review_idx" ON "vendor_wallet_withdrawals" ("status","requested_at");
CREATE UNIQUE INDEX "vendor_wallets_pkey" ON "vendor_wallets" ("vendor_id");
CREATE INDEX "vendors_location_idx" ON "vendors" USING gist ("location");
CREATE UNIQUE INDEX "vendors_pkey" ON "vendors" ("id");
CREATE INDEX "vendors_publish_grace_expiry_idx" ON "vendors" ("publish_grace_expires_at");
CREATE INDEX "vendors_published_business_name_prefix_idx" ON "vendors" ("lower(business_name)");
CREATE INDEX "vendors_slug_idx" ON "vendors" ("slug");
CREATE UNIQUE INDEX "vendors_slug_key" ON "vendors" ("slug");
CREATE UNIQUE INDEX "account_pkey" ON "neon_auth"."account" ("id");
CREATE INDEX "account_userId_idx" ON "neon_auth"."account" ("userId");
CREATE INDEX "invitation_email_idx" ON "neon_auth"."invitation" ("email");
CREATE INDEX "invitation_organizationId_idx" ON "neon_auth"."invitation" ("organizationId");
CREATE UNIQUE INDEX "invitation_pkey" ON "neon_auth"."invitation" ("id");
CREATE UNIQUE INDEX "jwks_pkey" ON "neon_auth"."jwks" ("id");
CREATE INDEX "member_organizationId_idx" ON "neon_auth"."member" ("organizationId");
CREATE UNIQUE INDEX "member_pkey" ON "neon_auth"."member" ("id");
CREATE INDEX "member_userId_idx" ON "neon_auth"."member" ("userId");
CREATE UNIQUE INDEX "organization_pkey" ON "neon_auth"."organization" ("id");
CREATE UNIQUE INDEX "organization_slug_key" ON "neon_auth"."organization" ("slug");
CREATE UNIQUE INDEX "organization_slug_uidx" ON "neon_auth"."organization" ("slug");
CREATE UNIQUE INDEX "project_config_endpoint_id_key" ON "neon_auth"."project_config" ("endpoint_id");
CREATE UNIQUE INDEX "project_config_pkey" ON "neon_auth"."project_config" ("id");
CREATE UNIQUE INDEX "session_pkey" ON "neon_auth"."session" ("id");
CREATE UNIQUE INDEX "session_token_key" ON "neon_auth"."session" ("token");
CREATE INDEX "session_userId_idx" ON "neon_auth"."session" ("userId");
CREATE UNIQUE INDEX "user_email_key" ON "neon_auth"."user" ("email");
CREATE UNIQUE INDEX "user_pkey" ON "neon_auth"."user" ("id");
CREATE INDEX "verification_identifier_idx" ON "neon_auth"."verification" ("identifier");
CREATE UNIQUE INDEX "verification_pkey" ON "neon_auth"."verification" ("id");
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "categories"("id");
ALTER TABLE "contact_verification_challenges" ADD CONSTRAINT "contact_verification_challenges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "conversation_read_receipts" ADD CONSTRAINT "conversation_read_receipts_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE;
ALTER TABLE "conversation_read_receipts" ADD CONSTRAINT "conversation_read_receipts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE;
ALTER TABLE "listings" ADD CONSTRAINT "listings_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id");
ALTER TABLE "listings" ADD CONSTRAINT "listings_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE;
ALTER TABLE "marketplace_fraud_alerts" ADD CONSTRAINT "marketplace_fraud_alerts_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "marketplace_orders"("id") ON DELETE CASCADE;
ALTER TABLE "marketplace_fraud_alerts" ADD CONSTRAINT "marketplace_fraud_alerts_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "users"("id");
ALTER TABLE "marketplace_order_events" ADD CONSTRAINT "marketplace_order_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id");
ALTER TABLE "marketplace_order_events" ADD CONSTRAINT "marketplace_order_events_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "marketplace_orders"("id") ON DELETE CASCADE;
ALTER TABLE "marketplace_order_items" ADD CONSTRAINT "marketplace_order_items_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE SET NULL;
ALTER TABLE "marketplace_order_items" ADD CONSTRAINT "marketplace_order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "marketplace_orders"("id") ON DELETE CASCADE;
ALTER TABLE "marketplace_orders" ADD CONSTRAINT "marketplace_orders_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "users"("id");
ALTER TABLE "marketplace_orders" ADD CONSTRAINT "marketplace_orders_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE;
ALTER TABLE "marketplace_orders" ADD CONSTRAINT "marketplace_orders_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id");
ALTER TABLE "marketplace_orders" ADD CONSTRAINT "marketplace_orders_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id");
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE;
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id");
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE;
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE;
ALTER TABLE "user_marketplace_interests" ADD CONSTRAINT "user_marketplace_interests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "user_terms_acceptances" ADD CONSTRAINT "user_terms_acceptances_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "vendor_payout_accounts" ADD CONSTRAINT "vendor_payout_accounts_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE;
ALTER TABLE "vendor_promotions" ADD CONSTRAINT "vendor_promotions_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE;
ALTER TABLE "vendor_promotions" ADD CONSTRAINT "vendor_promotions_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE;
ALTER TABLE "vendor_storefront_daily_metrics" ADD CONSTRAINT "vendor_storefront_daily_metrics_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE;
ALTER TABLE "vendor_storefront_gallery_images" ADD CONSTRAINT "vendor_storefront_gallery_images_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE;
ALTER TABLE "vendor_subscriptions" ADD CONSTRAINT "vendor_subscriptions_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE;
ALTER TABLE "vendor_verifications" ADD CONSTRAINT "vendor_verifications_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id");
ALTER TABLE "vendor_verifications" ADD CONSTRAINT "vendor_verifications_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE;
ALTER TABLE "vendor_wallet_transactions" ADD CONSTRAINT "vendor_wallet_transactions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "marketplace_orders"("id");
ALTER TABLE "vendor_wallet_transactions" ADD CONSTRAINT "vendor_wallet_transactions_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE;
ALTER TABLE "vendor_wallet_transactions" ADD CONSTRAINT "vendor_wallet_transactions_withdrawal_fk" FOREIGN KEY ("withdrawal_id") REFERENCES "vendor_wallet_withdrawals"("id") ON DELETE SET NULL;
ALTER TABLE "vendor_wallet_withdrawals" ADD CONSTRAINT "vendor_wallet_withdrawals_payout_account_id_fkey" FOREIGN KEY ("payout_account_id") REFERENCES "vendor_payout_accounts"("id");
ALTER TABLE "vendor_wallet_withdrawals" ADD CONSTRAINT "vendor_wallet_withdrawals_processed_by_fkey" FOREIGN KEY ("processed_by") REFERENCES "users"("id");
ALTER TABLE "vendor_wallet_withdrawals" ADD CONSTRAINT "vendor_wallet_withdrawals_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id");
ALTER TABLE "vendor_wallets" ADD CONSTRAINT "vendor_wallets_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE;
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id");
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "neon_auth"."account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "neon_auth"."user"("id") ON DELETE CASCADE;
ALTER TABLE "neon_auth"."invitation" ADD CONSTRAINT "invitation_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "neon_auth"."user"("id") ON DELETE CASCADE;
ALTER TABLE "neon_auth"."invitation" ADD CONSTRAINT "invitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "neon_auth"."organization"("id") ON DELETE CASCADE;
ALTER TABLE "neon_auth"."member" ADD CONSTRAINT "member_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "neon_auth"."organization"("id") ON DELETE CASCADE;
ALTER TABLE "neon_auth"."member" ADD CONSTRAINT "member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "neon_auth"."user"("id") ON DELETE CASCADE;
ALTER TABLE "neon_auth"."session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "neon_auth"."user"("id") ON DELETE CASCADE;
CREATE VIEW "geography_columns" TABLESPACE public AS (SELECT current_database() AS f_table_catalog, n.nspname AS f_table_schema, c.relname AS f_table_name, a.attname AS f_geography_column, postgis_typmod_dims(a.atttypmod) AS coord_dimension, postgis_typmod_srid(a.atttypmod) AS srid, postgis_typmod_type(a.atttypmod) AS type FROM pg_class c, pg_attribute a, pg_type t, pg_namespace n WHERE t.typname = 'geography'::name AND a.attisdropped = false AND a.atttypid = t.oid AND a.attrelid = c.oid AND c.relnamespace = n.oid AND (c.relkind = ANY (ARRAY['r'::"char", 'v'::"char", 'm'::"char", 'f'::"char", 'p'::"char"])) AND NOT pg_is_other_temp_schema(c.relnamespace) AND has_table_privilege(c.oid, 'SELECT'::text));
CREATE VIEW "geometry_columns" TABLESPACE public AS (SELECT current_database()::character varying(256) AS f_table_catalog, n.nspname AS f_table_schema, c.relname AS f_table_name, a.attname AS f_geometry_column, COALESCE(postgis_typmod_dims(a.atttypmod), 2) AS coord_dimension, COALESCE(NULLIF(postgis_typmod_srid(a.atttypmod), 0), 0) AS srid, replace(replace(COALESCE(NULLIF(upper(postgis_typmod_type(a.atttypmod)), 'GEOMETRY'::text), 'GEOMETRY'::text), 'ZM'::text, ''::text), 'Z'::text, ''::text)::character varying(30) AS type FROM pg_class c JOIN pg_attribute a ON a.attrelid = c.oid AND NOT a.attisdropped JOIN pg_namespace n ON c.relnamespace = n.oid JOIN pg_type t ON a.atttypid = t.oid WHERE (c.relkind = ANY (ARRAY['r'::"char", 'v'::"char", 'm'::"char", 'f'::"char", 'p'::"char"])) AND NOT c.relname = 'raster_columns'::name AND t.typname = 'geometry'::name AND NOT pg_is_other_temp_schema(c.relnamespace) AND has_table_privilege(c.oid, 'SELECT'::text));