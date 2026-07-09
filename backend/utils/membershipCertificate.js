const Certificate = require('../models/Certificate');
const Member = require('../models/Member');

const MEMBERSHIP_TEMPLATE_ID = 2;
const CHAIRMAN_NAME = 'M Farooq Ahmad';

async function resolveIssuerId(preferredId) {
  if (preferredId) return preferredId;
  const admin = await Member.findOne({
    role: { $in: ['Admin', 'Superuser'] },
    status: 'approved',
  }).select('_id');
  return admin?._id || null;
}

/**
 * Auto-issue membership certificate when a member is approved.
 * Skips if templateId 2 already exists for this member.
 */
async function issueMembershipCertificate(member, issuedBy = null) {
  if (!member?._id || !member.member_id) return null;

  const existing = await Certificate.findOne({
    memberId: member._id,
    templateId: MEMBERSHIP_TEMPLATE_ID,
  });
  if (existing) return existing;

  const issuerId = await resolveIssuerId(issuedBy);
  if (!issuerId) {
    console.warn('Membership certificate: no issuer admin found — skipping auto-issue.');
    return null;
  }

  const cert = await Certificate.create({
    memberId: member._id,
    memberName: member.name,
    member_id_str: member.member_id,
    category: 'Other',
    customCategory: 'Membership',
    title: 'CERTIFICATE OF MEMBERSHIP',
    awardType: 'Official Membership',
    chairmanName: CHAIRMAN_NAME,
    issuedBy: issuerId,
    templateId: MEMBERSHIP_TEMPLATE_ID,
    description:
      'This certifies that the above-named individual is an official member of Serve & Lead Society in good standing.',
  });

  return cert;
}

module.exports = {
  issueMembershipCertificate,
  MEMBERSHIP_TEMPLATE_ID,
  CHAIRMAN_NAME,
};
