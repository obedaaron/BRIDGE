import { pool } from "../db";

export const ACCOUNT_DELETION_GRACE_DAYS = 60;

export async function expireScheduledAccountDeletions() {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const due = await client.query(
      `select id from users
       where deletion_scheduled_for <= now()
       order by deletion_scheduled_for
       limit 50
       for update skip locked`
    );

    for (const { id } of due.rows as { id: string }[]) {
      await client.query("delete from vendor_verifications where vendor_id in (select id from vendors where user_id = $1)", [id]);
      await client.query("delete from vendor_storefront_gallery_images where vendor_id in (select id from vendors where user_id = $1)", [id]);
      await client.query(
        `update vendors set
           business_name = 'Deleted storefront',
           slug = 'deleted-' || id::text,
           description = null, logo_url = null, cover_image_url = null,
           phone = null, whatsapp = null, email = null, address = null,
           city = null, state = null, location = null, is_published = false,
           verification_status = 'unverified'
         where user_id = $1`,
        [id]
      );
      await client.query("delete from listings where vendor_id in (select id from vendors where user_id = $1)", [id]);
      await client.query("delete from reviews where customer_id = $1", [id]);
      await client.query("delete from messages where sender_id = $1", [id]);
      await client.query("delete from user_marketplace_interests where user_id = $1", [id]);
      await client.query("delete from contact_verification_challenges where user_id = $1", [id]);
      await client.query("delete from password_reset_tokens where user_id = $1", [id]);
      await client.query("delete from user_terms_acceptances where user_id = $1", [id]);
      await client.query("delete from conversation_read_receipts where user_id = $1", [id]);
      await client.query("delete from app_notifications where user_id = $1", [id]);
      await client.query(
        `update marketplace_orders set
           buyer_contact_name = null, buyer_contact_phone = null,
           delivery_address = null, delivery_city = null, delivery_state = null,
           gift_recipient_name = null, gift_recipient_phone = null, gift_message = null
         where buyer_id = $1`,
        [id]
      );
      await client.query(
        `update users set
           email = 'deleted-' || id::text || '@accounts.deleted.invalid',
           password_hash = crypt(gen_random_uuid()::text, gen_salt('bf')),
           full_name = null, username = null, phone = null, avatar_url = null,
           email_verified_at = null, phone_verified_at = null,
           personalized_ads_enabled = false, role = 'customer',
           deletion_requested_at = null, deletion_scheduled_for = null,
           account_deletion_completed_at = now()
         where id = $1`,
        [id]
      );
    }

    await client.query("commit");
    return due.rowCount || 0;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}
