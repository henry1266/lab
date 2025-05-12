const itemCategories = {
  "血脂肪檢查": ["CHOL", "TG", "HDL", "LDL", "VLDL", "CHO", "TRIG", "HDL-C", "LDL-C"],
  "糖尿病檢查": ["GLU", "GLUCOSE", "AC", "A1C", "HBA1C", "PC", "SUGAR"],
  "腎功能": ["BUN", "CREA", "CREATININE", "UA", "URIC ACID", "EGFR", "CRSC"],
  "肝功能": ["TP", "ALB", "GLOB", "A/G", "ALT", "SGPT", "AST", "SGOT", "ALP", "GGT", "GAMMA-GT", "T-BIL", "D-BIL", "TBIL", "DBIL", "ALBUMIN"],
  "血液檢查": ["WBC", "RBC", "HGB", "HCT", "MCV", "MCH", "MCHC", "PLT", "LYM", "MONO", "NEU", "EOS", "BASO", "LYMPH", "MONOCYTE", "NEUTROPHIL", "EOSINOPHIL", "BASOPHIL", "PLATELET", "HEMOGLOBIN", "HEMATOCRIT"],
  "尿液檢查": ["U-URO", "U-BIL", "U-KET", "U-BLD", "U-PRO", "U-NIT", "U-LEU", "U-GLU", "U-SG", "U-PH", "URO", "KETONE", "NITRITE", "LEUKOCYTES", "URINE", "U.NIT", "U.LEU", "U.GLU", "U.SG", "U.PH", "U.PRO", "U.BLD", "U.KET", "U.BIL", "U.URO"],
  "糞便檢查": ["OB", "STOOL", "FECAL"]
};

const defaultCategory = "其他檢查";

function categorizeItem(item) {
  const itemName = (item.itmnm || "").toUpperCase();
  const itemId = (item.itmid || "").toUpperCase();

  for (const category in itemCategories) {
    if (itemCategories[category].some(keyword => itemName.includes(keyword) || itemId.includes(keyword))) {
      return category;
    }
  }
  return defaultCategory;
}

function groupItemsByReport(records) {
  return records.map(record => {
    const categorizedItems = {};
    record.items.filter(i => i.itmid !== 'J126').forEach(item => {
      const category = categorizeItem(item);
      if (!categorizedItems[category]) {
        categorizedItems[category] = [];
      }
      categorizedItems[category].push(item);
    });
    return { ...record._doc, categorizedItems }; // Use _doc to get plain object if record is a Mongoose document
  });
}

module.exports = { groupItemsByReport, categorizeItem, itemCategories, defaultCategory };
