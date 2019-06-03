import { WebClient } from '@slack/web-api';
const web = new WebClient(process.env.slack_bot_oauth_token);

export const getAllMembersIdFromSlack = async function getAllMembersIdFromSlack(channelId) {
    const botId = await getSlackBotId(channelId);
    const resp = await web.groups.info({ channel: channelId })
    return resp.group['members'].filter(function (value) {
        return value != botId;
    });
}

export const getSlackBotId = async function getSlackBotId() {
    const resp = await web.auth.test()
    return resp.user_id
}

export const getSlackUserInfo = async function getSlackUserInfo(userId) {
    const resp = await web.users.info({
        user: userId
    })
    return resp.user
}

export const notifySlackMembers = async function notifySlackMembers(memberIds, message) {
    for (const member_id of memberIds) {
        const dm_resp = await web.im.open({ user: member_id })
        await web.chat.postMessage({
            channel: dm_resp.channel['id'],
            ...message
        });
    }
}

export const sendMessage = async function sendMessage(channelId, message) {
    await web.chat.postMessage({
        channel: channelId,
        ...message,
    });
}

export default {
    getAllMembersIdFromSlack,
    getSlackBotId,
    getSlackUserInfo,
    notifySlackMembers,
    sendMessage,
}