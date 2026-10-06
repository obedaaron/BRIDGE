import { pool } from "../db";
import { sendOrderUpdateEmail } from "./contactDelivery";

type NoticeInput = { userId: string; orderId?: string | null; kind: string; title: string; body: string; href?: string | null; email?: string | null; emailSubject?: string; emailText?: string };

export async function notifyUser(input: NoticeInput) {
  await pool.query(
    "insert into app_notifications (user_id, order_id, kind, title, body, href) values ($1,$2,$3,$4,$5,$6)",
    [input.userId, input.orderId || null, input.kind, input.title, input.body, input.href || null]
  );
  if (input.email) {
    try {
      await sendOrderUpdateEmail({ destination: input.email, subject: input.emailSubject || input.title, text: input.emailText || input.body });
    } catch (error) {
      console.error("Order notification email delivery failed", error);
    }
  }
}

export async function notifyOrderParties(orderId: string, event: "paid" | "processing" | "out_for_delivery" | "delivered" | "completed" | "return_requested" | "refunded", extra?: string) {
  const result = await pool.query(
    `select o.id, o.title, o.buyer_id, o.vendor_id, v.user_id as vendor_user_id, o.conversation_id,
            buyer.email as buyer_email, v.business_name, seller.email as seller_email
     from marketplace_orders o
     join users buyer on buyer.id = o.buyer_id
     join vendors v on v.id = o.vendor_id
     join users seller on seller.id = v.user_id
     where o.id = $1`, [orderId]
  );
  const order = result.rows[0];
  if (!order) return;
  const href = `/messages/${order.conversation_id}`;
  const messages: Record<typeof event, { buyer: [string, string, string]; vendor: [string, string, string] }> = {
    paid: { buyer: ["Payment confirmed", `Payment for ${order.title} is confirmed.`, "Your BRIDGE order payment is confirmed"], vendor: ["New paid order", `${order.title} has been paid and is ready for fulfilment.`, "A customer paid for an order" ] },
    processing: { buyer: ["Your order is being prepared", `${order.business_name} has started preparing ${order.title}.`, "Your order is being prepared"], vendor: ["Order processing started", `You marked ${order.title} as in progress.`, "Order processing update"] },
    out_for_delivery: { buyer: ["Your order is out for delivery", `${order.business_name} has dispatched ${order.title}.`, "Your order is out for delivery"], vendor: ["Order dispatched", `You marked ${order.title} out for delivery.`, "Your order is out for delivery"] },
    delivered: { buyer: ["Your order is out for delivery", `${order.business_name} marked ${order.title} as delivered. Please confirm receipt or report a problem from My Orders.`, "Your BRIDGE order was marked delivered"], vendor: ["Delivery marked", `${order.title} was marked delivered.`, "Order delivery update"] },
    completed: { buyer: ["Order completed", `You confirmed receipt of ${order.title}.`, "Your BRIDGE order is complete"], vendor: ["Earnings added to your wallet", `The buyer confirmed ${order.title}; your seller earnings are now available in your BRIDGE wallet.`, "Your order earnings are available"] },
    return_requested: { buyer: ["Return request submitted", `Your request for ${order.title} is with the store for review.`, "Your return request was submitted"], vendor: ["Customer requested a return", `${order.title}: ${extra || "The customer reported an issue."}`, "A customer requested a return or refund"] },
    refunded: { buyer: ["Refund approved", `The refund for ${order.title} has been initiated. ${extra || ""}`.trim(), "Your BRIDGE refund was initiated"], vendor: ["Order refund initiated", `${order.title} was refunded after review.`, "An order refund was initiated"] },
  };
  const current = messages[event];
  const [buyerTitle, buyerBody, buyerSubject] = current.buyer;
  const [vendorTitle, vendorBody, vendorSubject] = current.vendor;
  await Promise.all([
    notifyUser({ userId: order.buyer_id, orderId, kind: event, title: buyerTitle, body: buyerBody, href: "/orders", email: order.buyer_email, emailSubject: buyerSubject, emailText: buyerBody }),
    notifyUser({ userId: order.vendor_user_id, orderId, kind: event, title: vendorTitle, body: vendorBody, href, email: order.seller_email, emailSubject: vendorSubject, emailText: vendorBody }),
  ]);
}

export async function notifyNewOrder(orderId: string) {
  const result = await pool.query(
    `select o.id, o.title, o.vendor_id, v.user_id as vendor_user_id, o.conversation_id, v.business_name, seller.email as seller_email
     from marketplace_orders o join vendors v on v.id = o.vendor_id join users seller on seller.id = v.user_id where o.id = $1`, [orderId]
  );
  const order = result.rows[0];
  if (!order) return;
  const body = `A customer placed ${order.title} with ${order.business_name}. Open Orders to review it.`;
  await notifyUser({ userId: order.vendor_user_id, orderId, kind: "new_order", title: "New order received", body, href: "/dashboard/orders", email: order.seller_email, emailSubject: "New order on BRIDGE", emailText: body });
}
