const Certificate = require('../models/Certificate');
const Member = require('../models/Member');
const CertTemplate = require('../models/CertTemplate');

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

async function getActiveMembershipTemplate() {
  return CertTemplate.findOne({ kind: 'membership', isActive: true, isDeleted: { $ne: true } });
}

/**
 * Auto-issue membership certificate when a member is approved / membership template posted.
 * Skips if membership cert already exists for this member.
 */
async function issueMembershipCertificate(member, issuedBy = null) {
  if (!member?._id || !member.member_id) return null;

  const existing = await Certificate.findOne({
    memberId: member._id,
    $or: [
      { templateId: MEMBERSHIP_TEMPLATE_ID },
      { customCategory: 'Membership' },
    ],
  });
  if (existing) {
    // Upgrade older record with current membership template id if missing
    const activeTpl = await getActiveMembershipTemplate();
    if (activeTpl && !existing.certTemplateId) {
      existing.certTemplateId = activeTpl._id;
      await existing.save();
    }
    return existing;
  }

  const issuerId = await resolveIssuerId(issuedBy);
  if (!issuerId) {
    console.warn('Membership certificate: no issuer admin found — skipping auto-issue.');
    return null;
  }

  const activeTpl = await getActiveMembershipTemplate();

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
    certTemplateId: activeTpl?._id || null,
    description:
      'This certifies that the above-named individual is an official member of Serve & Lead Society in good standing.',
  });

  return cert;
}

async function ensureMembershipCertificate(member, issuedBy = null) {
  if (!member?._id || member.status !== 'approved' || !member.member_id) return null;
  return issueMembershipCertificate(member, issuedBy);
}

module.exports = {
  issueMembershipCertificate,
  ensureMembershipCertificate,
  getActiveMembershipTemplate,
  MEMBERSHIP_TEMPLATE_ID,
  CHAIRMAN_NAME,
};
