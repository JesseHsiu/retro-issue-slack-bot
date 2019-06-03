const Octokit = require('@octokit/rest')
const githubClientWithAuth = new Octokit({
    auth: process.env.github_auth_token
})

export const getLatestMilestone = async function get() {
    const opened_milestone = await githubClientWithAuth.issues.listMilestonesForRepo({
        owner: process.env.github_issue_repo_owner,
        repo: process.env.github_issue_repo_name,
        state: 'open'
    })
    if (opened_milestone.data.length > 1 || opened_milestone.data.length == 0) {
        return null
    }
    return opened_milestone.data[0]
}

export const createMilestone = async function get(title) {
    await githubClientWithAuth.issues.createMilestone({
        owner: process.env.github_issue_repo_owner,
        repo: process.env.github_issue_repo_name,
        title: title
    })
}

export const stopMilestone = async function get(milestoneNumber) {
    await githubClientWithAuth.issues.updateMilestone({
        owner: process.env.github_issue_repo_owner,
        repo: process.env.github_issue_repo_name,
        milestone_number: milestoneNumber,
        state: 'closed'
    })
}

export const getMembersRetroedInMilestone = async function get(milestoneId) {
    const resp = await githubClientWithAuth.issues.listForRepo({
        owner: process.env.github_issue_repo_owner,
        repo: process.env.github_issue_repo_name,
        milestone: milestoneId,
        per_page: 100, // assume we don't have larger number than 100 issues at a time.
    })
    const issues = resp.data;

    const retroed_member_set = new Set()

    for (const issue of issues) {
        const regex = /(?<=\>\>\> Created by\:\ \<).*(?=\>)/gi;
        
        const creators = issue.body.match(regex)
        for (const creator of creators) {
            retroed_member_set.add(creator)
        }
    }
    return Array.from(retroed_member_set)
}

export const createIssueInMilestoneAndMemberId = async function get(content, milestoneId, memberId, label) {

    let title = content.replace(/(?:\r\n|\r|\n)/g, '').replace(':+1:', '').replace(':-1:', '');
    if (title.length > 30) {
        title = title.slice(0, 30)
    }

    const body = content + 
`
\`\`\`
>>> Created by: <${memberId}> (PLEASE DO NOT EDIT THIS SECTION)
\`\`\``

    const new_issue = await githubClientWithAuth.issues.create({
        owner: process.env.github_issue_repo_owner,
        repo: process.env.github_issue_repo_name,
        milestone: milestoneId,
        title: title,
        body: body,
        labels: [label]
    })
    
    return new_issue
}

export default {
    getLatestMilestone,
    createMilestone,
    stopMilestone,
    getMembersRetroedInMilestone,
    createIssueInMilestoneAndMemberId,
}