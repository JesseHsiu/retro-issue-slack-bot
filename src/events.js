const { WebClient } = require('@slack/web-api');
const Octokit = require('@octokit/rest')
const slack_token = process.env.slack_bot_oauth_token;
const web = new WebClient(slack_token);

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
            const opened_milestone = await clientWithAuth.issues.listMilestonesForRepo({
                owner: process.env.github_issue_repo_owner,
                repo: process.env.github_issue_repo_name,
                state: 'open'
            })

            if (opened_milestone.data.length != 0) {
                await web.chat.postMessage({
                    text: 'There is already an opened milestone, please close it first',
                    channel: channe_id,
                });
            } else {
                // create milestone
                await clientWithAuth.issues.createMilestone({
                    owner: process.env.github_issue_repo_owner,
                    repo: process.env.github_issue_repo_name,
                    title: new Date().toLocaleDateString()
                })

                // notify every member in channel
                const resp = await web.groups.info({ channel: channe_id })
                for (const member_id of resp.group['members']) {
                    const dm_resp = await web.im.open({
                        user: member_id
                    })
                    await web.chat.postMessage({
                        text: 'retro just started',
                        channel: dm_resp.channel['id'],
                        as_user: false,
                    });
                }
            }
        } else if (message_body['text'].includes('notify')) {
            
        } else if (message_body['text'].includes('stop')) {

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