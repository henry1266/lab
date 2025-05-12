const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  itmid: String,
  nhiid: String,
  itmnm: String,
  result: String,
  rstunit: String,
  nlow: String,
  nhigh: String
});

const patientSchema = new mongoose.Schema({
  idno: String,
  patnm: String,
  birdt: String,
  regno: String,
  labid: String,
  labnm: String,
  regdt: String,
  rptdt: String,
  items: [itemSchema]
});

// ✅ 加上 birdt + regno 為唯一索引
patientSchema.index({ birdt: 1, regno: 1 }, { unique: true });

module.exports = mongoose.model('lab', patientSchema);
