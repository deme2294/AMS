const { sendEmail } = require('./emailService');

const sendBookingReceivedEmail = async (to, customerName, serviceName, barberName, bookingDate, timeSlot, referenceNumber) => {
    const trackingUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/queues/track/${referenceNumber}`;
    return await sendEmail({
        to,
        fromName: "AMS Barber Shop",
        subject: `Booking Received: ${serviceName} - Ref: ${referenceNumber}`,
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e5e7eb; border-radius: 16px; padding: 30px; color: #1e293b; background-color: #ffffff;">
                <div style="text-align: center; margin-bottom: 25px; border-bottom: 1px solid #f1f5f9; padding-bottom: 20px;">
                    <div style="display: inline-block; padding: 12px; background-color: #eff6ff; border-radius: 50%; color: #2563eb; font-size: 24px; margin-bottom: 10px;">✂️</div>
                    <h1 style="color: #0f172a; font-size: 24px; margin: 0; font-weight: 800; tracking-tight: -0.025em;">Booking Received</h1>
                    <p style="margin: 5px 0 0; font-size: 14px; color: #64748b;">We have received your appointment request</p>
                </div>
                
                <p style="font-size: 15px; line-height: 1.6;">Hello <strong>${customerName}</strong>,</p>
                <p style="font-size: 15px; line-height: 1.6; color: #475569;">Thank you for booking with us. Your appointment request is currently under review by our team. You will receive another notification as soon as it is accepted into the live queue.</p>
                
                <div style="margin: 25px 0; padding: 20px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
                    <h3 style="margin: 0 0 12px 0; color: #0f172a; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Appointment Summary</h3>
                    <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
                        <tr style="border-bottom: 1px solid #f1f5f9;">
                            <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Service:</td>
                            <td style="padding: 8px 0; font-weight: 700; color: #0f172a; text-align: right;">${serviceName}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #f1f5f9;">
                            <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Barber:</td>
                            <td style="padding: 8px 0; font-weight: 700; color: #0f172a; text-align: right;">${barberName || 'Any Barber'}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #f1f5f9;">
                            <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Date:</td>
                            <td style="padding: 8px 0; font-weight: 700; color: #0f172a; text-align: right;">${new Date(bookingDate).toLocaleDateString()}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Time Slot:</td>
                            <td style="padding: 8px 0; font-weight: 700; color: #0f172a; text-align: right;">${timeSlot}</td>
                        </tr>
                    </table>
                </div>

                <div style="margin: 25px 0; padding: 20px; background-color: #eff6ff; border-radius: 12px; border: 1px solid #bfdbfe; text-align: center;">
                    <p style="margin: 0; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #1d4ed8; font-weight: 700;">Reference Number</p>
                    <p style="margin: 10px 0; font-size: 28px; font-weight: 800; color: #1e3a8a; font-family: monospace; letter-spacing: 1px;">${referenceNumber}</p>
                    <p style="margin: 0; font-size: 13px; color: #1e40af;">Use this reference code to track your status live on our website.</p>
                </div>
                
                <div style="margin-top: 30px; text-align: center;">
                    <a href="${trackingUrl}" 
                       style="background-color: #2563eb; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 14px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">
                       Track Live Queue
                    </a>
                </div>

                <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 30px 0;" />
                <p style="font-size: 11px; color: #94a3b8; text-align: center; line-height: 1.5; margin: 0;">
                    This is an automated confirmation email. Please do not reply to this message.
                    <br>© ${new Date().getFullYear()} AMS Barber Shop. All rights reserved.
                </p>
            </div>
        `
    });
};

