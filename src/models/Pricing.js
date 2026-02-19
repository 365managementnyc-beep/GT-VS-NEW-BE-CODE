const { Schema, model } = require('mongoose');

const pricingPercentage = new Schema(

  {
    pricingPercentage: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    }

  },
  { timestamps: true }
);


module.exports = model('Pricing', pricingPercentage);

