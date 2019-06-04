# 🤖 retro-issue-slack-bot
A slack bot for retro &amp; creating github issue in milestone.

SM(Scrum master) can start/stop/notify members to submit their retro in channel.
Members within the channel can submit their retro in slack bot DM.
All retro issues are created & saved in Github repo with an milestone name.

![螢幕快照 2019-06-04 下午10 28 49](https://user-images.githubusercontent.com/7819967/58888028-48fd4200-8719-11e9-8d72-a222512ff9ea.png)

## Why creating this?
We love sprint retrospective for improving entire scrum team. :+1:

In old ways, I will firstly create a google sheet for members to submitting retros.
SM needs to look at responses in google sheet & notify memeber's that has not submitted.
Also, it's hard for tracking all the retro issues in different sheet.

So... `retro-issue-slack-bot` is here.

## How to use
- Create a slack channel and invite members in
- Invite this slack-bot into channel

### For Scrum master
- Start your retro: `@slack-bot-name start`, this will also send DM to all members with-in the channel
- Stop your retro: `@slack-bot-name stop`
- Notify members that has not submitted retro yet: `@slack-bot-name notify`

### For members
- Submit retro in slack-bot-name DM(Direct message) with :+1: for good, :-1: for bad
```
(good things) -> We should keep ... 👍
(bad  things) -> We should stop ... 👎
```
- Then bot will response with ticket link
```
Retro recorded, issue link: https://github.com/<repo-owner>/<repo-name>/issues/<issue-number>
```

## How to install
1. Open an AWS account
2. Install serverless (https://serverless.com/) and setup AWS related config
3. Create a SNS topic in AWS console
4. `sls deploy`
5. Setup in Slack!

## Missing something?
- Creating Github label when first installation

## Inspiration
- https://github.com/remy/retrobot
