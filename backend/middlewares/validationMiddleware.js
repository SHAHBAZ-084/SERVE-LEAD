const Joi = require('joi');

const validateRequest = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body, { abortEarly: false, allowUnknown: true });
        if (error) {
            const errorMessage = error.details.map(detail => detail.message).join(', ');
            return res.status(400).json({ error: errorMessage });
        }
        next();
    };
};

const schemas = {
    register: Joi.object({
        name: Joi.string().min(3).max(50).required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
        joining_year: Joi.number().integer().min(2000).max(new Date().getFullYear() + 1),
        father_name: Joi.string().max(50).optional().allow(''),
        whatsapp: Joi.string().pattern(/^[0-9+ ]+$/).max(20).optional().allow(''),
        education_level: Joi.string().optional().allow(''),
        applicant_type: Joi.string().valid('university', 'college', 'school', 'not_student').default('university'),
        program: Joi.string().optional().allow(''),
        passing_year: Joi.alternatives().try(Joi.number().integer(), Joi.string()).optional().allow('', null),
        university: Joi.string().optional().allow(''),
        institution_name: Joi.string().max(120).optional().allow(''),
        occupation: Joi.string().max(120).optional().allow(''),
        address: Joi.string().max(300).required(),
        province: Joi.string().max(80).required(),
        district: Joi.string().max(80).required(),
        tehsil: Joi.string().max(80).required(),
        requestedRole: Joi.string().valid('General', 'Executive').default('General'),
        sls_official_id: Joi.string().max(50).optional().allow(''),
        cnic_number: Joi.string()
            .pattern(/^\d{5}-\d{7}-\d$/)
            .required()
            .messages({
                'string.pattern.base': 'CNIC/B-Form must be 13 digits in format #####-#######-#',
                'any.required': 'CNIC/B-Form number is required',
            }),
        referredBy: Joi.string().max(30).optional().allow(''),
    }),
    login: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required()
    }),
    contact: Joi.object({
        name: Joi.string().min(2).max(50).required(),
        email: Joi.string().email().required(),
        message: Joi.string().min(5).max(1000).required()
    }),
    profileUpdate: Joi.object({
        name: Joi.string().min(3).max(50).optional(),
        oldPassword: Joi.string().optional(),
        newPassword: Joi.string().min(6).optional()
    })
};

module.exports = { validateRequest, schemas };
