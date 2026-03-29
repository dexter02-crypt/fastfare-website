import { Resend } from 'resend';

const resendClient = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

const sendEmail = async ({ to, subject, html }) => {
    try {
        const { data, error } = await resendClient.emails.send({
            from: `FastFare <${FROM_EMAIL}>`,
            reply_to: 'support@fastfare.com',
            to: [to],
            subject,
            html,
        });
        if (error) {
            console.error('[FastFare Email] Resend error:', error);
            throw new Error(error.message || 'Failed to send email');
        }
        return data;
    } catch (err) {
        console.error('[FastFare Email] Error sending email:', err);
        throw err;
    }
};

const getFooterHtml = () => `
    <tr>
      <td style="background-color: #1A1A2E; color: #FFFFFF; padding: 25px 20px; text-align: center; font-size: 12px; line-height: 1.8;">
        <div>
          <a href="https://fastfare.com/help-center" style="color: #FFFFFF; text-decoration: underline; margin: 0 10px;">Help Center</a> | 
          <a href="https://fastfare.com/contact" style="color: #FFFFFF; text-decoration: underline; margin: 0 10px;">Contact</a> | 
          <a href="https://fastfare.com/privacy" style="color: #FFFFFF; text-decoration: underline; margin: 0 10px;">Privacy Policy</a> | 
          <a href="https://fastfare.com/terms" style="color: #FFFFFF; text-decoration: underline; margin: 0 10px;">Terms of Service</a> | 
          <a href="https://fastfare.com/refund-policy" style="color: #FFFFFF; text-decoration: underline; margin: 0 10px;">Refund Policy</a>
        </div>
        <div style="margin-top: 15px; color: #888;">
          &copy; 2026 FastFare Technologies Pvt. Ltd. All rights reserved.<br>
          You're receiving this email because you have an active shipment with FastFare.
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const getHeaderHtml = (title, previewText) => `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
</head>
<body style="font-family: 'Inter', 'Poppins', Arial, sans-serif; margin: 0; padding: 0; background-color: #F4F5F7; color: #1A1A2E; -webkit-font-smoothing: antialiased;">
  <div style="display:none;font-size:1px;color:#333333;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${previewText}</div>
  <table style="border-collapse: collapse; width: 100%; max-width: 600px; margin: 0 auto; background-color: #FFFFFF;">
    <tr>
      <td style="background-color: #FF6B00; padding: 20px; text-align: center;">
        <h1 style="color: #FFFFFF; margin: 0; font-size: 26px;">FastFare</h1>
      </td>
    </tr>
