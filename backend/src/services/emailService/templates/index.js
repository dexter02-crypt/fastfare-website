// Email template functions returning HTML strings
// All emails use inline-styled, mobile-responsive table layout

const BRAND_COLORS = {
    primary: '#01696f',
    background: '#ffffff',
    text: '#28251d',
    success: '#437a22',
    warning: '#da7101',
    decline: '#a12c7b'
};

export const baseTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: ${BRAND_COLORS.background}; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: ${BRAND_COLORS.text};">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <tr>
            <td style="padding: 20px; text-align: center; border-bottom: 3px solid ${BRAND_COLORS.primary};">
                <h1 style="margin: 0; color: ${BRAND_COLORS.primary};">FastFare</h1>
            </td>
        </tr>
        <tr>
            <td style="padding: 30px 20px;">
                ${content}
            </td>
        </tr>
        <tr>
            <td style="padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #eee;">
                <p style="margin: 0;">This is a transactional email related to your FastFare order.<br/>You cannot unsubscribe from order-related notifications.</p>
                <p style="margin: 10px 0 0 0;">&copy; ${new Date().getFullYear()} FastFare Logistics</p>
            </td>
        </tr>
    </table>
</body>
</html>
`;

export const orderAssignmentTemplate = (payload) => {
    const content = `
        <h2 style="color: ${BRAND_COLORS.primary}; margin-top: 0;">New Order Assignment</h2>
        <p>You have received a new order assignment. Please review and accept or decline.</p>
        
        <table width="100%" cellpadding="10" cellspacing="0" style="background: #f9fafb; border-radius: 8px; margin: 20px 0;">
            <tr><td><strong>Order ID:</strong></td><td>${payload.orderId}</td></tr>
            <tr><td><strong>Pickup:</strong></td><td>${payload.pickup?.city || 'N/A'}</td></tr>
            <tr><td><strong>Delivery:</strong></td><td>${payload.delivery?.city || 'N/A'}</td></tr>
            <tr><td><strong>Value:</strong></td><td>₹${payload.orderValue}</td></tr>
            <tr><td><strong>Type:</strong></td><td>${payload.orderType?.toUpperCase() || 'PREPAID'}</td></tr>
        </table>
        
        <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
                <td style="padding: 10px;">
                    <a href="${payload.baseUrl}/partner/orders?highlight=${payload.orderId}" style="display: block; background: ${BRAND_COLORS.primary}; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; text-align: center;">Review & Accept Order</a>
                </td>
            </tr>
            <tr>
                <td style="padding: 10px;">
                    <a href="${payload.baseUrl}/partner/orders?decline=${payload.orderId}" style="display: block; background: ${BRAND_COLORS.decline}; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; text-align: center;">Decline Order</a>
                </td>
            </tr>
        </table>
        
        <p style="color: ${BRAND_COLORS.warning}; font-size: 12px; margin-top: 15px;">You have 5 minutes to respond.</p>
    `;
    return baseTemplate(content);
};

export const orderConfirmationTemplate = (payload) => {
    const content = `
        <h2 style="color: ${BRAND_COLORS.primary}; margin-top: 0;">Order Placed</h2>
        <p>Your order has been placed successfully. We're awaiting partner confirmation.</p>
        
        <table width="100%" cellpadding="10" cellspacing="0" style="background: #f9fafb; border-radius: 8px; margin: 20px 0;">
            <tr><td><strong>Order ID:</strong></td><td>${payload.orderId}</td></tr>
            <tr><td><strong>Destination:</strong></td><td>${payload.destination}</td></tr>
            <tr><td><strong>Value:</strong></td><td>₹${payload.orderValue}</td></tr>
        </table>
        
        <p style="text-align: center; margin-top: 20px;">
            <a href="${payload.baseUrl}/orders" style="display: inline-block; background: ${BRAND_COLORS.primary}; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Track Your Order</a>
        </p>
    `;
    return baseTemplate(content);
};

export const orderAcceptedTemplate = (payload) => {
    const content = `
        <h2 style="color: ${BRAND_COLORS.success}; margin-top: 0;">Order Accepted!</h2>
        <p>Your order has been accepted by the delivery partner.</p>
        
        <table width="100%" cellpadding="10" cellspacing="0" style="background: #f9fafb; border-radius: 8px; margin: 20px 0;">
            <tr><td><strong>Order ID:</strong></td><td>${payload.orderId}</td></tr>
            <tr><td><strong>Partner:</strong></td><td>${payload.partnerName}</td></tr>
            <tr><td><strong>Estimated Pickup:</strong></td><td>${payload.estimatedPickup || 'Today'}</td></tr>
        </table>
        
        <p style="text-align: center; margin-top: 20px;">
            <a href="${payload.baseUrl}/orders" style="display: inline-block; background: ${BRAND_COLORS.primary}; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Track Live</a>
        </p>
    `;
    return baseTemplate(content);
};

export const orderDeclinedTemplate = (payload) => {
    const content = `
        <h2 style="color: ${BRAND_COLORS.decline}; margin-top: 0;">Order Update</h2>
        <p>Your order was declined by the partner. You can reassign it.</p>
        
        <table width="100%" cellpadding="10" cellspacing="0" style="background: #f9fafb; border-radius: 8px; margin: 20px 0;">
            <tr><td><strong>Order ID:</strong></td><td>${payload.orderId}</td></tr>
            <tr><td><strong>Reason:</strong></td><td>${payload.reason || 'Partner unavailable'}</td></tr>
        </table>
        
        <p style="text-align: center; margin-top: 20px;">
            <a href="${payload.baseUrl}/orders" style="display: inline-block; background: ${BRAND_COLORS.primary}; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Reassign Order</a>
        </p>
    `;
    return baseTemplate(content);
};

export const statusUpdateTemplate = (payload) => {
    const stages = {
        in_transit: 'On the Way',
        out_for_delivery: 'Out for Delivery',
        shipped: 'Shipped',
        delivered: 'Delivered',
        failed_delivery: 'Delivery Failed',
        returned: 'Returned'
    };
    
    const content = `
        <h2 style="color: ${BRAND_COLORS.success}; margin-top: 0;">Order ${stages[payload.status] || 'Updated'}</h2>
        <p>Your order status has been updated.</p>
        
        <table width="100%" cellpadding="10" cellspacing="0" style="background: #f9fafb; border-radius: 8px; margin: 20px 0;">
            <tr><td><strong>Order ID:</strong></td><td>${payload.orderId}</td></tr>
            <tr><td><strong>Status:</strong></td><td style="color: ${BRAND_COLORS.success}; font-weight: bold;">${stages[payload.status] || payload.status}</td></tr>
        </table>
        
        <p style="text-align: center; margin-top: 20px;">
            <a href="${payload.baseUrl}/orders" style="display: inline-block; background: ${BRAND_COLORS.primary}; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Track Order</a>
        </p>
        
        ${payload.status === 'delivered' ? `
        <p style="text-align: center; margin-top: 15px;">
            <a href="${payload.baseUrl}/orders/${payload.orderId}/review" style="display: inline-block; background: ${BRAND_COLORS.success}; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 6px;">Rate Your Experience</a>
        </p>
        ` : ''}
    `;
    return baseTemplate(content);
};

export const statusConfirmationTemplate = (payload) => {
    const content = `
        <h2 style="color: ${BRAND_COLORS.primary};">Status Updated</h2>
        <p>Order status has been updated to: <strong>${payload.status}</strong></p>
        
        <table width="100%" cellpadding="10" cellspacing="0" style="background: #f9fafb; border-radius: 8px; margin: 20px 0;">
            <tr><td><strong>Order ID:</strong></td><td>${payload.orderId}</td></tr>
            <tr><td><strong>Customer:</strong></td><td>${payload.customerName}</td></tr>
            <tr><td><strong>Timestamp:</strong></td><td>${new Date().toLocaleString()}</td></tr>
        </table>
        
        <p style="text-align: center; margin-top: 20px;">
            <a href="${payload.baseUrl}/partner/orders" style="display: inline-block; background: ${BRAND_COLORS.primary}; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View Dashboard</a>
        </p>
    `;
    return baseTemplate(content);
};