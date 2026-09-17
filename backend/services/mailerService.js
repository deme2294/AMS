const { sendEmail } = require('./emailService');

const sendApplicationStatusUpdate = async (to, fullName, jobTitle, status, trackingCode, appointmentInfo = null) => {
    const statusColors = {
        pending: '#6B7280',
        reviewing: '#3B82F6',
        shortlisted: '#10B981',
        written_exam: '#F59E0B',
        interview_shortlisted: '#8B5CF6',
        interviewing: '#6366F1',
        offered: '#059669',
        rejected: '#EF4444'
    };

    const statusLabels = {
        written_exam: 'Shortlisted for Written Exam',
        interview_shortlisted: 'Shortlisted for Interview',
    };

    let appointmentHtml = '';
    if (appointmentInfo && (status === 'written_exam' || status === 'interview_shortlisted' || status === 'interviewing')) {
        appointmentHtml = `
            <div style="margin: 24px 0; padding: 20px; background-color: #F0F9FF; border: 1px solid #BAE6FD; border-radius: 12px;">
                <h3 style="margin: 0 0 12px 0; color: #0369A1; font-size: 16px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;">Appointment Details</h3>
                <table style="width: 100%; font-size: 14px; color: #0C4A6E;">
                    <tr>
                        <td style="padding: 4px 0; font-weight: bold; width: 80px;">Date:</td>
                        <td style="padding: 4px 0;">${appointmentInfo.date || 'TBD'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 4px 0; font-weight: bold;">Time:</td>
                        <td style="padding: 4px 0;">${appointmentInfo.time || 'TBD'}</td>
                    </tr>
                    <tr>
                        <td style="padding: 4px 0; font-weight: bold;">Location:</td>
                        <td style="padding: 4px 0;">${appointmentInfo.location || 'IT Park Office'}</td>
                    </tr>
                </table>

                ${(appointmentInfo.lat && appointmentInfo.lng) || appointmentInfo.mapLink ? `
                <div style="margin-top: 16px;">
                    <a href="${(appointmentInfo.lat && appointmentInfo.lng) ? `https://www.google.com/maps/search/?api=1&query=${appointmentInfo.lat},${appointmentInfo.lng}` : appointmentInfo.mapLink}" 
                       style="display: inline-block; padding: 10px 16px; background-color: #0369A1; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 13px;">
                        View Location on Google Maps
                    </a>
                </div>
                ` : ''}

                ${appointmentInfo.details ? `
                <div style="margin-top: 12px; padding-top: 12px; border-top: 1px dashed #BAE6FD; font-size: 13px; font-style: italic;">
                    <strong>Instructions:</strong> ${appointmentInfo.details}
                </div>
                ` : ''}
            </div>
        `;
    }

    const result = await sendEmail({
        to: to,
        fromName: "ITPC Recruitment",
        subject: `Update on your application for ${jobTitle} - ${trackingCode}`,
        html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px;">
        <h2 style="color: #111827;">Hello ${fullName},</h2>
        <p style="color: #4B5563; line-height: 1.6;">
          Your application for the position of <strong>${jobTitle}</strong> at ITPC has been updated.
        </p>
        <div style="margin: 24px 0; padding: 16px; background-color: #F9FAFB; border-radius: 8px; text-align: center;">
          <p style="margin: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #6B7280; font-weight: bold;">Current Status</p>
          <p style="margin: 8px 0 0; font-size: 24px; font-weight: 800; color: ${statusColors[status] || '#111827'}; text-transform: capitalize;">${statusLabels[status] || status.replace('_', ' ')}</p>
        </div>

        ${appointmentHtml}

        <p style="color: #4B5563; line-height: 1.6;">
          You can continue to track your application status on our career portal using your tracking code: <strong>${trackingCode}</strong>
        </p>
        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="font-size: 12px; color: #9CA3AF; text-align: center;">
          This is an automated message, please do not reply.
        </p>
      </div>
    `,
    });

    return result.success;
};

const sendApplicationConfirmationEmail = async (to, fullName, jobTitle, trackingCode) => {
    const result = await sendEmail({
        to: to,
        fromName: "ITPC Recruitment",
        subject: `Application Received: ${jobTitle} - ${trackingCode}`,
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e5e7eb; border-radius: 12px; padding: 30px; color: #333;">
                <div style="text-align: center; margin-bottom: 25px;">
                    <h1 style="color: #1a365d; font-size: 24px; margin: 0;">Application Confirmed</h1>
                </div>
                
                <p>Hello <strong>${fullName}</strong>,</p>
                <p>We've successfully received your application for the position of <strong>${jobTitle}</strong> at Ethiopian ICT Park (ITPC).</p>
                
                <div style="margin: 30px 0; padding: 25px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; text-align: center;">
                    <p style="margin: 0; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #64748b; font-weight: bold;">Your ID/Tracking Code</p>
                    <p style="margin: 15px 0; font-size: 32px; font-weight: 800; color: #1e293b; font-family: 'Courier New', monospace; letter-spacing: 2px;">${trackingCode}</p>
                    <p style="margin: 0; font-size: 13px; color: #64748b;">Save this code to monitor your status on our portal.</p>
                </div>

                <p style="line-height: 1.7; color: #475569; font-size: 14px;">
                    Our talent acquisition team will carefully review your credentials. If your profile aligns with our current needs, we will reach out to schedule the next phase of the recruitment protocol.
                </p>
                
                <div style="margin-top: 35px; text-align: center;">
                    <a href="https://ethiopianitpark.et/career" 
                       style="background-color: #1a365d; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 14px; shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
                       View Your Status
                    </a>
                </div>

                <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 35px 0;" />
                <p style="font-size: 11px; color: #94a3b8; text-align: center; line-height: 1.5;">
                    This is an automated system confirmation. Replies to this email are not monitored.
                    <br>© ${new Date().getFullYear()} Ethiopian ICT Park (ITPC). All rights reserved.
                </p>
            </div>
        `,
    });

    return result.success;
};

