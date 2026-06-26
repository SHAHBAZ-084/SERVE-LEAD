function isInterviewFailed(member) {
    return member.interviewResult?.status === 'failed';
}

function isInterviewCleared(member) {
    return member.interviewResult?.status === 'passed';
}

/** Mark interview as passed when admin skips the interview step (optional interview flow). */
function ensureInterviewCleared(member, adminName, note) {
    if (isInterviewFailed(member)) return false;
    if (!isInterviewCleared(member)) {
        member.interviewResult = {
            status: 'passed',
            note: note || 'Interview waived by administration',
            updatedAt: new Date(),
            updatedBy: adminName || 'Admin',
        };
    }
    return true;
}

module.exports = { isInterviewFailed, isInterviewCleared, ensureInterviewCleared };