const sendBookingApprovedEmail = async (to, customerName, serviceName, barberName, bookingDate, timeSlot, referenceNumber, queuePosition, estimatedWaitTime) => {
    const trackingUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/queues/track/${referenceNumber}`;
    return await sendEmail({
        to,
        fromName: "AMS Barber Shop",
        subject: `Booking Approved! Ref: ${referenceNumber} - Queue Position: #${queuePosition}`,
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e5e7eb; border-radius: 16px; padding: 30px; color: #1e293b; background-color: #ffffff;">
                <div style="text-align: center; margin-bottom: 25px; border-bottom: 1px solid #f1f5f9; padding-bottom: 20px;">
                    <div style="display: inline-block; padding: 12px; background-color: #ecfdf5; border-radius: 50%; color: #10b981; font-size: 24px; margin-bottom: 10px;">✅</div>
                    <h1 style="color: #0f172a; font-size: 24px; margin: 0; font-weight: 800; tracking-tight: -0.025em;">Booking Approved!</h1>
                    <p style="margin: 5px 0 0; font-size: 14px; color: #64748b;">Your appointment has been accepted into the live queue</p>
                </div>
                
                <p style="font-size: 15px; line-height: 1.6;">Hello <strong>${customerName}</strong>,</p>
                <p style="font-size: 15px; line-height: 1.6; color: #475569;">Great news! Your booking has been approved by our team and added to our live queue system. Below is your current queue status and estimated wait time.</p>
                
                <div style="margin: 25px 0; display: flex; justify-content: space-between; gap: 15px;">
                    <div style="flex: 1; padding: 15px; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; text-align: center;">
                        <span style="font-size: 11px; text-transform: uppercase; color: #166534; font-weight: 700; display: block; margin-bottom: 5px;">Queue Position</span>
                        <span style="font-size: 32px; font-weight: 900; color: #14532d;">#${queuePosition}</span>
                    </div>
                    <div style="flex: 1; padding: 15px; background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; text-align: center;">
                        <span style="font-size: 11px; text-transform: uppercase; color: #1e40af; font-weight: 700; display: block; margin-bottom: 5px;">Est. Wait Time</span>
                        <span style="font-size: 32px; font-weight: 900; color: #1e3a8a;">${estimatedWaitTime} <span style="font-size: 14px; font-weight: 750;">mins</span></span>
                    </div>
                </div>

                <div style="margin: 25px 0; padding: 20px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
                    <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
                        <tr style="border-bottom: 1px solid #f1f5f9;">
                            <td style="padding: 8px 0; color: #64748b;">Service:</td>
                            <td style="padding: 8px 0; font-weight: 700; color: #0f172a; text-align: right;">${serviceName}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #f1f5f9;">
                            <td style="padding: 8px 0; color: #64748b;">Barber:</td>
                            <td style="padding: 8px 0; font-weight: 700; color: #0f172a; text-align: right;">${barberName || 'Any Barber'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #64748b;">Date & Time:</td>
                            <td style="padding: 8px 0; font-weight: 700; color: #0f172a; text-align: right;">${new Date(bookingDate).toLocaleDateString()} at ${timeSlot}</td>
                        </tr>
                    </table>
                </div>

                <div style="margin-top: 30px; text-align: center;">
                    <a href="${trackingUrl}" 
                       style="background-color: #10b981; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 14px; box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2);">
                       Track Live Queue Status
                    </a>
                </div>

                <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 30px 0;" />
                <p style="font-size: 11px; color: #94a3b8; text-align: center; line-height: 1.5; margin: 0;">
                    Please arrive 10 minutes prior to your estimated turn.
                    <br>© ${new Date().getFullYear()} AMS Barber Shop. All rights reserved.
                </p>
            </div>
        `
    });
};

const sendBookingRejectedEmail = async (to, customerName, serviceName, bookingDate, timeSlot, rejectionReason) => {
    return await sendEmail({
        to,
        fromName: "AMS Barber Shop",
        subject: `Booking Update: Appointment Declined`,
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e5e7eb; border-radius: 16px; padding: 30px; color: #1e293b; background-color: #ffffff;">
                <div style="text-align: center; margin-bottom: 25px; border-bottom: 1px solid #f1f5f9; padding-bottom: 20px;">
                    <div style="display: inline-block; padding: 12px; background-color: #fef2f2; border-radius: 50%; color: #ef4444; font-size: 24px; margin-bottom: 10px;">❌</div>
                    <h1 style="color: #0f172a; font-size: 24px; margin: 0; font-weight: 800; tracking-tight: -0.025em;">Booking Declined</h1>
                    <p style="margin: 5px 0 0; font-size: 14px; color: #64748b;">Your booking request could not be approved</p>
                </div>
                
                <p style="font-size: 15px; line-height: 1.6;">Hello <strong>${customerName}</strong>,</p>
                <p style="font-size: 15px; line-height: 1.6; color: #475569;">We regret to inform you that your request to book <strong>${serviceName}</strong> on ${new Date(bookingDate).toLocaleDateString()} at ${timeSlot} was declined due to the following reason:</p>
                
                <div style="margin: 20px 0; padding: 15px; background-color: #fef2f2; border-left: 4px solid #ef4444; border-radius: 4px; font-size: 14px; color: #991b1b; font-style: italic;">
                    " ${rejectionReason || 'Staff unavailable / schedule conflict' } "
                </div>

                <p style="font-size: 14px; color: #64748b; line-height: 1.6;">Please log in to your dashboard to select another time slot or explore different options. We apologize for any inconvenience caused.</p>

                <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 30px 0;" />
                <p style="font-size: 11px; color: #94a3b8; text-align: center; line-height: 1.5; margin: 0;">
                    © ${new Date().getFullYear()} AMS Barber Shop. All rights reserved.
                </p>
            </div>
        `
    });
};

