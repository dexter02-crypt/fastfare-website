import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import logger from '../../utils/logger.js';
import * as templates from './templates/index.js';

// RESEND CLIENT
let resendClient = null;
const getResendClient = () => {
    if (!resendClient && process.env.RESEND_API_KEY) {
        resendClient = new Resend(process.env.RESEND_API_KEY);
    }
    return resendClient;
};

// NODEMAILER FALLBACK TRANSPORT
let smtpTransporter = null;
const getSmtpTransporter = () => {
    if (!smtpTransporter && process.env.SMTP_HOST) {
        smtpTransporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: false,
            auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        });
    }
    return smtpTransporter;
};

// CONFIG HELPERS
const getFromEmail = () => process.env.EMAIL_FROM || process.env.RESEND_FROM_EMAIL || 'noreply@fastfare.in';
const getBaseUrl = () => process.env.BASE_URL || process.env.APP_BASE_URL || 'http://localhost:8080';
const getSupportEmail = () => process.env.SUPPORT_EMAIL || 'support@fastfare.in';

// CORE EMAIL SENDING - RESEND + NODEMAILER FALLBACK
const sendEmail = async (to, subject, html, emailType, orderId) => {
    const timestamp = new Date().toISOString();
    
    // Try Resend first
    const resendClient = getResendClient();
    if (resendClient) {
        try {
            const { error } = await resendClient.emails.send({
                from: `FastFare <${getFromEmail()}>`,
                to, subject, html,
            });
            if (!error) {
                logger.info({ type: emailType, recipient: to, orderId, timestamp, status: 'sent', provider: 'resend' });
                return { success: true, provider: 'resend' };
            }
            logger.warn({ type: emailType, recipient: to, orderId, error: error.message, status: 'failed', provider: 'resend' });
        } catch (err) {
            logger.warn({ type: emailType, recipient: to, orderId, error: err.message, status: 'failed', provider: 'resend' });
        }
    }

    // Fallback to Nodemailer
    const smtp = getSmtpTransporter();
    if (smtp) {
        try {
            await smtp.sendMail({ from: `FastFare <${getFromEmail()}>`, to, subject, html });
            logger.info({ type: emailType, recipient: to, orderId, timestamp, status: 'sent', provider: 'nodemailer' });
            return { success: true, provider: 'nodemailer' };
        } catch (err) {
            logger.error({ type: emailType, recipient: to, orderId, error: err.message, timestamp, status: 'failed', provider: 'nodemailer' });
            return { success: false, provider: 'nodemailer' };
        }
    }

    logger.error({ type: emailType, recipient: to, orderId, error: 'No email provider', timestamp, status: 'failed' });
    return { success: false, provider: 'none' };
};

// FIRE-AND-FORGET WRAPPER
const sendEmailFireAndForget = (to, subject, html, emailType, orderId) => {
    sendEmail(to, subject, html, emailType, orderId).catch(err => {
        logger.error({ type: 'email_error', error: err.message, status: 'caught' });
    });
};

export const sendOrderAssignmentToPartner = async (payload) => {
    const subject = `New Order Assignment — Action Required | FastFare #${payload.orderId}`;
    const html = templates.orderAssignmentTemplate({ ...payload, baseUrl: getBaseUrl() });
    if (payload.partnerEmail) {
        return sendEmail(payload.partnerEmail, subject, html, 'order_assignment_partner', payload.orderId);
    }
    return { success: false, reason: 'No partner email' };
};

export const sendOrderConfirmationToUser = async (payload) => {
    const subject = `Order Placed Successfully — Awaiting Partner Confirmation | FastFare #${payload.orderId}`;
    const html = templates.orderConfirmationTemplate({ ...payload, baseUrl: getBaseUrl() });
    return sendEmail(payload.userEmail, subject, html, 'order_confirmation_user', payload.orderId);
};

export const sendOrderAcceptedToUser = async (payload) => {
    const subject = `Great News! Your Order Has Been Accepted | FastFare #${payload.orderId}`;
    const html = templates.orderAcceptedTemplate({ ...payload, baseUrl: getBaseUrl() });
    return sendEmail(payload.userEmail, subject, html, 'order_accepted_user', payload.orderId);
};

export const sendOrderDeclinedToUser = async (payload) => {
    const subject = `Order Update — Partner Unavailable | FastFare #${payload.orderId}`;
    const html = templates.orderDeclinedTemplate({ ...payload, baseUrl: getBaseUrl() });
    return sendEmail(payload.userEmail, subject, html, 'order_declined_user', payload.orderId);
};

