import { SNS } from "aws-sdk";
import githubUtil from './utils/github';
import slackUtil from './utils/slack';

export const slackEventHandler = async (event, context, callback) => {
    try {
        slackUtil.verifyWithEvent(event)
    } catch (error) {
        callback(null, {
            statusCode: 404,
            body: JSON.stringify({}),
        });
        return;
    }

    // response to slack verification
    const event_body = JSON.parse(event.body)
    if (event_body['type'] == 'url_verification') {
        callback(null, {
            statusCode: 200,
            body: JSON.stringify({
                challenge: event_body['challenge']
            }),
        });
        return;
    }

    // send to sns for further processing
    const sns = new SNS({});
    await sns.publish({
        Message: event.body,
        TopicArn: `arn:aws:sns:${process.env.AWS_REGION}:${process.env.aws_account_id}:${process.env.stageName}-retro-issue-slack-notify`
    }).promise();

    callback(null, {
        statusCode: 200,
        body: JSON.stringify({}),
    });
};

export const slackReactor = async (event, context, callback) => {
    // get message & record retro
    const message_body = JSON.parse(event.Records[0].Sns.Message)['event'];
    if (message_body['type'] == 'message' & message_body['subtype'] != 'bot_message') {
        const channelId = message_body['channel']

        let tag = null;
        if (message_body['text'].includes(':+1:')) {
            tag = 'good';
        } else if (message_body['text'].includes(':-1:')) {
            tag = 'bad'
        }

        if (tag == null) {
            await slackUtil.sendMessage(channelId, {
                text: `Not accepted! Please submit your retro with :+1: or :-1:!`,
            });
        } else {
            const opened_milestone = await githubUtil.getLatestMilestone();
            if (!opened_milestone) {
                await slackUtil.sendMessage(channelId, {
                    text: `There is no opened retro. Please contact SM.`,
                });
            } else {
                const resp = await githubUtil.createIssueInMilestoneAndMemberId(
                    message_body['text'],
                    opened_milestone.number,
                    message_body['user'],
                    tag)
                await slackUtil.sendMessage(channelId, {
                    text: `Retro recorded, issue link: ${resp.data.html_url}`,
                })
            }
        }

        callback(null, {
            statusCode: 200,
            body: JSON.stringify({}),
        });
        return;
    }

    // SM only for the followings
    const slack_user = await slackUtil.getSlackUserInfo(message_body['user'])
    if (slack_user['name'] != process.env.slack_sm_user_name) {
        callback(null, {
            statusCode: 200,
            body: JSON.stringify({}),
        });
        return;
    }

    // start, notify, stop retro commands
    if (message_body['type'] == 'app_mention') {
        const channelId = message_body['channel']
        if (message_body['text'].includes('start')) {
            const opened_milestone = await githubUtil.getLatestMilestone()
            if (opened_milestone) {
                await slackUtil.sendMessage(channelId, {
                    text: 'There is already an opened milestone, please close it first',
                });
            } else {
                // create milestone
                await githubUtil.createMilestone(new Date().toLocaleString())

                // notify every member in channel
                const memberIds = await slackUtil.getAllMembersIdFromSlack(channelId)
                await slackUtil.notifySlackMembers(memberIds, {
                    text: 'A new retro just started, please start submiting your retro. Please submit with with :+1: or :-1:, thanks a lot!',
                })

                await slackUtil.sendMessage(channelId, {
                    text: `A new retro just started, please start submiting your retro.`,
                });
            }
        } else if (message_body['text'].includes('notify')) {
            const opened_milestone = await githubUtil.getLatestMilestone()
            if (!opened_milestone) {
                await slackUtil.sendMessage(channelId, {
                    text: 'There is no a retro event here. Please start first.',
                });
            } else {
                const retroed_members = await githubUtil.getMembersRetroedInMilestone(opened_milestone.number)
                const all_slack_members = await slackUtil.getAllMembersIdFromSlack(channelId)
                const members_not_retroed = all_slack_members.filter((value) => {
                    return !retroed_members.includes(value)
                })

                if (members_not_retroed.length > 0) {
                    await slackUtil.notifySlackMembers(members_not_retroed, {
                        text: 'Please submit your retro.',
                    })

                    const mention_member_str = members_not_retroed.reduce((acc, cur) => acc + `<@${cur}> `, '');
                    await slackUtil.sendMessage(channelId, {
                        text: `${mention_member_str}: please submit your retro!`,
                    });
                } else {
                    await slackUtil.sendMessage(channelId, {
                        text: `All record received! No need to notify.`,
                    });
                }
            }
        } else if (message_body['text'].includes('stop')) {
            const opened_milestone = await githubUtil.getLatestMilestone()
            if (!opened_milestone) {
                await slackUtil.sendMessage(channelId, {
                    text: `There is no opened retro, please start first.`,
                });
            } else {
                await githubUtil.stopMilestone(opened_milestone.number)
                await slackUtil.sendMessage(channelId, {
                    text: 'Retro has concluded, please go to Github see the result.',
                });
            }
        } else {
            await slackUtil.sendMessage(channelId, {
                text: 'I cannot recognize your command. Please try the followings',
                attachments: [
                    { text: "start: start a retro" },
                    { text: "notify: notify members that not record a retro yet" },
                    { text: "stop: stop a retro" },
                ],
            });
        }
        callback(null, {
            statusCode: 200,
            body: JSON.stringify({}),
        });
        return;
    }

    callback(null, {
        statusCode: 200,
        body: JSON.stringify({}),
    });
    return;
}