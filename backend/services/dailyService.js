const axios = require('axios');

const DAILY_API_KEY = process.env.DAILY_API_KEY;
const DAILY_API_BASE = 'https://api.daily.co/v1';

/**
 * Create a new Daily room for broadcasting
 * @param {string} eventId - The event ID to associate with the room
 * @returns {Promise<{url: string, roomName: string}>}
 */
async function createBroadcastRoom(eventId) {
    try {
        const roomName = `itpc-event-${eventId}-${Date.now()}`;

        if (!DAILY_API_KEY) {
            console.error('CRITICAL: DAILY_API_KEY NOT FOUND IN ENVIRONMENT!');
            console.warn('Submitting a dummy room URL. This WILL fail on join!');
            console.warn('Please add DAILY_API_KEY to your backend/.env file.');
            // This is a fallback that might not work unless the user has manually created this room/domain
            return {
                url: `https://itpchub.daily.co/${roomName}`,
                roomName: roomName
            };
        }

        console.log('Creating Daily room via API...');

        // Production mode: Create room via API
        const response = await axios.post(
            `${DAILY_API_BASE}/rooms`,
            {
                name: roomName,
                privacy: 'public',
                properties: {
                    enable_screenshare: true,
                    enable_chat: true,
                    enable_knocking: false,
                    start_video_off: false,
                    start_audio_off: false,
                    max_participants: 200, // Increased for summit
                    exp: Math.floor(Date.now() / 1000) + (3600 * 4) // Room expires in 4 hours
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${DAILY_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('Daily room created successfully:', response.data.url);
        return {
            url: response.data.url,
            roomName: response.data.name
        };
    } catch (error) {
        const errorData = error.response?.data;
        console.error('Failed to create Daily room:', errorData || error.message);

        // If room already exists or other non-fatal error, try to handle or rethrow
        throw new Error(`Daily API Error: ${errorData?.info || error.message}`);
    }
}

/**
 * Delete a Daily room
 * @param {string} roomName 
 */
async function deleteRoom(roomName) {
    if (!DAILY_API_KEY) return;

    try {
        await axios.delete(
            `${DAILY_API_BASE}/rooms/${roomName}`,
            {
                headers: {
                    'Authorization': `Bearer ${DAILY_API_KEY}`
                }
            }
        );
        console.log(`Deleted Daily room: ${roomName}`);
    } catch (error) {
        console.error('Failed to delete Daily room:', error.message);
    }
}

module.exports = {
    createBroadcastRoom,
    deleteRoom
};
