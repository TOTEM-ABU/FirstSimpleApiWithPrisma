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
  price: {
    messages: {
      "number.base": "Price must be a number",
      "number.empty": "Price is required",
      "number.min": "Price must be greater than 0",
      "number.precision": "Price can have up to two decimal places",
    },
  },
  categoryId: {
    messages: {
      "string.base": "Category ID must be a string",
      "string.empty": "Category ID is required",
      "string.min": "Category ID must be at least 2 characters",
      "string.max": "Category ID must be at most 50 characters",
    },
  },
};

const productSchema = {
  name: Joi.string()
    .min(2)
    .max(100)
    .pattern(validationRules.name.pattern)
    .required()
    .messages(validationRules.name.messages),

  price: Joi.number()
    .min(0.01)
    .precision(2)
    .required()
    .messages(validationRules.price.messages),

  categoryId: Joi.string()
    .min(2)
    .max(50)
    .required()
    .messages(validationRules.categoryId.messages),
};

function productValidation(data) {
  const schema = Joi.object(productSchema);
  return schema.validate(data, { abortEarly: false });
}

function productValidationUpdate(data) {
  const updateSchema = {};
  Object.keys(productSchema).forEach((key) => {
    updateSchema[key] = productSchema[key].optional();
  });
  const schema = Joi.object(updateSchema);
  return schema.validate(data, { abortEarly: false });
}

module.exports = {
  productValidation,
  productValidationUpdate,
};