`;

const getProgressBar = (activeStep) => {
    const steps = ['Booked', 'Picked Up', 'In Transit', 'Out for Delivery', 'Delivered'];
    const activeIndex = steps.indexOf(activeStep);
    let html = '<div style="margin: 25px 0; text-align: center; font-size: 13px; font-weight: bold;">';
    steps.forEach((step, index) => {
        const color = index <= activeIndex ? '#FF6B00' : '#AAA';
        const bullet = index === activeIndex ? '●' : (index < activeIndex ? '✔' : '○');
        html += `<span style="color: ${color};">${bullet} ${step}</span>${index < steps.length - 1 ? ' &rarr; ' : ''}`;
    });
    html += '</div>';
    return html;
};

export const sendOrderPlacedEmail = async (data) => {
    const subject = `📦 Shipment Booked! Order #${data.order_id} — FastFare`;
    const html = `
        ${getHeaderHtml(subject, "Your package is in safe hands. Here's everything you need to know.")}
        <tr>
          <td style="padding: 30px 20px; line-height: 1.6; font-size: 15px;">
            <p>Hi ${data.customer_name},</p>
            <p>Your shipment has been successfully booked with FastFare. Here are your shipment details:</p>
            
            ${getProgressBar('Booked')}

            <div style="background-color: #F7F7F7; border: 1px solid #EAEAEA; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <table style="width: 100%; font-size: 14px; text-align: left;">
                <tr><td style="width: 40%; color: #666; font-weight: 600; padding: 6px 0;">Order ID</td><td style="padding: 6px 0;"><strong>${data.order_id}</strong></td></tr>
                <tr><td style="width: 40%; color: #666; font-weight: 600; padding: 6px 0;">AWB Number</td><td style="padding: 6px 0;"><strong>${data.awb_number}</strong></td></tr>
                <tr><td style="width: 40%; color: #666; font-weight: 600; padding: 6px 0;">Carrier</td><td style="padding: 6px 0;">${data.carrier_name}</td></tr>
                <tr><td style="width: 40%; color: #666; font-weight: 600; padding: 6px 0;">Service Type</td><td style="padding: 6px 0;">${data.service_type || 'Standard'}</td></tr>
                <tr><td style="width: 40%; color: #666; font-weight: 600; padding: 6px 0;">Booked On</td><td style="padding: 6px 0;">${data.order_date || new Date().toLocaleDateString()}</td></tr>
                <tr><td style="width: 40%; color: #666; font-weight: 600; padding: 6px 0;">Estimated ETA</td><td style="padding: 6px 0;"><strong style="color: #FF6B00;">${data.estimated_delivery || 'TBD'}</strong></td></tr>
              </table>
            </div>

            <table width="100%" style="font-size: 14px;">
              <tr>
                <td style="width: 48%; vertical-align: top;">
                  <div style="background-color: #F7F7F7; border: 1px solid #EAEAEA; border-radius: 8px; padding: 15px;">
                    <h4 style="margin:0 0 10px 0;color:#666;font-size:12px;text-transform:uppercase;">From</h4>
                    <strong>${data.pickup_name || ''}</strong><br>
                    ${data.pickup_address || ''}<br>
                    ${data.pickup_city || ''} - ${data.pickup_pincode || ''}
                  </div>
                </td>
                <td width="4%"></td>
                <td style="width: 48%; vertical-align: top;">
                  <div style="background-color: #F7F7F7; border: 1px solid #EAEAEA; border-radius: 8px; padding: 15px;">
                    <h4 style="margin:0 0 10px 0;color:#666;font-size:12px;text-transform:uppercase;">To</h4>
                    <strong>${data.delivery_name || ''}</strong><br>
                    ${data.delivery_address || ''}<br>
                    ${data.delivery_city || ''} - ${data.delivery_pincode || ''}
                  </div>
                </td>
              </tr>
            </table>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.tracking_url}" style="display: inline-block; background-color: #FF6B00; color: #FFFFFF; padding: 14px 32px; border-radius: 50px; font-weight: bold; font-size: 16px; text-decoration: none;">Track My Shipment &rarr;</a><br><br>
              <a href="https://fastfare.com/shipments" style="color: #FF6B00; font-size: 14px; font-weight: 600; text-decoration: underline;">View Order in Dashboard</a>
            </div>
          </td>
        </tr>
        ${getFooterHtml()}
    `;
    return sendEmail({ to: data.customer_email, subject, html });
};

export const sendPickupScheduledEmail = async (data) => {
    const subject = `✅ Pickup Scheduled for Order #${data.order_id} — FastFare`;
    const html = `
        ${getHeaderHtml(subject, "Our delivery partner will pick up your package soon.")}
        <tr>
          <td style="padding: 30px 20px; line-height: 1.6; font-size: 15px;">
            <p>Hi ${data.customer_name},</p>
            <p>Your shipment has been confirmed and a pickup has been scheduled for your package.</p>
            
            <div style="background-color: #F7F7F7; border: 1px solid #EAEAEA; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <table style="width: 100%; font-size: 14px; text-align: left;">
                <tr><td style="width: 40%; color: #666; font-weight: 600; padding: 6px 0;">Pickup Time</td><td style="padding: 6px 0;"><strong style="color: #FF6B00;">${data.pickup_scheduled_time || 'Check tracking for details'}</strong></td></tr>
                <tr><td style="width: 40%; color: #666; font-weight: 600; padding: 6px 0;">Pickup Address</td><td style="padding: 6px 0;"><strong>${data.pickup_address || ''}, ${data.pickup_city || ''} - ${data.pickup_pincode || ''}</strong></td></tr>
                <tr><td style="width: 40%; color: #666; font-weight: 600; padding: 6px 0;">Carrier</td><td style="padding: 6px 0;">${data.carrier_name}</td></tr>
                <tr><td style="width: 40%; color: #666; font-weight: 600; padding: 6px 0;">AWB Number</td><td style="padding: 6px 0;">${data.awb_number}</td></tr>
              </table>
            </div>

            <p style="text-align: center; color: #555;">Please ensure the package is ready and accessible during the pickup window.</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.tracking_url}" style="display: inline-block; background-color: #FF6B00; color: #FFFFFF; padding: 14px 32px; border-radius: 50px; font-weight: bold; font-size: 16px; text-decoration: none;">Track Shipment &rarr;</a>
            </div>
          </td>
        </tr>
        ${getFooterHtml()}
    `;
    return sendEmail({ to: data.customer_email, subject, html });
};

