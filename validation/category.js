const Joi = require("joi");

const validationRules = {
  name: {
    pattern: /^[a-zA-Z0-9\s'-]+$/,
    messages: {
      "string.base": "Name must be a string",
      "string.empty": "Name is required",
      "string.min": "Name must be at least 2 characters",
      "string.max": "Name must be at most 100 characters",
      "string.pattern.base":
        "Name can only contain letters, numbers, spaces, apostrophes (') and hyphens (-)",
    },
  },
};

const categorySchema = {
  name: Joi.string()
    .min(2)
    .max(100)
    .pattern(validationRules.name.pattern)
    .required()
    .messages(validationRules.name.messages),
};

function categoryValidation(data) {
  const schema = Joi.object(categorySchema);
  return schema.validate(data, { abortEarly: false });
}

function categoryValidationUpdate(data) {
  const updateSchema = {};
  Object.keys(categorySchema).forEach((key) => {
    updateSchema[key] = categorySchema[key].optional();
  });
  const schema = Joi.object(updateSchema);
  return schema.validate(data, { abortEarly: false });
}

module.exports = {
  categoryValidation,
  categoryValidationUpdate,
};
