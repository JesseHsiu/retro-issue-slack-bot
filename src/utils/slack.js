const { WebClient } = require('@slack/web-api');
const slack_token = process.env.slack_bot_oauth_token;
const web = new WebClient(slack_token);

export const getAllMembersIdFromSlack = async function get(channelId) {
    const botId = await getSlackBotId(channelId);
    const resp = await web.groups.info({ channel: channelId })
    return resp.group['members'].filter(function (value) {
        return value != botId;
    });
}

export const getSlackBotId = async function get(channelId) {
    const resp = await web.auth.test()
    return resp.user_id
}

export const notifySlackMembers = async function get(memberIds, message) {
    for (const member_id of memberIds) {
        const dm_resp = await web.im.open({ user: member_id })
        await web.chat.postMessage({
            channel: dm_resp.channel['id'],
            ...message
        });
    }
}