export const sendPackagePickedUpEmail = async (data) => {
    const subject = `🚚 Package Picked Up — Order #${data.order_id} is on its way!`;
    const html = `
        ${getHeaderHtml(subject, "Your shipment has left the pickup point. Track it live.")}
        <tr>
          <td style="padding: 30px 20px; line-height: 1.6; font-size: 15px;">
            <p>Hi ${data.customer_name},</p>
            <p>Your package has been picked up by ${data.carrier_name} and is now in transit.</p>
            
            ${getProgressBar('Picked Up')}

            <div style="background-color: #F7F7F7; border: 1px solid #EAEAEA; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <table style="width: 100%; font-size: 14px; text-align: left;">
                <tr><td style="width: 40%; color: #666; font-weight: 600; padding: 6px 0;">Picked Up At</td><td style="padding: 6px 0;"><strong>${data.pickup_completed_at || new Date().toLocaleString()}</strong></td></tr>
                <tr><td style="width: 40%; color: #666; font-weight: 600; padding: 6px 0;">From</td><td style="padding: 6px 0;">${data.pickup_city || ''}, ${data.pickup_pincode || ''}</td></tr>
                <tr><td style="width: 40%; color: #666; font-weight: 600; padding: 6px 0;">Heading To</td><td style="padding: 6px 0;">${data.delivery_city || ''}, ${data.delivery_pincode || ''}</td></tr>
                <tr><td style="width: 40%; color: #666; font-weight: 600; padding: 6px 0;">Carrier AWB</td><td style="padding: 6px 0;">${data.awb_number}</td></tr>
                <tr><td style="width: 40%; color: #666; font-weight: 600; padding: 6px 0;">Est. Delivery</td><td style="padding: 6px 0;"><strong style="color: #FF6B00;">${data.estimated_delivery || 'TBD'}</strong></td></tr>
              </table>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.tracking_url}" style="display: inline-block; background-color: #FF6B00; color: #FFFFFF; padding: 14px 32px; border-radius: 50px; font-weight: bold; font-size: 16px; text-decoration: none;">View Live Location &rarr;</a>
            </div>
          </td>
        </tr>
        ${getFooterHtml()}
    `;
    return sendEmail({ to: data.customer_email, subject, html });
};

export const sendInTransitUpdateEmail = async (data) => {
    const subject = `📍 Your Package is in ${data.last_checkpoint || 'Transit'} — Order #${data.order_id}`;
    const html = `
        ${getHeaderHtml(subject, `Your shipment just passed a checkpoint. ETA: ${data.estimated_delivery || 'TBD'}`)}
        <tr>
          <td style="padding: 30px 20px; line-height: 1.6; font-size: 15px;">
            <p>Hi ${data.customer_name},</p>
            <p>Quick update! Your package is moving through our network.</p>
            
            ${getProgressBar('In Transit')}

            <div style="background-color: #F7F7F7; border: 1px solid #EAEAEA; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <table style="width: 100%; font-size: 14px; text-align: left;">
                <tr><td style="width: 40%; color: #666; font-weight: 600; padding: 6px 0;">Current Location</td><td style="padding: 6px 0;"><strong>${data.current_location || data.last_checkpoint || 'In Transit Hub'}</strong></td></tr>
                <tr><td style="width: 40%; color: #666; font-weight: 600; padding: 6px 0;">Last Checkpoint</td><td style="padding: 6px 0;">${data.last_checkpoint || 'Scanned at facility'}</td></tr>
                <tr><td style="width: 40%; color: #666; font-weight: 600; padding: 6px 0;">Estimated Delivery</td><td style="padding: 6px 0;"><strong style="color: #FF6B00;">${data.estimated_delivery || 'TBD'}</strong></td></tr>
                <tr><td style="width: 40%; color: #666; font-weight: 600; padding: 6px 0;">AWB Number</td><td style="padding: 6px 0;">${data.awb_number}</td></tr>
              </table>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.tracking_url}" style="display: inline-block; background-color: #FF6B00; color: #FFFFFF; padding: 14px 32px; border-radius: 50px; font-weight: bold; font-size: 16px; text-decoration: none;">Live Map Tracking &rarr;</a>
            </div>
            <p style="text-align: center; color: #888; font-size: 13px;">FastFare's AI Analytics monitors your delivery for any delays and proactively reroutes when needed.</p>
          </td>
        </tr>
        ${getFooterHtml()}
    `;
    return sendEmail({ to: data.customer_email, subject, html });
};