export const sendStatusUpdateToUser = async (payload) => {
    const subjects = {
        in_transit: `Your Order is On the Way! | FastFare #${payload.orderId}`,
        out_for_delivery: `Out for Delivery Today! | FastFare #${payload.orderId}`,
        shipped: `Package Shipped | FastFare #${payload.orderId}`,
        delivered: `Order Delivered Successfully ✓ | FastFare #${payload.orderId}`,
        failed_delivery: `Delivery Attempt Failed | FastFare #${payload.orderId}`,
        returned: `Order Returned | FastFare #${payload.orderId}`
    };
    const subject = subjects[payload.status] || `Order Update | FastFare #${payload.orderId}`;
    const html = templates.statusUpdateTemplate({ ...payload, baseUrl: getBaseUrl() });
    const result = await sendEmail(payload.userEmail, subject, html, `status_update_${payload.status}`, payload.orderId);
    if (payload.status === 'delivered' && payload.partnerEmail) {
        await sendEmail(payload.partnerEmail, `Status Updated: Delivered | Order #${payload.orderId}`, 
            templates.statusConfirmationTemplate({ ...payload, baseUrl: getBaseUrl() }), 'status_confirm_partner', payload.orderId);
    }
    return result;
};

export const sendStatusConfirmationToPartner = async (payload) => {
    const subject = `Status Updated: ${payload.status} | Order #${payload.orderId}`;
    const html = templates.statusConfirmationTemplate({ ...payload, baseUrl: getBaseUrl() });
    return sendEmail(payload.partnerEmail, subject, html, 'status_confirm_partner', payload.orderId);
};

// FIRE-AND-FORGET EXPORTS FOR ROUTE HANDLERS
export const notifyPartnerOrderAssignment = (payload) => {
    sendEmailFireAndForget(
        payload.partnerEmail,
        `New Order Assignment — Action Required | FastFare #${payload.orderId}`,
        templates.orderAssignmentTemplate({ ...payload, baseUrl: getBaseUrl() }),
        'order_assignment_partner', payload.orderId
    );
};

export const notifyUserOrderConfirmation = (payload) => {
    sendEmailFireAndForget(
        payload.userEmail,
        `Order Placed Successfully — Awaiting Partner Confirmation | FastFare #${payload.orderId}`,
        templates.orderConfirmationTemplate({ ...payload, baseUrl: getBaseUrl() }),
        'order_confirmation_user', payload.orderId
    );
};

export const notifyUserOrderAccepted = (payload) => {
    sendEmailFireAndForget(
        payload.userEmail,
        `Great News! Your Order Has Been Accepted | FastFare #${payload.orderId}`,
        templates.orderAcceptedTemplate({ ...payload, baseUrl: getBaseUrl() }),
        'order_accepted_user', payload.orderId
    );
};

export const notifyUserOrderDeclined = (payload) => {
    sendEmailFireAndForget(
        payload.userEmail,
        `Order Update — Partner Unavailable | FastFare #${payload.orderId}`,
        templates.orderDeclinedTemplate({ ...payload, baseUrl: getBaseUrl() }),
        'order_declined_user', payload.orderId
    );
};

export const notifyUserStatusUpdate = (payload) => {
    const subjects = {
        in_transit: `Your Order is On the Way! | FastFare #${payload.orderId}`,
        out_for_delivery: `Out for Delivery Today! | FastFare #${payload.orderId}`,
        shipped: `Package Shipped | FastFare #${payload.orderId}`,
        delivered: `Order Delivered Successfully ✓ | FastFare #${payload.orderId}`,
        failed_delivery: `Delivery Attempt Failed | FastFare #${payload.orderId}`,
        returned: `Order Returned | FastFare #${payload.orderId}`
    };
    sendEmailFireAndForget(
        payload.userEmail,
        subjects[payload.status] || `Order Update | FastFare #${payload.orderId}`,
        templates.statusUpdateTemplate({ ...payload, baseUrl: getBaseUrl() }),
        `status_update_${payload.status}`, payload.orderId
    );
};

export default {
    sendOrderAssignmentToPartner,
    sendOrderConfirmationToUser,
    sendOrderAcceptedToUser,
    sendOrderDeclinedToUser,
    sendStatusUpdateToUser,
    sendStatusConfirmationToPartner,
    notifyPartnerOrderAssignment,
    notifyUserOrderConfirmation,
    notifyUserOrderAccepted,
    notifyUserOrderDeclined,
    notifyUserStatusUpdate
};
