const { Schema, model } = require('mongoose');

const EventTypeSchema = new Schema(

  {
    name: {
        type: String,
        required: true,
        trim: true
    }
  },
  { timestamps: true }
);


module.exports = model('EventType', EventTypeSchema);