export const sendOutForDeliveryEmail = async (data) => {
    const subject = `🛵 Out for Delivery! Order #${data.order_id} arriving today`;
    const html = `
        ${getHeaderHtml(subject, `${data.delivery_agent_name || 'Your agent'} is on the way with your package.`)}
        <tr>
          <td style="padding: 30px 20px; line-height: 1.6; font-size: 15px;">
            <p>Hi ${data.customer_name},</p>
            <p>Exciting news! Your package is out for delivery and will reach you today.</p>

            ${getProgressBar('Out for Delivery')}

            <div style="background-color: #F7F7F7; border: 1px solid #EAEAEA; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <table style="width: 100%; font-size: 14px; text-align: left;">
                <tr><td style="width: 40%; color: #666; font-weight: 600; padding: 6px 0;">Delivery Agent</td><td style="padding: 6px 0;"><strong>${data.delivery_agent_name || 'Agent Assigned'}</strong></td></tr>
                <tr><td style="width: 40%; color: #666; font-weight: 600; padding: 6px 0;">Agent Contact</td><td style="padding: 6px 0;">${data.delivery_agent_phone ? `<a href="tel:${data.delivery_agent_phone}" style="color: #FF6B00; font-weight: bold;">${data.delivery_agent_phone}</a>` : 'Available on tracking page'}</td></tr>
                <tr><td style="width: 40%; color: #666; font-weight: 600; padding: 6px 0;">Dispatched At</td><td style="padding: 6px 0;">${data.out_for_delivery_time || new Date().toLocaleTimeString()}</td></tr>
                <tr><td style="width: 40%; color: #666; font-weight: 600; padding: 6px 0;">Deliver To</td><td style="padding: 6px 0;">${data.delivery_address || ''}, ${data.delivery_city || ''} - ${data.delivery_pincode || ''}</td></tr>
              </table>
            </div>

            <p style="text-align: center; color: #555;">Please ensure someone is available to receive the package at the delivery address.</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.tracking_url}" style="display: inline-block; background-color: #FF6B00; color: #FFFFFF; padding: 14px 32px; border-radius: 50px; font-weight: bold; font-size: 16px; text-decoration: none;">Track Live Location &rarr;</a>
            </div>
          </td>
        </tr>
        ${getFooterHtml()}
    `;
    return sendEmail({ to: data.customer_email, subject, html });
};

export const sendDeliveredEmail = async (data) => {
    const subject = `✅ Delivered! Order #${data.order_id} has reached its destination`;
    const html = `
        ${getHeaderHtml(subject, "Your shipment was successfully delivered. Thank you.")}
        <tr>
          <td style="padding: 30px 20px; line-height: 1.6; font-size: 15px;">
            <p>Hi ${data.customer_name},</p>
            <p>Your package has been delivered successfully! 🎉</p>

            ${getProgressBar('Delivered')}

            <div style="background-color: #F7F7F7; border: 1px solid #EAEAEA; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <table style="width: 100%; font-size: 14px; text-align: left;">
                <tr><td style="width: 40%; color: #666; font-weight: 600; padding: 6px 0;">Order ID</td><td style="padding: 6px 0;"><strong>${data.order_id}</strong></td></tr>
                <tr><td style="width: 40%; color: #666; font-weight: 600; padding: 6px 0;">AWB Number</td><td style="padding: 6px 0;">${data.awb_number}</td></tr>
                <tr><td style="width: 40%; color: #666; font-weight: 600; padding: 6px 0;">Delivered To</td><td style="padding: 6px 0;">${data.delivery_name || ''}, ${data.delivery_city || ''}</td></tr>
                <tr><td style="width: 40%; color: #666; font-weight: 600; padding: 6px 0;">Delivered At</td><td style="padding: 6px 0;"><strong>${data.delivered_at || new Date().toLocaleString()}</strong></td></tr>
                ${data.delivery_proof ? `<tr><td style="width: 40%; color: #666; font-weight: 600; padding: 6px 0;">Proof of Delivery</td><td style="padding: 6px 0;"><a href="${data.delivery_proof}" style="color: #FF6B00;">[View POD Image]</a></td></tr>` : ''}
              </table>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="https://fastfare.com/shipment/new" style="display: inline-block; background-color: #FF6B00; color: #FFFFFF; padding: 14px 32px; border-radius: 50px; font-weight: bold; font-size: 16px; text-decoration: none;">Book Another Shipment &rarr;</a>
            </div>
            <p style="text-align: center;">Need help? Visit our <a href="https://fastfare.com/help-center" style="color: #FF6B00;">Help Center</a> or contact support.</p>
          </td>
        </tr>
        ${getFooterHtml()}
    `;
    return sendEmail({ to: data.customer_email, subject, html });
};