const sendQueueStatusUpdateEmail = async (to, customerName, serviceName, referenceNumber, newStatus, queuePosition, estimatedWaitTime) => {
    const trackingUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/queues/track/${referenceNumber}`;
    
    let statusTitle = "Queue Update";
    let statusDesc = "There is an update on your live queue position.";
    let statusIcon = "🔔";
    let statusColorBg = "#f8fafc";
    let statusColorText = "#0f172a";

    if (newStatus === 'serving') {
        statusTitle = "Your Turn is Next!";
        statusDesc = "Your turn is up! Please proceed to the service station immediately.";
        statusIcon = "💈";
        statusColorBg = "#fffbeb";
        statusColorText = "#b45309";
    } else if (newStatus === 'completed') {
        statusTitle = "Service Completed!";
        statusDesc = "Thank you for choosing AMS Barber Shop. We hope you enjoyed your premium service!";
        statusIcon = "⭐";
        statusColorBg = "#f0fdf4";
        statusColorText = "#166534";
    }

    return await sendEmail({
        to,
        fromName: "AMS Barber Shop",
        subject: `AMS Queue Update: ${statusTitle} (Ref: ${referenceNumber})`,
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e5e7eb; border-radius: 16px; padding: 30px; color: #1e293b; background-color: #ffffff;">
                <div style="text-align: center; margin-bottom: 25px; border-bottom: 1px solid #f1f5f9; padding-bottom: 20px;">
                    <div style="display: inline-block; padding: 12px; background-color: ${statusColorBg}; border-radius: 50%; color: ${statusColorText}; font-size: 24px; margin-bottom: 10px;">${statusIcon}</div>
                    <h1 style="color: #0f172a; font-size: 24px; margin: 0; font-weight: 800;">${statusTitle}</h1>
                    <p style="margin: 5px 0 0; font-size: 14px; color: #64748b;">Reference Number: ${referenceNumber}</p>
                </div>
                
                <p style="font-size: 15px; line-height: 1.6;">Hello <strong>${customerName}</strong>,</p>
                <p style="font-size: 15px; line-height: 1.6; color: #475569;">${statusDesc}</p>
                
                ${newStatus === 'serving' ? `
                <div style="margin: 25px 0; padding: 20px; background-color: #fffbeb; border-radius: 12px; border: 1px solid #fef3c7; text-align: center;">
                    <p style="margin: 0; font-size: 16px; font-weight: 800; color: #92400e;">Please go to the barber station now.</p>
                    <p style="margin: 5px 0 0; font-size: 13px; color: #b45309;">Your stylist is ready to serve you.</p>
                </div>
                ` : ''}

                ${newStatus === 'completed' ? `
                <div style="margin: 25px 0; padding: 20px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; text-align: center;">
                    <p style="margin: 0; font-size: 14px; font-weight: 700; color: #0f172a;">How was your experience?</p>
                    <p style="margin: 5px 0 15px; font-size: 13px; color: #64748b;">We would appreciate it if you could rate your service.</p>
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/rate-services" 
                       style="background-color: #eab308; color: #0f172a; padding: 8px 16px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 12px;">
                        Rate Our Service
                    </a>
                </div>
                ` : ''}

                <div style="margin-top: 30px; text-align: center;">
                    <a href="${trackingUrl}" 
                       style="background-color: #2563eb; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 14px;">
                        View Details
                    </a>
                </div>

                <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 30px 0;" />
                <p style="font-size: 11px; color: #94a3b8; text-align: center; line-height: 1.5; margin: 0;">
                    © ${new Date().getFullYear()} AMS Barber Shop. All rights reserved.
                </p>
            </div>
        `
    });
};