module.exports = {
    sendApplicationStatusUpdate,
    sendApplicationConfirmationEmail
};










// const nodemailer = require('nodemailer');
// require('dotenv').config();

// const transporter = nodemailer.createTransport({
//     host: process.env.EMAIL_HOST || 'smtp.gmail.com',
//     port: process.env.EMAIL_PORT || 587,
//     secure: false, // true for 465, false for other ports
//     auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS,
//     },
//     tls: {
//         rejectUnauthorized: false
//     }
// });

// console.log('Career Mailer Config Check:', {
//     host: process.env.EMAIL_HOST || 'smtp.gmail.com',
//     userPresent: !!process.env.EMAIL_USER,
//     passPresent: !!process.env.EMAIL_PASS
// });

// const sendApplicationStatusUpdate = async (to, fullName, jobTitle, status, trackingCode, appointmentInfo = null) => {
//     const statusColors = {
//         pending: '#6B7280',
//         reviewing: '#3B82F6',
//         shortlisted: '#10B981',
//         written_exam: '#F59E0B',
//         interview_shortlisted: '#8B5CF6',
//         interviewing: '#6366F1',
//         offered: '#059669',
//         rejected: '#EF4444'
//     };

//     const statusLabels = {
//         written_exam: 'Shortlisted for Written Exam',
//         interview_shortlisted: 'Shortlisted for Interview',
//     };

//     let appointmentHtml = '';
//     if (appointmentInfo && (status === 'written_exam' || status === 'interview_shortlisted' || status === 'interviewing')) {
//         appointmentHtml = `
//             <div style="margin: 24px 0; padding: 20px; background-color: #F0F9FF; border: 1px solid #BAE6FD; border-radius: 12px;">
//                 <h3 style="margin: 0 0 12px 0; color: #0369A1; font-size: 16px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;">Appointment Details</h3>
//                 <table style="width: 100%; font-size: 14px; color: #0C4A6E;">
//                     <tr>
//                         <td style="padding: 4px 0; font-weight: bold; width: 80px;">Date:</td>
//                         <td style="padding: 4px 0;">${appointmentInfo.date || 'TBD'}</td>
//                     </tr>
//                     <tr>
//                         <td style="padding: 4px 0; font-weight: bold;">Time:</td>
//                         <td style="padding: 4px 0;">${appointmentInfo.time || 'TBD'}</td>
//                     </tr>
//                     <tr>
//                         <td style="padding: 4px 0; font-weight: bold;">Location:</td>
//                         <td style="padding: 4px 0;">${appointmentInfo.location || 'IT Park Office'}</td>
//                     </tr>
//                 </table>

//                 ${(appointmentInfo.lat && appointmentInfo.lng) || appointmentInfo.mapLink ? `
//                 <div style="margin-top: 16px;">
//                     <a href="${(appointmentInfo.lat && appointmentInfo.lng) ? `https://www.google.com/maps/search/?api=1&query=${appointmentInfo.lat},${appointmentInfo.lng}` : appointmentInfo.mapLink}"
//                        style="display: inline-block; padding: 10px 16px; background-color: #0369A1; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 13px;">
//                         View Location on Google Maps
//                     </a>
//                 </div>
//                 ` : ''}

//                 ${appointmentInfo.details ? `
//                 <div style="margin-top: 12px; padding-top: 12px; border-top: 1px dashed #BAE6FD; font-size: 13px; font-style: italic;">
//                     <strong>Instructions:</strong> ${appointmentInfo.details}
//                 </div>
//                 ` : ''}
//             </div>
//         `;
//     }

//     const mailOptions = {
//         from: `"ITPC Recruitment" <${process.env.EMAIL_USER}>`,
//         to: to,
//         subject: `Update on your application for ${jobTitle} - ${trackingCode}`,
//         html: `
//       <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px;">
//         <h2 style="color: #111827;">Hello ${fullName},</h2>
//         <p style="color: #4B5563; line-height: 1.6;">
//           Your application for the position of <strong>${jobTitle}</strong> at ITPC has been updated.
//         </p>
//         <div style="margin: 24px 0; padding: 16px; background-color: #F9FAFB; border-radius: 8px; text-align: center;">
//           <p style="margin: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #6B7280; font-weight: bold;">Current Status</p>
//           <p style="margin: 8px 0 0; font-size: 24px; font-weight: 800; color: ${statusColors[status] || '#111827'}; text-transform: capitalize;">${statusLabels[status] || status.replace('_', ' ')}</p>
//         </div>

//         ${appointmentHtml}

//         <p style="color: #4B5563; line-height: 1.6;">
//           You can continue to track your application status on our career portal using your tracking code: <strong>${trackingCode}</strong>
//         </p>
//         <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
//         <p style="font-size: 12px; color: #9CA3AF; text-align: center;">
//           This is an automated message, please do not reply.
//         </p>
//       </div>
//     `,
//     };

//     try {
//         await transporter.sendMail(mailOptions);
//         console.log(`Email sent to ${to} for status ${status}`);
//         return true;
//     } catch (error) {
//         console.error('Error sending email:', error);
//         return false;
//     }
// };

// module.exports = {
//     sendApplicationStatusUpdate,
// };