export const sendDeliveryFailedEmail = async (data) => {
    const subject = `⚠️ Delivery Attempt Failed for Order #${data.order_id} — Action Required`;
    const html = `
        ${getHeaderHtml(subject, "We tried delivering your package but couldn't. Here's what to do.")}
        <tr>
          <td style="padding: 30px 20px; line-height: 1.6; font-size: 15px;">
            <p style="color: #d9534f; font-weight: bold; font-size: 18px;">⚠️ Delivery Attempt Failed</p>
            <p>We're sorry, ${data.customer_name}. Our delivery partner attempted to deliver your package but was unable to complete it.</p>
            
            <div style="background-color: #F7F7F7; border: 1px solid #EAEAEA; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <table style="width: 100%; font-size: 14px; text-align: left;">
                <tr><td style="width: 40%; color: #666; font-weight: 600; padding: 6px 0;">Attempt Made At</td><td style="padding: 6px 0;">${data.out_for_delivery_time || new Date().toLocaleString()}</td></tr>
                <tr><td style="width: 40%; color: #666; font-weight: 600; padding: 6px 0;">Reason</td><td style="padding: 6px 0;"><strong>${data.attempt_reason || 'Consignee unavailable'}</strong></td></tr>
                <tr><td style="width: 40%; color: #666; font-weight: 600; padding: 6px 0;">Next Attempt</td><td style="padding: 6px 0;"><strong style="color: #d9534f;">${data.next_attempt_date || 'Next working day'}</strong></td></tr>
                <tr><td style="width: 40%; color: #666; font-weight: 600; padding: 6px 0;">Carrier</td><td style="padding: 6px 0;">${data.carrier_name}</td></tr>
                <tr><td style="width: 40%; color: #666; font-weight: 600; padding: 6px 0;">AWB Number</td><td style="padding: 6px 0;">${data.awb_number}</td></tr>
              </table>
            </div>

            <p style="text-align: center; color: #555;">Please ensure someone is available at ${data.delivery_address || 'your address'} during the next delivery attempt.</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="https://fastfare.com/shipments" style="display: inline-block; background-color: #FF6B00; color: #FFFFFF; padding: 14px 32px; border-radius: 50px; font-weight: bold; font-size: 16px; text-decoration: none;">Reschedule / Update Address</a><br><br>
              <a href="https://fastfare.com/contact" style="color: #FF6B00; font-size: 14px; font-weight: 600; text-decoration: underline;">Contact Support</a>
            </div>
            
            <p style="text-align: center; color: #d9534f; font-size: 13px; font-weight: bold;">Warning: After 3 failed attempts, the package will be returned to the sender.</p>
          </td>
        </tr>
        ${getFooterHtml()}
    `;
    return sendEmail({ to: data.customer_email, subject, html });
};

