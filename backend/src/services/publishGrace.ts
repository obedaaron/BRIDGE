import { pool } from "../db";

export async function expireUnverifiedPublishedStores() {
  const result = await pool.query(
    `update vendors v
     set is_published = false, publish_grace_expires_at = null
     where v.is_published = true
       and v.publish_grace_expires_at is not null
       and v.publish_grace_expires_at <= now()
       and (
         not exists (select 1 from vendor_verifications vv where vv.vendor_id = v.id and vv.type = 'kyc' and vv.status = 'approved')
         or not exists (select 1 from vendor_verifications vv where vv.vendor_id = v.id and vv.type = 'location' and vv.status = 'approved')
         or not exists (select 1 from users u where u.id = v.user_id and u.email_verified_at is not null and u.phone_verified_at is not null)
       )
     returning v.id`,
  );
  return result.rowCount || 0;
}