// 10-minute appointment reminder email
const sendAppointmentReminderEmail = async (to, customerName, serviceName, barberName, appointmentDate, appointmentTime, referenceNumber, queuePosition) => {
    const trackingUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/queues/track/${referenceNumber}`;
    
    return await sendEmail({
        to,
        fromName: "AMS Barber Shop",
        subject: `Appointment Reminder: ${serviceName} in 10 minutes`,
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e5e7eb; border-radius: 16px; padding: 30px; color: #1e293b; background-color: #ffffff;">
                <div style="text-align: center; margin-bottom: 25px;">
                    <div style="display: inline-block; padding: 12px; background-color: #eff6ff; border-radius: 50%; color: #2563eb; font-size: 24px; margin-bottom: 10px;">⏰</div>
                    <h1 style="color: #0f172a; font-size: 24px; margin: 0; font-weight: 800;">Your Appointment is Near!</h1>
                </div>
                
                <p style="font-size: 15px; line-height: 1.6;">Hello <strong>${customerName}</strong>,</p>
                <p style="font-size: 15px; line-height: 1.6; color: #475569;">This is a friendly reminder that your appointment is in <strong>10 minutes</strong>.</p>
                
                <div style="margin: 25px 0; padding: 20px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
                    <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
                        <tr style="border-bottom: 1px solid #f1f5f9;">
                            <td style="padding: 8px 0; color: #64748b;">Service:</td>
                            <td style="padding: 8px 0; font-weight: 700; color: #0f172a; text-align: right;">${serviceName}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #f1f5f9;">
                            <td style="padding: 8px 0; color: #64748b;">Barber:</td>
                            <td style="padding: 8px 0; font-weight: 700; color: #0f172a; text-align: right;">${barberName || 'Any Barber'}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #f1f5f9;">
                            <td style="padding: 8px 0; color: #64748b;">Date & Time:</td>
                            <td style="padding: 8px 0; font-weight: 700; color: #0f172a; text-align: right;">${new Date(appointmentDate).toLocaleDateString()} at ${appointmentTime}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #64748b;">Queue Position:</td>
                            <td style="padding: 8px 0; font-weight: 700; color: #0f172a; text-align: right;">#${queuePosition}</td>
                        </tr>
                    </table>
                </div>

                <div style="margin-top: 30px; text-align: center;">
                    <a href="${trackingUrl}" 
                       style="background-color: #2563eb; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 14px;">
                        Track Queue
                    </a>
                </div>

                <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 30px 0;" />
                <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">
                    © ${new Date().getFullYear()} AMS Barber Shop. All rights reserved.
                </p>
            </div>
        `
    });
};

module.exports = {
    sendBookingReceivedEmail,
    sendBookingApprovedEmail,
    sendBookingRejectedEmail,
    sendQueueStatusUpdateEmail,
    sendAppointmentReminderEmail
};