export const sendReturnInitiatedEmail = async (data) => {
    const subject = `↩️ Return Initiated for Order #${data.order_id} — FastFare`;
    const tracking_url = `https://fastfare.com/track?awb=${data.return_awb || data.awb_number}`;
    const html = `
        ${getHeaderHtml(subject, "Your package is being returned. Here are the details.")}
        <tr>
          <td style="padding: 30px 20px; line-height: 1.6; font-size: 15px;">
            <p>Hi ${data.customer_name},</p>
            <p>A return has been initiated for your shipment.</p>
            
            <div style="background-color: #F7F7F7; border: 1px solid #EAEAEA; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <table style="width: 100%; font-size: 14px; text-align: left;">
                <tr><td style="width: 40%; color: #666; font-weight: 600; padding: 6px 0;">Original Order ID</td><td style="padding: 6px 0;"><strong>${data.order_id}</strong></td></tr>
                <tr><td style="width: 40%; color: #666; font-weight: 600; padding: 6px 0;">Return AWB</td><td style="padding: 6px 0;"><strong style="color: #FF6B00;">${data.return_awb || data.awb_number}</strong></td></tr>
                <tr><td style="width: 40%; color: #666; font-weight: 600; padding: 6px 0;">Initiated At</td><td style="padding: 6px 0;">${data.return_initiated_at || new Date().toLocaleString()}</td></tr>
                <tr><td style="width: 40%; color: #666; font-weight: 600; padding: 6px 0;">Returning To</td><td style="padding: 6px 0;">${data.pickup_name || ''}, ${data.pickup_city || ''}</td></tr>
              </table>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${tracking_url}" style="display: inline-block; background-color: #FF6B00; color: #FFFFFF; padding: 14px 32px; border-radius: 50px; font-weight: bold; font-size: 16px; text-decoration: none;">Track Return Shipment &rarr;</a><br><br>
              <a href="https://fastfare.com/shipments" style="color: #FF6B00; font-size: 14px; font-weight: 600; text-decoration: underline;">Return Management Portal</a>
            </div>
            
            <p style="text-align: center; color: #888; font-size: 13px;">Our self-service return portal handles automated labels and refunds. Visit your dashboard for full return status.</p>
          </td>
        </tr>
        ${getFooterHtml()}
    `;
    return sendEmail({ to: data.customer_email, subject, html });
};

export const sendReturnDeliveredEmail = async (data) => {
    const subject = `📦 Return Delivered — Order #${data.order_id} is back with you`;
    const html = `
        ${getHeaderHtml(subject, "Your returned package has been delivered back to the pickup location.")}
        <tr>
          <td style="padding: 30px 20px; line-height: 1.6; font-size: 15px;">
            <p style="color: #28a745; font-weight: bold; font-size: 18px;">📦 Return Delivered</p>
            <p>Hi ${data.customer_name},</p>
            <p>Your return shipment has been successfully delivered back to your address.</p>
            
            <div style="background-color: #F7F7F7; border: 1px solid #EAEAEA; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <table style="width: 100%; font-size: 14px; text-align: left;">
                <tr><td style="width: 40%; color: #666; font-weight: 600; padding: 6px 0;">Return AWB</td><td style="padding: 6px 0;"><strong>${data.return_awb || data.awb_number}</strong></td></tr>
                <tr><td style="width: 40%; color: #666; font-weight: 600; padding: 6px 0;">Returned To</td><td style="padding: 6px 0;">${data.pickup_name || ''}, ${data.pickup_city || ''}</td></tr>
                <tr><td style="width: 40%; color: #666; font-weight: 600; padding: 6px 0;">Delivered At</td><td style="padding: 6px 0;"><strong>${data.return_delivered_at || new Date().toLocaleString()}</strong></td></tr>
              </table>
            </div>

            <p style="text-align: center; color: #28a745; font-weight: bold; font-size: 13px;">If you have a refund due, it will be processed within 3–5 business days per our Refund & Cancellation Policy.</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="https://fastfare.com/refund-policy" style="display: inline-block; background-color: #FF6B00; color: #FFFFFF; padding: 14px 32px; border-radius: 50px; font-weight: bold; font-size: 16px; text-decoration: none;">Check Refund Status</a><br><br>
              <a href="https://fastfare.com/shipment/new" style="color: #FF6B00; font-size: 14px; font-weight: 600; text-decoration: underline;">Book New Shipment</a>
            </div>
          </td>
        </tr>
        ${getFooterHtml()}
    `;
    return sendEmail({ to: data.customer_email, subject, html });
};

