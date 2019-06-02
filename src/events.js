const { WebClient } = require('@slack/web-api');
const Octokit = require('@octokit/rest')
const slack_token = process.env.slack_bot_oauth_token;
const web = new WebClient(slack_token);

import {
    getAllMembersIdFromSlack,
    notifySlackMembers,
} from "./utils/slack";

import {
    getLatestMilestone,
    createMilestone,
    stopMilestone,
    createIssueInMilestoneAndMemberId,
    getMembersRetroedInMilestone
} from './utils/github';

const clientWithAuth = new Octokit({
    auth: process.env.github_auth_token
})

export const handler = async (event, context, callback) => {
    // TODO: check token
    const event_body = JSON.parse(event.body)
    if (event_body['type'] == 'url_verification') {
        const response = {
            statusCode: 200,
            body: JSON.stringify({
                challenge: event_body['challenge']
            }),
        };
        callback(null, response);
        return
    }

    const message_body = event_body['event']
    if (message_body['type'] == 'app_mention') {
        const channe_id = message_body['channel']
        if (message_body['text'].includes('start')) {
            const opened_milestone = await getLatestMilestone()
            if (opened_milestone) {
                await web.chat.postMessage({
                    text: 'There is already an opened milestone, please close it first',
                    channel: channe_id,
                });
            } else {
                // create milestone
                await createMilestone(new Date().toLocaleDateString())

                // notify every member in channel
                const memberIds = await getAllMembersIdFromSlack(channe_id)
                for (const member_id of memberIds) {
                    const dm_resp = await web.im.open({ user: member_id })
                    await web.chat.postMessage({
                        text: 'A new retro just started',
                        channel: dm_resp.channel['id'],
                    });
                }
            }
        } else if (message_body['text'].includes('notify')) {
            const opened_milestone = await getLatestMilestone()
            const retroed_members = await getMembersRetroedInMilestone(opened_milestone.number)
            const all_slack_members = await getAllMembersIdFromSlack(channe_id)
            const members_not_retroed = all_slack_members.filter((value) => {
                return !retroed_members.includes(value)
            })
            await notifySlackMembers(members_not_retroed, {
                text: 'Please submit your retro.',
            })
        } else if (message_body['text'].includes('stop')) {
            const opened_milestone = await getLatestMilestone()
            await stopMilestone(opened_milestone.number)
            await web.chat.postMessage({
                text: 'Retro has concluded, please go to gihub.',
                channel: channe_id,
            });
        } else {
            await web.chat.postMessage({
                text: 'Command not supported. Please try the followings',
                attachments: [
                    { text: "start: start a retro" },
                    { text: "notify: notify members that not record a retro yet" },
                    { text: "stop: stop a retro" },
                ],
                channel: channe_id,
            });
        }
        const response = {
            statusCode: 200,
            body: JSON.stringify({}),
        };
        callback(null, response);
        return;
    }

    if (message_body['type'] == 'message') {
        console.log(message_body)
        const response = {
            statusCode: 200,
            body: JSON.stringify({}),
        };
        callback(null, response);
        return;
    }

    const response = {
        statusCode: 404,
        body: JSON.stringify({
            error: "NOT SUPPORTED TYPE"
        }),
    };
    callback(null, response);    
};