export const triggerShipmentEmail = async (action, shipment, extraData = {}) => {
    try {
        const User = (await import('../../models/User.js')).default;
        const u = shipment.user && shipment.user.name ? shipment.user : await User.findById(shipment.user || shipment.user?._id);
        
        const customer_name = u?.name || u?.contactPerson || 'Customer';
        const customer_email = u?.email || 'customer@example.com';
        
        let driverName = shipment.assignedDriverName || 'Agent';
        let driverPhone = shipment.assignedDriver || '';
        if (shipment.assignedDriver && shipment.assignedDriver.name) {
            driverName = shipment.assignedDriver.name;
            driverPhone = shipment.assignedDriver.phone || '';
        }

        const baseData = {
            customer_name,
            customer_email,
            order_id: shipment._id.toString().slice(-8).toUpperCase(),
            awb_number: shipment.awb || 'Pending',
            carrier_name: shipment.carrier || 'FastFare Logistics',
            tracking_url: `https://fastfare.com/track?awb=${shipment.awb || 'Pending'}`,
            estimated_delivery: shipment.estimatedDelivery ? new Date(shipment.estimatedDelivery).toLocaleDateString() : 'TBD',
            ...extraData
        };

        switch (action) {
            case 'payment_received':
            case 'partner_assigned':
            case 'order_placed':
                await sendOrderPlacedEmail({
                    ...baseData,
                    service_type: shipment.serviceType,
                    order_date: shipment.createdAt ? new Date(shipment.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
                    pickup_name: shipment.pickup?.name || '',
                    pickup_address: shipment.pickup?.address || '',
                    pickup_city: shipment.pickup?.city || '',
                    pickup_pincode: shipment.pickup?.pincode || '',
                    delivery_name: shipment.delivery?.name || '',
                    delivery_address: shipment.delivery?.address || '',
                    delivery_city: shipment.delivery?.city || '',
                    delivery_pincode: shipment.delivery?.pincode || ''
                });
                break;
            case 'pickup_scheduled':
                await sendPickupScheduledEmail({
                    ...baseData,
                    pickup_scheduled_time: shipment.pickupDate ? new Date(shipment.pickupDate).toLocaleDateString() + ' ' + (shipment.pickupSlot || '') : 'Soon',
                    pickup_address: shipment.pickup?.address || '',
                    pickup_city: shipment.pickup?.city || '',
                    pickup_pincode: shipment.pickup?.pincode || ''
                });
                break;
            case 'picked_up':
                await sendPackagePickedUpEmail({
                    ...baseData,
                    pickup_completed_at: new Date().toLocaleString(),
                    pickup_city: shipment.pickup?.city || '',
                    pickup_pincode: shipment.pickup?.pincode || '',
                    delivery_city: shipment.delivery?.city || '',
                    delivery_pincode: shipment.delivery?.pincode || ''
                });
                break;
            case 'in_transit':
                await sendInTransitUpdateEmail({
                    ...baseData,
                    current_location: extraData.location || 'In Transit Hub',
                    last_checkpoint: extraData.description || 'Scanned at facility'
                });
                break;
            case 'out_for_delivery':
                await sendOutForDeliveryEmail({
                    ...baseData,
                    delivery_agent_name: driverName,
                    delivery_agent_phone: driverPhone,
                    out_for_delivery_time: new Date().toLocaleTimeString(),
                    delivery_address: shipment.delivery?.address || '',
                    delivery_city: shipment.delivery?.city || '',
                    delivery_pincode: shipment.delivery?.pincode || ''
                });
                break;
            case 'delivered':
                await sendDeliveredEmail({
                    ...baseData,
                    delivery_name: shipment.delivery?.name || '',
                    delivery_city: shipment.delivery?.city || '',
                    delivered_at: shipment.actualDelivery ? new Date(shipment.actualDelivery).toLocaleString() : new Date().toLocaleString(),
                    delivery_proof: shipment.deliveryProofUrl || ''
                });
                break;
            case 'delivery_failed':
            case 'rejected_by_carrier':
                await sendDeliveryFailedEmail({
                    ...baseData,
                    out_for_delivery_time: new Date().toLocaleString(),
                    attempt_reason: extraData.description || 'Consignee unavailable',
                    next_attempt_date: 'Next working day',
                    delivery_address: shipment.delivery?.address || ''
                });
                break;
            case 'return_delivered':
                await sendReturnDeliveredEmail({
                    ...baseData,
                    return_awb: shipment.awb,
                    pickup_name: shipment.pickup?.name || '',
                    pickup_city: shipment.pickup?.city || '',
                    return_delivered_at: new Date().toLocaleString()
                });
                break;
        }
    } catch (e) {
        console.error('[FastFare Email] Error triggering shipment email:', e);
    }
};
